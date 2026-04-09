import json
import uuid
import pika
from datetime import datetime
from typing import Dict, Any

from producer.config import config, logging

logger = logging.getLogger(__name__)


class TaskProducer:
    def __init__(self, rabbitmq_url: str = None, task_queue: str = None):
        self.rabbitmq_url = rabbitmq_url or config.RABBITMQ_URL
        self.task_queue = task_queue or config.TASK_QUEUE
        self.connection = None
        self.channel = None
        
    def connect(self) -> bool:
        """create dlq and task_queue and connect to rabbitMQ"""
        try:
            params = pika.URLParameters(self.rabbitmq_url)
            self.connection = pika.BlockingConnection(params)
            self.channel = self.connection.channel()

            # dead-letter exchange in case of any error
            self.channel.exchange_declare(
                exchange='dlx',
                exchange_type='direct',
                durable=True
            )

            # task queue with priority support
            self.channel.queue_declare(
                queue=self.task_queue,
                durable=True,
                arguments={
                    'x-dead-letter-exchange': 'dlx',
                    'x-max-priority': 10
                }
            )
            logger.info(f"Connected to rabbitMQ at {self.rabbitmq_url}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect to rabbitMQ: {e}")
            return False
    
    def publish_task(self, task_type: str, parameters: Dict[str, Any] = None, 
                     priority: str = 'medium') -> str:
        """publish a task to rabbitMQ"""
        task_id = str(uuid.uuid4())
        task = {
            'taskId': task_id,
            'taskType': task_type,
            'parameters': parameters or {},
            'priority': priority,
            'timestamp': datetime.now().isoformat(),
            'producer': 'python-producer'
        }
        
        try:
            message = json.dumps(task)
            priority_map = {'low': 1, 'medium': 5, 'high': 10}
            
            self.channel.basic_publish(
                exchange='',
                routing_key=self.task_queue,
                body=message,
                properties=pika.BasicProperties(
                    delivery_mode=2,
                    content_type='application/json',
                    priority=priority_map.get(priority, 5)
                )
            )
            logger.info(f"Published task {task_id} of type {task_type}")
            return task_id
            
        except Exception as e:
            logger.error(f"Failed to publish task: {e}")
            raise
    
    def close(self):
        """close RabbitMQ connection"""
        if self.connection and self.connection.is_open:
            self.connection.close()
            logger.info("Closed RabbitMQ connection.")