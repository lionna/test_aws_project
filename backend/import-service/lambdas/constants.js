const CONSTANTS = {
    HTTP_STATUS: {
        OK: 200,
        CREATED: 201,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        LOCKED: 423,
        INTERNAL_SERVER_ERROR: 500,
    },
    
    MESSAGES: {
        INTERNAL_SERVER_ERROR: 'Internal Server Error',
        CREATE_URL_ERROR: 'Could not create signed URL',
        PROCESSING_ERROR: 'Error processing file',
        PROCESSING_INFO: 'Files processed successfully',
        FILE_NAME_IS_MISSING: 'File Name parameter is missing',
        FILE_PROCESSED: 'CSV File was processed'
    },
};

module.exports = CONSTANTS;