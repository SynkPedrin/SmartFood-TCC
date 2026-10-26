FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN groupadd --system smartfood && useradd --system --gid smartfood --home /app smartfood
COPY --chown=smartfood:smartfood . .
RUN mkdir -p /app/media /app/staticfiles && chown -R smartfood:smartfood /app
USER smartfood
EXPOSE 8000
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py collectstatic --noinput && daphne -b 0.0.0.0 -p ${PORT:-8000} smartfood.asgi:application"]
