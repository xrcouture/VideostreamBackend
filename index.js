require("dotenv").config();
const express = require("express");
const crypto = require("crypto");
const model = require("./oneTimeLinkModel");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("./errors");
const logger = require("./logger");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
// express async error handlers
require("express-async-errors");
// database
const connectDB = require("./connect");
const app = express();

// middlewares
const notFoundMiddleware = require("./middleware/notFound");
const errorHandlerMiddleware = require("./middleware/error-handler");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// security package
const helmet = require("helmet");
const xss = require("xss-clean");
const cors = require("cors");
const mongoSanitize = require("express-mongo-sanitize");

// middleware for security
app.use(helmet());
app.use(cors({ origin: process.env.ORIGIN, credentials: true }));
app.use(xss());
app.use(mongoSanitize());

// Generate a random token
function generateToken() {
  return crypto.randomBytes(20).toString("hex");
}

// Create the config obj with credentials
// Always use environment variables or config files
// Don't hardcode your keys into code
const config = {
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
  region: process.env.AWS_BUCKET_REGION,
};

// Instantiate a new s3 client
const client = new S3Client(config);

async function getSignedFileUrl(fileName, bucket, expiresIn) {
  // Instantiate the GetObject command,
  // a.k.a. specific the bucket and key
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: fileName,
  });

  // await the signed URL and return it
  return await getSignedUrl(client, command, { expiresIn });
}

// Endpoint to generate a one-time accessible link
app.post("/validate", async (req, res) => {
  const url = await getSignedFileUrl(
    "userDashboard/img_1978.m3u8",
    "xrcouture-restricted",
    1800 // 30 min
  );
  const { email } = req.body;
  if (!email) {
    res.status(400).send("Empty mailId");
  }
  const existingUser = await model.findOne({ email });
  if (!existingUser) {
    logger.error(`The mailId: ${email} doesn't exists`);
    throw new CustomError.BadRequestError("Invalid");
  } else {
    if (existingUser.accessToken) {
      logger.error(`The accessToken for mail: ${email} already exists`);
      throw new CustomError.BadRequestError("Expired");
    } else {
      const token = generateToken();
      await model.findOneAndUpdate(
        {
          email,
        },
        { email, accessToken: token },
        { new: true }
      );

      logger.info(`Access for mailId: ${email} to view the video is granted`);
      res.status(StatusCodes.OK).json({
        url: url,
      });
    }
  }
});

// middleware for error handling
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URL);
    logger.info("Connection to MongoDB is successfully established");
    const server = app.listen(port, () =>
      logger.info(`Server is listening on port ${port}...`)
    );
    server.on("error", function (e) {
      logger.info(`The port ${port} is already in use`);
      throw new CustomError.CustomAPIError("The port is busy");
    });
  } catch (error) {
    logger.error(
      `Could not establish a connection to the Server on port ${port}`
    );
    throw new CustomError.CustomAPIError("Could not establish a connection");
  }
};

start();
