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

// Firebase başlatıldı.

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
            
            // Alternatif ve daha kolay yol: Kullanicilar listesindeki rolünü kontrol et
            const kulDoc = await db.collection('sistem').doc('sahinkaya_kullanicilar').get();
            if (kulDoc.exists && kulDoc.data().data) {
                const liste = kulDoc.data().data;
                const oKisi = liste.find(u => u.email === user.email || u.kadi === user.email);
                if (oKisi && (oKisi.rol === 'admin' || oKisi.rol === 'kurucu')) {
                    role = oKisi.rol;
                }
            }
        } catch(e) {}
        
        let eskiKullanici = null;
        try {
            eskiKullanici = JSON.parse(localStorage.getItem('sahinkaya_aktif') || 'null');
        } catch(e) {
            eskiKullanici = null;
            localStorage.removeItem('sahinkaya_aktif');
        }
        // Mevcut profil alanlarını (telefon, adres, favoriler, siparişler, sepet) koruyarak birleştir;
        // aksi halde her auth durum değişiminde bu alanlar sessizce silinirdi.
        const yeniKullanici = Object.assign(
            { telefon: '', adres: '', favoriler: [], siparisler: [], sepet: [], kadi: user.email },
            eskiKullanici,
            { email: user.email, rol: role, uid: user.uid, isim: user.displayName || (eskiKullanici && eskiKullanici.isim) || '' }
        );

        if (!eskiKullanici || eskiKullanici.email !== user.email || eskiKullanici.rol !== role || eskiKullanici.isim !== yeniKullanici.isim) {
            localStorage.setItem('sahinkaya_aktif', JSON.stringify(yeniKullanici));
            // NOT: 'aktifKullanici' data.js'te "let" ile tanımlı bir global'dir. window.aktifKullanici = ...
            // ataması bununla BAĞLANTISIZ ayrı bir özellik yaratır (ES6 let/const window'a yansımaz) ve
            // arayuzuGuncelle() gibi fonksiyonlar hep eski/boş değeri görürdü. Doğrudan atama yapılmalı.
            aktifKullanici = yeniKullanici;
            if(typeof arayuzuGuncelle === 'function') arayuzuGuncelle();
        }
    } else {
        localStorage.setItem('sahinkaya_aktif', JSON.stringify(null));
        aktifKullanici = null;
        if(typeof arayuzuGuncelle === 'function') arayuzuGuncelle();
    }
});

// Bulut senkronizasyonu
async function bulutSenkronizasyonu() {
    try {
        const snap = await db.collection('sistem').get({ source: 'server' });
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
        const urunlerSnap = await db.collection('sistem').doc('urunler').collection('liste').get({ source: 'server' });
        let yeniUrunler = [];
        urunlerSnap.forEach(doc => { yeniUrunler.push(doc.data()); });
        if(yeniUrunler.length > 0) {
            yeniUrunler.sort((a, b) => (a.sira || 99) - (b.sira || 99));
            // Sadece sunucudaki ürün sayısı lokalden az değilse veya ilk yüklemeyse üzerine yaz
            // (bkz. not yukarıda: gerçek "urunler" global'i kontrol edilmeli, window.urunler değil)
            if (typeof urunler === 'undefined' || yeniUrunler.length >= urunler.length) {
                localStorage.setItem('sahinkaya_urunler', JSON.stringify(yeniUrunler));
                urunler = yeniUrunler;
                changed = true;
            }
        }

        // 3. Kullaniciları yeni koleksiyondan yükle
        const kulSnap = await db.collection('sistem').doc('kullanicilar').collection('liste').get({ source: 'server' });
        let yeniKul = [];
        kulSnap.forEach(doc => { yeniKul.push(doc.data()); });
        if(yeniKul.length > 0) {
            localStorage.setItem('sahinkaya_kullanicilar', JSON.stringify(yeniKul));
            kullanicilar = yeniKul;
            changed = true;
        }

        // 4. Kapakları yeni koleksiyondan yükle
        const kapakSnap = await db.collection('sistem').doc('kapaklar').collection('liste').get({ source: 'server' });
        let yeniKapak = [];
        kapakSnap.forEach(doc => { yeniKapak.push(doc.data()); });
        if(yeniKapak.length > 0) {
            localStorage.setItem('sahinkaya_kapaklar', JSON.stringify(yeniKapak));
            kapaklar = yeniKapak;
            changed = true;
        }

        // 5. Projeleri yeni koleksiyondan yükle
        const projeSnap = await db.collection('sistem').doc('projeler').collection('liste').get({ source: 'server' });
        let yeniProje = [];
        projeSnap.forEach(doc => { yeniProje.push(doc.data()); });
        if(yeniProje.length > 0) {
            yeniProje.sort((a, b) => (a.sira || 99) - (b.sira || 99));
            localStorage.setItem('sahinkaya_projeler', JSON.stringify(yeniProje));
            projeler = yeniProje;
            changed = true;
        }
        
        if (changed) {
            // Bulut senkron tamamlandı
        }
    } catch(e) {
        console.error("Bulut okuma hatası:", e);
    }
}
bulutSenkronizasyonu();



