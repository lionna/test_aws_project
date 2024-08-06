const { handler } = require('../lambdas/importProductsFile');
const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { HTTP_STATUS, MESSAGES } = require("../lambdas/constants");

jest.mock('@aws-sdk/client-s3', () => ({
    S3Client: jest.fn(),
    PutObjectCommand: jest.fn(),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
    getSignedUrl: jest.fn(),
}));

describe('handler', () => {
    const mockClient = new S3Client({});
    const origin = 'http://example.com';
    const fileName = 'testfile.txt';
    const expiresIn = 3600;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return 400 status code on missing file name', async () => {
        const event = {
            headers: {
                origin,
            },
            queryStringParameters: {},
        };

        const result = await handler(event);

        expect(result.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
        expect(JSON.parse(result.body)).toEqual({ message: MESSAGES.FILE_NAME_IS_MISSING });
        expect(getSignedUrl).not.toHaveBeenCalled();
    });

    it('should return a presigned URL on valid input', async () => {
        const event = {
            headers: {
                origin,
            },
            queryStringParameters: {
                name: fileName,
            },
        };

        const mockPresignedUrl = 'https://mock-presigned-url.com';
        getSignedUrl.mockResolvedValue(mockPresignedUrl);
        const result = await handler(event);
        expect(result.statusCode).toBe(HTTP_STATUS.OK);
        expect(JSON.parse(result.body)).toEqual({ url: mockPresignedUrl });
        expect(getSignedUrl).toHaveBeenCalledTimes(1);
        expect(getSignedUrl).toHaveBeenCalledWith(
            mockClient,
            expect.any(PutObjectCommand),
            { expiresIn: expiresIn }
        );
    });

    it('should return 500 status code on error', async () => {
        const event = {
            headers: {
                origin,
            },
            queryStringParameters: {
                name: fileName,
            },
        };

        const mockError = new Error('Mock S3 error');
        getSignedUrl.mockRejectedValue(mockError);
        const result = await handler(event);
        expect(result.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        expect(JSON.parse(result.body)).toEqual({ message: MESSAGES.INTERNAL_SERVER_ERROR });
        expect(getSignedUrl).toHaveBeenCalledTimes(1);
    });
});