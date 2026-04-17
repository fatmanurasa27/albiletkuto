from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import datetime

# --- 1. AYARLAR VE VERİTABANI BAĞLANTISI ---
DATABASE_URL = "postgresql://kuto_user:kuto_password@postgres:5432/albiletkuto_db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- 2. VERİTABANI TABLOSU ---
class Trip(Base):
    __tablename__ = "trips"
    id = Column(Integer, primary_key=True, index=True)
    bus_company = Column(String, default="Kütahyalılar") # Tek firma kuralımız
    origin = Column(String, index=True)      # Kalkış
    destination = Column(String, index=True) # Varış
    departure_time = Column(DateTime)
    price = Column(Float)
    available_seats = Column(Integer, default=40) # Standart otobüs kapasitesi

Base.metadata.create_all(bind=engine)

# --- 3. ŞEMALAR (Veri Doğrulama) ---
class TripCreate(BaseModel):
    origin: str
    destination: str
    departure_time: datetime
    price: float

class TripResponse(BaseModel):
    id: int
    bus_company: str
    origin: str
    destination: str
    departure_time: datetime
    price: float
    available_seats: int

    class Config:
        from_attributes = True

# --- 4. FASTAPI UYGULAMASI VE UÇ NOKTALAR ---
app = FastAPI(title="AlbiletKüto - Trip Service")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Sefer Ekleme (Normalde bunu admin paneli yapar)
@app.post("/trips", response_model=TripResponse)
def create_trip(trip: TripCreate, db: Session = Depends(get_db)):
    new_trip = Trip(**trip.model_dump())
    db.add(new_trip)
    db.commit()
    db.refresh(new_trip)
    return new_trip

# Seferleri Listeleme ve Arama (Kullanıcılar burayı kullanacak)
@app.get("/trips", response_model=list[TripResponse])
def get_trips(origin: str = None, destination: str = None, db: Session = Depends(get_db)):
    query = db.query(Trip)
    
    # İsteğe bağlı filtrelemeler (Örn: Sadece Kütahya'dan kalkanlar)
    if origin:
        query = query.filter(Trip.origin.ilike(f"%{origin}%"))
    if destination:
        query = query.filter(Trip.destination.ilike(f"%{destination}%"))
        
    return query.all()