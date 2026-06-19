/* =========================================================================
   MAĞAZA — sepet, sipariş, takip
   ========================================================================= */
function bilgiAlWhatsApp(urunAd, urunId) {
    const mesaj = `Merhaba, kataloğunuzdaki "${urunAd}" (Ürün Kodu: SHN-${urunId.toString().slice(-4)}) hakkında detaylı bilgi ve fiyat almak istiyorum.`;
    const no = ayarlar.wpNo || '905555555555';
    window.open(`https://wa.me/${no}?text=${encodeURIComponent(mesaj)}`, '_blank');
}
function sepeteEkle(id) {
    if (!ayarlar.satisAktif) return;
    const urun = urunler.find(u => u.id === id);
    if (urun && !urun.stokta) return toastGoster("Ürün stokta yok!", "hata");
    if (urun) { sepet.push(urun); veriKaydet('sahinkaya_sepet', sepet); aktifKullaniciGuncelle(); arayuzuGuncelle(); toastGoster(`${urun.ad} sepete eklendi.`, "basari"); }
}
async function siparisiTamamla() {
    if (sepet.length === 0) return toastGoster("Sepetiniz boş.", "hata");
    if (!aktifKullanici) { toastGoster("Sipariş için giriş yapın.", "hata"); setTimeout(() => location.href = url('pages/giris.html'), 1500); return; }
    if (!aktifKullanici.telefon || !aktifKullanici.adres || !aktifKullanici.email) { toastGoster("Lütfen Hesabım sayfasından adres, telefon ve mail bilgilerinizi doldurun.", "hata"); setTimeout(() => location.href = url('pages/hesabim.html'), 2000); return; }
    
    toastGoster("Sipariş doğrulanıyor, lütfen bekleyin...", "basari");
    try {
        let gercekAraToplam = 0;
        let guvenliUrunler = [];
        
        for (const u of sepet) {
            const doc = await db.collection('sistem').doc('urunler').collection('liste').doc(u.id.toString()).get();
            if (doc.exists) {
                const gercekData = doc.data();
                if (!gercekData.stokta) throw new Error(`"${gercekData.ad}" stokta tükendi!`);
                gercekAraToplam += Number(gercekData.fiyat);
                guvenliUrunler.push(gercekData);
            } else {
                throw new Error("Bazı ürünler veritabanında bulunamadı.");
            }
        }
        
        const genelToplam = gercekAraToplam + (gercekAraToplam * 0.20); // %20 KDV
        const takipKodu = 'TRK' + Math.floor(100000 + Math.random() * 900000);
        
        const yeniSiparis = { siparisNo: takipKodu, tarih: new Date().toLocaleDateString('tr-TR'), urunler: guvenliUrunler, tutar: genelToplam, durum: 'Hazırlanıyor' };
        aktifKullanici.siparisler.push(yeniSiparis);
        
        let safeId = aktifKullanici.uid || aktifKullanici.email || aktifKullanici.kadi;
        await db.collection('sistem').doc('kullanicilar').collection('liste').doc(safeId).update({
            siparisler: firebase.firestore.FieldValue.arrayUnion(yeniSiparis)
        });
        
        // Eski sisteme de yazalım (geriye dönük uyumluluk)
        const idx = kullanicilar.findIndex(k => k.uid === safeId || k.email === safeId);
        if(idx > -1) { kullanicilar[idx].siparisler.push(yeniSiparis); veriKaydet('sahinkaya_kullanicilar', kullanicilar); }
        
        sepet = []; veriKaydet('sahinkaya_sepet', sepet); aktifKullaniciGuncelle();
        toastGoster('Sipariş alındı! Kodu: ' + takipKodu, "basari"); 
        setTimeout(() => { location.href = url('pages/siparisler.html'); }, 2000);
        
    } catch(e) {
        toastGoster("İşlem iptal edildi: " + e.message, "hata");
    }
}
function sepettenSil(index) { sepet.splice(index, 1); veriKaydet('sahinkaya_sepet', sepet); aktifKullaniciGuncelle(); toastGoster("Ürün kaldırıldı.", "hata"); setTimeout(() => location.reload(), 1000); }

