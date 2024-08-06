const { S3Client, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { SQSClient, SendMessageBatchCommand } = require('@aws-sdk/client-sqs');
const csvParser = require('csv-parser');
const { getCorsHeaders } = require('../lambdas/cors');
const { HTTP_STATUS, MESSAGES } = require('../lambdas/constants');
const { handler } = require('../lambdas/importFileParser');
const { PassThrough } = require('stream');

jest.mock('@aws-sdk/client-s3');
jest.mock('csv-parser');
jest.mock('@aws-sdk/client-sqs', () => {
  return {
    SQSClient: jest.fn().mockImplementation(() => ({
          send: jest.fn()
      })),
      SendMessageBatchCommand: jest.fn()
  };
});

describe('import Lambda handler', () => {
  const headers = getCorsHeaders('*');

  const mockEvent = {
    headers: {
      origin: 'http://example.com'
    },
    Records: [{
      s3: {
        bucket: {
          name: 'my-bucket'
        },
        object: {
          key: 'path/to/myfile.csv'
        }
      }
    }]
  };

  let sendMock;
  let sqsMock;
  beforeEach(() => {
    sendMock = jest.fn();
    S3Client.mockImplementation(() => ({
      send: sendMock
    }));

    sqsMock = jest.fn();
    SQSClient.mockImplementation(() => ({
      send: sqsMock
    }));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('should process CSV and return success response', async () => {
    // Mock the S3 getObject response to return a readable stream
    const mockStream = new PassThrough();
    mockStream.end('id,title\n1,Product1\n2,Product2\n');

    sendMock
      .mockResolvedValueOnce({ Body: mockStream }) // getObjectCommand
      .mockResolvedValueOnce({}) // copyObjectCommand
      .mockResolvedValueOnce({}); // deleteObjectCommand

    // Mock the csvParser to return a readable stream of parsed CSV objects
    const mockCsvStream = new PassThrough({ objectMode: true });
    setImmediate(() => {
      mockCsvStream.write({ id: '1', title: 'Product1' });
      mockCsvStream.write({ id: '2', title: 'Product2' });
      mockCsvStream.end();
    });

    csvParser.mockReturnValue(mockCsvStream);
    sqsMock.mockReturnValue({});

    const response = await handler(mockEvent);

    expect(sendMock).toHaveBeenCalledTimes(3);
    expect(sendMock).toHaveBeenNthCalledWith(1, expect.any(GetObjectCommand));
    expect(sendMock).toHaveBeenNthCalledWith(2, expect.any(CopyObjectCommand));
    expect(sendMock).toHaveBeenNthCalledWith(3, expect.any(DeleteObjectCommand));
    expect(sqsMock).toHaveBeenCalledTimes(1);
    expect(sqsMock).toHaveBeenCalledWith(expect.any(SendMessageBatchCommand));

    expect(response).toEqual({
      statusCode: HTTP_STATUS.OK,
      headers,
      body: JSON.stringify({ message: MESSAGES.FILE_PROCESSED })
    });
  });

  test('should handle errors and return error response', async () => {
    const errorMessage = 'Something went wrong';
    sendMock.mockRejectedValue(new Error(errorMessage));
    const response = await handler(mockEvent);
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sqsMock).toHaveBeenCalledTimes(0);
    expect(response.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(response).toEqual({
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      headers,
      body: JSON.stringify({ message: MESSAGES.INTERNAL_SERVER_ERROR })
    });
  });
});