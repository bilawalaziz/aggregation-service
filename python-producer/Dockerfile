FROM python:3.13-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy project files
COPY pyproject.toml ./
COPY producer/ ./producer/
COPY main.py ./

# Install dependencies using pip (from pyproject.toml)
RUN pip install --no-cache-dir .

# Create non-root user
RUN addgroup --system --gid 1001 pythonuser && \
    adduser --system --uid 1001 --gid 1001 pythonuser && \
    chown -R pythonuser:pythonuser /app

USER pythonuser

# Run producer
CMD ["python", "-u", "main.py"]