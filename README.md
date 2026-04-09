# Data Aggregation Service

A deployment ready microservices architecture for asynchronous data aggregation with JWT authentication, RabbitMQ messaging, and comprehensive error handling.

## 🚀 Features

- **REST API** with JWT authentication
- **Asynchronous task processing** using RabbitMQ
- **Multi-system data aggregation** from JSONPlaceholder API
- **Comprehensive error handling** with retry logic
- **OpenAPI 3.0 documentation**
- **Containerized** with Docker and Docker Compose
- **Production-ready logging** with Winston
- **Rate limiting** and security headers
- **Health checks** and graceful shutdown

## 📋 Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.13+ (for local development)
- Make (optional)

## 🏗️ Architecture
```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA AGGREGATION SERVICE                             │
└─────────────────────────────────────────────────────────────────────────────┘

                                    ┌─────────────────┐
                                    │     YOU         │
                                    │  (Manual via    │
                                    │   curl/Postman) │
                                    └────────┬────────┘
                                             │
                                             │ POST /api/tasks
                                             │ + JWT Token
                                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐

│                                                                             │
│  ┌──────────────────────┐                         ┌──────────────────────┐ │
│  │                      │                         │                      │ │
│  │   PYTHON PRODUCER    │                         │   NODE.JS BACKEND    │ │
│  │   (Automatic)        │                         │   (API + Consumer)   │ │
│  │                      │                         │                      │ │
│  │  • Runs every 30s    │                         │  • Receives API calls│ │
│  │  • Generates tasks   │                         │  • Validates JWT     │ │
│  │  • Sends to Queue    │                         │  • Creates tasks     │ │
│  │                      │                         │  • Consumes from Q   │ │
│  └──────────┬───────────┘                         └──────────┬───────────┘ │
│             │                                                 │             │
│             │ publishes                                       │ subscribes  │
│             │                                                 │             │
└─────────────┼─────────────────────────────────────────────────┼─────────────┘
              │                                                 │
              │                                                 │
              ▼                                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐

│                        ┌──────────────────────┐                              │
│                        │                      │                              │
│                        │      RABBITMQ        │                              │
│                        │    Message Queue     │                              │
│                        │                      │                              │
│                        │  ┌────────────────┐  │                              │
│                        │  │ aggregation_   │  │                              │
│                        │  │    tasks       │  │                              │
│                        │  │                │  │                              │
│                        │  │ [Task1][Task2] │  │                              │
│                        │  │ [Task3][Task4] │  │                              │
│                        │  └────────────────┘  │                              │
│                        │                      │                              │
│                        └──────────┬───────────┘                              │
│                                   │                                          │
└───────────────────────────────────┼──────────────────────────────────────────┘
                                    │
                                    │ tasks delivered
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐

│                        ┌──────────────────────┐                              │
│                        │                      │                              │
│                        │   NODE.JS CONSUMER    │                              │
│                        │   (Same as Backend)   │                              │
│                        │                      │                              │
│                        │  • Pulls tasks       │                              │
│                        │  • Processes them    │                              │
│                        │  • Acks/Retries      │                              │
│                        │                      │                              │
│                        └──────────┬───────────┘                              │
│                                   │                                          │
│                                   │ fetches data                             │
│                                   ▼                                          │
│                        ┌──────────────────────┐                              │
│                        │                      │                              │
│                        │   JSONPlaceholder    │                              │
│                        │    External API      │                              │
│                        │                      │                              │
│                        │  /posts  /users      │                              │
│                        │  /comments           │                              │
│                        │                      │                              │
│                        └──────────────────────┘                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   PATH 1 (Manual):                                                          │
│   You ──curl──▶ Node.js API ──publish──▶ RabbitMQ ──deliver──▶ Consumer    │
│                                                                             │
│   PATH 2 (Automatic):                                                       │
│   Python Producer ──publish──▶ RabbitMQ ──deliver──▶ Consumer              │
│                                                                             │
│   PATH 3 (Processing):                                                      │
│   Consumer ──fetch──▶ JSONPlaceholder ──aggregate──▶ Complete              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                        PRODUCERS vs CONSUMERS                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   PRODUCERS (Create Tasks):          CONSUMERS (Process Tasks):             │
│   ┌─────────────────────┐            ┌─────────────────────┐               │
│   │ 1. Python Producer  │            │ 1. Node.js Consumer │               │
│   │    • Automatic      │            │    • Always running │               │
│   │    • Every 30 sec   │            │    • Fetches from Q  │               │
│   │    • 3 task types   │            │    • Calls APIs      │               │
│   └─────────────────────┘            └─────────────────────┘               │
│   ┌─────────────────────┐                                                   │
│   │ 2. Manual (You)     │                                                   │
│   │    • Via curl       │                                                   │
│   │    • Via Postman    │                                                   │
│   │    • Via API Docs   │                                                   │
│   └─────────────────────┘                                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                          TASK TYPES                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────────────┐                                                 │
│   │ full_aggregation     │ ──▶ Fetches Posts + Users + Comments           │
│   └──────────────────────┘                                                 │
│                                                                             │
│   ┌──────────────────────┐                                                 │
│   │ posts_only           │ ──▶ Fetches only Posts                         │
│   └──────────────────────┘                                                 │
│                                                                             │
│   ┌──────────────────────┐                                                 │
│   │ users_with_posts     │ ──▶ Fetches Users + Their Posts                │
│   └──────────────────────┘                                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```



