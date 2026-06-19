const firebaseConfig = {
  apiKey: "AIzaSyCXLGSnXC0WmjhcjWwhauAZ_gmf_le_y_A",
  authDomain: "sahinkaya-mobilya.firebaseapp.com",
  projectId: "sahinkaya-mobilya",
  storageBucket: "sahinkaya-mobilya.firebasestorage.app",
  messagingSenderId: "1076961338849",
  appId: "1:1076961338849:web:7dbb9447cd993874345ea0"
};

window.firebaseConfig = firebaseConfig;
firebase.initializeApp(firebaseConfig);
window.db = firebase.firestore();
window.auth = firebase.auth();

console.log("Firebase başlatıldı.");

// Aktif kullanıcıyı firebase state'ine bağla
auth.onAuthStateChanged(async (user) => {
    if (user) {
        let role = 'user';
        if (user.email === 'berat.sahinkaya5@gmail.com') {
            role = 'kurucu';
        }
        
        try {
            const doc = await db.collection('sistem').doc('ayarlar_genel').get();
            if (doc.exists && doc.data().adminEmails && doc.data().adminEmails.includes(user.email)) {
                role = 'kurucu'; // admin yetkisi ver
            }
            
            // Alternatif ve daha kolay yol: Kullanıcılar listesindeki rolünü kontrol et
            const kulDoc = await db.collection('sistem').doc('sahinkaya_kullanicilar').get();
            if (kulDoc.exists && kulDoc.data().data) {
                const liste = kulDoc.data().data;
                const oKisi = liste.find(u => u.email === user.email || u.kadi === user.email);
                if (oKisi && (oKisi.rol === 'admin' || oKisi.rol === 'kurucu')) {
                    role = oKisi.rol;
                }
            }
        } catch(e) {}
        
        const eskiKullanici = JSON.parse(localStorage.getItem('sahinkaya_aktif') || 'null');
        const yeniKullanici = { email: user.email, rol: role, uid: user.uid, isim: user.displayName || '' };
        
        if (!eskiKullanici || eskiKullanici.email !== user.email || eskiKullanici.rol !== role || eskiKullanici.isim !== yeniKullanici.isim) {
            localStorage.setItem('sahinkaya_aktif', JSON.stringify(yeniKullanici));
            if (typeof window !== 'undefined') window.aktifKullanici = yeniKullanici;
            if(typeof arayuzuGuncelle === 'function') arayuzuGuncelle();
        }
    } else {
        localStorage.setItem('sahinkaya_aktif', JSON.stringify(null));
        if (typeof window !== 'undefined') window.aktifKullanici = null;
        if(typeof arayuzuGuncelle === 'function') arayuzuGuncelle();
    }
});

// Bulut senkronizasyonu
async function bulutSenkronizasyonu() {
    try {
        const snap = await db.collection('sistem').get();
        let changed = false;
        
        // YENİ YAPI: Koleksiyonları tek tek yükleyelim (Önceki sistem yerine)
        // 1. Ayarlar ve Kapaklar vs. (Eski yapı devam ediyor)
        snap.forEach(doc => {
            if(doc.id === 'ayarlar_genel' || doc.id === 'sahinkaya_urunler' || doc.id === 'sahinkaya_kullanicilar') return; 
            const bulutVeri = doc.data().data;
            const k = doc.id.startsWith('sahinkaya_') ? doc.id : 'sahinkaya_' + doc.id;
            const lokalVeri = localStorage.getItem(k);
            if (bulutVeri && JSON.stringify(bulutVeri) !== lokalVeri) {
                localStorage.setItem(k, JSON.stringify(bulutVeri));
                changed = true;
            }
        });
        
        // 2. Ürünleri yeni koleksiyondan yükle
        const urunlerSnap = await db.collection('sistem').doc('urunler').collection('liste').get();
        let yeniUrunler = [];
        urunlerSnap.forEach(doc => { yeniUrunler.push(doc.data()); });
        if(yeniUrunler.length > 0) {
            yeniUrunler.sort((a, b) => (a.sira || 99) - (b.sira || 99));
            localStorage.setItem('sahinkaya_urunler', JSON.stringify(yeniUrunler));
            if(typeof window !== 'undefined') window.urunler = yeniUrunler;
            changed = true;
        }

        // 3. Kullanıcıları yeni koleksiyondan yükle
        const kulSnap = await db.collection('sistem').doc('kullanicilar').collection('liste').get();
        let yeniKul = [];
        kulSnap.forEach(doc => { yeniKul.push(doc.data()); });
        if(yeniKul.length > 0) {
            localStorage.setItem('sahinkaya_kullanicilar', JSON.stringify(yeniKul));
            if(typeof window !== 'undefined') window.kullanicilar = yeniKul;
            changed = true;
        }
        
        if (changed) {
            console.log("Buluttan yeni veriler lokal belleğe eklendi.");
        }
    } catch(e) {
        console.log("Bulut okuma hatası:", e);
    }
}
bulutSenkronizasyonu();
