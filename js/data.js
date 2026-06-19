/* =========================================================================
   data.js — Veri katmanı, durum ve genel yardımcılar
   Bu dosya diğerlerinden ÖNCE yüklenir. localStorage anahtarları korunur.
   ========================================================================= */

/* ---------- localStorage ---------- */
function veriGetir(k, def) {
    try { 
        const d = localStorage.getItem(k); 
        if (d) {
            return JSON.parse(d);
        }
        return def; 
    }
    catch (e) { console.warn('veriGetir hatası:', k, e); return def; }
}
function veriKaydet(k, v) { 
    localStorage.setItem(k, JSON.stringify(v)); 
    // Firestore senkronizasyonu
    try {
        if (typeof db !== 'undefined' && db) {
            // Yeni koleksiyon yapısına geçen anahtarları eski belgeye (array) kaydetme!
            if (k === 'sahinkaya_urunler' || k === 'sahinkaya_kullanicilar') return;
            
            db.collection('sistem').doc(k).set({ data: v }).catch(e => console.log('Bulut yazma engellendi:', e));
        }
    } catch(e) {}
}

/* ---------- Yol sistemi ----------
   Sayfalar /pages/ altında, index.html kökte. Tek bir önek tüm bağlantıları
   her iki konumdan da doğru çözer. Örn: url('pages/giris.html'), url('index.html'). */
const KOK = location.pathname.includes('/pages/') ? '../' : '';
function url(hedef) { return KOK + hedef; }

/* ---------- DOM yardımcıları ---------- */
function getEl(id) { return document.getElementById(id); }
function setDisp(id, val) { const e = getEl(id); if (e) e.style.display = val; }

