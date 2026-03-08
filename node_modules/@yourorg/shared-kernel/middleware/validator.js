// shared-kernel/middleware/validator.js
export const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: "Validation Error", 
      details: error.details.map(d => d.message) 
    });
  }
  next();
};