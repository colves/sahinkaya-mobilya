/* =========================================================================
   ÜRÜN LİSTELEME & FİLTRE
   ========================================================================= */
let seciliSayfa = 1;
const SAYFA_BASI_URUN = 12;
let aktifUrunListesi = [];

function urunListele(liste) {
    aktifUrunListesi = liste;
    seciliSayfa = 1;
    sayfayiCiz();
}

function sayfayiCiz() {
    const grid = getEl('urun-listesi-izgara'); if (!grid) return;
    const paginationAlani = getEl('pagination-alani');
    const detayBase = url('pages/urun-detay.html');
    
    grid.innerHTML = '';
    if (aktifUrunListesi.length === 0) { 
        grid.innerHTML = "<p>Ürün bulunamadı.</p>"; 
        if(paginationAlani) paginationAlani.innerHTML = '';
        return; 
    }
    
    const baslangic = (seciliSayfa - 1) * SAYFA_BASI_URUN;
    const bitis = baslangic + SAYFA_BASI_URUN;
    const gosterilecekler = aktifUrunListesi.slice(baslangic, bitis);
    
    gosterilecekler.forEach(urun => {
        const anaResim = (urun.resimler && urun.resimler.length > 0) ? urun.resimler[0] : "";
        const fytMetin = ayarlar.fiyatGizle ? `<span style="font-size:1rem; color:var(--metin-soluk);">Fiyat Gizli</span>`
            : (ayarlar.satisAktif ? `${Number(urun.fiyat).toLocaleString('tr-TR')} TL` : `<span style="font-size:1rem; color:var(--metin-soluk);">Fiyat Sorunuz</span>`);
        const btnMetin = !urun.stokta ? "STOKTA YOK" : (ayarlar.satisAktif ? "Sepete Ekle" : "WhatsApp'tan Bilgi Al");
        const btnDisabled = !urun.stokta ? "disabled" : "";
        const btnIslem = !urun.stokta ? "" : (ayarlar.satisAktif ? `sepeteEkle(${urun.id})` : `bilgiAlWhatsApp('${kacis(urun.ad)}', ${urun.id})`);
        let puanHtml = "";
        if (ayarlar.puanGoster) {
            const ySayisi = urun.yorumlar ? urun.yorumlar.length : 0;
            if (ySayisi > 0) { const ort = urun.yorumlar.reduce((s, y) => s + (y.yildiz || 5), 0) / ySayisi; puanHtml = `<div class="urun-puan">${yildizCiz(Math.round(ort))} (${ySayisi})</div>`; }
            else puanHtml = `<div class="urun-puan bos">Henüz yorum yok</div>`;
        }
        grid.innerHTML += `<div class="urun-kart goster">
            <div onclick="location.href='${detayBase}?id=${urun.id}'">
                <img src="${anaResim}" alt="${kacis(urun.ad)}" onerror="this.src='https://via.placeholder.com/400x290?text=GORSEL'">
                <h3>${kacis(urun.ad)}</h3>${puanHtml}
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div class="urun-fiyat">${fytMetin}</div>
                <button class="btn-satin-al" style="width:auto; margin:0;" onclick="${btnIslem}" ${btnDisabled}>${btnMetin}</button>
            </div>
        </div>`;
    });
    animasyonlariBaslat();
    paginationCiz();
}

function paginationCiz() {
    const paginationAlani = getEl('pagination-alani');
    if (!paginationAlani) return;
    
    const toplamSayfa = Math.ceil(aktifUrunListesi.length / SAYFA_BASI_URUN);
    paginationAlani.innerHTML = '';
    
    if (toplamSayfa <= 1) return;
    
    if (seciliSayfa > 1) {
        paginationAlani.innerHTML += `<button class="sayfa-btn" onclick="sayfaDegistir(${seciliSayfa - 1})">« Önceki</button>`;
    }
    
    for (let i = 1; i <= toplamSayfa; i++) {
        const aktifClass = i === seciliSayfa ? 'aktif' : '';
        paginationAlani.innerHTML += `<button class="sayfa-btn ${aktifClass}" onclick="sayfaDegistir(${i})">${i}</button>`;
    }
    
    if (seciliSayfa < toplamSayfa) {
        paginationAlani.innerHTML += `<button class="sayfa-btn" onclick="sayfaDegistir(${seciliSayfa + 1})">Sonraki »</button>`;
    }
}

function sayfaDegistir(no) {
    seciliSayfa = no;
    sayfayiCiz();
    getEl('kategori-baslik')?.scrollIntoView({ behavior: 'smooth' });
}

function filtrele() {
    const min = parseInt(getEl('min-fiyat').value) || 0;
    const max = parseInt(getEl('max-fiyat').value) || 9999999;
    const stokSecim = getEl('stok-filtre') ? getEl('stok-filtre').value : 'hepsi';
    const katSecim = getEl('kategori-filtre') ? getEl('kategori-filtre').value : 'hepsi';
    
    let gosterilecek = [...urunler].sort((a, b) => (a.sira || 99) - (b.sira || 99));
    
    if (location.pathname.includes('kategori.html')) {
        const katParam = new URLSearchParams(location.search).get('kat');
        if (katParam) gosterilecek = gosterilecek.filter(u => u.kategoriler && u.kategoriler.includes(katParam));
    }
    
    if (katSecim !== 'hepsi') {
        gosterilecek = gosterilecek.filter(u => u.kategoriler && u.kategoriler.includes(katSecim));
    }
    
    gosterilecek = gosterilecek.filter(u => u.fiyat >= min && u.fiyat <= max);
    if (stokSecim === 'stokta') gosterilecek = gosterilecek.filter(u => u.stokta);
    urunListele(gosterilecek);
}


