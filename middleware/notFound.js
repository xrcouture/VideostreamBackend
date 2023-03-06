const logger = require("../logger");

const notFound = (req, res) => {
  logger.error(
    `The ${req.method} method on the url: ${req.url} does not exists`
  );
  res.status(404).send("Route does not exist");
};

module.exports = notFound;
