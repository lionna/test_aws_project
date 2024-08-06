const { handler } = require('../lambdas/getProductsById');
const { DynamoDBDocumentClient, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const ProductBuilder = require('../utils/productBuilder');
const StockBuilder = require('../utils/stockBuilder');
const { HTTP_STATUS, MESSAGES } = require('../lambdas/constants');

const productId = 'existing-product-id';
const product = new ProductBuilder().withId(productId).build();
const stock = new StockBuilder().withId(productId).build();

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

describe('getProductsById', () => {
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

	it('should return product with stock if it exists', async () => {
		dynamoDB.send
			.mockResolvedValueOnce({ Items: [product] })
			.mockResolvedValueOnce({ Items: [stock] });

		const event = { headers: {}, pathParameters: { productId } };
		const result = await handler(event);

		expect(dynamoDB.send).toHaveBeenCalledWith(expect.any(QueryCommand));
		expect(result.statusCode).toBe(HTTP_STATUS.OK);
		expect(JSON.parse(result.body)).toEqual({
			...product,
			count: stock.count
		});
	});
	
	it('should return product with stock if not exists', async () => {
		dynamoDB.send
			.mockResolvedValueOnce({ Items: [product] });

		const event = { headers: {}, pathParameters: { productId } };
		const result = await handler(event);

		expect(dynamoDB.send).toHaveBeenCalledWith(expect.any(QueryCommand));
		expect(result.statusCode).toBe(HTTP_STATUS.OK);
		expect(JSON.parse(result.body)).toEqual({
			...product,
			count: 0
		});
	});

	it('should return 404 if product does not exist', async () => {
		dynamoDB.send
			.mockResolvedValueOnce({ Items: [] })
			.mockResolvedValueOnce({ Items: [] });

		const event = { headers: {}, pathParameters: { productId: productId } };
		const result = await handler(event);

		expect(dynamoDB.send).toHaveBeenCalledWith(expect.any(QueryCommand));
		expect(result.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
		expect(JSON.parse(result.body).message).toBe(MESSAGES.PRODUCT_NOT_FOUND);
	});

	it('should return 500 if an error occurs', async () => {
		dynamoDB.send.mockRejectedValueOnce(new Error("DynamoDB error"));

		const event = { headers: {}, pathParameters: { productId: productId } };
		const result = await handler(event);

		expect(result.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
		expect(JSON.parse(result.body).message).toBe(MESSAGES.INTERNAL_SERVER_ERROR);
	});
});
