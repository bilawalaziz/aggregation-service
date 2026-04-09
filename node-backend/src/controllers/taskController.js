const { v4: uuidv4 } = require('uuid');
const { publishTask } = require('../config/rabbitmq');
const logger = require('../config/logger');
const { validateTask } = require('../middleware/validation');

const createTask = async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = validateTask(req.body);
    if (error) {
      logger.warn('Task validation failed', { errors: error.details });
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details,
      });
    }
    
    const task = {
      taskId: uuidv4(),
      taskType: value.taskType,
      parameters: value.parameters || {},
      status: 'pending',
      timestamp: new Date().toISOString(),
      userId: req.user?.userId || 'anonymous',
    };
    
    // Publish to RabbitMQ
    await publishTask(task);
    
    logger.info(`Task created and queued: ${task.taskId}`, { taskType: task.taskType });
    
    res.status(202).json({
      message: 'Task accepted for processing',
      taskId: task.taskId,
      status: 'pending',
      links: {
        self: `/api/tasks/${task.taskId}`,
      },
    });
  } catch (error) {
    logger.error('Failed to create task:', error);
    next(error);
  }
};

const getTaskStatus = async (req, res, next) => {
  // mocking response 
  res.status(200).json({
    taskId: req.params.id,
    status: 'processing',
    message: 'Task status endpoint - mocking with OK Resp status',
  });
};

module.exports = {
  createTask,
  getTaskStatus,
};