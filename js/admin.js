
/* --- Resim Kucultme --- */
function resimKucult(file, maxWidth = 800) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height = Math.round(height * maxWidth / width);
                    width = maxWidth;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.8)); // compressed jpeg
            };
        };
    });
}
/* =========================================================================
   YÖNETİM PANELİ — listeleme & ayarlar
   ========================================================================= */
async function urunKategoriEkleCikar(id, kat, isChecked) {
    const idx = urunler.findIndex(u => u.id === id); if (idx === -1) return;
    if (!urunler[idx].kategoriler) urunler[idx].kategoriler = [];
    if (isChecked) { if (!urunler[idx].kategoriler.includes(kat)) urunler[idx].kategoriler.push(kat); }
    else { urunler[idx].kategoriler = urunler[idx].kategoriler.filter(k => k !== kat); }
    
    try {
        await db.collection('sistem').doc('urunler').collection('liste').doc(id.toString()).update({ kategoriler: urunler[idx].kategoriler });
        veriKaydet('sahinkaya_urunler', urunler);
    } catch(e) { console.error("Kategori güncellenemedi", e); }
}

async function siparisDurumGuncelle(kadi, sNo, durum) {
    const m = kullanicilar.find(x => x.kadi === kadi);
    if (m) { 
        const s = m.siparisler.find(y => y.siparisNo === sNo); 
        if (s) { 
            s.durum = durum; 
            let safeId = m.uid || m.email || m.kadi;
            if(safeId) await db.collection('sistem').doc('kullanicilar').collection('liste').doc(safeId).update({ siparisler: m.siparisler }).catch(()=>{});
            veriKaydet('sahinkaya_kullanicilar', kullanicilar); 
            toastGoster("Durum güncellendi."); adminYukle(); 
        } 
    }
}
async function adminSiparisSil(kadi, sNo) {
    ozelOnayGoster("Siparişi silmek istediğinize emin misiniz?", async () => {
        const m = kullanicilar.find(x => x.kadi === kadi);
        if (m) { 
            m.siparisler = m.siparisler.filter(y => y.siparisNo !== sNo); 
            let safeId = m.uid || m.email || m.kadi;
            if(safeId) await db.collection('sistem').doc('kullanicilar').collection('liste').doc(safeId).update({ siparisler: m.siparisler }).catch(()=>{});
            veriKaydet('sahinkaya_kullanicilar', kullanicilar); 
            toastGoster("Sipariş silindi."); adminYukle(); 
        }
    });
}
function kullanıcıSiparisIptal(sNo) {
    ozelOnayGoster("Siparişinizi iptal etmek istediğinize emin misiniz?", () => {
        const s = aktifKullanici.siparisler.find(y => y.siparisNo === sNo);
        if (s && (s.durum === 'Hazırlanıyor' || !s.durum)) { s.durum = "İptal Edildi"; aktifKullaniciGuncelle(); toastGoster("Siparişiniz iptal edildi."); setTimeout(() => location.reload(), 1000); }
        else { toastGoster("Bu sipariş iptal edilemez.", "hata"); }
    });
}

