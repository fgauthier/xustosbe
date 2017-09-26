import * as awsExpress from "aws-serverless-express";
import * as log4js from "log4js";
import * as App from "./app";

log4js.configure({
  appenders: {out: {type: "stdout"}},
  categories: {
    default: {appenders: ["out"], level: "debug"},
  },
});

const server = awsExpress.createServer(App.app);

exports.handler = (event, context) => {

  const logger = log4js.getLogger();

  logger.info("EVENT: " + JSON.stringify(event));

  awsExpress.proxy(server, event, context);

};
