const { DeleteObjectCommand } =  require("@aws-sdk/client-s3");
const  { s3 } =  require("./s3-configure.js");

const deleteFromS3 = async (imageUrl) => {
  const key = imageUrl.split(".amazonaws.com/")[1];

  await s3.send(
    new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    }),
  );
};

module.exports = {
    deleteFromS3,
};
