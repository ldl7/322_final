const Joi = require('joi');
const httpStatusCodes = require('http-status-codes');
const { BadRequestError } = require('../utils/errors'); // Path adjusted to .. from middleware directory

// Middleware to handle Joi validation
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const dataToValidate = req[property];
    const { error, value } = schema.validate(dataToValidate, { abortEarly: false });

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(', ');
      return next(new BadRequestError(errorMessage));
    }
    req[property] = value; 
    next();
  };
};

// --- Individual Validation Schemas ---

const registrationSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required()
    .messages({
      'string.min': 'Password must be at least 8 characters long.',
    }),
  first_name: Joi.string().min(1).max(50).optional().allow('').default(''),
  last_name: Joi.string().min(1).max(50).optional().allow('').default(''),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const emailSchema = Joi.object({
  email: Joi.string().email().required(),
});

const passwordResetSchemaBody = Joi.object({
  newPassword: Joi.string().min(8).required()
    .messages({
      'string.min': 'New password must be at least 8 characters long.',
    }),
});
const passwordResetSchemaParams = Joi.object({
    token: Joi.string().hex().length(64).required(), 
});

const tokenSchemaParams = Joi.object({
  token: Joi.string().hex().length(64).required(), 
});


module.exports = {
  validateRegistration: validate(registrationSchema, 'body'),
  validateLogin: validate(loginSchema, 'body'),
  validateEmail: validate(emailSchema, 'body'), 
  validatePasswordReset: [
    validate(passwordResetSchemaParams, 'params'), 
    validate(passwordResetSchemaBody, 'body')
  ],
  validateToken: validate(tokenSchemaParams, 'params'), 
};