function adminYukle() {
    const liste = getEl('admin-urun-listesi');
    if (liste) {
        liste.innerHTML = '';
        [...urunler].sort((a, b) => (a.sira || 99) - (b.sira || 99)).forEach((urun) => {
            const k = urun.kategoriler || [];
            const katCheckbox = `<div class="kategori-checkbox-grid">
                <label><input type="checkbox" onchange="urunKategoriEkleCikar(${urun.id}, 'yatak-odası', this.checked)" ${k.includes('yatak-odası') ? 'checked' : ''}> Y.Odası</label>
                <label><input type="checkbox" onchange="urunKategoriEkleCikar(${urun.id}, 'mutfak', this.checked)" ${k.includes('mutfak') ? 'checked' : ''}> Mutfak</label>
                <label><input type="checkbox" onchange="urunKategoriEkleCikar(${urun.id}, 'calisma-odası', this.checked)" ${k.includes('calisma-odası') ? 'checked' : ''}> Ç.Odası</label>
                <label><input type="checkbox" onchange="urunKategoriEkleCikar(${urun.id}, 'banyo', this.checked)" ${k.includes('banyo') ? 'checked' : ''}> Banyo</label>
            </div>`;
            liste.innerHTML += `<tr>
                <td><input type="number" style="width:55px; padding:5px; text-align:center;" value="${urun.sira || 99}" onchange="urunSiraGuncelle(${urun.id}, this.value)"></td>
                <td><span style="font-size:0.8rem; color:var(--metin-soluk);">[SHN-${urun.id.toString().slice(-4)}]</span><br><b>${kacis(urun.ad)}</b><br><label style="font-size:0.8rem;"><input type="checkbox" ${urun.stokta ? 'checked' : ''} onchange="urunStokGuncelle(${urun.id}, this.checked)"> Stokta Var</label></td>
                <td>${katCheckbox}</td>
                <td>${Number(urun.fiyat).toLocaleString('tr-TR')} TL</td>
                <td><button class="btn-incele" onclick="urunDuzenleAc(${urun.id})" style="margin-bottom:5px;">DÜZENLE</button><br><button class="btn-incele btn-tehlike" onclick="urunSil(${urun.id})">SİL</button></td></tr>`;
        });
    }

    if (getEl('ayar-satış')) {
        getEl('ayar-satış').checked = ayarlar.satisAktif; getEl('ayar-fiyat-gizle').checked = ayarlar.fiyatGizle; getEl('ayar-siparislerim').checked = ayarlar.siparislerimGoster; getEl('ayar-takip').checked = ayarlar.takipGoster; getEl('ayar-hakkimizda').checked = ayarlar.hakkimizdaGoster; getEl('ayar-iletişim').checked = ayarlar.iletişimGoster; getEl('ayar-projeler').checked = ayarlar.projelerGoster; getEl('ayar-kapaklar').checked = ayarlar.kapaklarGoster; getEl('ayar-yorum-goster').checked = ayarlar.yorumlarGoster; getEl('ayar-yorum-yapma').checked = ayarlar.yorumYapmaAktif; getEl('ayar-puan-goster').checked = ayarlar.puanGoster;
        getEl('ayar-arama').checked = ayarlar.aramaAktif; getEl('ayar-filtre').checked = ayarlar.filtreAktif; getEl('ayar-wp').checked = ayarlar.wpAktif; getEl('ayar-wp-no').value = ayarlar.wpNo; getEl('ayar-urunler').checked = ayarlar.urunlerGoster; getEl('ayar-mağaza').checked = ayarlar.mağazaGoster; 
    }

    const musteriListe = getEl('admin-musteri-listesi');
    if (musteriListe) {
        musteriListe.innerHTML = ''; const isKurucu = aktifKullanici && aktifKullanici.rol === 'kurucu';
        kullanicilar.forEach((m, idx) => {
            
            const yetkiStr = m.rol === 'kurucu' ? '<span style="color:#8e44ad">(Kurucu)</span>' : (m.rol === 'admin' ? '<span style="color:var(--hata)">(Admin)</span>' : '');
            let yetkiBtn = '-';
            if (m.rol === 'user' && (aktifKullanici.rol === 'admin' || isKurucu)) yetkiBtn = `<button class="btn-admin-yap" onclick="yetkiVerAdmin('${m.kadi}')">Admin Yap</button>`;
            else if (m.rol === 'admin' && isKurucu) yetkiBtn = `<button class="btn-admin-yap" style="color:var(--hata); border-color:var(--hata);" onclick="yetkiAlAdmin('${m.kadi}')">Yetkiyi Al</button>`;
            let islemBtn = '-';
            if (m.rol !== 'kurucu') islemBtn = `<button class="btn-incele" onclick="sifreDegistirAdmin('${m.kadi}')" style="margin-bottom:5px;">Şifre Değiş</button><br><button class="btn-incele btn-tehlike" onclick="hesapSilAdmin('${m.kadi}')">Hesap Sil</button>`;

            let siparisListesiHtml = m.siparisler.map(s => `
                <li style="font-size:0.85rem; border-bottom:1px solid var(--kenarlik); padding-bottom:5px; margin-bottom:5px;">
                    <b>Kod:</b> ${s.siparisNo} | <b>Tarih:</b> ${s.tarih} | <b>Tutar:</b> ${Number(s.tutar).toLocaleString('tr-TR')} TL<br>
                    Durum: <select onchange="siparisDurumGuncelle('${m.kadi}', '${s.siparisNo}', this.value)" style="padding:4px; font-size:0.8rem; background:var(--input-bg); color:var(--metin-renk); border:1px solid var(--input-border); border-radius:4px;">
                        <option value="Hazırlanıyor" ${(!s.durum || s.durum === 'Hazırlanıyor') ? 'selected' : ''}>Hazırlanıyor</option>
                        <option value="Üretimde" ${s.durum === 'Üretimde' ? 'selected' : ''}>Üretimde</option>
                        <option value="Kargoya Verildi" ${s.durum === 'Kargoya Verildi' ? 'selected' : ''}>Kargoya Verildi</option>
                        <option value="Teslim Edildi" ${s.durum === 'Teslim Edildi' ? 'selected' : ''}>Teslim Edildi</option>
                        <option value="İptal Edildi" ${s.durum === 'İptal Edildi' ? 'selected' : ''}>İptal Edildi</option>
                    </select>
                    <button class="btn-incele btn-tehlike" style="margin-left:8px; padding:3px 8px;" onclick="adminSiparisSil('${m.kadi}', '${s.siparisNo}')">Sil</button>
                </li>`).join('');
            if (m.siparisler.length === 0) siparisListesiHtml = "<li style='font-size:0.85rem;'>Siparişi yok.</li>";
            musteriListe.innerHTML += `<tr><td><b>${kacis(m.kadi)}</b> ${yetkiStr}</td><td>${kacis(m.isim) || '-'}</td><td><button class="btn-incele" onclick="document.getElementById('sip-detay-${idx}').style.display = document.getElementById('sip-detay-${idx}').style.display === 'none' ? 'block' : 'none'">İncele (${m.siparisler.length})</button><ul id="sip-detay-${idx}" style="display:none; list-style:none; padding:10px; background:var(--kutu-bg); border:1px solid var(--kenarlik); margin-top:5px; border-radius:6px;">${siparisListesiHtml}</ul></td><td>${yetkiBtn}</td><td>${islemBtn}</td></tr>`;
        });
    }

    const kListe = getEl('admin-kapak-listesi');
    if (kListe) {
        kListe.innerHTML = '';
        [...kapaklar].sort((a, b) => a.kod.localeCompare(b.kod, 'tr')).forEach(k => { kListe.innerHTML += `<tr><td><img src="${k.resim}" style="width:50px; height:75px; object-fit:cover; border:1px solid var(--kenarlik); border-radius:4px;" onerror="this.src='https://via.placeholder.com/50x75?text=KAPAK'"></td><td><b>${kacis(k.kod)}</b></td><td><button class="btn-incele btn-tehlike" onclick="kapakSilPanelden(${k.id})">SİL</button></td></tr>`; });
    }
}

