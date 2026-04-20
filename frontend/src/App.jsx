import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import './App.css'

// --- KÜTAHYALILAR TURİZM KONSEPT STİLLERİ ---
const styles = {
  busContainer: { maxWidth: '400px', margin: '30px auto', background: '#1a1a1a', padding: '20px', borderRadius: '30px 30px 10px 10px', border: '3px solid #333', boxShadow: '0 10px 30px rgba(0,0,0,0.7)', position: 'relative' },
  driverSection: { height: '60px', background: '#2a2a2a', borderRadius: '20px 20px 5px 5px', marginBottom: '30px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px', color: '#555', borderBottom: '2px solid #444' },
  seatGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', padding: '0 10px' },
  koridor: { gridColumn: '3', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#333', fontSize: '20px' },
  searchCard: { background: '#1a1a2e', padding: '30px', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', border: '1px solid #0f3460', textAlign: 'left' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '15px' },
  label: { color: '#aaa', fontSize: '14px', fontWeight: 'bold' },
  selectInput: { padding: '15px', borderRadius: '8px', border: 'none', background: '#0f3460', color: 'white', fontSize: '16px', outline: 'none' },
  tripCard: { background: '#222', padding: '20px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', borderLeft: '5px solid #e94560' },
  authInput: { width: '100%', padding: '15px', marginBottom: '15px', borderRadius: '8px', border: 'none', background: '#333', color: 'white', fontSize: '16px', boxSizing: 'border-box' }
}

// --- SAHTE VERİTABANI (Backend İptal Olduğu İçin) ---
const SAHTE_SEFERLER = [
  { id: 1, from_city: "Kütahya", to_city: "Ankara", saat: "10:00", fiyat: 450, firma: "Kütahyalılar VIP" },
  { id: 2, from_city: "Kütahya", to_city: "Ankara", saat: "14:30", fiyat: 500, firma: "Nilüfer Turizm" },
  { id: 3, from_city: "Kütahya", to_city: "Ankara", saat: "23:30", fiyat: 400, firma: "Kamil Koç" },
  { id: 4, from_city: "Bursa", to_city: "Antalya", saat: "09:00", fiyat: 600, firma: "Pamukkale" },
  { id: 5, from_city: "İzmir", to_city: "İstanbul", saat: "12:15", fiyat: 750, firma: "Metro Turizm" }
];

// --- ÜST MENÜ (NAVBAR) ---
function Navbar({ user, cikisYap }) {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', padding: '15px', background: '#222', borderRadius: '10px' }}>
      <div onClick={() => navigate('/')} style={{ color: '#e94560', fontWeight: 'bold', fontSize: '20px', cursor: 'pointer' }}>👑 AlbiletKüto</div>
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
        {user ? (
          <>
            <button onClick={() => navigate('/profil')} style={{ background: '#333', border: '1px solid #4CAF50', color: '#4CAF50', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>🎫 Biletlerim</button>
            <span style={{ color: 'white', fontSize: '14px' }}>👤 {user.isim || 'Yolcu'}</span>
            <button onClick={cikisYap} style={{ background: 'transparent', border: '1px solid #aaa', color: '#aaa', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>Çıkış</button>
          </>
        ) : (
          <button onClick={() => navigate('/auth')} style={{ background: '#e94560', border: 'none', color: '#fff', padding: '8px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Giriş Yap</button>
        )}
      </div>
    </div>
  );
}

// --- KOLTUK BİLEŞENİ ---
function KoltukIkonu({ numara, secili, tikla, dolu }) {
  let bgColor = '#333', cursor = 'pointer', border = '1px solid #444', textColor = 'white'
  if (dolu) { bgColor = '#222'; cursor = 'not-allowed'; textColor = '#555' } 
  else if (secili) { bgColor = '#e94560'; border = '2px solid #fff' }

  return (
    <div onClick={dolu ? null : tikla} style={{ width: '50px', height: '55px', background: bgColor, color: textColor, display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '16px', borderRadius: '10px 10px 2px 2px', cursor: cursor, border: border, transition: '0.2s', position: 'relative', boxShadow: secili ? '0 0 15px #e94560' : 'none' }}>
      <div style={{ position: 'absolute', top: '-5px', width: '30px', height: '10px', background: secili ? '#fff' : '#444', borderRadius: '5px' }}></div>
      {numara}
    </div>
  )
}

// --- GİRİŞ / KAYIT SAYFASI ---
function AuthSayfasi({ setUser }) {
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [isim, setIsim] = useState('')
  const [email, setEmail] = useState('')
  const [sifre, setSifre] = useState('')

  const islemYap = (e) => {
    e.preventDefault()
    const userData = { isim: isLogin ? "Kullanıcı" : isim, email: email }
    localStorage.setItem('albilet_user', JSON.stringify(userData))
    setUser(userData)
    navigate('/')
  }

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', textAlign: 'center' }}>
      <div style={{ background: '#1a1a2e', padding: '40px 30px', borderRadius: '20px', border: '1px solid #0f3460' }}>
        <h2 style={{ color: '#e94560' }}>{isLogin ? 'Giriş Yap' : 'Kayıt Ol'}</h2>
        <form onSubmit={islemYap}>
          {!isLogin && <input type="text" placeholder="Ad Soyad" required value={isim} onChange={e => setIsim(e.target.value)} style={styles.authInput} />}
          <input type="email" placeholder="E-Posta" required value={email} onChange={e => setEmail(e.target.value)} style={styles.authInput} />
          <input type="password" placeholder="Şifre" required value={sifre} onChange={e => setSifre(e.target.value)} style={styles.authInput} />
          <button type="submit" style={{ width: '100%', padding: '15px', background: '#e94560', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Tamamla</button>
        </form>
        <p onClick={() => setIsLogin(!isLogin)} style={{ color: '#4CAF50', cursor: 'pointer', marginTop: '15px' }}>{isLogin ? 'Hesabım Yok' : 'Giriş Yap'}</p>
      </div>
    </div>
  )
}

// --- BİLETLERİM (PROFİL) SAYFASI ---
function ProfilSayfasi({ user, cikisYap }) {
  const biletler = JSON.parse(localStorage.getItem('albilet_biletler')) || []
  return (
    <div style={{ maxWidth: '600px', margin: '20px auto' }}>
      <Navbar user={user} cikisYap={cikisYap} />
      <h3 style={{ color: '#e94560', borderBottom: '2px solid #333', paddingBottom: '10px' }}>🎫 Geçmiş Biletlerim</h3>
      {biletler.length === 0 ? (
        <p style={{ color: '#888', textAlign: 'center', marginTop: '30px' }}>Henüz bilet almadınız.</p>
      ) : (
        [...biletler].reverse().map((bilet, index) => (
          <div key={index} style={{ background: '#222', padding: '20px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', marginTop: '15px', borderLeft: '5px solid #4CAF50' }}>
            <div>
              <div style={{ color: '#aaa', fontSize: '12px' }}>{bilet.islemTarihi}</div>
              <h4 style={{ margin: '5px 0', color: 'white' }}>{bilet.rota}</h4>
              <div style={{ color: '#4CAF50', fontWeight: 'bold' }}>Koltuk: {bilet.koltuk}</div>
            </div>
            <div style={{ textAlign: 'right', color: '#e94560', fontWeight: 'bold' }}>{bilet.id}</div>
          </div>
        ))
      )}
    </div>
  )
}

// --- ANA SAYFA ---
function AnaSayfa({ user, cikisYap }) {
  const navigate = useNavigate()
  const [nereden, setNereden] = useState('Kütahya')
  const [nereye, setNereye] = useState('Ankara')
  const [tarih, setTarih] = useState('')
  const [seferler, setSeferler] = useState([])
  const [mesaj, setMesaj] = useState('')

  const sehirler = ["Kütahya", "Ankara", "İstanbul", "İzmir", "Eskişehir", "Bursa", "Antalya"]

  const seferAra = (e) => {
    e.preventDefault()
    setMesaj("⏳ Seferler aranıyor...")
    setSeferler([])

    // Backend olmadığı için aramayı sahte veritabanımızda yapıyoruz
    setTimeout(() => {
      const sonuclar = SAHTE_SEFERLER.filter(s => s.from_city === nereden && s.to_city === nereye);
      if(sonuclar.length === 0) {
        setMesaj("❌ Bu tarihte ve rotada sefer bulunamadı. (Kütahya-Ankara deneyin)")
      } else {
        setMesaj("")
        setSeferler(sonuclar)
      }
    }, 800); // 0.8 saniye bekleme efekti (gerçekçi olsun diye)
  }

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto' }}>
      <Navbar user={user} cikisYap={cikisYap} />
      <h1 style={{ color: 'white', fontSize: '32px' }}>Nereye Gidiyoruz?</h1>
      <form onSubmit={seferAra} style={styles.searchCard}>
        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ ...styles.inputGroup, flex: 1 }}>
            <label style={styles.label}>Nereden</label>
            <select style={styles.selectInput} value={nereden} onChange={e => setNereden(e.target.value)}>{sehirler.map(s => <option key={s} value={s}>{s}</option>)}</select>
          </div>
          <div style={{ ...styles.inputGroup, flex: 1 }}>
            <label style={styles.label}>Nereye</label>
            <select style={styles.selectInput} value={nereye} onChange={e => setNereye(e.target.value)}>{sehirler.map(s => <option key={s} value={s}>{s}</option>)}</select>
          </div>
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Tarih</label>
          <input type="date" required style={styles.selectInput} value={tarih} onChange={e => setTarih(e.target.value)} />
        </div>
        <button type="submit" style={{ width: '100%', padding: '15px', background: '#e94560', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Sefer Bul</button>
        {mesaj && <div style={{ color: '#ff9800', fontWeight: 'bold', marginTop: '15px', textAlign: 'center' }}>{mesaj}</div>}
      </form>
      {seferler.map(sefer => (
        <div key={sefer.id} style={styles.tripCard}>
          <div><div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>{sefer.saat}</div><div style={{ color: '#aaa' }}>{sefer.firma}</div></div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '22px', color: '#4CAF50', marginBottom: '5px' }}>{sefer.fiyat} TL</div>
            <button onClick={() => navigate('/koltuk', { state: { sefer, nereden, nereye, tarih } })} style={{ padding: '10px 20px', background: '#fff', color: '#000', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>Koltuk Seç ➔</button>
          </div>
        </div>
      ))}
    </div>
  )
}

// --- KOLTUK SEÇİMİ ---
function KoltukSecimi({ user, cikisYap }) {
  const location = useLocation(); const navigate = useNavigate()
  if (!location.state) return <Navigate to="/" />
  
  const { sefer, nereden, nereye, tarih } = location.state
  const [seciliKoltuk, setSeciliKoltuk] = useState(null)
  
  // Sahte dolu koltuklar (Backend olmadığı için rastgele 3 koltuğu dolu gösteriyoruz)
  const doluKoltuklar = [3, 7, 12, 15]

  const renderKoltuklar = () => {
    let rows = []
    for (let i = 1; i <= 20; i += 4) {
      rows.push(<KoltukIkonu key={i} numara={i} secili={seciliKoltuk === i} dolu={doluKoltuklar.includes(i)} tikla={() => setSeciliKoltuk(i)} />, <KoltukIkonu key={i+1} numara={i+1} secili={seciliKoltuk === i+1} dolu={doluKoltuklar.includes(i+1)} tikla={() => setSeciliKoltuk(i+1)} />)
      rows.push(<div key={`k-${i}`} style={styles.koridor}>🡙</div>)
      rows.push(<KoltukIkonu key={i+2} numara={i+2} secili={seciliKoltuk === i+2} dolu={doluKoltuklar.includes(i+2)} tikla={() => setSeciliKoltuk(i+2)} />, <KoltukIkonu key={i+3} numara={i+3} secili={seciliKoltuk === i+3} dolu={doluKoltuklar.includes(i+3)} tikla={() => setSeciliKoltuk(i+3)} />)
    }
    return rows
  }

  return (
    <div style={{ maxWidth: '600px', margin: '30px auto', textAlign: 'center' }}>
      <Navbar user={user} cikisYap={cikisYap} />
      <div style={styles.busContainer}><div style={styles.driverSection}>📺</div><div style={styles.seatGrid}>{renderKoltuklar()}</div></div>
      {seciliKoltuk && <button onClick={() => navigate('/odeme', { state: { koltukNo: seciliKoltuk, sefer, nereden, nereye, tarih } })} style={{ padding: '18px 40px', background: '#e94560', color: 'white', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: '20px' }}>💳 {seciliKoltuk} No'lu Koltuğu Onayla</button>}
    </div>
  )
}

// --- ÖDEME SAYFASI ---
function OdemeSayfasi({ user, cikisYap }) {
  const location = useLocation(); const navigate = useNavigate()
  if (!location.state) return <Navigate to="/" />
  
  const { koltukNo, sefer, nereden, nereye, tarih } = location.state
  const [mesaj, setMesaj] = useState(''); const [isSuccess, setIsSuccess] = useState(false)
  const [kalanSure, setKalanSure] = useState(180)
  const [form, setForm] = useState({ tc: '', tel: '', email: user ? user.email : '', kartNo: '' })

  useEffect(() => {
    if (kalanSure <= 0 && !isSuccess) { alert("Süre doldu!"); navigate('/'); return; }
    const timer = setInterval(() => setKalanSure(s => s - 1), 1000)
    return () => clearInterval(timer)
  }, [kalanSure, isSuccess, navigate])

  const biletiOnayla = (e) => {
    e.preventDefault()
    setMesaj("⏳ Banka ile iletişim kuruluyor, lütfen bekleyin...")
    
    // Backend olmadığı için 1.5 saniye sonra sanki sistemden onay gelmiş gibi yapıyoruz
    setTimeout(() => {
      setIsSuccess(true)
      setMesaj(`✅ BAŞARILI! Biletiniz başarıyla oluşturuldu! 🎫`)
      
      // Bileti tarayıcı hafızasına (Local Storage) kaydediyoruz ki Biletlerim sayfasında çıksın
      const yeniBilet = { 
        id: 'PNR' + Math.floor(Math.random()*10000), 
        rota: `${nereden} ➔ ${nereye}`, 
        koltuk: koltukNo, 
        islemTarihi: new Date().toLocaleDateString() + " " + tarih
      }
      const mevcutBiletler = JSON.parse(localStorage.getItem('albilet_biletler')) || []
      localStorage.setItem('albilet_biletler', JSON.stringify([...mevcutBiletler, yeniBilet]))
      
    }, 1500); // 1.5 saniye banka onayı bekleme efekti
  }

  return (
    <div style={{ maxWidth: '450px', margin: '50px auto', textAlign: 'center' }}>
      <Navbar user={user} cikisYap={cikisYap} />
      {!isSuccess && <div style={{ background: '#ff9800', padding: '10px', borderRadius: '10px', fontWeight: 'bold', marginBottom: '20px', color: 'black' }}>⏳ Kalan Süre: {Math.floor(kalanSure/60)}:{kalanSure%60 < 10 ? '0'+kalanSure%60 : kalanSure%60}</div>}
      
      <form onSubmit={biletiOnayla} style={{ display: 'flex', flexDirection: 'column', gap: '15px', background: '#1a1a2e', padding: '30px', borderRadius: '15px', border: '1px solid #0f3460' }}>
        {isSuccess ? (
          <div style={{ padding: '20px' }}>
            <h2 style={{ color: '#4CAF50' }}>{mesaj}</h2>
            <button onClick={() => navigate('/profil')} style={{ marginTop: '10px', padding: '15px', background: '#333', color: '#4CAF50', border: '1px solid #4CAF50', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>🎫 Biletlerimi Gör</button>
            <button onClick={() => navigate('/')} style={{ marginTop: '15px', padding: '15px', background: '#e94560', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>🏠 Ana Sayfaya Dön</button>
          </div>
        ) : (
          <>
            <div style={{ background: '#0f3460', padding: '10px', borderRadius: '8px', color: 'white' }}>Koltuk {koltukNo} | {sefer.fiyat} TL</div>
            <input type="number" placeholder="TC Kimlik" required value={form.tc} onChange={e => setForm({...form, tc: e.target.value})} style={styles.authInput} />
            <input type="tel" placeholder="Cep Telefonu" required value={form.tel} onChange={e => setForm({...form, tel: e.target.value})} style={styles.authInput} />
            <input type="email" placeholder="E-Posta Adresi" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} style={styles.authInput} />
            <input type="text" placeholder="Kart Numarası (16 Hane)" required value={form.kartNo} onChange={e => setForm({...form, kartNo: e.target.value})} style={styles.authInput} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <input type="text" placeholder="AA/YY" required style={{...styles.authInput, width: '50%'}} />
              <input type="text" placeholder="CVC" required style={{...styles.authInput, width: '50%'}} />
            </div>
            <button type="submit" style={{ padding: '18px', background: '#e94560', color: 'white', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Güvenli Ödeme Yap</button>
            {mesaj && <div style={{ color: '#ff9800', fontWeight: 'bold', marginTop: '10px' }}>{mesaj}</div>}
          </>
        )}
      </form>
    </div>
  )
}

// --- ANA APP BİLEŞENİ ---
function App() {
  const [user, setUser] = useState(null)
  useEffect(() => { const s = localStorage.getItem('albilet_user'); if(s) setUser(JSON.parse(s)) }, [])
  const cikis = () => { localStorage.removeItem('albilet_user'); setUser(null) }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<AnaSayfa user={user} cikisYap={cikis} />} />
        <Route path="/auth" element={<AuthSayfasi setUser={setUser} />} />
        <Route path="/profil" element={<ProfilSayfasi user={user} cikisYap={cikis} />} />
        <Route path="/koltuk" element={<KoltukSecimi user={user} cikisYap={cikis} />} />
        <Route path="/odeme" element={<OdemeSayfasi user={user} cikisYap={cikis} />} />
      </Routes>
    </Router>
  )
}

export default App