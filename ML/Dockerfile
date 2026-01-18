FROM python:3.10-slim

WORKDIR /app

# Install system dependencies if required (e.g. for building some python packages)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
# Install CPU-only version of torch first to reduce image size (approx 100MB vs 800MB+)
RUN pip install --no-cache-dir --prefer-binary torch --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir --prefer-binary -r requirements.txt

COPY . .

# Run FastAPI with uvicorn
CMD ["uvicorn", "src.api:app", "--host", "0.0.0.0", "--port", "8001"]
