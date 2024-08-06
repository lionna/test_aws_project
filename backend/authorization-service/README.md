# Import-Service

1. Install the latest version of AWS SDK

Run the following command to create a default package.json file:

```sh
`npm init -y`
```

Run the following command to install the Amazon S3 client package:

```sh
`npm i @aws-sdk/client-s3`
```

Add the following code to a file named index.js in the yours folder:

```js
// This is used for getting user input.
import { createInterface } from "readline/promises";

import {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
  DeleteObjectCommand,
  DeleteBucketCommand,
  paginateListObjectsV2,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

export async function main() {
  // A region and credentials can be declared explicitly. For example
  // `new S3Client({ region: 'us-east-1', credentials: {...} })` would
  //initialize the client with those settings. However, the SDK will
  // use your local configuration and credentials if those properties
  // are not defined here.
  const s3Client = new S3Client({});

  // Create an Amazon S3 bucket. The epoch timestamp is appended
  // to the name to make it unique.
  const bucketName = `test-bucket-${Date.now()}`;
  await s3Client.send(
    new CreateBucketCommand({
      Bucket: bucketName,
    })
  );

  // Put an object into an Amazon S3 bucket.
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: "my-first-object.txt",
      Body: "Hello JavaScript SDK!",
    })
  );

  // Read the object.
  const { Body } = await s3Client.send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: "my-first-object.txt",
    })
  );

  console.log(await Body.transformToString());

  // Confirm resource deletion.
  const prompt = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const result = await prompt.question("Empty and delete bucket? (y/n) ");
  prompt.close();

  if (result === "y") {
    // Create an async iterator over lists of objects in a bucket.
    const paginator = paginateListObjectsV2(
      { client: s3Client },
      { Bucket: bucketName }
    );
    for await (const page of paginator) {
      const objects = page.Contents;
      if (objects) {
        // For every object in each page, delete it.
        for (const object of objects) {
          await s3Client.send(
            new DeleteObjectCommand({ Bucket: bucketName, Key: object.Key })
          );
        }
      }
    }

    // Once all the objects are gone, the bucket can be deleted.
    await s3Client.send(new DeleteBucketCommand({ Bucket: bucketName }));
  }
}

// Call a function if this file was run directly. This allows the file
// to be runnable without running on import.
import { fileURLToPath } from "url";
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
```

2. Install the CSV parser package:

```sh
`npm i csv-parser`
```

# Task 7
https://github.com/rolling-scopes-school/aws/blob/main/aws-developer/07_authorization/task.md

### Links
- [Product Service API](https://dapdmi8g8h.execute-api.us-east-1.amazonaws.com/prod/products)
- [Product Service API for id = 8f79f8e2-8841-4dc3-871e-2f7c861b130e](https://dapdmi8g8h.execute-api.us-east-1.amazonaws.com/prod/products/8f79f8e2-8841-4dc3-871e-2f7c861b130e)
- [Frontend](https://d3oeh93tzbcw2m.cloudfront.net/)

### Settings:
[Token Generator](https://www.debugbear.com/basic-auth-header-generator)
userName = 'Tati-Moon'
password = 
> add to console localStorage.setItem('authorization_token', "SOME_VALID_TOKEN");
or
> add to console localStorage.setItem('authorization_token', "SOME_INVALID_TOKEN");

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