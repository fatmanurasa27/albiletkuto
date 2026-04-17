from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt

# --- 1. AYARLAR ---
# Docker Compose'da belirlediğimiz veritabanı bilgileri
DATABASE_URL = "postgresql://kuto_user:kuto_password@postgres:5432/albiletkuto_db"
SECRET_KEY = "kütahyalılar_süper_gizli_anahtar" # Normalde bu .env dosyasında saklanır
ALGORITHM = "HS256"

# --- 2. VERİTABANI BAĞLANTISI ---
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Tablo Yapımız
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)

# Tabloları veritabanında oluştur (Docker'daki PostgreSQL'e yazar)
Base.metadata.create_all(bind=engine)

# --- 3. ŞEMALAR (Gelen Veriyi Doğrulama) ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

# --- 4. GÜVENLİK VE ŞİFRELEME ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=2) # Token 2 saat geçerli olsun
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# --- 5. FASTAPI UYGULAMASI VE UÇ NOKTALAR ---
app = FastAPI(title="AlbiletKüto - Auth Service")

# Veritabanı ile konuşmak için kapı açar
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/register", response_model=Token)
def register(user: UserCreate, db: Session = Depends(get_db)):
    # Sistemde bu email ile kayıtlı biri var mı?
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Bu email zaten kayıtlı hemşerim!")
    
    # Şifreyi şifrele (hash'le) ve veritabanına kaydet
    hashed_password = get_password_hash(user.password)
    new_user = User(email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Kayıt başarılı, direkt token vererek giriş yaptır
    access_token = create_access_token(data={"sub": new_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/login", response_model=Token)
def login(user: UserCreate, db: Session = Depends(get_db)):
    # Email sistemde var mı ve şifreler eşleşiyor mu?
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Email veya şifre yanlış!")
    
    # Doğruysa token ver
    access_token = create_access_token(data={"sub": db_user.email})
    return {"access_token": access_token, "token_type": "bearer"}