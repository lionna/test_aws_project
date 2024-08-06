const { SNSClient } = require("@aws-sdk/client-sns");
const { HTTP_STATUS, MESSAGES } = require('../lambdas/constants');
const { createTransactItems } = require('../lambdas/dynamoDBUtils');
const { handler } = require('../lambdas/catalogBatchProcess');
const ProductBuilder = require('../utils/productBuilder');

jest.mock('@aws-sdk/util-dynamodb');
jest.mock('../lambdas/dynamoDBUtils');
jest.mock('@aws-sdk/client-sns', () => {
    return {
        SNSClient: jest.fn().mockImplementation(() => ({
            send: jest.fn()
        })),
        PublishCommand: jest.fn()
    };
});

const PRODUCTS_TABLE = 'ProductsTable';
const STOCKS_TABLE = 'StocksTable';
const SNS_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:MyTopic';

process.env.PRODUCTS_TABLE = PRODUCTS_TABLE;
process.env.STOCKS_TABLE = STOCKS_TABLE;
process.env.SNS_TOPIC_ARN = SNS_TOPIC_ARN;

const event = {
    Records: [
        { body: JSON.stringify(new ProductBuilder().withId(123).build()) },
        { body: JSON.stringify(new ProductBuilder().withId(321).build()) }
    ]
};

describe('handler', () => {
    let snsClient;

    beforeEach(() => {
        snsClient = new SNSClient();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should process records and send SNS message successfully', async () => {
        createTransactItems.mockResolvedValueOnce({});
        snsClient.send.mockResolvedValueOnce({});

        const response = await handler(event);
        
      expect(createTransactItems).toHaveBeenCalledTimes(1);
        expect(response).toEqual({
            statusCode: HTTP_STATUS.OK,
            body: JSON.stringify({ message: MESSAGES.BATCH_PROCESSED })
        });
    });

    it('should handle errors during record processing', async () => {
        createTransactItems.mockRejectedValueOnce(new Error("DynamoDB error"));

        const response = await handler(event);

        expect(createTransactItems).toHaveBeenCalledTimes(1);
        expect(snsClient.send).not.toHaveBeenCalled();
        expect(response).toEqual({
            statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            body: JSON.stringify({ message: MESSAGES.INTERNAL_SERVER_ERROR })
        });
    });
});
