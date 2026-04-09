import time
from datetime import datetime

from producer.config import config, logging
from producer.producer import TaskProducer

logger = logging.getLogger(__name__)


def generate_sample_tasks(producer: TaskProducer, count: int = 5):
    """generate sample tasks for and send to rabbitMQ"""
    # task types
    task_types = ['full_aggregation', 'posts_only', 'users_with_posts']
    # task avialable priorities
    priorities = ['low', 'medium', 'high']
    
    for i in range(count):
        # randomize the task type
        task_type = task_types[i % len(task_types)]
        # randomize the task priority
        priority = priorities[i % len(priorities)]
        parameters = {
            'limit': 10,
            'sample_number': i + 1,
            'timestamp': datetime.now().isoformat()
        }
        
        task_id = producer.publish_task(task_type, parameters, priority)
        logger.info(f"Generated task {i+1}/{count}: {task_id} (priority: {priority})")
        # adding 1 second delay to avoid limit rate 
        time.sleep(1)


def generate_continuous_tasks(producer: TaskProducer, interval: int = None):
    """ generate task to queue at provided (if not env preset) time interval"""
    interval = interval or config.TASK_GENERATION_INTERVAL
    
    while True:
        producer.publish_task('full_aggregation', {'auto_generated': True})
        time.sleep(interval)