const retryOperation = async (operation, options = {}) => {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = 2,
    logger = console,
    operationName = 'Operation',
  } = options;
  
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        logger.error(`${operationName} failed after ${maxRetries} attempts`, error);
        throw error;
      }
      
      const waitTime = delay * Math.pow(backoff, attempt - 1);
      logger.warn(`${operationName} attempt ${attempt} failed, retrying in ${waitTime}ms`, {
        error: error.message,
      });
      
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError;
};

module.exports = {
  retryOperation,
};