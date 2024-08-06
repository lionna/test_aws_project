const { DynamoDBClient, TransactWriteItemsCommand } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { marshall } = require("@aws-sdk/util-dynamodb");
const crypto = require('crypto');
const { HTTP_STATUS, MESSAGES } = require('./constants');

const client = new DynamoDBClient({});
const dynamoDB = DynamoDBDocumentClient.from(client);

function generateUUID() {
    return crypto.randomUUID();
}

async function createTransactItems(products, productsTableName, stocksTableName, headers) {

    try {
        console.log("products", products);

        const transactItems = products.flatMap((product) => {

            const productId = product.id || generateUUID();

            const productItem = marshall({
                id: productId,
                title: product.title || '',
                description: product.description || '',
                price: product.price || '',
                photo: product.photo || '',
            });

            const stockItem = marshall({
                product_id: productId,
                count: product.count
            });

            return [
                {
                    Put: {
                        TableName: productsTableName,
                        Item: productItem
                    }
                },
                {
                    Put: {
                        TableName: stocksTableName,
                        Item: stockItem
                    }
                }
            ];
        });

        const params = {
            TransactItems: transactItems
        };

        await dynamoDB.send(new TransactWriteItemsCommand(params));

        console.log("Products added");

        return {
            statusCode: HTTP_STATUS.CREATED,
            body: JSON.stringify(products),
            headers,
        }

    }
    catch (error) {
        console.log(MESSAGES.ERROR_CREATING_PRODUCT(error));
        return {
            statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            body: JSON.stringify({ message: MESSAGES.INTERNAL_SERVER_ERROR }),
            headers,
        };
    }
}

module.exports = {
    createTransactItems
};
