const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { getCorsHeaders } = require("./cors");
const { HTTP_STATUS, MESSAGES } = require("./constants");

const BUCKET_NAME = process.env.BUCKET_NAME || "";
const client = new S3Client();
const PRESIGNED_URL_EXPIRATION = 3600; // URL life time 
const UPLOAD_PATH_PREFIX = "uploaded/";

exports.handler = async (event) => {
  console.log("Import products file request", event);

  const origin = event.headers?.origin;
  const headers = getCorsHeaders(origin);
  const name = event.queryStringParameters?.name;

  if (!name) {
    console.log(MESSAGES.FILE_NAME_IS_MISSING);
    return {
      statusCode: HTTP_STATUS.BAD_REQUEST,
      headers,
      body: JSON.stringify({ message: MESSAGES.FILE_NAME_IS_MISSING }),
    };
  }

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: `${UPLOAD_PATH_PREFIX}${name}`,
  });

  try {
    const presignedUrl = await getSignedUrl(client, command, { expiresIn: PRESIGNED_URL_EXPIRATION });

    console.log("presignedUrl", presignedUrl);
    return {
      statusCode: HTTP_STATUS.OK,
      headers,
      body: JSON.stringify({ url: presignedUrl }),
    };
  } catch (error) {
    console.log("Import Error", error);
    return {
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      headers,
      body: JSON.stringify({ message: MESSAGES.INTERNAL_SERVER_ERROR }),
    };
  }
};
