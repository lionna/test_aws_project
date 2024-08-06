const { handler } = require('../lambdas/deleteProductById');
const { HTTP_STATUS, MESSAGES } = require('../lambdas/constants');
const { DynamoDBDocumentClient, DeleteCommand } = require("@aws-sdk/lib-dynamodb");

const productId = 'some-id';

jest.mock("@aws-sdk/lib-dynamodb", () => {
    const originalModule = jest.requireActual("@aws-sdk/lib-dynamodb");
    return {
        ...originalModule,
        DynamoDBDocumentClient: {
            from: jest.fn().mockReturnValue({
                send: jest.fn()
            })
        }
    };
});

describe('deleteProductById', () => {
    let dynamoDB;

    beforeEach(() => {
        dynamoDB = DynamoDBDocumentClient.from();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('parameter validation', () => {
        describe('productId validation', () => {
            const invalidIds = [null, undefined, NaN, '', '\t', '\n', 123];

            it('should return 400 if productId is invalid', async () => {
                for (const id of invalidIds) {

                    const event = { headers: {}, pathParameters: { productId: id } };
                    const result = await handler(event);

                    expect(result.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
                    expect(JSON.parse(result.body).message).toBe(MESSAGES.INVALID_PRODUCT_ID(id));
                }
            });
        });
    });

    it('should delete product and stock and return 204 if product exists', async () => {
        dynamoDB.send
            .mockResolvedValueOnce({}) // Delete product
            .mockResolvedValueOnce({}); // Delete stock

        const event = { headers: {}, pathParameters: { productId } };
        const result = await handler(event);

        expect(dynamoDB.send).toHaveBeenCalledWith(expect.any(DeleteCommand));
        expect(result.statusCode).toBe(HTTP_STATUS.NO_CONTENT);
        expect(JSON.parse(result.body).message).toBe(MESSAGES.DELETE_SUCCESS(productId));
    });

    it('should return 500 if an error occurs during deletion', async () => {
        dynamoDB.send.mockRejectedValueOnce(new Error('DynamoDB error'));

        const event = { headers: {}, pathParameters: { productId } };
        const result = await handler(event);

        expect(result.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        expect(JSON.parse(result.body).message).toBe(MESSAGES.INTERNAL_SERVER_ERROR);
    });
});
