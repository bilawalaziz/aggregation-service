# Task Producer - Python Service

Python-based task producer that publishes data aggregation tasks to RabbitMQ for the Node.js backend service to process.

## 🎯 What This Service Does

- Connects to RabbitMQ message broker
- Generates and publishes tasks (full_aggregation, posts_only, users_with_posts)
- Supports message priorities (low, medium, high)
- Auto-generates tasks at configurable intervals
- Includes dead-letter exchange for failed messages

## 📋 Prerequisites

- Python 3.11 or higher
- RabbitMQ running (local or Docker)
- Node.js backend service running (to consume tasks)

## 🔧 Installation

### Using uv
```bash
uv pip install -e .
```
## 🚀 Running the Producer
### Local Development
```bash
# From project root
uv run main.py

# Or with custom interval
uv run main.py --interval 15
```
### With Docker
```bash
docker build -t task-producer .
docker run --env-file .env task-producer
### With Docker Compose (from parent project)
docker compose up -d python-producer
```
## ⚙️ Configuration
Create a .env file in the project root:

```bash
# RabbitMQ Connection
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# Queue Names
TASK_QUEUE=aggregation_tasks
RESULT_QUEUE=aggregation_results

# Producer Behavior
AUTO_GENERATE_TASKS=true
TASK_GENERATION_INTERVAL=30

# Task Defaults
DEFAULT_PRIORITY=medium
LOG_LEVEL=INFO
```

## 📊 Task Types
|Task Type	|         Description|
|----------------|----------------|
|full_aggregation |	    Fetches posts, users, and comments
|posts_only	      |      Fetches only posts
|users_with_posts	|    Fetches users with their posts

## 🔍 Monitoring
Check if producer is running
```bash
# View logs
docker-compose logs -f python-producer

# Check RabbitMQ queue
docker exec aggregation-rabbitmq rabbitmqctl list_queues
```
Verify messages are being published
```bash
# Watch queue message count
watch -n 1 'docker exec aggregation-rabbitmq rabbitmqctl list_queues name messages'
```

## 📁 Project Structure
```text
producer/
├── __init__.py          # Package exports
├── config.py            # Central configuration & logging
├── client.py            # TaskProducer class
└── task_generator.py    # Task generation utilities

main.py                  # Entry point
.env.example             # Example Environment variables
pyproject.toml           # Project metadata
README.md                # Readme file
```
## 🐳 Docker
Build image
```bash
docker build -t task-producer .
```
Run container
```bash
docker run --rm \
  -e RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672 \
  -e TASK_QUEUE=aggregation_tasks \
  task-producer
```

## 🔄 Integration with Node.js Backend
This producer works with the Node.js backend service that:

Exposes POST /api/tasks endpoint for manual task creation

Consumes tasks from the same aggregation_tasks queue

Processes aggregations and stores results

## ⚠️ Troubleshooting
Connection refused to RabbitMQ
```bash
# Ensure RabbitMQ is running
docker ps | grep rabbitmq

# Test connectivity
nc -zv localhost 5672
```

Queue configuration mismatch
```bash
# Delete and recreate queue
docker exec aggregation-rabbitmq rabbitmqctl delete_queue aggregation_tasks
# Restart producer to recreate with correct config
```
No tasks being consumed
```bash
# Check Node.js consumer is running
docker-compose logs node-backend | grep "Processing task"

# Check consumer is bound to queue
docker exec aggregation-rabbitmq rabbitmqctl list_consumers
```

Note: i have copied icons from gpt.