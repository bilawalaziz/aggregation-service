import time
from producer.config import config, logging
from producer.producer import TaskProducer
from producer.task_generator import generate_sample_tasks, generate_continuous_tasks

logger = logging.getLogger(__name__)


def main():
    """entry point to publish tasks to rabbitMQ"""
    logger.info(f"Starting producer with config:")
    logger.info(f"  rabbitMQ URL: {config.RABBITMQ_URL}")
    logger.info(f"  taskQueue: {config.TASK_QUEUE}")
    
    producer = TaskProducer()

    if not producer.connect():
        logger.error("Could not connect to RabbitMQ. Exiting.")
        return

    try:
        logger.info("task producer started")
        generate_sample_tasks(producer, count=3)
        logger.info(f"producer running. Publishing every {config.TASK_GENERATION_INTERVAL}s. Press Ctrl+C to stop.")
        
        if config.AUTO_GENERATE_TASKS:
            generate_continuous_tasks(producer)
        else:
            while True:
                time.sleep(1)

    except KeyboardInterrupt:
        logger.info("Received interrupt signal.")
    finally:
        producer.close()


if __name__ == '__main__':
    main()