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
