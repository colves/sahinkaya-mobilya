/* =========================================================================
   İÇERİK — iletişim, projeler, hakkımızda
   ========================================================================= */
function iletisimRenderEt() {
    ['imalat', 'magaza'].forEach(tur => {
        const alan = getEl('iletisim-metin-' + tur); if (!alan) return;
        const info = iletisimBilgileri[tur];
        alan.innerHTML = `<p style="margin-bottom:10px;"><b>Adres:</b> ${kacis(info.adres)}</p><p style="margin-bottom:10px;"><b>Telefon:</b> ${kacis(info.tel)}</p><p style="margin-bottom:10px;"><b>E-Posta:</b> ${kacis(info.posta)}</p>`;
    });
}
/* iletisimDuzenle ve iletisimKaydet admin.js'te tanımlıdır */

// PROJE YÖNETİMİ YENİDEN İNŞA
let aktifProjeResimler = [];

function renderProjeOnizleme() {
    const liste = getEl('proje-onizleme-listesi');
    if (!liste) return;
    if (aktifProjeResimler.length === 0) {
        liste.innerHTML = '<p style="color:var(--metin-soluk); font-size:1rem; grid-column: 1 / -1;">Henüz görsel eklenmedi.</p>';
        return;
    }
    liste.innerHTML = aktifProjeResimler.map((resim, idx) => {
        if(!resim._tid) resim._tid = 'gorsel_' + Math.floor(Math.random()*1000000);
        let [x, y] = (resim.focus || '50% 50%').replace(/center/g, '50%').replace(/top/g, '0%').replace(/bottom/g, '100%').split(' ');
        x = parseInt(x) || 50; y = parseInt(y) || 50;
        
        return `
        <div class="gorsel-kart" ondragover="projeDragOver(event)" ondrop="projeDrop(event, ${idx})" style="background: var(--kutu-ikinci-bg); padding: 15px; border-radius: var(--radius-sm); position: relative; border: 1px solid var(--kenarlik);">
            <div style="position:absolute; top:25px; left:25px; background:rgba(0,0,0,0.7); color:white; padding:4px 8px; border-radius:4px; font-size:0.75rem; z-index:2; font-weight:bold;">Sıra: ${idx + 1}</div>
            <img src="${resim.url}" draggable="true" ondragstart="projeDragStart(event, ${idx})" style="width: 100%; height: 220px; object-fit: cover; object-position: ${x}% ${y}%; cursor: grab; z-index:1; border-radius: 4px; margin-bottom: 20px;" title="Sıralamayı değiştirmek için sürükleyin">
            
            <div style="margin-bottom: 15px; padding: 0 5px;">
                <label style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.8rem; color: var(--metin-soluk); font-weight: 600;">YATAY KONUM: <span id="val-x-${idx}">${x}%</span></label>
                <input type="range" min="0" max="100" value="${x}" oninput="projeResimOdakKaydir(${idx}, 'x', this.value)" style="width:100%; height:6px; accent-color:var(--ahsap); cursor:pointer; margin-bottom: 20px;">
                
                <label style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.8rem; color: var(--metin-soluk); font-weight: 600;">DİKEY KONUM: <span id="val-y-${idx}">${y}%</span></label>
                <input type="range" min="0" max="100" value="${y}" oninput="projeResimOdakKaydir(${idx}, 'y', this.value)" style="width:100%; height:6px; accent-color:var(--ahsap); cursor:pointer;">
            </div>
            
            <button class="btn-satin-al btn-tehlike" style="width: 100%; margin: 0; padding: 12px; border-radius: 4px; font-weight: bold; background: #c0392b; color: white; border: none; cursor: pointer;" onclick="projeResimSil(${idx})">🗑️ SİL</button>
        </div>
    `}).join('');
}

function projeResimOdakKaydir(idx, eksen, deger) {
    getEl(`val-${eksen}-${idx}`).innerText = deger + '%';
    let [x, y] = (aktifProjeResimler[idx].focus || '50% 50%').replace(/center/g, '50%').replace(/top/g, '0%').replace(/bottom/g, '100%').split(' ');
    x = parseInt(x) || 50; y = parseInt(y) || 50;
    if(eksen === 'x') x = deger;
    if(eksen === 'y') y = deger;
    aktifProjeResimler[idx].focus = `${x}% ${y}%`;
    const kart = getEl('proje-onizleme-listesi').children[idx];
    if(kart) {
        const img = kart.querySelector('img');
        if(img) img.style.objectPosition = `${x}% ${y}%`;
    }
}