function ayarlarıKaydet() {
    if (!yetkiGerek()) return;
    ayarlar.satisAktif = getEl('ayar-satış').checked; ayarlar.fiyatGizle = getEl('ayar-fiyat-gizle').checked; ayarlar.siparislerimGoster = getEl('ayar-siparislerim').checked; ayarlar.takipGoster = getEl('ayar-takip').checked; ayarlar.hakkimizdaGoster = getEl('ayar-hakkimizda').checked; ayarlar.iletişimGoster = getEl('ayar-iletişim').checked; ayarlar.projelerGoster = getEl('ayar-projeler').checked; ayarlar.kapaklarGoster = getEl('ayar-kapaklar').checked; ayarlar.yorumlarGoster = getEl('ayar-yorum-goster').checked; ayarlar.yorumYapmaAktif = getEl('ayar-yorum-yapma').checked; ayarlar.puanGoster = getEl('ayar-puan-goster').checked;
    ayarlar.aramaAktif = getEl('ayar-arama').checked; ayarlar.filtreAktif = getEl('ayar-filtre').checked; ayarlar.wpAktif = getEl('ayar-wp').checked; ayarlar.wpNo = getEl('ayar-wp-no').value; ayarlar.urunlerGoster = getEl('ayar-urunler').checked; ayarlar.mağazaGoster = getEl('ayar-mağaza').checked;
    veriKaydet('sahinkaya_ayarlar', ayarlar); toastGoster("Ayarlar kaydedildi!", "basari");
    setTimeout(() => location.reload(), 600);
}

