/* =========================================================================
   layout.js — Ortak sayfa iskeleti (nav, modallar, footer, toast, WhatsApp)
   Premium Yenileme v2 — Bisha ilhami tek satır navbar
   ========================================================================= */
(function () {
    const navHTML = `
<nav class="ana-nav" >
    <div class="nav-header">
        <button class="hamburger-btn" onclick="mobilMenuGoster()" aria-label="Menü">☰</button>
        <div class="sol-grup">
            <a href="${url('index')}" aria-label="Ana sayfa">
                <img src="${url('assets/img/logo.png')}" alt="ŞAHİNKAYA AHŞAP" class="logo-img"
                     onerror="this.style.display='none'">
            </a>
        </div>
        <div class="mobil-sag-ikonlar">
            <a href="${url('hesabim')}" id="mobil-btn-hesabim" class="mobil-ikon-btn" style="display:none;" aria-label="Hesabım">👤</a>
            <a href="${url('sepet')}" id="mobil-btn-sepet" class="mobil-ikon-btn" style="display:none;" aria-label="Sepet">
                🛒 <span class="mobil-sepet-sayac" id="mobil-sepet-sayac">0</span>
            </a>
        </div>
    </div>
    <div class="nav-collapse">
        <div class="orta-menu-kapsayici">
            <div class="satir-1" id="dinamik-menu">
                <a href="${url('kapaklar')}" id="nav-kapaklar">KAPAKLAR</a>
                <a href="${url('projelerimiz')}" id="nav-projeler">PROJELERİMİZ</a>
                <a href="${url('kategori')}" id="nav-urunler" style="display:inline-block;">ÜRÜNLER</a>
                <a href="${url('hakkimizda')}" id="nav-hakkimizda">HAKKIMIZDA</a>
            </div>
        </div>
        <div class="sag-grup">
            <div id="arama-kapsayici" style="position:relative; display:inline-block;">
                <input type="text" id="arama-input" class="arama-kutusu" placeholder="Ürün Ara..."
                       oninput="aramaOnerileriGetir()" onkeyup="if(event.key==='Enter') urunAra()" onfocus="aramaOnerileriGetir()">
                <div id="arama-sonuclari" style="display:none; position:absolute; top:100%; right:0; width:300px; max-height:360px; overflow-y:auto; background:var(--yuzey); border:1px solid var(--kenarlik-belirgin); border-radius:var(--radius); box-shadow:var(--golge-orta); margin-top:8px; z-index:9999; text-align:left; padding:8px 0;"></div>
            </div>
            <a href="${url('admin')}" class="btn-nav btn-admin sadece-admin-btn" id="btn-admin" style="display:none;">Yönetim Paneli</a>
            <a href="${url('siparisler')}" class="btn-nav" id="btn-siparis" style="display:none;">Siparişlerim</a>
            <a href="${url('hesabim')}" class="btn-nav" id="btn-hesabim" style="display:none;">Hesabım</a>
            <a href="${url('giris')}" class="btn-nav" id="btn-giris" style="display:inline-block;">Giriş Yap</a>
            <a href="${url('sepet')}" class="btn-nav" id="btn-sepet" style="display:none;">Sepet (<span id="sepet-sayac">0</span>)</a>
            <a href="${url('iletisim')}" class="btn-contact-now" id="btn-iletisim-nav">
                <span class="btn-dot"></span>
                İletişim
                <span class="btn-arrow-circle">↗</span>
            </a>
        </div>
    </div>
</nav>`;

    const altKisim = `
<a href="https://wa.me/905336639714" class="wp-btn" id="wp-btn" target="_blank" rel="noopener" style="display:none;" aria-label="WhatsApp ile İletişim">💬</a>

<div id="ozel-modal" class="ozel-modal-arkaplan">
    <div class="ozel-modal-kutu">
        <h3>Lütfen Onaylayın</h3>
        <p id="ozel-modal-mesaj">İşlemi gerçekleştirmek istediğinize emin misiniz?</p>
        <div class="modal-btn-grup">
            <button class="modal-btn-iptal" onclick="ozelOnayKapat()">İptal Et</button>
            <button class="modal-btn-onay" onclick="ozelOnayKabul()">Evet, Onaylıyorum</button>
        </div>
    </div>
</div>

<div id="admin-sifre-modal" class="ozel-modal-arkaplan">
    <div class="ozel-modal-kutu">
        <h3>Kullanici Şifresini Değiştir</h3>
        <input type="password" id="admin-yeni-sifre" class="modal-input" placeholder="Yeni Şifre">
        <input type="password" id="admin-yeni-sifre-tekrar" class="modal-input" placeholder="Yeni Şifre (Tekrar)">
        <div class="modal-btn-grup">
            <button class="modal-btn-iptal" onclick="adminSifreIptal()">İptal Et</button>
            <button class="modal-btn-onay olumlu" onclick="adminSifreKaydet()">Kaydet</button>
        </div>
    </div>
</div>

<div id="menu-ayar-modal" class="ozel-modal-arkaplan">
    <div class="ozel-modal-kutu">
        <h3>Menü Görünüm Ayarları</h3>
        <div class="modal-alan"><label>Arka Plan Rengi</label><input type="color" id="ayar-menu-bg" class="modal-renk"></div>
        <div class="modal-alan"><label>Yazı Rengi</label><input type="color" id="ayar-menu-text" class="modal-renk"></div>
        <div class="modal-alan"><label>Üst Menü Yazı Boyutu</label><input type="number" id="ayar-menu-boyut" class="modal-input" step="0.05"></div>
        <div class="modal-alan"><label>Alt Menü Yazı Boyutu</label><input type="number" id="ayar-menu-link-boyut" class="modal-input" step="0.1"></div>
        <div class="modal-btn-grup">
            <button class="modal-btn-iptal" onclick="menuAyarIptal()">İptal Et</button>
            <button class="modal-btn-onay olumlu" onclick="menuAyarKaydet()">Ayarları Kaydet</button>
        </div>
    </div>
</div>

<div id="toast"></div>

<div id="lightbox-modal" class="lightbox-arkaplan" onclick="lightboxKapat(event)">
    <button class="lightbox-kapat-btn" onclick="lightboxKapat(event)">✕</button>
    <img id="lightbox-resim" src="" alt="Büyük Görsel">
</div>

<footer id="gizli-footer">
    <div class="footer-marka">Şahinkaya Ahşap</div>
    <p>© 2026 Şahinkaya Ahşap Mobilya ve Dekorasyon — Tüm hakları saklıdır.</p>
</footer>`;

    document.body.insertAdjacentHTML('afterbegin', navHTML);
    document.body.insertAdjacentHTML('beforeend', altKisim);
})();






