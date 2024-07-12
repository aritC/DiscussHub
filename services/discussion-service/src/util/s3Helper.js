const AWS = require("aws-sdk");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

const uploadFileToS3 = (filePath) => {
  const fileContent = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  const fileKey = `${uuidv4()}-${fileName}`;
  const params = {
    Bucket: BUCKET_NAME,
    Key: fileKey,
    Body: fileContent,
    ACL: "public-read",
  };

  return new Promise((resolve, reject) => {
    s3.upload(params, (error, data) => {
      if (error) {
        return reject(error);
      }
      resolve(data);
    });
  });
};

module.exports = {
  uploadFileToS3,
};
