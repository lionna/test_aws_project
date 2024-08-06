const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { getCorsHeaders } = require('./cors');
const { HTTP_STATUS, MESSAGES } = require('./constants');

const client = new DynamoDBClient({});
const dynamoDB = DynamoDBDocumentClient.from(client);
const productsTableName = process.env.PRODUCTS_TABLE;
const stocksTableName = process.env.STOCKS_TABLE;

exports.handler = async (event) => {
    const origin = event.headers.origin;
    const headers = getCorsHeaders(origin, 'GET,OPTIONS');

    console.log('Received request:', event);

    try {
        const [productsResult, stocksResult] = await Promise.all([
            dynamoDB.send(new ScanCommand({ TableName: productsTableName })),
            dynamoDB.send(new ScanCommand({ TableName: stocksTableName }))
        ]);

        const products = productsResult.Items;
        const stocks = stocksResult?.Items || [];

        const productList = products.map(product => {
            const stock = stocks.find(s => s.product_id === product.id);
            return {
                ...product,
                count: stock ? stock.count : 0
            };
        });

        return {
            statusCode: HTTP_STATUS.OK,
            headers,
            body: JSON.stringify(productList),
        };
    } catch (error) {
        console.log('Error fetching data:', error);
        return {
            statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            headers,
            body: JSON.stringify({ message: MESSAGES.INTERNAL_SERVER_ERROR }),
        };
    }
};
