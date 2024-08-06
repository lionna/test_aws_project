const { handler } = require('../lambdas/getProductsList');
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const ProductBuilder = require('../utils/productBuilder');
const StockBuilder = require('../utils/stockBuilder');
const { HTTP_STATUS, MESSAGES } = require('../lambdas/constants');

const productId1 = 'some-id1';
const productId2 = 'some-id2';
const product1 = new ProductBuilder().withId(productId1).build();
const product2 = new ProductBuilder().withId(productId2).build();
const stock1 = new StockBuilder().withId(productId1).withCount(100).build();
const stock2 = new StockBuilder().withId(productId2).withCount(200).build();

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

describe('getProductsList', () => {
    let dynamoDB;

    beforeEach(() => {
        dynamoDB = DynamoDBDocumentClient.from();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return a list of products with their stock', async () => {
        dynamoDB.send
            .mockResolvedValueOnce({ Items: [product1, product2] })
            .mockResolvedValueOnce({ Items: [stock1, stock2] });

        const event = { headers: {} };
        const result = await handler(event);

        expect(dynamoDB.send).toHaveBeenCalledWith(expect.any(ScanCommand));
        expect(result.statusCode).toBe(HTTP_STATUS.OK);
        expect(JSON.parse(result.body)).toEqual([
            { ...product1, count: stock1.count },
            { ...product2, count: stock2.count }
        ]);
    });

    it('should return a list of products without stocks', async () => {
        dynamoDB.send
            .mockResolvedValueOnce({ Items: [product1, product2] });

        const event = { headers: {} };
        const result = await handler(event);

        expect(dynamoDB.send).toHaveBeenCalledWith(expect.any(ScanCommand));
        expect(result.statusCode).toBe(HTTP_STATUS.OK);
        expect(JSON.parse(result.body)).toEqual([
            { ...product1, count: 0 },
            { ...product2, count: 0 }
        ]);
    });

    it('should return 500 if an error occurs', async () => {
        dynamoDB.send.mockRejectedValueOnce(new Error("DynamoDB error"));

        const event = { headers: {} };
        const result = await handler(event);

        expect(result.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        expect(JSON.parse(result.body).message).toBe(MESSAGES.INTERNAL_SERVER_ERROR);
    });
});
