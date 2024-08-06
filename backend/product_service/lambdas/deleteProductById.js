const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, DeleteCommand } = require("@aws-sdk/lib-dynamodb");
const { getCorsHeaders } = require('./cors');
const { HTTP_STATUS, MESSAGES } = require('./constants');

const client = new DynamoDBClient({});
const dynamoDB = DynamoDBDocumentClient.from(client);
const productsTableName = process.env.PRODUCTS_TABLE;
const stocksTableName = process.env.STOCKS_TABLE;

exports.handler = async (event) => {
    const origin = event.headers.origin;
    const headers = getCorsHeaders(origin, 'DELETE,OPTIONS');
    const { productId } = event.pathParameters;

    console.log('Received request:', event);

    if (!productId || typeof productId !== 'string' || productId.trim() === '') {
        return {
            statusCode: HTTP_STATUS.BAD_REQUEST,
            headers,
            body: JSON.stringify({ message: MESSAGES.INVALID_PRODUCT_ID(productId) }),
        };
    }

    try {
        const productParams = {
            TableName: productsTableName,
            Key: {
                "id": productId,
            },
        };

        const stockParams = {
            TableName: stocksTableName,
            Key: {
                "product_id": productId,
            },
        };

        await Promise.all([
            dynamoDB.send(new DeleteCommand(productParams)),
            dynamoDB.send(new DeleteCommand(stockParams))
        ]);

        return {
            statusCode: HTTP_STATUS.NO_CONTENT,
            headers,
            body: JSON.stringify({ message: MESSAGES.DELETE_SUCCESS(productId) }),
        };
    } catch (error) {
        console.log(`Error deleting productId = ${productId}: ${error}`, error);
        return {
            statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            headers,
            body: JSON.stringify({ message: MESSAGES.INTERNAL_SERVER_ERROR }),
        };
    }
};