## 🔧 Installation

### Using Docker Compose (Recommended)

1. Clone the repository:
```bash
git clone https://github.com/bilawalaziz/aggregation-service.git
cd aggregation-service
```
2. Copy environment files:

```bash
cp .env.example .env
cp node-backend/.env.example node-backend/.env
cp python-producer/.env.example python-producer/.env
```

3. Generate JWT secret:

```bash
openssl rand -base64 32
# Update JWT_SECRET in .env files
```
4. Build and run with Docker Compose:
```bash
docker-compose up -d

```
5. Wait for services to be healthy:

```bash
docker-compose ps
```
## Local Development
# Node.js Backend
```bash
cd node-backend
npm install
cp .env.example .env
# Update .env with your configuration
npm run dev
```
# Python Producer
```bash
cd python-producer
uv venv
source .venv/bin/activate
uv pip install -e .
cp .env.example .env
uv run python main.py
```

## 🔐 Authentication
Generate a JWT token for API access:

```bash
cd node-backend
node generate-token.js
```
Example token:

```text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItMTIzIiwicm9sZSI6InVzZXIiLCJpYXQiOjE2OTk5OTk5OTksImV4cCI6MTcwMDAwMzU5OX0.signature
```
## 📡 API Usage
# Create a Task
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "full_aggregation",
    "parameters": {
      "limit": 10
    },
    "priority": "high"
  }'
```
Response
```json
{
  "message": "Task accepted for processing",
  "taskId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "links": {
    "self": "/api/tasks/550e8400-e29b-41d4-a716-446655440000"
  }
}
```
## Task Types

|Task Type  | Description | Parameters |
|----------------|----------|--------------|
|full_aggregation | Aggregates  | posts, users, and comments	limit (optional)
|posts_only | Fetches only posts| limit (optional)
|users_with_posts|  Fetches users with their posts  | userId (optional)

## 🧪 Testing
Run API Tests
```bash
cd node-backend
npm test
```
## 📊 Monitoring
Health Check
```bash
curl http://localhost:3000/health
```
## RabbitMQ Management
### Access RabbitMQ management UI:

```bash
URL: http://localhost:15672

Username: guest

Password: guest
```
# Logs
```bash
# View Node.js logs
docker-compose logs node-backend

# View Python producer logs
docker-compose logs python-producer

# View all logs
docker-compose logs -f
```
# 🐳 Docker Commands
```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Stop services
docker-compose down

# Rebuild and start
docker-compose up -d --build

# View running containers
docker-compose ps

# Scale consumers
docker-compose up -d --scale node-backend=3
```



# 🔒 Security
JWT authentication with expiration

Rate limiting (100 requests/15 minutes per IP)

Helmet.js security headers

CORS configured

Input validation with Joi

No sensitive data in logs

Non-root users in containers

# 🛠️ Troubleshooting
RabbitMQ Connection Issues
```bash
# Check RabbitMQ status
docker-compose exec rabbitmq rabbitmq-diagnostics ping

# List queues
docker-compose exec rabbitmq rabbitmqctl list_queues
```
Node.js Backend Issues
```bash
# Check logs
docker-compose logs node-backend

# Restart service
docker-compose restart node-backend
```
## Common Errors
Error: "JWT_SECRET not set"

```bash
# Generate and set JWT_SECRET in .env
openssl rand -base64 32
Error: "Connection refused"
```
```bash
# Ensure RabbitMQ is running
docker-compose ps rabbitmq
```
# 📚 API Documentation
Swagger UI available at: http://localhost:3000/api-docs

# Future tasks
## Considerations

- Enable HTTPS with nginx reverse proxy

- Set up database for task persistence

- Configure monitoring (Prometheus + Grafana)

- Implement rate limiting per user

- Set up log aggregation (ELK stack)

- Configure auto-scaling policies





# 🙏 Acknowledgments
JSONPlaceholder for test API

RabbitMQ team for message broker

Express.js community
