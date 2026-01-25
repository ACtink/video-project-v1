const { PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");
const { s3 } = require("./s3-configure");

 const uploadToS3 = async (file, options) => {
  const { folder, filename } = options;

  const fileStream = fs.createReadStream(file.path);

  const ext = path.extname(file.originalname);

  const key = `uploads/${folder}/${filename}${ext}`;

  const uploadParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: fileStream,
    ContentType: file.mimetype,
  };

  await s3.send(new PutObjectCommand(uploadParams));

  return `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${key}`;
};


module.exports = {
    uploadToS3,
};