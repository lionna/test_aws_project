const { getCorsHeaders } = require('./cors');
const { HTTP_STATUS, MESSAGES } = require('./constants');
const { validateInput } = require('./validation');
const { createTransactItems } = require('./dynamoDBUtils');

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;
const STOCKS_TABLE = process.env.STOCKS_TABLE;

exports.handler = async (event) => {
    const origin = event.headers.origin;
    const headers = getCorsHeaders(origin, 'POST,OPTIONS');
    const { id, title, description, price, count } = JSON.parse(event.body);
    const product = JSON.parse(event.body);

    try {
        const validationError = validateInput({ id, title, description, price, count });

        if (validationError) {
            return {
                statusCode: HTTP_STATUS.BAD_REQUEST,
                body: JSON.stringify({ message: validationError }),
                headers,
            };
        }

        return await createTransactItems([product], PRODUCTS_TABLE, STOCKS_TABLE, headers);

    } catch (error) {
        console.log(MESSAGES.ERROR_CREATING_PRODUCT(error));
        return {
            statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            body: JSON.stringify({ message: MESSAGES.INTERNAL_SERVER_ERROR }),
            headers,
        };
    }
};
