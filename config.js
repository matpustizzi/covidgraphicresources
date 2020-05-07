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
  app.use(timeout("5s"));
  // all environments
  app.set("port", process.env.PORT || 3000);
  app.set("views", path.join(__dirname, "views"));
  app.set("view engine", "pug");
  app.use(logger("dev"));
  app.use(haltOnTimedout);
  app.use(bodyParser.json());
  app.use(haltOnTimedout);
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(haltOnTimedout);
  app.use(methodOverride());
  app.use(haltOnTimedout);
  app.use(express.static(path.join(__dirname, "public")));
  app.use(haltOnTimedout);
  app.use(errorHandler());

  app.get("/", (req, res, next) => {
    setTimeout(() => {
      if (req.timedout) {
        next();
      } else {
        res.send("success");
      }
    }, Math.random() * 7000);
  });

  app.use((err, req, res, next) => {
    res.send("timed out");
  });

  function haltOnTimedout(req, res, next) {
    if (!req.timedout) next();
  }

  return app;
})();
