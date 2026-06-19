/* =========================================================================
   KİMLİK & HESAP (FIREBASE)
   ========================================================================= */
function formDegistir(h) {
    const g = getEl('giris-kutusu'), k = getEl('kayit-kutusu');
    if (h === 'kayit') { g.style.display = 'none'; k.style.display = 'block'; }
    else { k.style.display = 'none'; g.style.display = 'block'; }
}

function kayitOl() {
    const isim = getEl('kayit-isim').value.trim();
    const email = getEl('kayit-kadi').value.trim();
    const sifre = getEl('kayit-sifre').value.trim();
    const sifreTekrar = getEl('kayit-sifre-tekrar').value.trim();
    
    if (!isim || !email || !sifre || !sifreTekrar) return toastGoster("Boş alan bırakmayın!", "hata");
    if (sifre !== sifreTekrar) return toastGoster("Şifreler eşleşmiyor!", "hata");
    
    auth.createUserWithEmailAndPassword(email, sifre)
        .then((userCredential) => {
            const user = userCredential.user;
            return user.updateProfile({ displayName: isim }).then(() => {
                const yeniKullaniciModeli = { kadi: email, email: email, sifre: 'GİZLİ', rol: 'user', siparisler: [], isim: isim, telefon: '', adres: '', favoriler: [], sepet: [], uid: user.uid };
                // Yeni koleksiyona yaz
                db.collection('sistem').doc('kullanicilar').collection('liste').doc(user.uid).set(yeniKullaniciModeli).then(() => {
                    kullanicilar.push(yeniKullaniciModeli);
                    veriKaydet('sahinkaya_kullanicilar', kullanicilar); // Eski sistem uyumluluğu için
                    toastGoster("Kayıt başarılı! Yönlendiriliyorsunuz...", "basari");
                    setTimeout(() => location.href = url('index.html'), 1500);
                }).catch(e => {
                    toastGoster("Kayıt oldu ama veri yazılamadı: " + e.message, "hata");
                });
            });
        })
        .catch((error) => {
            if (error.code === 'auth/email-already-in-use') {
                toastGoster("Bu e-posta zaten kullanımda!", "hata");
            } else if (error.code === 'auth/weak-password') {
                toastGoster("Şifre en az 6 hane olmalı!", "hata");
            } else {
                toastGoster("Kayıt hatası: " + error.message, "hata");
            }
        });
}

function girisYap() {
    const email = getEl('giris-kadi').value.trim();
    const sifre = getEl('giris-sifre').value.trim();
    if (!email || !sifre) return toastGoster("Boş alan bırakmayın!", "hata");

    auth.signInWithEmailAndPassword(email, sifre)
        .then((userCredential) => {
            toastGoster("Giriş başarılı! Yönlendiriliyorsunuz...", "basari");
            setTimeout(() => location.href = url('index.html'), 1500);
        })
        .catch((error) => {
            toastGoster("E-posta veya şifre hatalı!", "hata");
        });
}

function cikisYap() { 
    auth.signOut().then(() => {
        aktifKullanici = null; 
        veriKaydet('sahinkaya_aktif', null); 
        sepet = []; 
        veriKaydet('sahinkaya_sepet', sepet); 
        location.href = url('index.html'); 
    });
}

function profilKaydet() {
    if (!aktifKullanici) return;
    aktifKullanici.isim = getEl('profil-isim').value;
    aktifKullanici.telefon = getEl('profil-tel').value.replace(/\D/g, '');
    aktifKullanici.adres = getEl('profil-adres').value;
    aktifKullanici.email = getEl('profil-email').value;
    veriKaydet('sahinkaya_aktif', aktifKullanici); 
    toastGoster("Profil güncellendi.", "basari");
}

function sifreDegistir() {
    const user = auth.currentUser;
    if (!user) return toastGoster("Lütfen önce giriş yapın", "hata");
    
    const yeni = getEl('yeni-sifre').value, yeniTekrar = getEl('yeni-sifre-tekrar').value;
    if (yeni.length < 6) return toastGoster("Yeni şifre en az 6 hane olmalı!", "hata");
    if (yeni !== yeniTekrar) return toastGoster("Yeni şifreler eşleşmiyor!", "hata");
    
    user.updatePassword(yeni).then(() => {
        toastGoster("Şifre başarıyla değiştirildi.", "basari");
        getEl('eski-sifre').value = ''; getEl('yeni-sifre').value = ''; getEl('yeni-sifre-tekrar').value = '';
    }).catch((error) => {
        if(error.code === 'auth/requires-recent-login') {
            toastGoster("Güvenlik için lütfen çıkış yapıp tekrar giriş yapın.", "hata");
        } else {
            toastGoster("Hata: " + error.message, "hata");
        }
    });
}

/* ---------- Admin Modal ---------- */
function adminTabDegistir(btn, t) {
    document.querySelectorAll('.admin-tab-icerik').forEach(el => el.classList.remove('aktif'));
    getEl(t).classList.add('aktif');
    document.querySelectorAll('.admin-tab-btn').forEach(el => el.classList.remove('aktif-tab'));
    if (btn) btn.classList.add('aktif-tab');
}

function menuAyarModalAc() {
    getEl('ayar-menu-bg').value = navAyarlar.bgRenk; getEl('ayar-menu-text').value = navAyarlar.yaziRenk;
    getEl('ayar-menu-boyut').value = navAyarlar.yaziBoyut; getEl('ayar-menu-link-boyut').value = navAyarlar.linkBoyut;
    getEl('menu-ayar-modal').style.display = 'flex';
}
function menuAyarIptal() { getEl('menu-ayar-modal').style.display = 'none'; }
function menuAyarKaydet() {
    navAyarlar.bgRenk = getEl('ayar-menu-bg').value; navAyarlar.yaziRenk = getEl('ayar-menu-text').value;
    navAyarlar.yaziBoyut = getEl('ayar-menu-boyut').value; navAyarlar.linkBoyut = getEl('ayar-menu-link-boyut').value;
    veriKaydet('sahinkaya_nav_ayarlar', navAyarlar); toastGoster("Menü renk ve boyut güncellendi!", "basari");
    getEl('menu-ayar-modal').style.display = 'none'; arayuzuGuncelle();
}

function yetkiAlAdmin(kadi) { toastGoster("Bu işlem artık Firebase Console üzerinden yapılmalıdır.", "hata"); }
function yetkiVerAdmin(kadi) { toastGoster("Bu işlem artık Firebase Console üzerinden yapılmalıdır.", "hata"); }
function sifreDegistirAdmin(kadi) { toastGoster("Bu işlem artık Firebase Console üzerinden yapılmalıdır.", "hata"); }
function hesapSilAdmin(kadi) { toastGoster("Bu işlem artık Firebase Console üzerinden yapılmalıdır.", "hata"); }
