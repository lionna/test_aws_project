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
- [Product Service API for id = 1](https://dapdmi8g8h.execute-api.us-east-1.amazonaws.com/prod/products/1)
- [Frontend](https://d3oeh93tzbcw2m.cloudfront.net/)
- [Swagger](http://localhost:3000/api-docs)