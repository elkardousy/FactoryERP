import * as Joi from 'joi';

export const validationSchema = Joi.object({
  APP_NAME: Joi.string().default('Factory ERP'),

  NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),

  PORT: Joi.number().default(3000),

  DATABASE_URL: Joi.string().required(),

  JWT_SECRET: Joi.string().required(),

  JWT_EXPIRES_IN: Joi.string().required(),

  REFRESH_EXPIRES_IN: Joi.string().required(),

  LOG_LEVEL: Joi.string().default('info'),
});
