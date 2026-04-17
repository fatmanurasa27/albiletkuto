# Python'un hafif versiyonunu kullan
FROM python:3.10-slim

# Çalışma klasörümüz
WORKDIR /app

# Kütüphane listesini kopyala ve kur
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Yazdığımız tüm kodları kopyala
COPY . .

# FastAPI'yi 80 portundan dışarı aç
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80"]