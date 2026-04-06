/**
 * global.js - PeshoX Intelligence Master Controller
 * Central configuration, localStorage vault, key generators, modal/loader system, audio handler
 */

(function() {
    // ========== 1. CENTRAL CONFIGURATION ==========
    window.PX_CONFIG = {
        // Branding & Contacts
        owner1: '+923128942224',      // Dark Echo
        owner2: '+923197521621',      // Ibn e Sina
        whatsappChannel: 'https://whatsapp.com/channel/0029Vb781b08fewrKeUT7m1a',
        brandName: 'PESHOX INTELLIGENCE',
        footerCredit: '@darkecho',
        easypaisaNumber: '03469393997',
        
        // Plans & Pricing (Basic: 7000 PKR for 30 minutes)
        planPrices: { basic: 7000, standard: 15000, premium: 25000 },
        keyLengths: { basic: 33, standard: 44, premium: 55 },
        planHours: { basic: 0.5, standard: 24, premium: 72 },   // 0.5 = 30 minutes
        
        // Wallet & Bonus
        walletBonus: 5000,
        
        // Simulation Logic
        trxSuccessAttempt: 3,
        mainLoadingSec: 20,
        stepTransitionMs: 2000,
        predictionCooldownSec: 10,      // 10 seconds cooldown
        inviteCooldownHours: 24,
        inviteTargetShares: 5,
        
        // Mobile Validation
        pakistanCode: '+92',
        pakistanLength: 13,
        
        // Radar Multipliers
        radarMultipliers: {
            low:  { min: 1.00, max: 10.00, weight: 0.80 },
            mid:  { min: 10.01, max: 30.00, weight: 0.15 },
            high: { min: 30.01, max: 60.00, weight: 0.05 }
        },
        
        // Audio file path
        audioPath: '/assets/sounds/Aviator - Music(MP3_160K).mp3'
    };

    // ========== 2. LOCALSTORAGE VAULT ==========
    const STORAGE = {
        USER_KEY: '_px_user',
        USERS_DB: '_px_users',
        WALLET: '_px_wallet',
        SUBS: '_px_sub',
        AUDIO_MUTED: '_px_audio_muted'
    };

    function getUsers() {
        const data = localStorage.getItem(STORAGE.USERS_DB);
        return data ? JSON.parse(data) : {};
    }

    function saveUser(userKey, profile) {
        const users = getUsers();
        users[userKey] = { ...(users[userKey] || {}), ...profile, lastUpdated: Date.now() };
        localStorage.setItem(STORAGE.USERS_DB, JSON.stringify(users));
    }

    function getUser(userKey) {
        return getUsers()[userKey] || null;
    }

    function getCurrentUserKey() {
        return localStorage.getItem(STORAGE.USER_KEY);
    }

    function setCurrentUser(userKey) {
        localStorage.setItem(STORAGE.USER_KEY, userKey);
    }

    // Nuclear logout: clear ALL localStorage and redirect
    function logout() {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-container">
                <h3><i class="fas fa-exclamation-triangle"></i> Confirm Logout</h3>
                <div class="bilingual">
                    <span class="english-text">Are you sure you want to logout? All your local data will be erased.</span>
                    <span class="urdu-text">کیا آپ واقعی لاگ آؤٹ کرنا چاہتے ہیں؟ آپ کا تمام مقامی ڈیٹا مٹ جائے گا۔</span>
                </div>
                <div class="modal-buttons">
                    <button id="logoutCancelBtn" class="btn-secondary">Cancel</button>
                    <button id="logoutConfirmBtn" class="btn-danger">Logout & Erase Data</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        setTimeout(() => overlay.classList.add('active'), 10);
        const cancelBtn = overlay.querySelector('#logoutCancelBtn');
        const confirmBtn = overlay.querySelector('#logoutConfirmBtn');
        cancelBtn.onclick = () => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
        };
        confirmBtn.onclick = () => {
            localStorage.clear();
            window.location.href = '/';
        };
    }

    function checkAuth(redirectTo = '/') {
        const key = getCurrentUserKey();
        if (!key || !getUser(key)) {
            window.location.href = redirectTo;
            return false;
        }
        return true;
    }

    // Wallet functions
    function getWalletBalance() {
        return parseInt(localStorage.getItem(STORAGE.WALLET) || '0');
    }
    function setWalletBalance(amount) {
        localStorage.setItem(STORAGE.WALLET, amount);
    }
    function addToWallet(amount) {
        const current = getWalletBalance();
        setWalletBalance(current + amount);
    }

    // Subscription functions (supports 0.5 hour = 30 minutes)
    function getSubscription() {
        const userKey = getCurrentUserKey();
        if (!userKey) return null;
        const subs = JSON.parse(localStorage.getItem(STORAGE.SUBS) || '{}');
        return subs[userKey] || null;
    }

    function saveSubscription(expiry, plan) {
        const userKey = getCurrentUserKey();
        if (!userKey) return;
        const subs = JSON.parse(localStorage.getItem(STORAGE.SUBS) || '{}');
        subs[userKey] = { expiry, plan };
        localStorage.setItem(STORAGE.SUBS, JSON.stringify(subs));
    }

    function isSubscriptionActive() {
        const sub = getSubscription();
        return sub && sub.expiry && Date.now() < sub.expiry;
    }

    // ========== 3. KEY GENERATORS (flexible but correct length) ==========
    function generateKey(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?/`~ ';
        let key = '';
        for (let i = 0; i < length; i++) {
            key += chars[Math.floor(Math.random() * chars.length)];
        }
        return key;
    }
    const generateKey99 = () => generateKey(99);
    const generateKey33 = () => generateKey(33);
    const generateKey44 = () => generateKey(44);
    const generateKey55 = () => generateKey(55);

    // Validation: only checks length – flexible on characters to prevent false rejects
    function isValidKey(key, expectedLen) {
        if (!key || key.length !== expectedLen) return false;
        // At least one letter, one number, one symbol, one space is NOT required for activation
        // to avoid "Access Denied" bugs. Only length matters for plan assignment.
        return true;
    }

    // ========== 4. MODAL & LOADER SYSTEM ==========
    function showLoader(durationMs, onComplete) {
        const existing = document.querySelector('.global-loader-overlay');
        if (existing) existing.remove();
        const overlay = document.createElement('div');
        overlay.className = 'global-loader-overlay';
        overlay.innerHTML = `
            <div class="loader-container">
                <div class="loader-spinner"></div>
                <div class="bilingual">
                    <span class="english-text">Processing...</span>
                    <span class="urdu-text">عمل جاری ہے...</span>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        setTimeout(() => overlay.classList.add('active'), 10);
        setTimeout(() => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
            if (onComplete) onComplete();
        }, durationMs);
    }

    function showModal(englishTitle, urduTitle, englishBody, urduBody, onConfirm = null, showCancel = true) {
        const existing = document.querySelector('.modal-overlay');
        if (existing) existing.remove();
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-container">
                <h3><i class="fas fa-info-circle"></i> ${englishTitle}</h3>
                <h3 style="font-family: 'Noto Nastaliq Urdu';">${urduTitle}</h3>
                <div class="bilingual">
                    <p class="english-text">${englishBody}</p>
                    <p class="urdu-text">${urduBody}</p>
                </div>
                <div class="modal-buttons">
                    ${showCancel ? '<button id="modalCancelBtn" class="btn-secondary">Cancel</button>' : ''}
                    <button id="modalConfirmBtn" class="btn-primary">OK</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        setTimeout(() => overlay.classList.add('active'), 10);
        const confirmBtn = overlay.querySelector('#modalConfirmBtn');
        const cancelBtn = overlay.querySelector('#modalCancelBtn');
        confirmBtn.onclick = () => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
            if (onConfirm) onConfirm();
        };
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                overlay.classList.remove('active');
                setTimeout(() => overlay.remove(), 300);
            };
        }
    }

    // ========== 5. AUDIO SYSTEM ==========
    let audioElement = null;
    let isMuted = localStorage.getItem(STORAGE.AUDIO_MUTED) === 'true';

    function initAudio() {
        if (audioElement) return;
        audioElement = document.createElement('audio');
        audioElement.id = 'globalAudio';
        audioElement.loop = true;
        audioElement.preload = 'auto';
        audioElement.src = PX_CONFIG.audioPath;
        document.body.appendChild(audioElement);
        if (!isMuted) {
            // Attempt to play; will be triggered by user gesture
            audioElement.play().catch(e => console.log("Audio not started yet, waiting for user interaction"));
        }
    }

    function playAudio() {
        if (!audioElement) initAudio();
        if (audioElement && !isMuted) {
            audioElement.play().catch(e => console.log("Play failed:", e));
        }
    }

    function pauseAudio() {
        if (audioElement) {
            audioElement.pause();
        }
    }

    function toggleMute() {
        isMuted = !isMuted;
        localStorage.setItem(STORAGE.AUDIO_MUTED, isMuted);
        if (isMuted) {
            if (audioElement) audioElement.pause();
        } else {
            if (audioElement) audioElement.play().catch(e => console.log("Play failed:", e));
        }
        return !isMuted;
    }

    // ========== 6. AUTO-INJECT BRANDING, FOOTER, WHATSAPP, AUDIO CONTROL ==========
    function loadFontAwesome() {
        if (!document.querySelector('link[href*="fontawesome"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
            document.head.appendChild(link);
        }
    }

    function injectBranding() {
        if (document.querySelector('.peshox-brand')) return;
        const brand = document.createElement('div');
        brand.className = 'peshox-brand';
        brand.innerHTML = `<i class="fas fa-brain"></i> ${PX_CONFIG.brandName}`;
        document.body.appendChild(brand);
    }

    function injectFooter() {
        if (document.querySelector('.global-footer')) return;
        const footer = document.createElement('footer');
        footer.className = 'global-footer';
        footer.innerHTML = `
            <div class="bilingual">
                <span class="english-text">⚡ System Status: Secure. Access granted to verified users only. Powered by PeshoX Neural Engines. Managed by ${PX_CONFIG.footerCredit}.</span>
                <span class="urdu-text">⚡ سسٹم کی صورتحال: محفوظ۔ صرف تصدیق شدہ صارفین کو رسائی دی گئی ہے۔ PeshoX نیورل انجن کے ذریعے تقویت یافتہ۔ ${PX_CONFIG.footerCredit} کے زیر انتظام۔</span>
            </div>
        `;
        document.body.appendChild(footer);
    }

    function injectWhatsApp() {
        if (document.querySelector('.whatsapp-float')) return;
        const wa = document.createElement('div');
        wa.className = 'whatsapp-float';
        wa.innerHTML = '<i class="fab fa-whatsapp"></i>';
        wa.onclick = () => window.open(PX_CONFIG.whatsappChannel, '_blank');
        document.body.appendChild(wa);
    }

    // Audio control button (floating)
    function injectAudioControl() {
        if (document.querySelector('.audio-control')) return;
        const btn = document.createElement('div');
        btn.className = 'audio-control';
        btn.innerHTML = isMuted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
        btn.style.cssText = `
            position: fixed;
            bottom: 24px;
            left: 24px;
            background: rgba(0,0,0,0.7);
            backdrop-filter: blur(8px);
            width: 44px;
            height: 44px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 1000;
            border: 1px solid var(--border-red);
            color: var(--neon-red);
            font-size: 1.2rem;
        `;
        btn.onclick = () => {
            const nowMuted = toggleMute();
            btn.innerHTML = nowMuted ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
            if (!nowMuted) playAudio();
        };
        document.body.appendChild(btn);
    }

    // Initialize all global UI elements
    document.addEventListener('DOMContentLoaded', () => {
        loadFontAwesome();
        injectBranding();
        injectFooter();
        injectWhatsApp();
        injectAudioControl();
        initAudio();
    });

    // ========== 7. EXPOSE PUBLIC API ==========
    window.PX = {
        CONFIG: window.PX_CONFIG,
        getUsers, saveUser, getUser,
        getCurrentUserKey, setCurrentUser, logout, checkAuth,
        getWalletBalance, setWalletBalance, addToWallet,
        getSubscription, saveSubscription, isSubscriptionActive,
        generateKey99, generateKey33, generateKey44, generateKey55, isValidKey,
        showLoader, showModal,
        playAudio, pauseAudio, toggleMute,
        STORAGE_KEYS: STORAGE
    };
})();
          
