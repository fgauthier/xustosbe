import * as log4js from "log4js";
import * as App from "./app";

log4js.configure({
  appenders: {out: {type: "stdout"}},
  categories: {
    default: {appenders: ["out"], level: "debug"},
  },
});

const logger = log4js.getLogger();

App.awsconfig.loadFromPath("./.awsconfig.json");

const port = 3000;

App.app.listen(port);

logger.info(`listening on http://localhost:${port}`);
