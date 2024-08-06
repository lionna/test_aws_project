const CONSTANTS = {
    HTTP_STATUS: {
        OK: 200,
        CREATED: 201,
        NO_CONTENT: 204,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        LOCKED: 423,
        INTERNAL_SERVER_ERROR: 500,
    },
    MESSAGES: {
        INTERNAL_SERVER_ERROR: 'Internal Server Error',
        RESOURCE_LOCKED: 'Resource is currently locked. Please try again later.',
        PRODUCT_NOT_FOUND: 'Product not found',
        INVALID_INPUT_TITLE: 'Title is required and must be a non-empty string',
        INVALID_INPUT_DESCRIPTION: 'Description is required and must be a non-empty string',
        INVALID_INPUT_PRICE: 'Price is required and must be a positive number',
        INVALID_INPUT_COUNT: 'Count is required and must be a non-negative number',
        BATCH_PROCESSED: 'Batch processed successfully',
        DELETE_SUCCESS: id => `Product deleted successfully: ${id}`,
        INVALID_PRODUCT_ID : id => `Invalid id: ${id}`,
        FAILED_TO_UNLOCK: error => `Failed to unlock: ${error}`,
        TRANSACTION_FAILED: error => `Transaction failed: ${error}`,
        ERROR_CREATING_PRODUCT: error => `Error creating product: ${error}`,
    },
};

module.exports = CONSTANTS;