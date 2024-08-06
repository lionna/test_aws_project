const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
const { HTTP_STATUS, MESSAGES } = require('./constants');
const { createTransactItems } = require('./dynamoDBUtils');

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;
const STOCKS_TABLE = process.env.STOCKS_TABLE;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

const snsClient = new SNSClient();

exports.handler = async (event) => {
    try {
        const records = event.Records.map(({ body }) => JSON.parse(body));

        console.log('records', records);

        await createTransactItems(records, PRODUCTS_TABLE, STOCKS_TABLE);

        const formattedMessage = `New Product Notification
        ${records.map(
            (product, i) => `
          ${i + 1}. "${product.title}" = ${product.price} $. Proto ${product.photo}
        `
        ).join('')}
        `;

        console.log('formattedMessage', formattedMessage);

        //const titles = records.map(record => record.title);
        //const titlesString = titles.join(', ');

        await snsClient.send(new PublishCommand({
            TopicArn: SNS_TOPIC_ARN,
            Message: formattedMessage,
            MessageAttributes: {
                'count': {
                    DataType: 'Number',
                    StringValue: `${records.length}`
                },
                /*  'title': {
             DataType: 'String',
             StringValue: JSON.stringify(titlesString)
         }*/
            },
            //MessageStructure: "json",
        }));

        return { statusCode: HTTP_STATUS.OK, body: JSON.stringify({ message: MESSAGES.BATCH_PROCESSED }) };
    } catch (error) {
        console.log(error);
        return {
            statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            body: JSON.stringify({ message: MESSAGES.INTERNAL_SERVER_ERROR })
        };
    }
};