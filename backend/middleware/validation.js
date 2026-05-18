export const validate = (validations) => {
  return async (req, res, next) => {
    try {
      for (const validation of validations) {
        const result = await validation.run(req);
        if (!result.isEmpty()) {
          return res.status(400).json({
            message: 'Validation failed',
            errors: result.array()
          });
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
