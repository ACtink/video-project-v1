const { z } = require("zod");

const joinSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  age: z.number().min(16, "You must be at least 16 years old"),
  country: z.string().min(2, "Country is required"),
  acceptedTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the Terms & Conditions",
  }),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

module.exports = {
  joinSchema,
  loginSchema,
};