/* ---------- Ürün CRUD ---------- */
async function urunSiraGuncelle(id, yeniSira) { 
    const i = urunler.findIndex(u => u.id === id); 
    if (i !== -1) { 
        try {
            await db.collection('sistem').doc('urunler').collection('liste').doc(id.toString()).update({ sira: Number(yeniSira) });
            urunler[i].sira = Number(yeniSira); veriKaydet('sahinkaya_urunler', urunler); 
            toastGoster("Sıralama güncellendi.", "basari"); adminYukle(); 
        } catch(e) { toastGoster("Sıra güncellenemedi: " + e.message, "hata"); }
    } 
}
async function urunStokGuncelle(id, isStokta) { 
    const i = urunler.findIndex(u => u.id === id); 
    if (i !== -1) { 
        try {
            await db.collection('sistem').doc('urunler').collection('liste').doc(id.toString()).update({ stokta: isStokta });
            urunler[i].stokta = isStokta; veriKaydet('sahinkaya_urunler', urunler); 
            toastGoster("Stok durumu güncellendi.", "basari"); adminYukle(); 
        } catch(e) { toastGoster("Stok güncellenemedi: " + e.message, "hata"); }
    } 
}
function urunSil(id) { 
    if (!yetkiGerek()) return; 
    ozelOnayGoster("Silmek istediğinize emin misiniz?", async () => { 
        try {
            await db.collection('sistem').doc('urunler').collection('liste').doc(id.toString()).delete();
            const i = urunler.findIndex(u => u.id === id); 
            if (i > -1) { urunler.splice(i, 1); veriKaydet('sahinkaya_urunler', urunler); }
            toastGoster("Ürün silindi.", "basari"); adminYukle(); 
        } catch(e) { toastGoster("Ürün silinemedi: " + e.message, "hata"); }
    }); 
}

async function urunEkle() {
    if (!yetkiGerek()) return;
    const secilenKategoriler = Array.from(document.querySelectorAll('.kat-cb:checked')).map(cb => cb.value);
    const ad = getEl('yeni-urun-adi').value, fiyat = getEl('yeni-urun-fiyat').value, sira = getEl('yeni-urun-sira').value;
    const aciklama = getEl('yeni-urun-aciklama').value, ozelliklerRaw = getEl('yeni-urun-ozellikler').value, resimlerRaw = getEl('yeni-urun-resimler').value;
    const dosyaInput = getEl('yeni-urun-dosya'), isStokta = getEl('yeni-urun-stok').checked;
    if (!ad || !fiyat || secilenKategoriler.length === 0) return toastGoster("Lütfen Ad, Fiyat ve Kategori seçin.", "hata");
    let resimler = resimlerRaw ? resimlerRaw.split(',').map(u => u.trim()).filter(u => u !== "") : [];
    if (dosyaInput && dosyaInput.files && dosyaInput.files.length > 0) {
        for (const file of dosyaInput.files) {
            const dataUrl = await resimKucult(file, 800);
            resimler.push(dataUrl);
        }
    }
    const ozellikler = ozelliklerRaw.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const yeniUrun = { id: Date.now(), ad, resimler, fiyat: Number(fiyat), aciklama, ozellikler, kategoriler: secilenKategoriler, sira: Number(sira || 99), yorumlar: [], stokta: isStokta };
    try { 
        await db.collection('sistem').doc('urunler').collection('liste').doc(yeniUrun.id.toString()).set(yeniUrun);
        urunler.push(yeniUrun); veriKaydet('sahinkaya_urunler', urunler); 
        toastGoster("Ürün eklendi!", "basari"); setTimeout(() => location.reload(), 1500); 
    }
    catch (e) { toastGoster("HATA: " + e.message, "hata"); }
}

function urunDuzenleAc(id) {
    if (!yetkiGerek()) return;
    const u = urunler.find(x => x.id === id);
    if (!u) return;
    
    getEl('duzenle-urun-id').value = u.id;
    getEl('duzenle-urun-adi').value = u.ad || "";
    getEl('duzenle-urun-fiyat').value = u.fiyat || "";
    getEl('duzenle-urun-aciklama').value = u.aciklama || "";
    getEl('duzenle-urun-ozellikler').value = (u.ozellikler || []).join('\n');
    getEl('duzenle-urun-resimler').value = (u.resimler || []).join(', ');
    getEl('duzenle-urun-stok').checked = u.stokta !== false;
    
    getEl('urun-duzenle-modal').style.display = 'flex';
}

function urunDuzenleKapat() {
    getEl('urun-duzenle-modal').style.display = 'none';
}

