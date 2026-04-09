require('dotenv').config({ path: './.env' });

//mocking rabbitMQ
// Mock RabbitMQ module before loading app
jest.mock('../src/config/rabbitmq', () => ({
  connectRabbitMQ: jest.fn().mockResolvedValue(true),
  publishTask: jest.fn().mockResolvedValue(true),
  startConsumer: jest.fn().mockResolvedValue(true),
  closeRabbitMQ: jest.fn().mockResolvedValue(true),
}));

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';  


// increase timeout for async operations
jest.setTimeout(10000);
