const { S3Client, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { SQSClient, SendMessageBatchCommand } = require('@aws-sdk/client-sqs');
const csvParser = require("csv-parser");
const { getCorsHeaders } = require("./cors");
const { HTTP_STATUS, MESSAGES } = require("./constants");

const QUEUE_URL = process.env.QUEUE_URL;

exports.handler = async (event) => {

    const s3Client = new S3Client();
    const sqsClient = new SQSClient();

    const origin = event.headers?.origin;
    const headers = getCorsHeaders(origin);
    const bucketName = event.Records[0].s3.bucket.name;
    const objectName = event.Records[0].s3.object.key;

    console.log('bucket:', bucketName);
    console.log('key:', objectName);
    console.log('QUEUE_URL:', QUEUE_URL);

    try {
        const getObjectCommand = new GetObjectCommand({
            Bucket: bucketName,
            Key: objectName,
        });

        const s3Object = await s3Client.send(getObjectCommand);

        const results = [];
        const parser = s3Object.Body.pipe(csvParser());

        for await (const record of parser) {
            results.push(record);
        }

        console.log('Parsed CSV data:', results);

        const messages = results.map((product, index) => ({
            Id: `Message${index}`,
            MessageBody: JSON.stringify(product),
            MessageAttributes: {
                'price': {
                    DataType: 'Number',
                    StringValue: product.price
                },
            }
        }));

        console.log('messages', messages);

        await sqsClient.send(new SendMessageBatchCommand({
            QueueUrl: QUEUE_URL,
            Entries: messages
        }));

        console.log(`Successfully sent ${results.length} messages to SQS.`);

        const newObjectKey = `parsed/${objectName.split('/').pop()}`;
        await s3Client.send(new CopyObjectCommand({ Bucket: bucketName, CopySource: `${bucketName}/${objectName}`, Key: newObjectKey }));
        await s3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: objectName }));

        return { 
            statusCode: HTTP_STATUS.OK, 
            headers, 
            body: JSON.stringify({ message: MESSAGES.FILE_PROCESSED }) 
        };
    } catch (error) {
        console.log('Error processing CSV file:', error);
        return { 
            statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR, 
            headers, 
            body: JSON.stringify({ message: MESSAGES.INTERNAL_SERVER_ERROR }) 
        };
    }
};
