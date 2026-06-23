FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

COPY docker-entrypoint.sh /usr/local/bin/ddc-backend-entrypoint
RUN chmod +x /usr/local/bin/ddc-backend-entrypoint

EXPOSE 8000

ENTRYPOINT ["ddc-backend-entrypoint"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
