/* =========================================================================
   effects.js — "UKBE" yönetici sürprizi (TNT fizik motoru)
   Yalnızca yönetici + ayar açıkken çalışır (app.js arayuzuGuncelle tetikler).
   ========================================================================= */
let ukbeCalisiyor = false, ukbeFrame, tntEl, oklar = [], clonedTexts = [];
let tntData = { x: 0, y: 0, vx: 0, vy: 0, isDragging: false, state: 'idle' };
let dragStartX = 0, dragStartY = 0, lastX = 0, lastY = 0;
const textGravity = 0.6, textFriction = 0.8, textBounce = -0.6, tntBounce = -0.8, tntFriction = 0.98;

function syncTntPosition() {
    const kayitli = veriGetir('sahinkaya_tnt_pos', null);
    if (kayitli) { tntData.x = kayitli.x; tntData.y = kayitli.y; }
    else { tntData.x = window.innerWidth / 2 - 32; tntData.y = 50; }
    if (tntData.x > window.innerWidth - 64) tntData.x = window.innerWidth - 64;
    if (tntData.y > window.innerHeight - 64) tntData.y = window.innerHeight - 64;
    if (tntData.x < 0) tntData.x = 0;
    if (tntData.y < 0) tntData.y = 0;
}

setInterval(() => {
    if (ukbeCalisiyor && tntData.state !== 'exploded' && !tntData.isDragging) {
        veriKaydet('sahinkaya_tnt_pos', { x: tntData.x, y: tntData.y });
    }
}, 1000);

document.addEventListener('mousemove', (e) => {
    if (tntData.isDragging && (tntData.state === 'idle' || tntData.state === 'flashing')) {
        tntData.x = e.clientX - dragStartX; tntData.y = e.clientY - dragStartY;
        tntData.vx = (e.clientX - lastX) * 1.5; tntData.vy = (e.clientY - lastY) * 1.5;
        lastX = e.clientX; lastY = e.clientY;
        if (tntEl) { tntEl.style.left = tntData.x + 'px'; tntEl.style.top = tntData.y + 'px'; }
    }
});
document.addEventListener('mouseup', () => {
    if (tntData.isDragging) {
        tntData.isDragging = false;
        if (tntEl) tntEl.style.cursor = 'grab';
        veriKaydet('sahinkaya_tnt_pos', { x: tntData.x, y: tntData.y });
    }
});

function toggleUkbe() { ayarlar.ukbeAktif = !ayarlar.ukbeAktif; veriKaydet('sahinkaya_ayarlar', ayarlar); location.reload(); }

function startUkbe() {
    if (ukbeCalisiyor) return;
    ukbeCalisiyor = true; syncTntPosition();
    if (!getEl('ukbe-screen-flash')) { const f = document.createElement('div'); f.id = 'ukbe-screen-flash'; document.body.appendChild(f); }
    if (!getEl('ukbe-tnt')) {
        tntEl = document.createElement('img'); tntEl.id = 'ukbe-tnt'; tntEl.src = url('assets/img/tnt.png');
        tntEl.style.cssText = 'position:fixed; width:64px; height:64px; z-index:9999; cursor:grab; user-select:none;';
        tntEl.draggable = false;
        document.body.appendChild(tntEl);
        tntEl.addEventListener('mousedown', (e) => {
            e.preventDefault(); if (tntData.state === 'exploded') return;
            tntData.isDragging = true; tntData.vx = 0; tntData.vy = 0;
            dragStartX = e.clientX - tntData.x; dragStartY = e.clientY - tntData.y;
            lastX = e.clientX; lastY = e.clientY; tntEl.style.cursor = 'grabbing';
        });
    }
    respawnTnt(true); ukbeLoop();
}

function stopUkbe() {
    ukbeCalisiyor = false; cancelAnimationFrame(ukbeFrame);
    if (tntEl) { tntEl.remove(); tntEl = null; }
    oklar.forEach(o => o.el.remove()); oklar = [];
}

function respawnTnt(isInit = false) {
    tntData.state = 'idle';
    if (!isInit) { tntData.x = innerWidth / 2 - 32; tntData.y = 50; veriKaydet('sahinkaya_tnt_pos', { x: tntData.x, y: tntData.y }); }
    tntData.vx = 0; tntData.vy = 0;
    if (tntEl) { tntEl.style.display = 'block'; tntEl.style.left = tntData.x + 'px'; tntEl.style.top = tntData.y + 'px'; }
}

function spawnArrow() {
    const side = Math.floor(Math.random() * 4); let x, y, angle;
    if (side === 0) { x = Math.random() * innerWidth; y = -50; angle = Math.PI / 2 + (Math.random() - 0.5); }
    else if (side === 1) { x = innerWidth + 50; y = Math.random() * innerHeight; angle = Math.PI + (Math.random() - 0.5); }
    else if (side === 2) { x = Math.random() * innerWidth; y = innerHeight + 50; angle = -Math.PI / 2 + (Math.random() - 0.5); }
    else { x = -50; y = Math.random() * innerHeight; angle = 0 + (Math.random() - 0.5); }
    const aEl = document.createElement('img'); aEl.src = url('assets/img/ok.png'); aEl.className = 'ukbe-arrow';
    aEl.style.transform = `rotate(${(angle * 180 / Math.PI) + 45}deg)`;
    document.body.appendChild(aEl);
    oklar.push({ el: aEl, x: x, y: y, vx: Math.cos(angle) * 15, vy: Math.sin(angle) * 15 });
}