async function urunDuzenleKaydet() {
    if (!yetkiGerek()) return;
    const id = parseInt(getEl('duzenle-urun-id').value);
    const i = urunler.findIndex(u => u.id === id);
    if (i === -1) return toastGoster("Ürün bulunamadı.", "hata");
    
    const ad = getEl('duzenle-urun-adi').value.trim();
    const fiyat = getEl('duzenle-urun-fiyat').value;
    const aciklama = getEl('duzenle-urun-aciklama').value.trim();
    const ozelliklerRaw = getEl('duzenle-urun-ozellikler').value;
    const resimlerRaw = getEl('duzenle-urun-resimler').value;
    const isStokta = getEl('duzenle-urun-stok').checked;
    
    if (!ad || !fiyat) return toastGoster("Ad ve Fiyat zorunludur.", "hata");
    
    const resimler = resimlerRaw ? resimlerRaw.split(',').map(u => u.trim()).filter(u => u !== "") : [];
    const ozellikler = ozelliklerRaw.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    const guncelUrun = { ...urunler[i], ad, resimler, fiyat: Number(fiyat), aciklama, ozellikler, stokta: isStokta };
    
    try {
        toastGoster("Kaydediliyor...", "basari");
        await db.collection('sistem').doc('urunler').collection('liste').doc(id.toString()).update(guncelUrun);
        urunler[i] = guncelUrun;
        veriKaydet('sahinkaya_urunler', urunler);
        toastGoster("Ürün güncellendi!", "basari");
        urunDuzenleKapat();
        adminYukle();
    } catch(e) {
        console.error("Ürün güncelleme hatası:", e);
        toastGoster("HATA: " + e.message, "hata");
    }
}

/* ---------- Kapaklar ---------- */
function kapaklarMetinDuzenleAc() { getEl('kapaklar-metin-alani').innerHTML = `<button class="bold-btn" onclick="metinKalinlastir('edit-kapak-metin')" title="Seçili metni kalın yapar"><b>B</b> Kalın Yap</button><br><input type="text" id="edit-kapak-metin" class="modal-input" value="${kacis(kapaklarMetin)}" style="font-size:1.1rem; margin-top:5px; margin-bottom:10px;"><button class="btn-satin-al btn-oto" onclick="kapaklarMetinKaydet()">Kaydet</button>`; }
function kapaklarMetinKaydet() { kapaklarMetin = getEl('edit-kapak-metin').value; veriKaydet('sahinkaya_kapaklar_metin', kapaklarMetin); toastGoster("Güncellendi!", "basari"); setTimeout(() => location.reload(), 1000); }
function kapakEkleFormAc() { getEl('kapak-ekle-form').style.display = 'block'; }
async function kapakEkleIslemi(kodId, dosyaId) {
    if (!yetkiGerek()) return;
    const kodInput = getEl(kodId).value, dosyaInput = getEl(dosyaId);
    
    if (!dosyaInput || !dosyaInput.files || dosyaInput.files.length === 0) {
        if (!kodInput) return toastGoster("Kapak kodu veya görsel seçin.", "hata");
        const yeni = { id: Date.now(), kod: kodInput, resim: "https://via.placeholder.com/600x900?text=KAPAK" };
        kapaklar.push(yeni);
        await db.collection('sistem').doc('kapaklar').collection('liste').doc(yeni.id.toString()).set(yeni);
    } else {
        toastGoster("Kapaklar yükleniyor, lütfen bekleyin...", "basari");
        let eklendi = 0;
        
        // Chunk batch to avoid 10MB limit (10 resim = max 5-8 MB civarı yapar)
        for (let i = 0; i < dosyaInput.files.length; i += 10) {
            let batch = db.batch();
            let chunk = Array.from(dosyaInput.files).slice(i, i + 10);
            
            for (let j = 0; j < chunk.length; j++) {
                const file = chunk[j];
                let kod = kodInput;
                if (dosyaInput.files.length > 1 || !kodInput) {
                    kod = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                }
                try {
                    const resimUrl = await resimKucult(file, 800);
                    const yeniId = Date.now() + i + j;
                    const yeniKapak = { id: yeniId, kod: kod, resim: resimUrl };
                    kapaklar.push(yeniKapak);
                    const docRef = db.collection('sistem').doc('kapaklar').collection('liste').doc(yeniId.toString());
                    batch.set(docRef, yeniKapak);
                    eklendi++;
                } catch (e) {
                    console.error(e);
                }
            }
            await batch.commit().catch(e => console.error("Chunk yazma hatası:", e));
        }

        if (eklendi === 0) {
            return toastGoster("Görseller yüklenemedi.", "hata");
        }
    }
    
    veriKaydet('sahinkaya_kapaklar', kapaklar); 
    toastGoster("Kapaklar eklendi!", "basari"); 
    setTimeout(() => location.reload(), 1000); 
}
function kapakKaydet() { kapakEkleIslemi('kapak-kodu', 'kapak-dosya'); }
function kapakSilPanelden(id) { 
    ozelOnayGoster("Silmek istediğinize emin misiniz?", async () => { 
        await db.collection('sistem').doc('kapaklar').collection('liste').doc(id.toString()).delete().catch(()=>{});
        kapaklar = kapaklar.filter(k => k.id !== id); 
        veriKaydet('sahinkaya_kapaklar', kapaklar); 
        toastGoster("Silindi.", "basari"); 
        setTimeout(() => location.reload(), 1000); 
    }); 
}