function projeDragStart(e, idx) { e.dataTransfer.setData('text/plain', idx); }
function projeDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }
function projeDrop(e, targetIdx) {
    e.preventDefault();
    const sourceIdx = parseInt(e.dataTransfer.getData('text/plain'));
    if (!isNaN(sourceIdx) && sourceIdx !== targetIdx) {
        const item = aktifProjeResimler.splice(sourceIdx, 1)[0];
        aktifProjeResimler.splice(targetIdx, 0, item);
        renderProjeOnizleme();
    }
}

function projeResimSil(idx) { aktifProjeResimler.splice(idx, 1); renderProjeOnizleme(); }

async function projeDosyalariEkle(input) {
    if (input.files && input.files.length > 0) {
        for (const file of input.files) {
            const dataUrl = await new Promise(res => { const r = new FileReader(); r.onload = e => res(e.target.result); r.readAsDataURL(file); });
            aktifProjeResimler.push({ url: dataUrl, focus: "50% 50%" });
        }
        input.value = "";
        renderProjeOnizleme();
    }
}

function projeUrlEkle(input) {
    const val = input.value.trim();
    if (val && val.startsWith("http")) {
        aktifProjeResimler.push({ url: val, focus: "50% 50%" });
        input.value = "";
        renderProjeOnizleme();
    }
}

function projeEkleFormAc() { 
    if (!yetkiGerek()) return; 
    getEl('proje-ekle-form').style.display = 'block'; 
    getEl('proje-edit-id').value = ""; 
    getEl('proje-baslik').value = ""; 
    getEl('proje-aciklama').value = ""; 
    getEl('proje-dosya').value = ""; 
    getEl('proje-sira').value = projeler.length + 1; 
    aktifProjeResimler = []; 
    renderProjeOnizleme(); 
}

function projeDuzenleAc(id) { 
    if (!yetkiGerek()) return; 
    const p = projeler.find(x => x.id === id); 
    if (!p) return; 
    getEl('proje-ekle-form').style.display = 'block'; 
    getEl('proje-edit-id').value = p.id; 
    getEl('proje-baslik').value = p.baslik; 
    getEl('proje-aciklama').value = p.aciklama; 
    getEl('proje-sira').value = p.sira || 1; 
    getEl('proje-dosya').value = ""; 
    aktifProjeResimler = p.resimler.map(r => {
        if(typeof r === 'string') return { url: r, focus: "50% 50%" };
        return { url: r.url, focus: r.focus || "50% 50%" };
    });
    renderProjeOnizleme();
    window.scrollTo({ top: getEl('proje-ekle-form').offsetTop - 100, behavior: 'smooth' }); 
}

function projeFormKapat() { 
    getEl('proje-ekle-form').style.display = 'none'; 
    aktifProjeResimler = []; 
    renderProjeOnizleme(); 
}

async function projeKaydet() {
    if (!yetkiGerek()) return;
    const id = getEl('proje-edit-id').value;
    const baslik = getEl('proje-baslik').value.trim();
    const aciklama = getEl('proje-aciklama').value.trim();
    const sira = parseInt(getEl('proje-sira').value) || 1;
    
    if (!baslik) return toastGoster("Proje başlığı girmelisiniz.", "hata");
    
    let resimlerToSave = JSON.parse(JSON.stringify(aktifProjeResimler));
    if (resimlerToSave.length === 0) resimlerToSave = [{url: "", focus: "50% 50%"}];
    
    if (id) { 
        const i = projeler.findIndex(x => x.id == id); 
        projeler[i] = { ...projeler[i], baslik, aciklama, sira, resimler: resimlerToSave }; 
    } else { 
        projeler.push({ id: Date.now(), baslik, aciklama, sira, resimler: resimlerToSave }); 
    }
    
    try { 
        veriKaydet('sahinkaya_projeler', projeler); 
        toastGoster("Proje başarıyla kaydedildi!", "basari"); 
        projeFormKapat();
        sayfaProjeler();
    }
    catch (e) { 
        toastGoster("HATA: Görseller çok büyük, lütfen URL kullanın veya küçültün.", "hata"); 
    }
}

function projeSilPanelden(id) { 
    if (!yetkiGerek()) return; 
    ozelOnayGoster("Bu projeyi silmek istediğinize emin misiniz?", () => { 
        projeler = projeler.filter(p => p.id !== id); 
        veriKaydet('sahinkaya_projeler', projeler); 
        toastGoster("Proje silindi.", "basari"); 
        sayfaProjeler();
    }); 
}

