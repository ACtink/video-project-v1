const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { s3 } = require("./s3-configure");

const deleteFromS3 = async (fileUrlOrKey) => {
  try {
    if (!fileUrlOrKey) return;

    /* ===========================
       EXTRACT KEY IF URL GIVEN
    =========================== */

    let key = fileUrlOrKey;

    if (fileUrlOrKey.includes(".amazonaws.com")) {
      key = fileUrlOrKey.split(".amazonaws.com/")[1];
    }

    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,

      Key: key,
    });

    await s3.send(command);

    console.log("Deleted from S3:", key);
  } catch (err) {
    console.error("S3 delete error:", err);

    throw err;
  }
};

module.exports = {
  deleteFromS3,
};
