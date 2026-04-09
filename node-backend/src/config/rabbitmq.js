const amqp = require('amqplib');
const logger = require('./logger');
const { processTask } = require('../services/taskProcessor');
const { retryOperation } = require('../utils/retryHelper');

let connection = null;
let channel = null;

const TASK_QUEUE = process.env.TASK_QUEUE || 'aggregation_tasks';
const RESULT_QUEUE = process.env.RESULT_QUEUE || 'aggregation_results';
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES) || 3;
const RETRY_DELAY = parseInt(process.env.RETRY_DELAY_MS) || 1000;

const connectRabbitMQ = async () => {
  return retryOperation(
    async () => {
      connection = await amqp.connect(process.env.RABBITMQ_URL);
      channel = await connection.createChannel();
      
      await channel.assertQueue(TASK_QUEUE, { 
        durable: true,
        deadLetterExchange: 'dlx',
        arguments: {
          'x-dead-letter-exchange': 'dlx',
          'x-max-retries': MAX_RETRIES,
          'x-max-priority': 10 
        }
      });
      
      await channel.assertQueue(RESULT_QUEUE, { durable: true });
      await channel.assertExchange('dlx', 'direct', { durable: true });
      
      logger.info('RabbitMQ connected successfully');
      
      connection.on('error', (error) => {
        logger.error('RabbitMQ connection error:', error);
        setTimeout(connectRabbitMQ, 5000);
      });
      
      connection.on('close', () => {
        logger.warn('RabbitMQ connection closed, reconnecting...');
        setTimeout(connectRabbitMQ, 5000);
      });
      
      return { connection, channel };
    },
    {
      maxRetries: 5,
      delay: 5000,
      logger,
      operationName: 'RabbitMQ Connection'
    }
  );
};

const publishTask = async (task) => {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized');
  }
  
  const message = Buffer.from(JSON.stringify(task));
  const result = channel.sendToQueue(TASK_QUEUE, message, {
    persistent: true,
    contentType: 'application/json',
  });
  
  logger.info(`Task published: ${task.taskId}`);
  return result;
};

const startConsumer = async () => {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized');
  }
  
  await channel.prefetch(1); // Process one task at a time
  
  channel.consume(TASK_QUEUE, async (msg) => {
    if (!msg) return;
    
    const task = JSON.parse(msg.content.toString());
    const retryCount = msg.properties.headers?.['x-retry-count'] || 0;
    
    logger.info(`Processing task ${task.taskId}, retry: ${retryCount}`);
    
    try {
      const result = await processTask(task);
      
      // Send result
      const resultMessage = Buffer.from(JSON.stringify({
        taskId: task.taskId,
        status: 'completed',
        result,
        timestamp: new Date().toISOString(),
      }));
      
      channel.sendToQueue(RESULT_QUEUE, resultMessage, { persistent: true });
      channel.ack(msg);
      
      logger.info(`Task ${task.taskId} completed successfully`);
    } catch (error) {
      logger.error(`Task ${task.taskId} failed:`, error);
      
      if (retryCount < MAX_RETRIES) {
        // Retry with delay
        setTimeout(() => {
          channel.nack(msg, false, false);
        }, RETRY_DELAY * (retryCount + 1));
        
        logger.warn(`Task ${task.taskId} will be retried (${retryCount + 1}/${MAX_RETRIES})`);
      } else {
        // Send to dead letter queue
        channel.sendToQueue('dlx', msg.content, {
          headers: { 'x-error': error.message }
        });
        channel.ack(msg);
        logger.error(`Task ${task.taskId} failed permanently after ${MAX_RETRIES} retries`);
      }
    }
  }, { noAck: false });
};

const closeRabbitMQ = async () => {
  if (channel) await channel.close();
  if (connection) await connection.close();
  logger.info('RabbitMQ connections closed');
};

module.exports = {
  connectRabbitMQ,
  publishTask,
  startConsumer,
  closeRabbitMQ,
};