import * as AWS from "aws-sdk";
import * as awsExpress from "aws-serverless-express";
import * as awsExpressMiddleware from "aws-serverless-express/middleware";
import * as bodyParser from "body-parser";
import * as express from "express";
import * as log4js from "log4js";

log4js.configure({
  appenders: {out: {type: "stdout"}},
  categories: {
    default: {appenders: ["out"], level: "debug"},
  },
});

export const awsconfig = AWS.config;

awsconfig.update({region: process.env.REGION});

// declare a new express app
export const app = express();
app.use(awsExpressMiddleware.eventContext({deleteHeaders: false}), bodyParser.json());

const logger = log4js.getLogger();

const tableName = process.env.TABLE_NAME;

const resourcePath = "/resource/:resourceId";

let dynamodb;

app.get(resourcePath, (req, res) => {
  const params = {
    Key: {id: {S: req.params.resourceId}},
    TableName: tableName,
  };
  if (dynamodb === undefined) {
    dynamodb = new AWS.DynamoDB();
  }
  dynamodb.getItem(params, (err, data) => {
    if (err) {
      logger.error(err, err.stack); // an error occurred
      return res.status(500).json(err.message);
    } else {
      logger.info("data: " + data);
      res.status(200).json(data);
    }
  });
});

app.put(resourcePath, (req, res) => {
  try {
    const value = JSON.parse(req.body);
    const resource = {
      id: {S: req.params.resourceId},
      value,
    };
    const params = {
      Item: resource,
      ReturnConsumedCapacity: "TOTAL",
      TableName: tableName,
    };
    if (dynamodb === undefined) {
      dynamodb = new AWS.DynamoDB();
    }
    dynamodb.putItem(params, (err, data) => {
      if (err) {
        logger.error(err, err.stack); // an error occurred
        return res.status(500).json(err.message);
      } else {
        logger.info("response: " + data);
        res.status(200).json(data);
      }
    });
  } catch (error) {
    logger.error(error, error.stack); // an error occurred
    return res.status(500).json(error.message);
  }
});

app.delete(resourcePath, (req, res) => {
  const params = {
    Key: {id: {S: req.params.resourceId}},
    TableName: tableName,
  };
  if (dynamodb === undefined) {
     dynamodb = new AWS.DynamoDB();
  }
  dynamodb.deleteItem(params, (err, data) => {
    if (err) {
      logger.error(err, err.stack); // an error occurred
      return res.status(500).json(err.message);
    } else {
      logger.info("response: " + data);
      res.status(200).json(data);
    }
  });
});
