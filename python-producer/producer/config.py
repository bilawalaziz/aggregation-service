import os
import logging
from pathlib import Path
from dotenv import load_dotenv

# Load .env
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)
 

def setup_logging():
    """Configure logging for the entire application."""
    log_level = os.getenv('LOG_LEVEL', 'INFO')
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)
    
    logging.basicConfig(
        level=numeric_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Suppress additional warnings as it is bloating logs
    logging.getLogger('pika').setLevel(logging.WARNING)

# Initialize logging
setup_logging()

class Config:
    """Configuration class to load required variables as per environment."""
    
    # rabbitMQ
    RABBITMQ_URL = os.getenv('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672')
    TASK_QUEUE = os.getenv('TASK_QUEUE', 'aggregation_tasks')
    RESULT_QUEUE = os.getenv('RESULT_QUEUE', 'aggregation_results')
    
    # producer behavior
    AUTO_GENERATE_TASKS = os.getenv('AUTO_GENERATE_TASKS', 'true').lower() == 'true'
    # setting default interval to 30 seconds in case not provided
    TASK_GENERATION_INTERVAL = int(os.getenv('TASK_GENERATION_INTERVAL', '30'))
    
    # task priority set default to mediuim [low, medium, high]
    DEFAULT_PRIORITY = os.getenv('DEFAULT_PRIORITY', 'medium')
    
    @classmethod
    def validate(cls):
        """Validate required config."""
        if not cls.RABBITMQ_URL:
            raise ValueError("RABBITMQ_URL is required.")
        if not cls.TASK_QUEUE:
            raise ValueError("TASK_QUEUE is required.")

# create config from env file and validate
config = Config()
config.validate()