/* ---------- Hakkimizda ---------- */
function hakkimizdaDuzenleAc() { 
    if(!yetkiGerek()) return;
    let alan = getEl('hakkimizda-metin-alani'); 
    alan.innerHTML = `<button class="bold-btn" onclick="metinKalinlastir('hakkimizda-edit-area')" title="Seçili metni kalın yapar"><b>B</b> Kalın Yap</button><textarea id="hakkimizda-edit-area" rows="8" style="width:100%; padding:15px; font-size:1.1rem; line-height:1.6; border:2px solid var(--kenarlik); background:var(--input-bg); color:var(--metin-renk);">${hakkimizdaMetin}</textarea><br><button class="btn-satin-al btn-oto" onclick="hakkimizdaKaydet()">Kaydet</button><button class="btn-incele btn-oto" onclick="window.location.reload()">İptal</button>`; 
    let btn = document.querySelector('.sadece-admin-btn');
    if(btn) btn.style.display = 'none'; 
}
function hakkimizdaKaydet() { 
    if(!yetkiGerek()) return;
    let yeniMetin = getEl('hakkimizda-edit-area').value; 
    hakkimizdaMetin = yeniMetin; 
    veriKaydet('sahinkaya_hakkimizda_metin', hakkimizdaMetin); 
    toastGoster("Metin güncellendi!", "basari"); 
    setTimeout(() => { window.location.reload(); }, 1000); 
}

/* ---------- İletişim ---------- */
function iletişimDuzenle(tur) {
    if(!yetkiGerek()) return;
    let alan = getEl('iletişim-metin-' + tur), info = iletişimBilgileri[tur];
    alan.innerHTML = `<div class="form-grup"><label><b>Adres:</b></label><input type="text" id="edit-adres-${tur}" value="${kacis(info.adres)}"></div><div class="form-grup"><label><b>Telefon:</b></label><input type="text" id="edit-tel-${tur}" value="${kacis(info.tel)}"></div><div class="form-grup"><label><b>E-Posta:</b></label><input type="text" id="edit-posta-${tur}" value="${kacis(info.posta)}"></div><div class="form-grup"><label><b>Google Maps Embed Linki:</b></label><input type="text" id="edit-harita-${tur}" value="${kacis(info.harita || '')}"></div><button class="btn-satin-al btn-oto" style="margin-top:10px;" onclick="iletişimKaydet('${tur}')">Kaydet</button><button class="btn-incele btn-oto" style="margin-top:10px; background:#ccc; color:#333; border:none;" onclick="iletişimRenderEt()">İptal</button>`;
}
function iletişimKaydet(tur) { 
    if(!yetkiGerek()) return;
    iletişimBilgileri[tur].adres = getEl('edit-adres-'+tur).value; 
    iletişimBilgileri[tur].tel = getEl('edit-tel-'+tur).value; 
    iletişimBilgileri[tur].posta = getEl('edit-posta-'+tur).value; 
    iletişimBilgileri[tur].harita = getEl('edit-harita-'+tur).value; 
    veriKaydet('sahinkaya_iletişim_bilgi', iletişimBilgileri); 
    toastGoster("Bilgiler güncellendi!", "basari"); 
    iletişimRenderEt(); 
}