function siparisSorgula() {
    const kod = getEl('takip-kodu-input').value.trim(), sonucAlani = getEl('sorgu-sonucu');
    if (!kod) return toastGoster("Kod girin.", "hata");
    let bulunan = null, sahibi = null;
    for (const u of kullanicilar) { const sip = u.siparisler.find(s => s.siparisNo === kod); if (sip) { bulunan = sip; sahibi = u.kadi; break; } }
    if (bulunan) {
        const dRenk = bulunan.durum === 'İptal Edildi' ? 'var(--hata)' : 'var(--basari)';
        sonucAlani.innerHTML = `<div class="siparis-kart" style="text-align:left; margin-top:20px;"><div class="siparis-baslik"><span>Durum: <span style="color:${dRenk};">${bulunan.durum || 'Hazırlanıyor'}</span></span><span>${bulunan.tarih}</span></div><p><strong>Müşteri:</strong> ${kacis(sahibi)}</p><p><strong>Toplam:</strong> ${Number(bulunan.tutar).toLocaleString('tr-TR')} TL</p></div>`;
        toastGoster("Sipariş bulundu!", "basari");
    } else { sonucAlani.innerHTML = `<p style="color:var(--hata); margin-top:20px;">Kayıt bulunamadı.</p>`; toastGoster("Sipariş bulunamadı.", "hata"); }
}

/* ---------- Yorum & favori ---------- */
function yorumYap(urunId) {
    if (!aktifKullanici) return toastGoster("Yorum yapmak için giriş yapmalısınız.", "hata");
    const metin = getEl('yeni-yorum-metin').value.trim(), yildiz = parseInt(getEl('yeni-yorum-yildiz').value);
    if (!metin) return;
    const i = urunler.findIndex(u => u.id === urunId);
    if (i > -1) { 
        if (!urunler[i].yorumlar) urunler[i].yorumlar = []; 
        const yeniYorum = { yazar: aktifKullanici.kadi, metin, yildiz, tarih: new Date().toLocaleDateString('tr-TR') };
        urunler[i].yorumlar.push(yeniYorum); 
        db.collection('sistem').doc('urunler').collection('liste').doc(urunId.toString()).update({
            yorumlar: firebase.firestore.FieldValue.arrayUnion(yeniYorum)
        }).then(() => {
            veriKaydet('sahinkaya_urunler', urunler); 
            toastGoster("Yorum eklendi!", "basari"); 
            setTimeout(() => location.reload(), 1000); 
        }).catch(e => toastGoster("Yorum eklenemedi: " + e.message, "hata"));
    }
}
function yorumSil(urunId, yorumIndex) { 
    ozelOnayGoster("Yorumu silmek istediğinize emin misiniz?", () => { 
        const i = urunler.findIndex(u => u.id === urunId); 
        if (i > -1) { 
            const silinecekYorum = urunler[i].yorumlar[yorumIndex];
            urunler[i].yorumlar.splice(yorumIndex, 1); 
            db.collection('sistem').doc('urunler').collection('liste').doc(urunId.toString()).update({
                yorumlar: firebase.firestore.FieldValue.arrayRemove(silinecekYorum)
            }).then(() => {
                veriKaydet('sahinkaya_urunler', urunler); 
                toastGoster("Yorum silindi.", "basari"); 
                setTimeout(() => location.reload(), 1000); 
            }).catch(e => toastGoster("Silinemedi: " + e.message, "hata"));
        } 
    }); 
}
function favoriEkle(urunId) {
    if (!aktifKullanici) return toastGoster("Kaydetmek için giriş yapmalısınız.", "hata");
    if (!aktifKullanici.favoriler) aktifKullanici.favoriler = [];
    if (aktifKullanici.favoriler.includes(urunId)) return toastGoster("Zaten kaydedilmiş.", "basari");
    aktifKullanici.favoriler.push(urunId); aktifKullaniciGuncelle();
    getEl('detay-favori-btn').innerText = "KAYDEDİLDİ"; toastGoster("Ürün kaydedildi!", "basari");
}