function patlamaBaslat() { tntData.state = 'flashing'; tntEl.classList.add('ukbe-flash-anim'); setTimeout(() => gercekPatlama(), 2500); }

function gercekPatlama() {
    tntData.state = 'exploded'; tntEl.style.display = 'none'; tntEl.classList.remove('ukbe-flash-anim');
    const f = getEl('ukbe-screen-flash'); if (f) { f.style.opacity = '1'; setTimeout(() => f.style.opacity = '0', 200); }
    document.querySelectorAll('h1, h2, h3, a, button, p, span, li, td, th, img').forEach(el => {
        if (el.closest('.admin-tab-menu') || el.closest('#proje-ekle-form') || el.closest('#kapak-ekle-form') || el.closest('.ozel-modal-kutu') || el.id === 'ukbe-tnt' || el.classList.contains('ukbe-arrow') || el.id === 'ukbe-screen-flash') return;
        const rect = el.getBoundingClientRect(); if (rect.width === 0 || rect.height === 0) return;
        const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
        const dx = cx - (tntData.x + 32), dy = cy - (tntData.y + 32), dist = Math.hypot(dx, dy) || 1;
        if (dist < 400) {
            const clone = el.cloneNode(true);
            clone.style.cssText = `position:fixed; left:${rect.left}px; top:${rect.top}px; margin:0; z-index:9997; pointer-events:none; width:${rect.width}px; height:${rect.height}px; transition:none;`;
            document.body.appendChild(clone);
            el.style.visibility = 'hidden';
            let force = (400 - dist) / 10; if (force > 30) force = 30;
            clonedTexts.push({ el: clone, origEl: el, x: rect.left, y: rect.top, vx: (dx / dist) * force + (Math.random() * 4 - 2), vy: (dy / dist) * force - Math.random() * 10 - 5, w: rect.width, h: rect.height, origX: rect.left, origY: rect.top });
        }
    });
    setTimeout(() => sakinlesVeSifirla(), 3500);
    setTimeout(() => respawnTnt(), 6000);
}

function sakinlesVeSifirla() {
    const clones = [...clonedTexts]; clonedTexts = [];
    clones.forEach(tc => {
        tc.el.style.transition = 'all 1s ease-in-out'; tc.el.style.transform = 'none';
        tc.el.style.left = tc.origX + 'px'; tc.el.style.top = tc.origY + 'px';
        setTimeout(() => { if (tc.el.parentNode) tc.el.parentNode.removeChild(tc.el); tc.origEl.style.visibility = 'visible'; }, 1000);
    });
}

function ukbeLoop() {
    if (!ukbeCalisiyor) return;
    if ((tntData.state === 'idle' || tntData.state === 'flashing') && !tntData.isDragging) {
        tntData.x += tntData.vx; tntData.y += tntData.vy; tntData.vx *= tntFriction; tntData.vy *= tntFriction;
        if (tntData.y + 64 > innerHeight) { tntData.y = innerHeight - 64; tntData.vy *= tntBounce; }
        if (tntData.x + 64 > innerWidth) { tntData.x = innerWidth - 64; tntData.vx *= tntBounce; }
        if (tntData.x < 0) { tntData.x = 0; tntData.vx *= tntBounce; }
        if (tntData.y < 0) { tntData.y = 0; tntData.vy *= tntBounce; }
        if (tntEl) { tntEl.style.left = tntData.x + 'px'; tntEl.style.top = tntData.y + 'px'; }
    }
    if (tntData.state === 'idle' && Math.random() < 0.015) spawnArrow();
    for (let i = oklar.length - 1; i >= 0; i--) {
        const ok = oklar[i]; ok.x += ok.vx; ok.y += ok.vy; ok.el.style.left = ok.x + 'px'; ok.el.style.top = ok.y + 'px';
        if (ok.x < -100 || ok.x > innerWidth + 100 || ok.y < -100 || ok.y > innerHeight + 100) { ok.el.remove(); oklar.splice(i, 1); continue; }
        if (tntData.state === 'idle' && Math.hypot(tntData.x + 32 - ok.x, tntData.y + 32 - ok.y) < 40) { ok.el.remove(); oklar.splice(i, 1); patlamaBaslat(); }
    }
    clonedTexts.forEach(tc => {
        tc.vy += textGravity; tc.x += tc.vx; tc.y += tc.vy;
        if (tc.y + tc.h > innerHeight) { tc.y = innerHeight - tc.h; tc.vy *= textBounce; tc.vx *= textFriction; }
        if (tc.x + tc.w > innerWidth) { tc.x = innerWidth - tc.w; tc.vx *= textBounce; }
        if (tc.x < 0) { tc.x = 0; tc.vx *= textBounce; }
        tc.el.style.left = tc.x + 'px'; tc.el.style.top = tc.y + 'px';
    });
    ukbeFrame = requestAnimationFrame(ukbeLoop);
}
