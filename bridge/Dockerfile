FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
WORKDIR /app
COPY bridge/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY bridge/server.py /app/server.py
RUN useradd --create-home --uid 10001 bridge
USER bridge
ENV NBA_API_BIND=0.0.0.0 NBA_API_PORT=8765
EXPOSE 8765
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8765/health', timeout=3)"
CMD ["python", "/app/server.py"]
