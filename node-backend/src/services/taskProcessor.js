const aggregationService = require('./aggregationService');
const logger = require('../config/logger');

const processTask = async (task) => {
  const { taskId, taskType, parameters, timestamp } = task;
  
  logger.info(`Starting task processing: ${taskId}`, { taskType });
  
  try {
    // adding some delay to mimic real world use case
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // data aggregation
    const aggregatedData = await aggregationService.aggregateData(taskType, parameters);
    
    const result = {
      taskId,
      status: 'success',
      data: aggregatedData,
      processedAt: new Date().toISOString(),
      originalTimestamp: timestamp,
    };
    
    logger.info(`Task ${taskId} processed successfully.`);
    return result;
  } catch (error) {
    logger.error(`Task ${taskId} processing failed:`, error);
    throw new Error(`Processing failed: ${error.message}`);
  }
};

module.exports = {
  processTask,
};