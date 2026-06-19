/* =========================================================================
   app.js — Arayüz, kimlik, mağaza, yönetim ve içerik mantığı + başlangıç
   data.js, layout.js, effects.js'ten SONRA yüklenir.
   ========================================================================= */


/* =========================================================================
   BAŞLANGIÇ (sayfa yönlendiricisi)
   ========================================================================= */
document.addEventListener('DOMContentLoaded', () => {
    try {
        anasayfaKontrol();
        arayuzuGuncelle();
        const path = location.pathname;
        if (path.includes('admin.html')) adminYukle();

        if (path.includes('hesabim.html')) sayfaHesabim();
        if (path.includes('hakkimizda.html')) { const ha = getEl('hakkimizda-metin-alani'); if (ha) ha.innerHTML = `<p style="font-size:1.1rem; line-height:1.8; white-space:pre-wrap;">${hakkimizdaMetin}</p>`; }
        if (path.includes('iletisim.html')) iletisimRenderEt();
        if (path.includes('projelerimiz.html')) sayfaProjeler();
        if (path.includes('kapaklar.html')) sayfaKapaklar();

        if (getEl('urun-listesi-izgara')) {
            let gosterilecek = [...urunler].sort((a, b) => (a.sira || 99) - (b.sira || 99));
            const p = new URLSearchParams(location.search);
            const katParam = p.get('kat'), araRaw = (p.get('ara') || '').trim(), araParam = araRaw.toLowerCase();
            if (katParam) gosterilecek = gosterilecek.filter(u => u.kategoriler && u.kategoriler.includes(katParam));
            if (araParam) gosterilecek = gosterilecek.filter(u => u.ad.toLowerCase().includes(araParam));
            const baslik = getEl('kategori-baslik');
            if (baslik) {
                const katAd = { 'yatak-odasi': 'Yatak Odası', 'mutfak': 'Mutfak', 'calisma-odasi': 'Çalışma Odası', 'banyo': 'Banyo' };
                if (katParam && katAd[katParam]) baslik.innerText = katAd[katParam];
                else if (araRaw) baslik.innerText = `"${araRaw}" için sonuçlar`;
            }
            urunListele(gosterilecek);
        }

        if (path.includes('urun-detay.html')) sayfaUrunDetay();
        if (getEl('sepet-tablo-govde')) sayfaSepet();
        if (getEl('siparis-listesi')) sayfaSiparislerim();
    } catch (err) { console.error("DOM Hatası:", err); }
});

/* ---------- Sayfa kurucuları (bootstrap yardımcıları) ---------- */
function sayfaHesabim() {
    const telInput = getEl('profil-tel');
    if (telInput) {
        telInput.addEventListener('input', function () { telefonFormatla(this); });
        if (aktifKullanici) {
            getEl('profil-isim').value = aktifKullanici.isim || '';
            getEl('profil-adres').value = aktifKullanici.adres || '';
            if (aktifKullanici.telefon) { telInput.value = aktifKullanici.telefon; telefonFormatla(telInput); }
            if (aktifKullanici.email) getEl('profil-email').value = aktifKullanici.email;
        }
    }
    const favoriListe = getEl('favori-listesi');
    if (favoriListe && aktifKullanici && aktifKullanici.favoriler) {
        const detayBase = url('pages/urun-detay.html');
        if (aktifKullanici.favoriler.length === 0) { favoriListe.innerHTML = "<p>Henüz kaydedilmiş ürününüz bulunmuyor.</p>"; return; }
        favoriListe.innerHTML = '';
        aktifKullanici.favoriler.forEach(id => {
            const fUrun = urunler.find(u => u.id === id); if (!fUrun) return;
            const resim = fUrun.resimler[0] || '';
            favoriListe.innerHTML += `<div class="favori-satir"><img src="${resim}" alt="${kacis(fUrun.ad)}" onerror="this.src='https://via.placeholder.com/60'"><div><h4 style="margin:0;"><a href="${detayBase}?id=${fUrun.id}">${kacis(fUrun.ad)}</a></h4><span style="font-weight:bold; color:var(--ahsap);">${Number(fUrun.fiyat).toLocaleString('tr-TR')} TL</span></div></div>`;
        });
    }
}

function sayfaProjeler() {
    const grid = getEl('projeler-alani'); 
    if (!grid) return;
    
    const siraliProjeler = [...projeler].sort((a, b) => (a.sira || 999) - (b.sira || 999));
    
    let html = '';
    siraliProjeler.forEach(p => {
        const imgHtml = p.resimler.map(resim => {
            const urlStr = typeof resim === 'string' ? resim : resim.url;
            const focusStr = typeof resim === 'string' ? '50% 50%' : (resim.focus || '50% 50%');
            if(!urlStr) return `<div class="proje-bos-cerceve" style="border: 1px dashed var(--kenarlik); border-radius: var(--radius); padding: 50px; text-align: center; color: var(--metin-soluk); font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">GÖRSEL BEKLENİYOR</div>`;
            return `<img src="${kacis(urlStr)}" alt="${kacis(p.baslik)}" style="object-position: ${focusStr}; width: 100%; height: 350px; object-fit: cover; border-radius: var(--radius); cursor: pointer; border: 1px solid var(--kenarlik);" class="tiklanabilir-resim" onclick="lightboxAc('${kacis(urlStr)}')">`;
        }).join('');
        
        const adminHtml = yetkiliMi() ? `
            <div style="display: flex; gap: 8px;">
                <button style="background: transparent; border: 1px solid var(--ahsap); color: var(--ahsap); padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: all 0.2s;" onmouseover="this.style.background='var(--ahsap)'; this.style.color='#fff';" onmouseout="this.style.background='transparent'; this.style.color='var(--ahsap)';" onclick="projeDuzenleAc(${p.id})">✏️ Düzenle</button>
                <button style="background: transparent; border: 1px solid var(--metin-soluk); color: var(--metin-soluk); padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: all 0.2s;" onmouseover="this.style.background='var(--hata)'; this.style.color='#fff'; this.style.borderColor='var(--hata)';" onmouseout="this.style.background='transparent'; this.style.color='var(--metin-soluk)'; this.style.borderColor='var(--metin-soluk)';" onclick="projeSilPanelden(${p.id})">🗑️ Sil</button>
            </div>
        ` : '';
        
        const aciklamaHtml = (p.aciklama && p.aciklama.trim().length > 0) ? `<p style="margin-bottom:20px; white-space:pre-wrap; font-size: 1.05rem; line-height: 1.7; color: var(--metin-soluk);">${p.aciklama}</p>` : '';
        
        html += `
        <div class="proje-kart goster" style="background: var(--kutu-bg); border: 1px solid var(--kenarlik); border-radius: var(--radius); padding: 30px; box-shadow: var(--golge-yumusak);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid var(--kenarlik); padding-bottom: 15px; margin-bottom: 20px;">
                <h3 class="proje-baslik" style="margin: 0; font-family: 'Playfair Display', serif; font-size: 1.8rem; font-weight: 700;">${kacis(p.baslik)}</h3>
                ${adminHtml}
            </div>
            ${aciklamaHtml}
            <div class="proje-resimler" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                ${imgHtml}
            </div>
        </div>`;
    });
    
    if(siraliProjeler.length === 0) {
        html = '<p style="text-align:center; color:var(--metin-soluk); padding: 50px;">Henüz eklenmiş bir proje bulunmuyor.</p>';
    }
    
    grid.innerHTML = html;
}




/* Safari/iOS BFCache (Geri tusu) hatalarini onlemek icin */
window.addEventListener('pageshow', function(e) { if (e.persisted) { window.location.reload(); } });
