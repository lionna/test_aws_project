const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { getCorsHeaders } = require('./cors');
const { HTTP_STATUS, MESSAGES } = require('./constants');

const client = new DynamoDBClient({});
const dynamoDB = DynamoDBDocumentClient.from(client);
const productsTableName = process.env.PRODUCTS_TABLE;
const stocksTableName = process.env.STOCKS_TABLE;

exports.handler = async (event) => {
    const origin = event.headers.origin;
    const headers = getCorsHeaders(origin, 'GET,OPTIONS');
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
            KeyConditionExpression: "#id = :idValue",
            ExpressionAttributeNames: {
                "#id": "id",
            },
            ExpressionAttributeValues: {
                ":idValue": productId,
            },
        };

        const stockParams = {
            TableName: stocksTableName,
            KeyConditionExpression: "product_id = :pid",
            ExpressionAttributeValues: {
                ":pid": productId,
            },
        };

        const [productResponse, stockResponse] = await Promise.all([
            dynamoDB.send(new QueryCommand(productParams)),
            dynamoDB.send(new QueryCommand(stockParams))
        ]);

        const product = productResponse?.Items[0];
        const stock = stockResponse?.Items[0];

        if (product) {
            const returnedBody = JSON.stringify({
                ...product,
                count: stock ? stock.count : 0
            });

            return {
                statusCode: HTTP_STATUS.OK,
                headers,
                body: returnedBody,
            };
        } else {
            console.log(`Product not found for productId = ${productId}`);
            return {
                statusCode: HTTP_STATUS.NOT_FOUND,
                headers,
                body: JSON.stringify({ message: MESSAGES.PRODUCT_NOT_FOUND }),
            };
        }
    } catch (error) {
        console.log(`Error getting productId = ${productId}: ${error}`, error);
        return {
            statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            headers,
            body: JSON.stringify({ message: MESSAGES.INTERNAL_SERVER_ERROR }),
        };
    }
};
