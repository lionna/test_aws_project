const { HTTP_STATUS, MESSAGES } = require('../lambdas/constants');
const { createTransactItems } = require('../lambdas/dynamoDBUtils');
const { handler } = require('../lambdas/createProduct');
const ProductBuilder = require('../utils/productBuilder');

const invalidItems = [null, undefined, NaN, '', '\t', '\n', 123];
process.env.PRODUCTS_TABLE = 'ProductsTable';
process.env.STOCKS_TABLE = 'StocksTable';

jest.mock('../lambdas/dynamoDBUtils');

describe('handler', () => {
    const headers = {};
    const newProduct = new ProductBuilder().withId('some-id').build();
    const event = {
        headers,
        body: JSON.stringify(newProduct)
    };

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('parameter validation', () => {
        describe('title validation', () => {
            it('should return 400 if title is invalid', async () => {
                for (const item of invalidItems) {

                    const event = {
                        headers: headers,
                        body: JSON.stringify({
                            title: item
                        })
                    };
                    const result = await handler(event);

                    expect(result.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
                    expect(JSON.parse(result.body).message).toBe(MESSAGES.INVALID_INPUT_TITLE);
                }
            });
        });
    });

    it('should create transact items successfully', async () => {  
        createTransactItems.mockResolvedValueOnce({
            statusCode: HTTP_STATUS.CREATED,
            body: JSON.stringify(newProduct),
            headers
        });

        const result = await handler(event);

        expect(result.statusCode).toBe(HTTP_STATUS.CREATED);
        expect(JSON.parse(result.body)).toEqual(newProduct);
        
    });

    it('should handle errors during item creation', async () => {
        createTransactItems.mockRejectedValueOnce(new Error('DynamoDB error'));

        const result = await handler(event);

        expect(createTransactItems).toHaveBeenCalledTimes(1);
        expect(result.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
        expect(JSON.parse(result.body).message).toBe(MESSAGES.INTERNAL_SERVER_ERROR);
    });
});