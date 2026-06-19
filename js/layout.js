/* =========================================================================
   layout.js — Ortak sayfa iskeleti (nav, modallar, footer, toast, WhatsApp)
   Her sayfada tekrarlanan ~150 satırlık HTML tek kaynaktan enjekte edilir.
   data.js'ten SONRA, app.js'ten ÖNCE yüklenir.
   ========================================================================= */
(function () {
    const duzen1Menu = `
        <div class="satir-1" id="dinamik-menu">
            <a href="${url('pages/iletisim.html')}" id="nav-iletisim">İLETİŞİM</a>
            <a href="${url('index.html')}" id="nav-anasayfa" style="opacity:1; color:#fff; font-size:calc(var(--menu-boyut) * 1.15); font-weight:600;">ANA SAYFA</a>
            <a href="${url('pages/hakkimizda.html')}" id="nav-hakkimizda">HAKKIMIZDA</a>
        </div>
        <div class="satir-2">
            <a href="${url('pages/kapaklar.html')}" id="nav-kapaklar" class="satir-2-link">KAPAKLAR</a>
            <a href="${url('pages/projelerimiz.html')}" id="nav-projeler" class="satir-2-link">PROJELER</a>
            <a href="${url('pages/kategori.html')}" id="nav-urunler" class="satir-2-link">ÜRÜNLER</a>
        </div>
    `;

    const duzen2Menu = `
        <div class="satir-1" id="dinamik-menu">
            <a href="${url('pages/iletisim.html')}" id="nav-iletisim">İLETİŞİM</a>
            <a href="${url('index.html')}" id="nav-anasayfa" style="opacity:1; color:#fff; font-size:calc(var(--menu-boyut) * 1.15); font-weight:600;">ANA SAYFA</a>
            <a href="${url('pages/kapaklar.html')}" id="nav-kapaklar">KAPAKLAR</a>
            <a href="${url('pages/hakkimizda.html')}" id="nav-hakkimizda">HAKKIMIZDA</a>
            <a href="${url('pages/siparis-takip.html')}" id="nav-takip">SİPARİŞ TAKİP</a>
        </div>
        <div class="satir-2">
            <a href="${url('pages/projelerimiz.html')}" id="nav-projeler" class="satir-2-link">PROJELER</a>
            <a href="${url('index.html')}" id="magaza-ikon" class="magaza-link">MAĞAZA</a>
            <a href="${url('pages/kategori.html')}" id="nav-urunler" class="satir-2-link">ÜRÜNLER</a>
        </div>
    `;

    const seciliMenuHtml = (typeof ayarlar !== 'undefined' && ayarlar.siteDuzeni == 2) ? duzen2Menu : duzen1Menu;

    const navHTML = `
<nav class="ana-nav" style="opacity: 0; transition: opacity 0.2s ease;">
    <div class="nav-header">
        <button class="hamburger-btn" onclick="mobilMenuGoster()" aria-label="Menü">☰</button>
        <div class="sol-grup">
            <a href="${url('index.html')}" aria-label="Ana sayfa">
                <img src="${url('assets/img/logo.png')}" alt="SAHINKAYA" class="logo-img"
                     onerror="this.src='https://via.placeholder.com/250x75?text=SAHINKAYA+AHSAP'">
            </a>
        </div>
        <div class="mobil-sag-ikonlar">
            <a href="${url('pages/hesabim.html')}" id="mobil-btn-hesabim" class="mobil-ikon-btn" style="display:none;" aria-label="Hesabım">👤</a>
            <a href="${url('pages/sepet.html')}" id="mobil-btn-sepet" class="mobil-ikon-btn" style="display:none;" aria-label="Sepet">
                🛒 <span class="mobil-sepet-sayac" id="mobil-sepet-sayac">0</span>
            </a>
        </div>
    </div>
    <div class="nav-collapse">
        <div class="orta-menu-kapsayici">
            ${seciliMenuHtml}
        </div>
        <div class="sag-grup">
            <div id="arama-kapsayici" style="position:relative; display:none;">
                <input type="text" id="arama-input" class="arama-kutusu" placeholder="Ürün Ara..."
                       oninput="aramaOnerileriGetir()" onkeyup="if(event.key==='Enter') urunAra()" onfocus="aramaOnerileriGetir()">
                <div id="arama-sonuclari" style="display:none; position:absolute; top:100%; right:0; width:280px; max-height:350px; overflow-y:auto; background:var(--kutu-bg); border:1px solid var(--kenarlik); border-radius:var(--radius-sm); box-shadow:var(--golge-orta); margin-top:8px; z-index:9999; text-align:left; padding:8px 0;"></div>
            </div>
            <button id="btn-menu-ayar" class="btn-nav btn-admin sadece-admin-btn" style="display:none;" onclick="menuAyarModalAc()">⚙ Menü</button>
            <a href="${url('pages/admin.html')}" class="btn-nav btn-admin sadece-admin-btn" id="btn-admin" style="display:none;">Yönetim Paneli</a>
            <a href="${url('pages/siparisler.html')}" class="btn-nav" id="btn-siparis" style="display:none;">Siparişlerim</a>
            <a href="${url('pages/hesabim.html')}" class="btn-nav" id="btn-hesabim" style="display:none;">Hesabım</a>
            <a href="${url('pages/giris.html')}" class="btn-nav" id="btn-giris">Giriş Yap</a>
            <a href="${url('pages/sepet.html')}" class="btn-nav" id="btn-sepet">Sepet (<span id="sepet-sayac">0</span>)</a>
            <button class="dark-mode-btn" onclick="temaDegistir()" id="tema-ikon" title="Tema değiştir">🌙</button>
        </div>
    </div>
</nav>`;

    const altKisim = `
<a href="https://wa.me/905555555555" class="wp-btn" id="wp-btn" target="_blank" rel="noopener" style="display:none;" aria-label="WhatsApp">💬</a>

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
        <h3>Kullanıcı Şifresini Değiştir</h3>
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
    <p>&copy; 2026 Şahinkaya Ahşap Mobilya ve Dekorasyon — Tüm hakları saklıdır.</p>
</footer>`;

    document.body.insertAdjacentHTML('afterbegin', navHTML);
    document.body.insertAdjacentHTML('beforeend', altKisim);
})();
