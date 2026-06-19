/* =========================================================================
   GENEL ARAYÜZ YARDIMCILARI
   ========================================================================= */
function toastGoster(mesaj, tip = 'basari') {
    let t = getEl('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
    t.innerText = mesaj; t.className = 'aktif ' + (tip === 'hata' ? 'hata' : 'basari');
    setTimeout(() => t.classList.remove('aktif'), 3000);
}

function yildizCiz(puan) { return '⭐'.repeat(puan) + '☆'.repeat(5 - puan); }

function animasyonlariBaslat() {
    const obs = new IntersectionObserver((kayitlar) => {
        kayitlar.forEach(k => k.target.classList.toggle('goster', k.isIntersecting));
    }, { threshold: 0.05 });
    document.querySelectorAll('.urun-kart, .proje-kart, .kapak-kart').forEach(el => obs.observe(el));
}

/* ---------- Onay modalı ---------- */
let onayBekleyenIslem = null;
function ozelOnayGoster(msj, cb) { onayBekleyenIslem = cb; const m = getEl('ozel-modal'); if (m) { getEl('ozel-modal-mesaj').innerText = msj; m.style.display = 'flex'; } }
function ozelOnayKapat() { const m = getEl('ozel-modal'); if (m) m.style.display = 'none'; onayBekleyenIslem = null; }
function ozelOnayKabul() { const m = getEl('ozel-modal'); if (m) m.style.display = 'none'; if (onayBekleyenIslem) onayBekleyenIslem(); }

/* ---------- Metin kalınlaştırma (admin editör) ---------- */
function metinKalinlastir(id) {
    const t = getEl(id); if (!t) return;
    const s = t.selectionStart, e = t.selectionEnd, txt = t.value, sec = txt.substring(s, e);
    if (sec.length > 0) { t.value = txt.substring(0, s) + "<b>" + sec + "</b>" + txt.substring(e); t.focus(); t.selectionStart = s + 3; t.selectionEnd = e + 4; }
    else toastGoster("Yazı seçin.", "hata");
}

function aktifKullaniciGuncelle() {
    if (!aktifKullanici) return;
    if (aktifKullanici.kadi === 'admin') aktifKullanici.rol = 'kurucu';
    aktifKullanici.sepet = sepet; veriKaydet('sahinkaya_aktif', aktifKullanici);
    
    let safeId = aktifKullanici.uid || aktifKullanici.email || aktifKullanici.kadi;
    if (safeId && typeof db !== 'undefined') {
        db.collection('sistem').doc('kullanicilar').collection('liste').doc(safeId).set(aktifKullanici, { merge: true }).catch(()=>{});
    }
    
    const i = kullanicilar.findIndex(u => u.kadi === aktifKullanici.kadi);
    if (i !== -1) { kullanicilar[i] = aktifKullanici; veriKaydet('sahinkaya_kullanicilar', kullanicilar); }
}


/* =========================================================================
   TEMA & MENÜ
   ========================================================================= */
function temaDegistir() { aktifTema = aktifTema === 'light' ? 'dark' : 'light'; veriKaydet('sahinkaya_tema', aktifTema); temaUygula(); }
function temaUygula() {
    const ikon = getEl('tema-ikon');
    if (aktifTema === 'dark') { document.documentElement.classList.add('dark-mode'); if (ikon) ikon.innerText = '☀️'; }
    else { document.documentElement.classList.remove('dark-mode'); if (ikon) ikon.innerText = '🌙'; }
}
function mobilMenuGoster() { const n = document.querySelector('nav'); if (n) n.classList.toggle('nav-acik'); }

function arayuzuGuncelle() {
    try {
        temaUygula();
        const kok = document.documentElement.style;
        kok.setProperty('--menu-bg', navAyarlar.bgRenk);
        kok.setProperty('--menu-text', navAyarlar.yaziRenk);
        kok.setProperty('--menu-boyut', navAyarlar.yaziBoyut + 'rem');
        kok.setProperty('--menu-link-boyut', navAyarlar.linkBoyut + 'rem');

        setDisp('nav-takip', ayarlar.takipGoster ? 'inline-block' : 'none');
        setDisp('nav-hakkimizda', ayarlar.hakkimizdaGoster ? 'inline-block' : 'none');
        setDisp('nav-iletisim', ayarlar.iletisimGoster ? 'inline-block' : 'none');
        setDisp('nav-projeler', ayarlar.projelerGoster ? 'inline-block' : 'none');
        setDisp('nav-urunler', ayarlar.urunlerGoster ? 'inline-block' : 'none');
        setDisp('magaza-ikon', ayarlar.magazaGoster ? 'inline-block' : 'none');
        setDisp('nav-kapaklar', ayarlar.kapaklarGoster ? 'inline-block' : 'none');

        setDisp('arama-kapsayici', ayarlar.aramaAktif ? 'inline-block' : 'none');
        setDisp('mobil-btn-arama', ayarlar.aramaAktif ? 'inline-flex' : 'none');
        setDisp('filtre-alani', ayarlar.filtreAktif ? 'flex' : 'none');
        setDisp('wp-btn', ayarlar.wpAktif ? 'flex' : 'none');
        if (ayarlar.wpAktif && getEl('wp-btn')) getEl('wp-btn').href = 'https://wa.me/' + ayarlar.wpNo;

        setDisp('btn-sepet', ayarlar.satisAktif ? 'inline-block' : 'none');
        setDisp('mobil-btn-sepet', ayarlar.satisAktif ? 'inline-flex' : 'none');
        const sc = getEl('sepet-sayac'); if (sc) sc.innerText = sepet.length;
        const msc = getEl('mobil-sepet-sayac'); if (msc) msc.innerText = sepet.length;

        const isAdmin = yetkiliMi();
        if (aktifKullanici) {
            setDisp('btn-giris', 'none');
            setDisp('btn-siparis', ayarlar.siparislerimGoster ? 'inline-block' : 'none');
            setDisp('btn-hesabim', 'inline-block');
            setDisp('mobil-btn-hesabim', 'inline-flex');
            setDisp('btn-admin', isAdmin ? 'inline-block' : 'none');
            document.querySelectorAll('.sadece-admin-btn').forEach(btn => { btn.style.display = isAdmin ? 'inline-block' : 'none'; });
            setDisp('btn-menu-ayar', isAdmin ? 'inline-block' : 'none');
        } else {
            setDisp('btn-giris', 'inline-block'); setDisp('btn-siparis', 'none');
            setDisp('btn-hesabim', 'none'); setDisp('btn-admin', 'none');
            setDisp('mobil-btn-hesabim', 'none');
            document.querySelectorAll('.sadece-admin-btn').forEach(btn => { btn.style.display = 'none'; });
            setDisp('btn-menu-ayar', 'none');
        }

        if (isAdmin && location.pathname.includes('admin.html')) {
            const btnUkbe = getEl('btn-ukbe-toggle');
            if (btnUkbe) { btnUkbe.style.display = 'inline-block'; btnUkbe.innerText = ayarlar.ukbeAktif ? "UKBE MODU: AÇIK" : "UKBE MODU: KAPALI"; }
        }

        const m = getEl('magaza-ikon'); if (m) m.href = url('index.html');

        const magazaLink = getEl('magaza-ikon');
        if (magazaLink) magazaLink.style.display = ayarlar.magazaGoster ? 'inline-block' : 'none';
        
        const anasayfada = location.pathname.endsWith('/') || location.pathname.endsWith('index.html');
        if (anasayfada) {
            const v1 = getEl('vitrin-duzen-1'); if(v1) v1.style.display = (ayarlar.siteDuzeni == 1) ? 'flex' : 'none';
            const v2 = getEl('vitrin-duzen-2'); if(v2) v2.style.display = (ayarlar.siteDuzeni == 2) ? 'flex' : 'none';
        }

        // Vitrin (anasayfa) dışında footer görünür
        const footer = getEl('gizli-footer');
        if (footer) footer.style.display = anasayfada ? 'none' : 'block';

        if (isAdmin && ayarlar.ukbeAktif && !ukbeCalisiyor) startUkbe();
        else if ((!isAdmin || !ayarlar.ukbeAktif) && ukbeCalisiyor) stopUkbe();

        const nav = document.querySelector('.ana-nav');
        if (nav) nav.style.opacity = '1';
    } catch (err) { console.error("Arayüz hatası:", err); }
}

function urunAra() {
    const q = getEl('arama-input').value.trim();
    if(q) location.href = url('pages/kategori.html') + '?ara=' + encodeURIComponent(q);
}

function aramaOnerileriGetir() {
    const q = getEl('arama-input').value.trim().toLowerCase();
    const kutu = getEl('arama-sonuclari');
    if (!kutu) return;
    
    if (q.length < 2) {
        kutu.style.display = 'none';
        return;
    }
    
    const sonuclar = urunler.filter(u => u.ad.toLowerCase().includes(q) || (u.kategoriler && u.kategoriler.some(k => k.toLowerCase().includes(q))));
    
    if (sonuclar.length === 0) {
        kutu.innerHTML = '<div style="padding:10px 15px; color:var(--metin-soluk); font-size:0.9rem;">Eşleşen ürün bulunamadı.</div>';
    } else {
        const detayBase = url('pages/urun-detay.html');
        kutu.innerHTML = sonuclar.slice(0, 6).map(u => {
            const anaResim = (u.resimler && u.resimler.length > 0) ? (typeof u.resimler[0] === 'string' ? u.resimler[0] : u.resimler[0].url) : '';
            return `
            <div style="display:flex; align-items:center; gap:10px; padding:10px 15px; border-bottom:1px solid var(--kenarlik); cursor:pointer; transition:var(--gecis);" 
                 onmouseover="this.style.backgroundColor='var(--input-bg)'" 
                 onmouseout="this.style.backgroundColor='transparent'"
                 onclick="location.href='${url('pages/urun-detay.html')}?id=${u.id}'">
                <img src="${anaResim}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;" onerror="this.src='https://via.placeholder.com/40'">
                <div>
                    <div style="font-weight:600; font-size:0.9rem; color:var(--metin-renk);">${kacis(u.ad)}</div>
                    <div style="font-size:0.8rem; color:var(--ahsap); font-weight:700;">${u.fiyat} ₺</div>
                </div>
            </div>`;
        }).join('');
    }
    kutu.style.display = 'block';
}

document.addEventListener('click', (e) => {
    const kapsayici = getEl('arama-kapsayici');
    const kutu = getEl('arama-sonuclari');
    if (kapsayici && kutu && !kapsayici.contains(e.target)) {
        kutu.style.display = 'none';
    }
});

function anasayfaKontrol() {
    const path = location.pathname;
    if (path.endsWith('/') || path.endsWith('index.html')) {
        const gidilecek = ayarlar.anaSayfa || 'index.html';
        if (gidilecek !== 'index.html' && sessionStorage.getItem('yonlendirildi') !== '1') {
            sessionStorage.setItem('yonlendirildi', '1');
            location.href = url('pages/' + gidilecek);
        }
    } else { sessionStorage.setItem('yonlendirildi', '0'); }
}


/* =========================================================================
   LIGHTBOX GALERİ
   ========================================================================= */
function lightboxAc(urlStr) {
    const modal = getEl('lightbox-modal');
    const img = getEl('lightbox-resim');
    if(modal && img) { img.src = urlStr; modal.style.display = 'flex'; document.body.style.overflow = 'hidden'; }
}
function lightboxKapat(event) {
    if(event && event.target.id === 'lightbox-resim') return;
    const modal = getEl('lightbox-modal');
    if(modal) { modal.style.display = 'none'; getEl('lightbox-resim').src = ''; document.body.style.overflow = 'auto'; }
}

function sayfaKapaklar() {
    const textAlan = getEl('kapaklar-metin-alani'); if (textAlan) textAlan.innerHTML = kapaklarMetin;
    const kGrid = getEl('kapaklar-katalog'); if (!kGrid) return;
    kGrid.innerHTML = '';
    kapaklar.forEach(k => {
        const adminHtml = yetkiliMi() ? `<button class="btn-satin-al btn-tehlike" style="padding:6px; margin-top:10px;" onclick="kapakSilPanelden(${k.id})">🗑️ Sil</button>` : '';
        kGrid.innerHTML += `<div class="kapak-kart goster"><img src="${k.resim}" alt="${kacis(k.kod)}" style="cursor:pointer;" onclick="lightboxAc('${k.resim}')" onerror="this.src='https://via.placeholder.com/300x450?text=KAPAK'"><div class="kapak-kodu">${kacis(k.kod)}</div>${adminHtml}</div>`;
    });
    animasyonlariBaslat();
}

function sayfaUrunDetay() {
    const urunId = parseInt(new URLSearchParams(location.search).get('id'));
    const urun = urunler.find(u => u.id === urunId); if (!urun) return;
    getEl('detay-baslik').innerText = urun.ad;
    
    // Dinamik SEO Etiketleri
    const sayfaBaslik = getEl('sayfa-baslik');
    if(sayfaBaslik) sayfaBaslik.innerText = urun.ad + " - Şahinkaya Ahşap";
    else document.title = urun.ad + " - Şahinkaya Ahşap";
    
    const metaDesc = document.getElementById('meta-desc');
    if(metaDesc) {
        let aciklamaTeks = urun.aciklama ? urun.aciklama.replace(/<[^>]*>?/gm, '').substring(0, 150) : "Özel üretim ahşap mobilya ve dekorasyon.";
        metaDesc.content = urun.ad + " - " + aciklamaTeks;
    }
    getEl('detay-fiyat').innerHTML = ayarlar.fiyatGizle ? `<span style="font-size:1.2rem; color:var(--metin-soluk);">Fiyat Sorunuz</span>` : `${Number(urun.fiyat).toLocaleString('tr-TR')} TL`;
    getEl('urun-kodu-alani').innerText = "Ürün Kodu: SHN-" + urun.id.toString().slice(-4);

    const sDurum = getEl('stok-durum-alani');
    if (sDurum) sDurum.innerHTML = urun.stokta ? '<div class="stok-durum stok-var">Stokta Var</div>' : '<div class="stok-durum stok-yok">Stokta Yok</div>';

    getEl('detay-aciklama').innerHTML = urun.aciklama || "-";
    const imgList = urun.resimler || [];
    if (imgList.length > 0) getEl('ana-urun-resmi').src = imgList[0];
    const kucuk = getEl('kucuk-resimler-kutusu');
    if (kucuk) { kucuk.innerHTML = ''; imgList.forEach(imgUrl => { kucuk.innerHTML += `<img src="${imgUrl}" class="kucuk-resim" onclick="document.getElementById('ana-urun-resmi').src='${imgUrl}'">`; }); }
    const oz = getEl('detay-ozellikler');
    if (oz) { oz.innerHTML = ''; (urun.ozellikler || []).forEach(o => { const p = o.split(':'); if (p.length > 1) oz.innerHTML += `<tr><td>${kacis(p[0].trim())}</td><td>${kacis(p.slice(1).join(':').trim())}</td></tr>`; else oz.innerHTML += `<tr><td colspan="2">${kacis(o)}</td></tr>`; }); }

    const sepBtn = getEl('detay-sepet-btn');
    if (sepBtn) {
        if (!urun.stokta) { sepBtn.disabled = true; sepBtn.innerText = "STOKTA YOK"; }
        else if (ayarlar.satisAktif) { sepBtn.innerText = "Sepete Ekle"; sepBtn.onclick = () => sepeteEkle(urun.id); }
        else { sepBtn.innerText = "WhatsApp'tan Bilgi Al"; sepBtn.onclick = () => bilgiAlWhatsApp(urun.ad, urun.id); }
    }
    const favBtn = getEl('detay-favori-btn');
    if (favBtn) { if (aktifKullanici && aktifKullanici.favoriler && aktifKullanici.favoriler.includes(urun.id)) favBtn.innerText = "KAYDEDİLDİ"; favBtn.onclick = () => favoriEkle(urun.id); }

    if (!ayarlar.yorumlarGoster) { const ya = document.querySelector('.yorum-alani'); if (ya) ya.style.display = 'none'; return; }

    const yorumListesi = getEl('yorum-listesi'), ySayisi = urun.yorumlar ? urun.yorumlar.length : 0;
    if (yorumListesi) {
        yorumListesi.innerHTML = '';
        if (ayarlar.puanGoster && ySayisi > 0) { const ort = urun.yorumlar.reduce((s, y) => s + (y.yildiz || 5), 0) / ySayisi; getEl('detay-fiyat').insertAdjacentHTML('beforebegin', `<div style="font-size:1rem; color:var(--ahsap-acik); margin-bottom:15px;">${yildizCiz(Math.round(ort))} (${ySayisi} Değerlendirme)</div>`); }
        if (ySayisi > 0) {
            urun.yorumlar.forEach((y, index) => {
                const islemBtn = yetkiliMi() ? `<button onclick="yorumSil(${urun.id}, ${index})" style="float:right; color:var(--hata); border:none; background:none; cursor:pointer;">🗑️ Sil</button>` : '';
                const yildizGoster = ayarlar.puanGoster ? `<span style="color:var(--ahsap-acik);">${yildizCiz(y.yildiz || 5)}</span>` : '';
                yorumListesi.innerHTML += `<div class="yorum-kart">${islemBtn}<div class="yorum-yazar">${kacis(y.yazar)} ${yildizGoster} <span style="font-size:0.75rem; color:var(--metin-soluk); font-weight:normal;">- ${y.tarih}</span></div><p style="font-size:0.9rem;">${kacis(y.metin)}</p></div>`;
            });
        } else yorumListesi.innerHTML = "<p style='color:var(--metin-soluk); font-size:0.9rem;'>Henüz yorum yapılmamış.</p>";
    }
    const yorumForm = getEl('yorum-ekleme-formu');
    if (ayarlar.yorumYapmaAktif) { const by = getEl('btn-yorum-yap'); if (by) by.onclick = () => yorumYap(urun.id); }
    else if (yorumForm) yorumForm.style.display = 'none';
}

function sayfaSepet() {
    const govde = getEl('sepet-tablo-govde'); let araToplam = 0;
    if (sepet.length === 0) { govde.innerHTML = '<tr><td colspan="3" style="text-align:center;">Sepetiniz boş.</td></tr>'; }
    else { govde.innerHTML = ''; sepet.forEach((urun, i) => { araToplam += Number(urun.fiyat); govde.innerHTML += `<tr><td>${kacis(urun.ad)}</td><td>${Number(urun.fiyat).toLocaleString('tr-TR')} TL</td><td><button class="btn-incele btn-tehlike" onclick="sepettenSil(${i})">KALDIR</button></td></tr>`; }); }
    const at = getEl('ara-toplam'); if (at) at.innerText = araToplam.toLocaleString('tr-TR') + " TL";
    const gt = getEl('genel-toplam'); if (gt) gt.innerText = (araToplam + (araToplam * 0.20)).toLocaleString('tr-TR') + " TL";
}

function sayfaSiparislerim() {
    const siparisListesi = getEl('siparis-listesi');
    if (!aktifKullanici) { location.href = url('pages/giris.html'); return; }
    if (!aktifKullanici.siparisler || aktifKullanici.siparisler.length === 0) { siparisListesi.innerHTML = "<p>Henüz bir siparişiniz bulunmamaktadır.</p>"; return; }
    siparisListesi.innerHTML = '';
    [...aktifKullanici.siparisler].reverse().forEach(sip => {
        const urunIsimleri = sip.urunler.map(u => kacis(u.ad)).join(', ');
        const dRenk = sip.durum === 'İptal Edildi' ? 'var(--hata)' : 'var(--basari)';
        const iptalBtn = (sip.durum === 'Hazırlanıyor' || !sip.durum) ? `<button class="btn-satin-al btn-tehlike btn-oto" style="margin-top:10px;" onclick="kullaniciSiparisIptal('${sip.siparisNo}')">Siparişi İptal Et</button>` : '';
        siparisListesi.innerHTML += `<div class="siparis-kart"><div class="siparis-baslik"><span>Takip Kodu: <span class="takip-kodu">${sip.siparisNo}</span></span><span>${sip.tarih}</span></div><p style="margin-bottom:10px;"><strong>Ürünler:</strong> ${urunIsimleri}</p><p><strong>Toplam Tutar:</strong> ${Number(sip.tutar).toLocaleString('tr-TR')} TL</p><p style="color:${dRenk}; font-weight:bold; margin-top:10px;">Durum: ${sip.durum || 'Hazırlanıyor'}</p>${iptalBtn}</div>`;
    });
}

