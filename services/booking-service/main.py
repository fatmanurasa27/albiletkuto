from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from kafka import KafkaProducer
import json

# --- 1. AYARLAR ---
# DİKKAT: Veritabanı adını dün gece düzelttiğimiz şekliyle sabitledim.
DATABASE_URL = "postgresql://kuto_user:kuto_password@postgres:5432/albilet_db"
KAFKA_BROKER = "kafka:9092"
KAFKA_TOPIC = "bilet_bildirim"

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
try:
    producer = KafkaProducer(
        bootstrap_servers=[KAFKA_BROKER],
        value_serializer=lambda v: json.dumps(v).encode('utf-8')
    )
    print("✅ Kafka Producer başarıyla bağlandı! Telsiz hazır.", flush=True)
except Exception as e:
    print(f"❌ Kafka bağlantı hatası: {e}", flush=True)
    producer = None

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

    # 2. Bildirim Servisine Gidecek "Telsiz Anonsunu" Hazırla
    if producer:
        try:
            mesaj = {
                "nereden": "Albilet Merkezi",
                "nereye": request.user_email,
                "fiyat": request.price
            }
            producer.send(KAFKA_TOPIC, mesaj)
            producer.flush() # Mesajın kesin gittiğinden emin olana kadar bekle
        except Exception as e:
            print(f"❌ Bildirim anonsu yapılamadı: {e}", flush=True)

    return {
        "message": "Bilet başarıyla ayrıldı ve Kafka'ya anons geçildi!", 
        "ticket_details": {"id": new_ticket.id, "email": new_ticket.user_email}
    }