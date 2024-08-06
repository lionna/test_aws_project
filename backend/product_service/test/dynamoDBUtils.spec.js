const { TransactWriteItemsCommand } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { HTTP_STATUS, MESSAGES } = require('../lambdas/constants');
const ProductBuilder = require('../utils/productBuilder');
const { createTransactItems } = require('../lambdas/dynamoDBUtils');

const headers = { "Content-Type": "application/json" };
const productsTableName = 'ProductsTable';
const stocksTableName = 'StocksTable';
const productId = 'some-id';
const newProduct = new ProductBuilder().withId(productId).build();
const products = [newProduct];

jest.mock('@aws-sdk/util-dynamodb');

jest.mock("@aws-sdk/client-dynamodb", () => {
    return {
        DynamoDBClient: jest.fn().mockImplementation(() => ({})),
        TransactWriteItemsCommand: jest.fn()
    };
});

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

jest.mock('crypto', () => ({
    randomUUID: jest.fn().mockReturnValue(productId),
}));

describe('createTransactItems', () => {
    let dynamoDB;

    beforeEach(() => {
        dynamoDB = DynamoDBDocumentClient.from();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should create transact items successfully', async () => {
        dynamoDB.send
            .mockResolvedValueOnce({});

        const result = await createTransactItems(products, productsTableName, stocksTableName, headers);

        expect(dynamoDB.send).toHaveBeenCalledWith(expect.any(TransactWriteItemsCommand)); // Transaction
        expect(result.statusCode).toBe(HTTP_STATUS.CREATED);
        expect(JSON.parse(result.body)).toEqual(products);
    });

    it('should create transact items with generated uuid for product id', async () => {
        const productWithoutId = new ProductBuilder().withId('').build();

        dynamoDB.send.mockResolvedValueOnce({});

        const result = await createTransactItems([productWithoutId], productsTableName, stocksTableName, headers);

        expect(dynamoDB.send).toHaveBeenCalledWith(expect.any(TransactWriteItemsCommand));
        expect(result.statusCode).toBe(HTTP_STATUS.CREATED);
        const createdProduct = JSON.parse(result.body)[0];
        expect(createdProduct.title).toEqual(productWithoutId.title);
        expect(createdProduct.id).toBeDefined();
        expect(createdProduct.id).toBeDefined();
        expect(createdProduct.id).not.toBeNull();
    });

    it('should handle errors during transact items creation', async () => {
        dynamoDB.send.mockRejectedValueOnce(new Error("DynamoDB error"));

        const response = await createTransactItems(products, productsTableName, stocksTableName, headers);

        expect(dynamoDB.send).toHaveBeenCalledTimes(1);
        expect(response).toEqual({
            statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            body: JSON.stringify({ message: MESSAGES.INTERNAL_SERVER_ERROR }),
            headers,
        });
    });
});
