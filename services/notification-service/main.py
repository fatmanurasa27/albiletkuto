from fastapi import FastAPI
from confluent_kafka import Consumer
import threading
import json
import time

# --- 1. KAFKA AYARLARI ---
KAFKA_BROKER = "kafka:29092"
CONSUMER_GROUP = "notification_group"
IN_TOPIC = "payment_events"  # Ödeme servisinden gelecek müjdeli haberleri dinliyoruz

app = FastAPI(title="AlbiletKüto - Notification Service")

# --- 2. ARKA PLAN KAFKA DİNLEYİCİSİ (WORKER) ---
def notification_worker():
    consumer = Consumer({
        'bootstrap.servers': KAFKA_BROKER,
        'group.id': CONSUMER_GROUP,
        'auto.offset.reset': 'earliest'
    })
    consumer.subscribe([IN_TOPIC])

    print("🔔 Notification Service pusuda... Ödeme onaylarını bekliyor!")

    while True:
        msg = consumer.poll(1.0) # Saniyede bir kontrol et
        if msg is None:
            continue
        if msg.error():
            print(f"❌ Hata: {msg.error()}")
            continue

        # Mesajı yakaladık!
        data = json.loads(msg.value().decode('utf-8'))
        
        if data.get("status") == "PAID":
            print(f"\n🎉 Bilet ID {data['ticket_id']} için ödeme alınmış!")
            
            # Mail Gönderim Simülasyonu
            print("✉️ Mail hazırlanıyor...")
            time.sleep(1.5)
            print(f"✅ {data['user_email']} adresine e-bilet gönderildi!")
            
            # SMS Gönderim Simülasyonu
            print("📱 SMS hazırlanıyor...")
            time.sleep(1.5)
            print("✅ Kütahyalılar firmasından PNR kodunuz SMS olarak iletildi! İyi yolculuklar dileriz.")

# --- 3. FASTAPI BAŞLATICI ---
@app.on_event("startup")
def startup_event():
    thread = threading.Thread(target=notification_worker, daemon=True)
    thread.start()

@app.get("/")
def root():
    return {"message": "Notification Service ayakta ve bildirim atmaya hazır!"}