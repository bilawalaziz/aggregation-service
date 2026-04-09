const dotenv = require('dotenv');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const taskRoutes = require('./routes/taskRoutes');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./config/logger');
const { connectRabbitMQ, startConsumer } = require('./config/rabbitmq');

dotenv.config();

const app = express();
const swaggerDocument = YAML.load(path.join(__dirname, '../docs/openapi.yaml'));

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
});
app.use('/api', limiter);

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip });
  next();
});

// API routes
app.use('/api', taskRoutes);

// Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Initialize services
const initializeServices = async () => {
  try {
    await connectRabbitMQ();
    await startConsumer();
    logger.info('All services are initailized successfully.');
  } catch (error) {
    logger.error('Failed to initialize services, check error:', error);
    process.exit(1);
  }
};

// Start server
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000;
  const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    initializeServices();
  });

  // shutdown in case of SIGTERM interrupt is received
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully.');
    server.close(() => {
      logger.info('Process is terminated.');
      process.exit(0);
    });
  });
}

module.exports = app;