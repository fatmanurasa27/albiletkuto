from fastapi import FastAPI
from confluent_kafka import Consumer, Producer
import threading
import json
import time

# --- 1. KAFKA AYARLARI ---
KAFKA_BROKER = "kafka:9092"
CONSUMER_GROUP = "payment_group"
IN_TOPIC = "ticket_events"     # Booking'den gelen mesajları dinleyeceğimiz kanal
OUT_TOPIC = "payment_events"   # Ödeme bitince Bildirim servisine bağıracağımız kanal

app = FastAPI(title="AlbiletKüto - Payment Service")

# --- 2. ARKA PLAN KAFKA DİNLEYİCİSİ (WORKER) ---
def payment_worker():
    # Kafka'dan mesaj okuyucu
    consumer = Consumer({
        'bootstrap.servers': KAFKA_BROKER,
        'group.id': CONSUMER_GROUP,
        'auto.offset.reset': 'earliest'
    })
    consumer.subscribe([IN_TOPIC])

    # Kafka'ya yeni mesaj gönderici
    producer = Producer({'bootstrap.servers': KAFKA_BROKER})

    print("💸 Payment Service Kafka'yı dinlemeye başladı...")

    while True:
        msg = consumer.poll(1.0) # Saniyede bir yeni mesaj var mı diye bak
        if msg is None:
            continue
        if msg.error():
            print(f"❌ Hata: {msg.error()}")
            continue

        # Mesajı yakaladık!
        data = json.loads(msg.value().decode('utf-8'))
        
        if data.get("status") == "PAYMENT_REQUIRED":
            print(f"\n📦 Yeni ödeme talebi yakalandı: Bilet ID {data['ticket_id']}")
            print(f"💳 {data['user_email']} kullanıcısının kartından {data['price']} TL çekiliyor...")
            
            # Gerçekçi olması için 3 saniye mock (sahte) bekleme süresi
            time.sleep(3) 
            print("✅ ÖDEME BAŞARILI!")

            # Ödeme başarılı mesajını Kafka'ya at (Bildirim servisi duysun diye)
            success_event = {
                "ticket_id": data["ticket_id"],
                "user_email": data["user_email"],
                "status": "PAID"
            }
            producer.produce(
                OUT_TOPIC,
                key=str(data["ticket_id"]),
                value=json.dumps(success_event)
            )
            producer.flush()

# --- 3. FASTAPI BAŞLATICI ---
# FastAPI sunucusu kalkarken arka plandaki dinleyiciyi de çalıştır
@app.on_event("startup")
def startup_event():
    thread = threading.Thread(target=payment_worker, daemon=True)
    thread.start()

@app.get("/")
def root():
    return {"message": "Payment Service ayakta ve pusuda bekliyor!"}