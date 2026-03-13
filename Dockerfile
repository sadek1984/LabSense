FROM node:18-slim AS frontend-builder
WORKDIR /build
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM python:3.10-slim
WORKDIR /app
RUN apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . /app
COPY --from=frontend-builder /build/dist /app/dist
RUN touch /app/server/__init__.py
ENV PYTHONPATH=/app
ENV PORT=8080
ENV PYTHONUNBUFFERED=1
CMD ["uvicorn", "server.main:app", "--host", "0.0.0.0", "--port", "8080"]
