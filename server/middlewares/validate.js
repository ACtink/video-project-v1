const { ZodError } = require("zod");

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        message: "Validation failed",
        errors: err.issues.map((issue) => issue.message),
      });
    }

    // fallback (should rarely happen)
    return res.status(500).json({
      message: "Something went wrong",
    });
  }
};

module.exports = validate;
