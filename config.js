/**
 * Module dependencies.
 */
const express = require("express");
const logger = require("morgan");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const errorHandler = require("errorhandler");
const path = require("path");
const timeout = require("connect-timeout");

module.exports = (() => {
  const app = express();

  // all environments
  app.set("port", process.env.PORT || 3000);
  app.set("views", path.join(__dirname, "views"));
  app.set("view engine", "pug");
  app.use(logger("dev"));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(methodOverride());
  app.use(express.static(path.join(__dirname, "public")));

  app.use(errorHandler());
  app.use(timeout("5s"));
  app.use(haltOnTimedout);

  function haltOnTimedout(req, res, next) {
    if (!req.timedout) next();
  }

  return app;
})();
