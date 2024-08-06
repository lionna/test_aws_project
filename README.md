[Architecture] (Architecture.pdf)

# Task 2.1
## Manual Deployment

1) In the AWS Console, created and configured an S3 bucket
[S3 bucket](https://shop-web-app.s3.eu-central-1.amazonaws.com/index.html/)

2) Created a CloudFront distribution for app 
[Cloud Front](https://d2zyxqnb5qq3f8.cloudfront.net/)

3) AWS CLI commands:
```sh
`aws --version`
`aws s3 ls`
`aws s3api get-bucket-policy --bucket shop-web-app`
`aws cloudfront list-distributions`
```
```sh
curl -o NUL -s -w "Total: %{time_total}s\n" https://d2zyxqnb5qq3f8.cloudfront.net
# Total: 0.124938s

curl -o NUL -s -w "Total: %{time_total}s\n" https://shop-web-app.s3.eu-central-1.amazonaws.com/index.html
# Total: 0.177813s

curl -o $null -s -w "Total: %{time_total}s\n" https://d2zyxqnb5qq3f8.cloudfront.net
# Total: 0.036126s

curl -o $null -s -w "Total: %{time_total}s\n" https://shop-web-app.s3.eu-central-1.amazonaws.com/index.html
# Total: 0.126337s
```

# Task 2.2

Used [AWS CDK](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-construct-library.html)
1) Created new folder, for example 'cdk'
2) Installed 
* `npm install -g aws-cdk`
3) Configured 
* `cdk init app --language csharp`
* `cdk bootstrap` or `cdk bootstrap aws://ID/REGION`
 (
    delete options: 
    * `aws cloudformation describe-stacks`
    * `aws cloudformation delete-stack --stack-name CdkStack --region eu-central-1`
    * `aws cloudformation delete-stack --stack-name CdkStack --retain-resources shopwebappbucket4BE87B22`
    * `aws cloudformation delete-stack --stack-name CDKToolkit`
    * `npm uninstall -g aws-cdk`
)
4) Added new options to CdkStack.cs and Program.cs
# core for AWS CDK (Program.cs)
```csharp
public static void Main(string[] args)
{
    var app = new App();
    new CdkStack(app, "CdkStack", new StackProps
    {
        Env = new Environment
        {
            Account = "ACCOUNT_ID",
            Region = "eu-central-1",
        }
    });
    app.Synth();
}
```
# CdkStack.cs
```csharp
internal CdkStack(Construct scope, string id, IStackProps props = null) : base(scope, id, props)
{
    // Create the S3 bucket
    var bucket = new Bucket(this, $"{BucketId}-bucket", new BucketProps
    {
        ...
    });

    var oai = new OriginAccessIdentity(this, "OAI");

    // Create an IAM policy statement to allow GetObject action on the S3 bucket
    var bucketPolicyStatement = new PolicyStatement(new PolicyStatementProps
    {
        ...
    });

    bucket.AddToResourcePolicy(bucketPolicyStatement);

    // Create CloudFront distribution
    var distribution = new CloudFrontWebDistribution(this, $"{BucketId}-distribution", new CloudFrontWebDistributionProps
    {
        OriginConfigs = new[]
        {
          ...
        }
    });

    // Deploy files to the S3 bucket
    new BucketDeployment(this, $"{BucketId}-deployment", new BucketDeploymentProps
    {
        ...
    });

    // Export CloudFront distribution ID
    new CfnOutput(this, "DistributionURL", new CfnOutputProps
    {
        Value = distribution.DistributionDomainName,
        Description = "CloudFront distribution"
    });

    // Output S3 bucket URL
    new CfnOutput(this, "BucketURL", new CfnOutputProps
    {
        Value = bucket.BucketWebsiteUrl,
        Description = "The URL of the S3 bucket website endpoint"
    });
}
```

5) Builded C# project
* `dotnet build src` compile this app
* `cdk deploy`       deploy this stack to your default AWS account/region
* `cdk diff`         compare deployed stack with current state
* `cdk synth`        emits the synthesized CloudFormation template
6) Added options to package.json:
   "scripts": {
    "cdk-deploy": "cdk deploy --app \"cdk_dest/cdk.out\"",
    "deploy": "npm run build && npm run cdk-deploy"
    }