/* HTML enjeksiyonunda kullanıcı girdisini güvenli kıl (XSS koruması) */
function kacis(metin) {
    if (metin == null) return '';
    return String(metin)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ---------- Yetki yardımcıları ---------- */
function yetkiliMi() {
    return !!(aktifKullanici && (aktifKullanici.rol === 'admin' || aktifKullanici.rol === 'kurucu'));
}
/* İşlem öncesi yetki kapısı: yetki yoksa uyarır ve false döner. */
function yetkiGerek() {
    if (!yetkiliMi()) { toastGoster('Yetkiniz yok.', 'hata'); return false; }
    return true;
}

/* ---------- Uygulama Durumu ---------- */
let urunler = veriGetir('sahinkaya_urunler', [
    { id: 1001, ad: "Masif Kayın Karyola", resimler: ["https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=800&q=80"], fiyat: 15000, aciklama: "Doğal dokulu sağlam kayın karyola.", ozellikler: ["Malzeme: Masif Kayın"], kategoriler: ["yatak-odasi"], sira: 1, yorumlar: [], stokta: true },
    { id: 1002, ad: "Ahşap Sürgülü Gardırop", resimler: ["https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?auto=format&fit=crop&w=800&q=80"], fiyat: 24000, aciklama: "Geniş iç hacimli modern gardırop.", ozellikler: ["Malzeme: MDF"], kategoriler: ["yatak-odasi"], sira: 2, yorumlar: [], stokta: true },
    { id: 1003, ad: "Rustik Meşe Yemek Masası", resimler: ["https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&w=800&q=80"], fiyat: 18500, aciklama: "6 kişilik, tamamen doğal meşe kaplama yemek masası.", ozellikler: ["Malzeme: Meşe"], kategoriler: ["diger"], sira: 3, yorumlar: [], stokta: true },
    { id: 1004, ad: "Ceviz Kitaplık", resimler: ["https://images.unsplash.com/photo-1594620302200-9a762244a156?auto=format&fit=crop&w=800&q=80"], fiyat: 12000, aciklama: "Minimalist tasarımlı, geniş raflı ceviz kitaplık.", ozellikler: ["Malzeme: Ceviz Ağacı"], kategoriler: ["calisma"], sira: 4, yorumlar: [], stokta: true },
    { id: 1005, ad: "Modern Ahşap Mutfak Adası", resimler: ["https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80"], fiyat: 32000, aciklama: "Geniş tezgahlı, çekmeceli modern ahşap mutfak adası.", ozellikler: ["Malzeme: Akrilik + Ahşap"], kategoriler: ["mutfak"], sira: 5, yorumlar: [], stokta: true }
]);
let projeler = veriGetir('sahinkaya_projeler', [{ id: 1, baslik: "Sapanca Villa Mutfak", aciklama: "Meşe kaplama tasarım.", resimler: ["https://images.unsplash.com/photo-1556910103-1c02745a872f?auto=format&fit=crop&w=800&q=80", "", ""] }]);
let kapaklar = veriGetir('sahinkaya_kapaklar', [{ id: 1, kod: "HK_006_001", resim: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=600&q=80" }]);

let iletisimBilgileri = veriGetir('sahinkaya_iletisim_bilgi', {
    imalat: { adres: "Organize Sanayi Bölgesi", tel: "+90 (264) 555 12 34", posta: "imalat@sahinkaya.com", harita: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12093.58572120025!2d30.3955!3d40.7588!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDDCsDQ1JzMxLjciTiAzMMKwMjMnNDMuOCJF!5e0!3m2!1str!2str!4v1600000000000!5m2!1str!2str" },
    magaza: { adres: "Şehir Merkezi AVM", tel: "+90 (555) 444 55 66", posta: "magaza@sahinkaya.com", harita: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12093.58572120025!2d30.3955!3d40.7588!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDDCsDQ1JzMxLjciTiAzMMKwMjMnNDMuOCJF!5e0!3m2!1str!2str!4v1600000000000!5m2!1str!2str" }
});

let hakkimizdaMetin = veriGetir('sahinkaya_hakkimizda_metin', "Şahinkaya Ahşap Mobilya olarak mekanlarınıza değer katıyoruz.");
let kapaklarMetin = veriGetir('sahinkaya_kapaklar_metin', "Özel kesim istediğiniz modelde kapaklar. İletişim: 0555 555 55 55");

let kullanicilar = veriGetir('sahinkaya_kullanicilar', []);
if (kullanicilar.some(u => u.kadi === 'admin')) {
    kullanicilar = kullanicilar.filter(u => u.kadi !== 'admin');
    veriKaydet('sahinkaya_kullanicilar', kullanicilar);
}
let aktifKullanici = veriGetir('sahinkaya_aktif', null);
let sepet = veriGetir('sahinkaya_sepet', []);

const varsayilanAyarlar = {
    satisAktif: false, fiyatGizle: true, siparislerimGoster: false, takipGoster: false, hakkimizdaGoster: true, iletisimGoster: true, projelerGoster: true, kapaklarGoster: true, ukbeAktif: false, puanGoster: false, yorumlarGoster: false, yorumYapmaAktif: false,
    aramaAktif: true, filtreAktif: true, wpAktif: true, wpNo: '905555555555', urunlerGoster: true, magazaGoster: true, anaSayfa: "index.html", siteDuzeni: 1
};
/* Önceki önbelleği sıfırlayıp yeni varsayılanlara geçiş için sürüm kontrolü eklendi */
if (!localStorage.getItem('sahinkaya_v3_guncelleme')) {
    localStorage.removeItem('sahinkaya_ayarlar');
    localStorage.setItem('sahinkaya_v3_guncelleme', '1');
}
/* Not: defaults nesnesini mutasyona uğratmamak için boş hedefe kopyalıyoruz. */
let ayarlar = Object.assign({}, varsayilanAyarlar, veriGetir('sahinkaya_ayarlar', {}));

let navAyarlar = veriGetir('sahinkaya_nav_ayarlar', { bgRenk: "#1c1714", yaziRenk: "#f3ede4", linkBoyut: "1.1", yaziBoyut: "0.85" });
let aktifTema = veriGetir('sahinkaya_tema', 'light');
