import * as AWS from "aws-sdk";

export let handler = (event, context, callback) => {
  const bucketName = process.env.S3_BUCKET;
  callback(null, bucketName);
};
