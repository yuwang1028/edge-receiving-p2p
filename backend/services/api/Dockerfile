# Control-plane API — Cloud Run container (used in P4.5 deploy).
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
ENV PORT=8080
# Cloud Run sets $PORT; bind to it.
CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT}
