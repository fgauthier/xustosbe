import * as AWS from "aws-sdk";
import * as awsExpress from "aws-serverless-express";
import * as awsExpressMiddleware from "aws-serverless-express/middleware";
import * as bodyParser from "body-parser";
import * as express from "express";
import * as log4js from "log4js";
import * as uuid from "node-uuid";

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
const UNAUTH = "UNAUTH";
const tableName = process.env.TABLE_NAME;

const resourcePath = "/items/pets";

let dynamodb;

app.get(resourcePath, (req, res) => {
  const anyReq: any = req;
  // performs a DynamoDB Query operation to extract all records for the cognitoIdentityId in the table
  getDynamoDB().query({
    KeyConditions: {
      userId: {
        AttributeValueList: [anyReq.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH],
        ComparisonOperator: "EQ",
      },
    },
    TableName: tableName,
  }, (err, data) => {
    if (err) {
      logger.error(err);
      res.status(500).json({
        message: "Could not load pets",
      }).end();
    } else {
      res.json(data.Items).end();
    }
  });
});

app.post(resourcePath, (req, res) => {
  if (!req.body.name) {
    res.status(400).json({
      message: "You must specify a pet name",
    }).end();
    return;
  }

  const pet = {...req.body};

  Object.keys(pet).forEach((key) => (pet[key] === "" && delete pet[key]));

  const anyReq: any = req;
  pet.userId = anyReq.apiGateway.event.requestContext.identity.cognitoIdentityId || UNAUTH;
  pet.petId = uuid.v1();

  getDynamoDB().put({
    Item: pet,
    TableName: tableName,
  }, (err, data) => {
    if (err) {
      logger.error(err);
      res.status(500).json({
        message: "Could not insert pet",
      }).end();
    } else {
      res.json(pet);
    }
  });
});

app.delete(resourcePath, (req, res) => {
  const params = {
    Key: {id: {S: req.params.resourceId}},
    TableName: tableName,
  };
  getDynamoDB().deleteItem(params, (err, data) => {
    if (err) {
      logger.error(err, err.stack); // an error occurred
      return res.status(500).json(err.message);
    } else {
      logger.info("response: " + data);
      res.status(200).json(data);
    }
  });
});

const getDynamoDB = () => {
  if (dynamodb === undefined) {
    dynamodb = new AWS.DynamoDB.DocumentClient();
  }
  return dynamodb;
};
