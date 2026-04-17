from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from confluent_kafka import Producer
import json

# --- 1. AYARLAR ---
DATABASE_URL = "postgresql://kuto_user:kuto_password@postgres:5432/albiletkuto_db"
KAFKA_BROKER = "kafka:29092"
KAFKA_TOPIC = "ticket_events"

# --- 2. VERİTABANI TABLOSU ---
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Ticket(Base):
    __tablename__ = "tickets"
    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, index=True)
    trip_id = Column(Integer)
    seat_number = Column(Integer)
    price = Column(Float)
    status = Column(String, default="PENDING") # Bilet ayrıldı ama henüz ödenmedi

Base.metadata.create_all(bind=engine)

# --- 3. KAFKA PRODUCER (Mesaj Gönderici) AYARLARI ---
producer_conf = {'bootstrap.servers': KAFKA_BROKER}
producer = Producer(producer_conf)

# Mesajın gidip gitmediğini terminale yazdıran yardımcı fonksiyon
def delivery_report(err, msg):
    if err is not None:
        print(f"❌ Mesaj Kafka'ya iletilemedi: {err}")
    else:
        print(f"✅ Mesaj Kafka'ya uçtu! Topic: {msg.topic()}, Partition: {msg.partition()}")

# --- 4. ŞEMALAR ---
class BookingRequest(BaseModel):
    user_email: EmailStr
    trip_id: int
    seat_number: int
    price: float

# --- 5. FASTAPI UYGULAMASI ---
app = FastAPI(title="AlbiletKüto - Booking Service")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/bookings")
def create_booking(request: BookingRequest, db: Session = Depends(get_db)):
    # 1. Bileti Veritabanına "Beklemede" olarak kaydet
    new_ticket = Ticket(
        user_email=request.user_email,
        trip_id=request.trip_id,
        seat_number=request.seat_number,
        price=request.price
    )
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)

    # 2. Kafka'ya Gönderilecek Etkinlik (Event) Mesajını Hazırla
    event_data = {
        "ticket_id": new_ticket.id,
        "user_email": new_ticket.user_email,
        "price": new_ticket.price,
        "status": "PAYMENT_REQUIRED"
    }
    
    # 3. Mesajı Kafka'ya fırlat!
    producer.produce(
        KAFKA_TOPIC,
        key=str(new_ticket.id),
        value=json.dumps(event_data),
        callback=delivery_report
    )
    producer.flush() # Mesajın kesin gittiğinden emin olana kadar bekle

    return {
        "message": "Bilet başarıyla ayrıldı, ödeme adımına geçiliyor...", 
        "ticket_details": event_data
    }