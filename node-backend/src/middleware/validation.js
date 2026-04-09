const Joi = require('joi');

const taskSchema = Joi.object({
  taskType: Joi.string().valid('full_aggregation', 'posts_only', 'users_with_posts').required(),
  parameters: Joi.object({
    limit: Joi.number().integer().min(1).max(100),
    userId: Joi.number().integer(),
  }).optional(),
  priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
}).unknown(false);

const validateTask = (data) => {
  return taskSchema.validate(data, { abortEarly: false });
};

module.exports = {
  validateTask,
};