7) Result of operation  'cdk deploy --all'
[Settings] (img.png)
8) Checked links:
[S3 bucket link](http://shop-web-app-automated.s3-website.eu-central-1.amazonaws.com/) - the 403 error should be shown
[Cloud Front link](https://d3oeh93tzbcw2m.cloudfront.net/) - should be available.


# Task 3

Task: https://github.com/rolling-scopes-school/aws/blob/main/aws-developer/03_serverless_api/task.md

### What was done?
- Created two Lambda functions: `getProductsList` and `getProductsById`.
- Integrated these functions with API Gateway.
- Added CORS support.
- Created Swagger documentation.
- Added unit tests for Lambda functions.

### Additional scope
- Swagger documentation: added `openapi.yaml` file.
- Unit tests: created tests for `getProductsList` and `getProductsById`.
- Code is separated into different modules for better maintainability.

### How to run Swagger locally?

1. Ensure you have the necessary dependencies installed:
   * `npm install swagger-ui-express yamljs express --legacy-peer-deps`
2. Run the Swagger server:
   * `npm run start-swagger`

### Links
- [Product Service API](https://dapdmi8g8h.execute-api.us-east-1.amazonaws.com/prod/products)
- [Product Service API for id = 1](https://dapdmi8g8h.execute-api.us-east-1.amazonaws.com/prod/products/1)
- [Frontend](https://d3oeh93tzbcw2m.cloudfront.net/)
- [Swagger](http://localhost:3000/api-docs)

# Task 4

Task: https://github.com/rolling-scopes-school/aws/blob/main/aws-developer/04_integration_with_nosql_database/task.md

### Task 4.1
1. Created two DynamoDB tables:
   - **products** table with fields:
     - `id` (uuid, Primary key)
     - `title` (text, not null)
     - `description` (text)
     - `price` (integer)
   - **stocks** table with fields:
     - `product_id` (uuid, Foreign key referencing `products.id`)
     - `count` (integer, representing total stock count)

2. Wrote a script (`populate-tables.js`) to fill tables with test data.

### Task 4.2
1. Updated AWS CDK Stack:
   - Created DynamoDB tables (`products` and `stocks`).
   - Updated Lambda’s environment variables.

2. Integrated `getProductsList` Lambda:
   - Returns list of products via `GET /products` endpoint from DynamoDB.
   - Implemented joining of `products` and `stocks` tables.

3. Implemented Product model:
   - Combined `product` and `stock` data into a single model (`Product`).

### Task 4.3
1. Created `createProduct` Lambda function:
   - Triggered by HTTP POST method.
   - Implements logic to create a new item in `products` table.

2. Curl:

curl -X POST \
  https://s0ob4l26k9.execute-api.us-east-1.amazonaws.com/prod/products \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "some new title",
    "description": "some new description",
    "price": 11,
    "count": 22
  }'


### Task 4.4
1. Committed changes to new branch

### Additional Tasks
- **Error Handling**:
  - Implemented error handling:
    - Returns 400 status code for invalid product data.
    - Returns 500 status code for any unhandled errors.
  
- **Logging**:
  - Added console.log for each incoming request and their arguments.

- **Transactions**:
  - Implemented transaction-based creation of products and stocks to ensure data integrity.

### Links
- [Product Service API](https://dapdmi8g8h.execute-api.us-east-1.amazonaws.com/prod/products)
- [Product Service API for id = 8f79f8e2-8841-4dc3-871e-2f7c861b130e](https://dapdmi8g8h.execute-api.us-east-1.amazonaws.com/prod/products/8f79f8e2-8841-4dc3-871e-2f7c861b130e)
- [Frontend](https://d3oeh93tzbcw2m.cloudfront.net/)
- [Swagger](http://localhost:3000/api-docs)


# Task 5
https://github.com/rolling-scopes-school/aws/blob/main/aws-developer/05_integration_with_s3/task.md

### Links
- [Product Service API](https://dapdmi8g8h.execute-api.us-east-1.amazonaws.com/prod/products)
- [Product Service API for id = 8f79f8e2-8841-4dc3-871e-2f7c861b130e](https://dapdmi8g8h.execute-api.us-east-1.amazonaws.com/prod/products/8f79f8e2-8841-4dc3-871e-2f7c861b130e)
- [Frontend](https://d3oeh93tzbcw2m.cloudfront.net/)
- [Swagger](http://localhost:3000/api-docs)

![image](https://github.com/Tati-Moon/nodejs-aws-shop-react/assets/170366343/5362f40a-93b6-4f27-9c99-7d1cb49b803e)

![image](https://github.com/Tati-Moon/nodejs-aws-shop-react/assets/170366343/0b451010-b5b7-46c1-8b9f-6bf71f13363e)

### Task 5.1
Created and configured a new S3 bucket with a folder called 'uploaded'

### Task 5.2
1. Created a Lambda function `importProductsFile` to handle HTTP GET requests.
2. Added API `/import`.
3. Added necessary configurations to pass the `name` parameter in the request.
4. Updated the stack with policies to allow Lambda functions to interact with S3.
5. Updated the `import` property in the API paths configuration to integrate the new Lambda endpoint.

![image](https://github.com/Tati-Moon/nodejs-aws-shop-react/assets/170366343/bd1dec60-fc48-4268-a77a-c2b31f766340)

### Task 5.3
1. Created a Lambda function `importFileParser` to handle S3 events.
2. The function is triggered by `s3:ObjectCreated:*` events.
3. Updated the stack to configure the S3 event trigger for the `importFileParser` Lambda function.
4. Ensured that the Lambda function has the necessary permissions to read from the S3 bucket and log to CloudWatch.
![image](https://github.com/Tati-Moon/nodejs-aws-shop-react/assets/170366343/c5107f0b-aeae-414b-92f3-23c223d914de)


# Task 6
https://github.com/rolling-scopes-school/aws/blob/main/aws-developer/06_async_microservices_communication/task.md

>  When exporting data, the values are either updated or added 

- [File for update products file_test.csv](https://github.com/Tati-Moon/nodejs-aws-shop-react/pull/5/files#diff-87fd6b5baa07b67b9923b7d2b9b9fd5fe9b746dab41d968c71ce184d5e6463cd)
- [File for add new products file.csv](https://github.com/Tati-Moon/nodejs-aws-shop-react/pull/5/files#diff-3fd208365d4d7d63f1aad9cdf63fb4ea1627e5936b6d96f884d978d6f9b41457) 
- [Frontend](https://d3oeh93tzbcw2m.cloudfront.net/)
- [Product Service API](https://dapdmi8g8h.execute-api.us-east-1.amazonaws.com/prod/products)
- [Product Service API for id = 441905d7-55c7-4814-85be-b3e6045b29b2](https://dapdmi8g8h.execute-api.us-east-1.amazonaws.com/prod/products/441905d7-55c7-4814-85be-b3e6045b29b2)
- [Swagger openapi.yaml](https://github.com/Tati-Moon/nodejs-aws-shop-react/pull/5/files#diff-54d896b1347a7bb7a01a769938bc286da80145946425ef1f9610f50edfd802b1)

# Evaluation Criteria
- [x] 100/100

# Task 6.1
- [x] Created a lambda function called `catalogBatchProcess` under the Product Service, which is triggered by an SQS event.
- [x] Created an SQS queue called `catalogItemsQueue` in the AWS CDK Stack.
- [x] Configured the SQS to trigger the lambda `catalogBatchProcess` with 5 messages at once via the `batchSize` property.
- [x] The lambda function iterates over all SQS messages and creates corresponding products in the products table.

# Task 6.2
- [x] Updated the `importFileParser` lambda function in the Import Service to send each CSV record into SQS.
- [x] It no longer logs entries from the readable stream to CloudWatch.

# Task 6.3
- [x] Created an SNS topic `createProductTopic` and an email subscription in the AWS CDK Stack of the Product Service.
- [x] Created a subscription for this SNS topic with an email endpoint type, using your own email.
- [x] Updated the `catalogBatchProcess` lambda function in the Product Service to send an event to the SNS topic once it creates products.

![image](https://github.com/Tati-Moon/nodejs-aws-shop-react/assets/170366343/6a3ddc63-84f2-4b2e-a799-705cd797d6e4)

![image](https://github.com/Tati-Moon/nodejs-aws-shop-react/assets/170366343/8bb0217c-2dd1-455b-ac87-e4063216a633)

# Additional Tasks
- [x] The `catalogBatchProcess` lambda is covered by unit tests.
[Tests catalogBatchProcess.js](https://github.com/Tati-Moon/nodejs-aws-shop-react/pull/5/files#diff-f9d9e61653d60c898d1b3b1d33f07401901fa6929fc056217d551b6d149299e5)

![image](https://github.com/Tati-Moon/nodejs-aws-shop-react/assets/170366343/a7180d37-9337-4383-920e-67029ef1540c)

![image](https://github.com/Tati-Moon/nodejs-aws-shop-react/assets/170366343/816dd4ac-5e16-4f1b-a7e7-6d8d9985d716)

- [x] Set a Filter Policy for the SNS `createProductTopic` in the AWS CDK Stack and created an additional email subscription to distribute messages to different emails depending on the filter for any product attribute.

![image](https://github.com/Tati-Moon/nodejs-aws-shop-react/assets/170366343/7481bfdd-bd75-4ab6-b7ea-e3de6cae607e)

![image](https://github.com/Tati-Moon/nodejs-aws-shop-react/assets/170366343/6cd43d6d-5b08-4a83-9c49-a9644d2c58ca)



# Task 7
https://github.com/rolling-scopes-school/aws/blob/main/aws-developer/07_authorization/task.md

### Links
- [Product Service API](https://dapdmi8g8h.execute-api.us-east-1.amazonaws.com/prod/products)
- [Product Service API for id = 8f79f8e2-8841-4dc3-871e-2f7c861b130e](https://dapdmi8g8h.execute-api.us-east-1.amazonaws.com/prod/products/8f79f8e2-8841-4dc3-871e-2f7c861b130e)
- [Frontend](https://d3oeh93tzbcw2m.cloudfront.net/)

### Settings:
[Token Generator](https://www.debugbear.com/basic-auth-header-generator)
userName = 'Tati-Moon'
password = (from task)
> add to console localStorage.setItem('authorization_token', "SOME_VALID_TOKEN");
or
> add to console localStorage.setItem('authorization_token', "SOME_INVALID_TOKEN");
or
> add to console localStorage.setItem('authorization_token', "");

### CVS:
title,description,price,count
some,some,666,666
or
title,description,price,count,photo
Product x, Product x,111,9,https://d1yjjnpx0p53s8.cloudfront.net/styles/logo-thumbnail/s3/0025/1559/brand.gif?itok=vXujPldk

# Evaluation Criteria
- [x]  100/100

- [x]  ### Task 7.1
1. Created a new service called `authorization-service`
2. Created a lambda function called `basicAuthorizer` under the Authorization Service
3. Lambda have environment variables: `GITHUB_LOGIN` and `GITHUB_PASSWORD`

![image](https://github.com/user-attachments/assets/fc8c9017-f4b2-45c8-b41e-ed771ed2c3a1)

- [x]  ### Task 7.2
1. Added Lambda authorization to the /import path of the Import Service API Gateway.
2. Used basicAuthorizer lambda as the Lambda authorizer

- [x]  ### Task 7.3
1. The request from the client application to the /import path of the Import Service was required to have a Basic Authorization header:
Authorization: Basic {authorization_token}

2. The {authorization_token} was a base64-encoded {your_github_account_login}
example: Authorization: Basic sGLzdRxvZmw0ZXs0UGFzcw==

3. The client obtained the authorization_token value from the browser's localStorage:
const authorization_token = localStorage.getItem('authorization_token')

![image](https://github.com/user-attachments/assets/cea5c371-9655-437f-bbc5-1c18b9b13361)

- [x]  ### Additional 

The client application displayed alerts for responses with 401 and 403 HTTP statuses. This behavior was added to the nodejs-aws-fe-main/src/index.tsx file.

![image](https://github.com/user-attachments/assets/5662aedd-8b0f-4c0e-a8c4-76d92f95279e)

____
# React-shop-cloudfront

This is frontend starter project for nodejs-aws mentoring program. It uses the following technologies:

- [Vite](https://vitejs.dev/) as a project bundler
- [React](https://beta.reactjs.org/) as a frontend framework
- [React-router-dom](https://reactrouterdotcom.fly.dev/) as a routing library
- [MUI](https://mui.com/) as a UI framework
- [React-query](https://react-query-v3.tanstack.com/) as a data fetching library
- [Formik](https://formik.org/) as a form library
- [Yup](https://github.com/jquense/yup) as a validation schema
- [Vitest](https://vitest.dev/) as a test runner
- [MSW](https://mswjs.io/) as an API mocking library
- [Eslint](https://eslint.org/) as a code linting tool
- [Prettier](https://prettier.io/) as a code formatting tool
- [TypeScript](https://www.typescriptlang.org/) as a type checking tool

## Available Scripts

### `start`

Starts the project in dev mode with mocked API on local environment.

### `build`

Builds the project for production in `dist` folder.

### `preview`

Starts the project in production mode on local environment.

### `test`, `test:ui`, `test:coverage`

Runs tests in console, in browser or with coverage.

### `lint`, `prettier`

Runs linting and formatting for all files in `src` folder.

# Task 2 (Serve SPA in AWS S3 and Cloudfront Services)
https://github.com/rolling-scopes-school/aws/blob/main/aws-developer/02_serving_spa/task.md

+ Installed the latest version of AWS CDK (https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html).
+ Configured credentials for AWS to make them accessible for AWS CLI & CDK.
+ Forked the React Shop single-page app from https://github.com/rolling-scopes-school/nodejs-aws-shop-react.
+ Installed dependencies (need to use npm i --force).
