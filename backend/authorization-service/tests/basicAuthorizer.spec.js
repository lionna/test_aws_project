const { handler } = require('../lambdas/basicAuthorizer');

const generatePolicy = (principalId, effect, resource, statusCode) => {
    const policyDocument = {
        Version: '2012-10-17',
        Statement: [{
            Action: 'execute-api:Invoke',
            Effect: effect,
            Resource: resource
        }]
    };

    return {
        principalId,
        policyDocument,
        context: {
            statusCode: statusCode
        }
    };
};

describe('handler', () => {
    beforeEach(() => {
        process.env.GITHUB_LOGIN = 'testLogin';
        process.env.GITHUB_PASSWORD = 'testPassword';
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    test('should deny when event type is not TOKEN', async () => {
        const event = {
            type: 'NOT_TOKEN',
            methodArn: 'arn:aws:execute-api:region:account-id:api-id/stage/method/resource-path'
        };

        const result = await handler(event);

        expect(result).toEqual(generatePolicy('user', 'Deny', event.methodArn, 401));
    });

    test('should deny when authorization token is missing', async () => {
        const event = {
            type: 'TOKEN',
            methodArn: 'arn:aws:execute-api:region:account-id:api-id/stage/method/resource-path'
        };

        const result = await handler(event);

        expect(result).toEqual(generatePolicy('user', 'Deny', event.methodArn, 401));
    });

    test('should deny when authorization token is malformed', async () => {
        const event = {
            type: 'NOT_TOKEN',
            authorizationToken: 'malformed token',
            methodArn: 'arn:aws:execute-api:region:account-id:api-id/stage/method/resource-path'
        };

        const result = await handler(event);

        expect(result).toEqual(generatePolicy('user', 'Deny', event.methodArn, 401));
    });

    test('should deny when credentials do not match', async () => {
        const event = {
            type: 'TOKEN',
            authorizationToken: 'Basic ' + Buffer.from('wrongLogin:wrongPassword').toString('base64'),
            methodArn: 'arn:aws:execute-api:region:account-id:api-id/stage/method/resource-path'
        };

        const result = await handler(event);

        expect(result).toEqual(generatePolicy('user', 'Deny', event.methodArn, 403));
    });

    test('should allow when credentials match', async () => {
        const event = {
            type: 'TOKEN',
            authorizationToken: 'Basic ' + Buffer.from('testLogin:testPassword').toString('base64'),
            methodArn: 'arn:aws:execute-api:region:account-id:api-id/stage/method/resource-path'
        };

        const result = await handler(event);

        expect(result).toEqual(generatePolicy('user', 'Allow', event.methodArn, 200));
    });

    test('should handle unexpected errors gracefully', async () => {
        const event = {
            type: 'TOKEN',
            authorizationToken: 'Basic ' + Buffer.from('testLogin:testPassword').toString('base64'),
            methodArn: 'arn:aws:execute-api:region:account-id:api-id/stage/method/resource-path'
        };

        jest.spyOn(Buffer.prototype, 'toString').mockImplementationOnce(() => {
            throw new Error('Unexpected error');
        });

        const result = await handler(event);

        expect(result).toEqual(generatePolicy('user', 'Deny', event.methodArn, 500));
    });
});