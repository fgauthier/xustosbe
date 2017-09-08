import * as AWS from "aws-sdk";
import * as log4js from "log4js";

log4js.configure({
  appenders: {out: {type: "stdout"}},
  categories: {
    default: {appenders: ["out"], level: "debug"},
  },
});

export let handler = (event, context, callback) => {

  const logger = log4js.getLogger();

  const tableName = process.env.TABLE_NAME;
  const resourceId = event.pathParameters.resourceId || false;
  const dynamodb = new AWS.DynamoDB();
  switch (event.httpMethod) {
    case "GET":
      {
        const params = {
          Key: {id: {S: resourceId}},
          TableName: tableName,
        };
        dynamodb.getItem(params, (err, data) => {
          if (err) {
            logger.error(err, err.stack); // an error occurred
            callback(null, {body: err.message, statusCode: 500});
          } else {
            logger.info("data: " + data);
            callback(null, {body: JSON.stringify(data), statusCode: 200});
          }
        });
      }
      break;
    case "PUT":
      try {
        const value = JSON.parse(event.body);
        const resource = {
          id: {S: resourceId},
          value,
        };
        const params = {
          Item: resource,
          ReturnConsumedCapacity: "TOTAL",
          TableName: tableName,
        };
        dynamodb.putItem(params, (err, data) => {
          if (err) {
            logger.error(err, err.stack); // an error occurred
            callback(null, {body: err.message, statusCode: 500});
          } else {
            logger.info("response: " + data);
            callback(null, {body: JSON.stringify(data), statusCode: 200});
          }
        });
      } catch (error) {
        logger.error(error, error.stack); // an error occurred
        callback(null, {body: error.message, statusCode: 500});
      }
      break;
    case "DELETE":
      {
        const params = {
          Key: {id: {S: resourceId}},
          TableName: tableName,
        };
        dynamodb.deleteItem(params, (err, data) => {
          if (err) {
            logger.error(err, err.stack); // an error occurred
            callback(null, {body: err.message, statusCode: 500});
          } else {
            logger.info("response: " + data);
            callback(null, {body: JSON.stringify(data), statusCode: 200});
          }
        });
      }
      break;
    default:
      // Send HTTP 501: Not Implemented
      logger.error("Error: unsupported HTTP method (" + event.httpMethod + ")");
      callback(null, {statusCode: 501});

  }
};
