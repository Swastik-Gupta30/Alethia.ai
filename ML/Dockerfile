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

# Keep container running to allow executing scripts
CMD ["tail", "-f", "/dev/null"]
