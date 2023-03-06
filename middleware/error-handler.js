const { StatusCodes } = require("http-status-codes");
const logger = require("../logger");

const errorHandlerMiddleware = (err, req, res, next) => {
  let customError = {
    // set default
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    msg: err.message || "Something went wrong try again later",
  };
  if (err.name === "ValidationError") {
    customError.msg = Object.values(err.errors)
      .map((item) => item.message)
      .join(",");
    customError.statusCode = 400;
  }

  logger.error(
    `Custom Error occured with statuscode: ${customError.statusCode} and error message: ${customError.msg} while accessing: ${req.url} with ${req.method} method`
  );
  return res.status(customError.statusCode).json({ msg: customError.msg });
};

module.exports = errorHandlerMiddleware;
