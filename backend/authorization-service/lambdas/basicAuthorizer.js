exports.handler = async (event) => {
    console.log('event: ', event);

    if (event['type'] !== 'TOKEN') {
        console.log('Deny_type:', event['type']);
        return generatePolicy('user', 'Deny', event.methodArn, 401);
    }

    console.log('auth');
    const githubLogin = process.env.GITHUB_LOGIN;
    const githubPassword = process.env.GITHUB_PASSWORD;

    console.log('githubLogin:', githubLogin);
    console.log('githubPassword:', githubPassword);

    try {
        const authHeader = event.authorizationToken;
        console.log('authHeader:', authHeader);

        if (!authHeader) {
            console.log('Deny - 401');
            return generatePolicy('user', 'Deny', event.methodArn, 401);
        }

        const token = authHeader.split(' ')[1];
        const decodedToken = Buffer.from(token, 'base64').toString('utf-8');
        const [login, password] = decodedToken.split(':');
        
        console.log('login:', login);
        console.log('password:', password);

        if (login !== githubLogin || password !== githubPassword) {
            console.log('Deny - 403');
            return generatePolicy('user', 'Deny', event.methodArn, 403);
        }

        console.log('Allow');
        return generatePolicy('user', 'Allow', event.methodArn, 200);
    } catch (e) {
        console.log(e);
        return generatePolicy('user', 'Deny', event.methodArn, 500);
    }
};

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
