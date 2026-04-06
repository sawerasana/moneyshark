/**
 * profile.js – User Profile Logic
 * - Loads user data from localStorage and displays it
 * - Live subscription countdown (updates every second)
 * - Reveal PIN functionality (masked initially)
 * - Copy 99-char access key to clipboard
 * - Nuclear logout: wipe all localStorage and redirect to index
 * - Support: open WhatsApp chat with random owner from PX_CONFIG
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Authentication guard ---
    const userKey = PX.getCurrentUserKey();
    if (!userKey) {
        window.location.href = '/';
        return;
    }
    const userData = PX.getUser(userKey) || {};

    // --- DOM elements ---
    const fullNameSpan = document.getElementById('fullNameDisplay');
    const mobileSpan = document.getElementById('mobileDisplay');
    const platformSpan = document.getElementById('platformDisplay');
    const pinSpan = document.getElementById('pinDisplay');
    const revealPinBtn = document.getElementById('revealPinBtn');
    const accessKeySpan = document.getElementById('accessKeyDisplay');
    const copyKeyBtn = document.getElementById('copyKeyBtn');
    const copyAccessKeyBtn = document.getElementById('copyAccessKeyBtn');
    const planTypeSpan = document.getElementById('planTypeDisplay');
    const timeRemainingSpan = document.getElementById('timeRemainingDisplay');
    const timerCanvas = document.getElementById('timerCanvas');
    const ctx = timerCanvas.getContext('2d');
    const logoutBtn = document.getElementById('logoutBtn');
    const supportBtn = document.getElementById('supportBtn');
    const logoutModal = document.getElementById('logoutModal');
    const logoutCancel = document.getElementById('logoutCancelBtn');
    const logoutConfirm = document.getElementById('logoutConfirmBtn');
    const supportModal = document.getElementById('supportModal');
    const contactOwner1 = document.getElementById('contactOwner1Btn');
    const contactOwner2 = document.getElementById('contactOwner2Btn');
    const supportCancel = document.getElementById('supportCancelBtn');

    // --- Populate personal information ---
    const fullName = userData.fullName || 'Anonymous';
    const mobileNumber = userData.mobileNumber || '+923001234567';
    const aviatorPlatform = userData.aviatorPlatform || 'Not selected';
    const storedPin = userData.intelligencePin || '0000';
    fullNameSpan.textContent = fullName;
    mobileSpan.textContent = mobileNumber;
    platformSpan.textContent = aviatorPlatform;
    pinSpan.textContent = '••••';
    let pinRevealed = false;

    // --- Display access key (masked) ---
    const fullKey = userKey;
    const maskedKey = fullKey.slice(0, 10) + '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••';
    accessKeySpan.textContent = maskedKey;

    // --- Subscription display and live timer ---
    let timerInterval = null;

    function drawTimerRing(percent) {
        if (!ctx) return;
        const radius = 25;
        const center = 30;
        const circumference = 2 * Math.PI * radius;
        ctx.clearRect(0, 0, 60, 60);
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.beginPath();
        const endAngle = -Math.PI / 2 + (2 * Math.PI * percent);
        ctx.arc(center, center, radius, -Math.PI / 2, endAngle);
        ctx.strokeStyle = '#ff0000';
        ctx.stroke();
    }

    function updateSubscriptionDisplay() {
        const sub = PX.getSubscription();
        let isActive = false;
        let remainingMs = 0;
        let plan = 'Free';
        if (sub && sub.expiry && sub.expiry > Date.now()) {
            isActive = true;
            remainingMs = sub.expiry - Date.now();
            plan = sub.plan.toUpperCase();
        }
        planTypeSpan.textContent = plan;
        if (!isActive) {
            timeRemainingSpan.textContent = 'Inactive / غیر فعال';
            timeRemainingSpan.style.color = '#ff8888';
            drawTimerRing(0);
            return;
        }
        const hours = Math.floor(remainingMs / (1000 * 60 * 60));
        const minutes = Math.floor((remainingMs % (3600000)) / 60000);
        const seconds = Math.floor((remainingMs % 60000) / 1000);
        timeRemainingSpan.textContent = `${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
        timeRemainingSpan.style.color = '#00ff88';
        // Draw ring progress (full ring = 72h for premium, 24h for standard, 0.5h for basic)
        let maxDuration = 72 * 60 * 60 * 1000;
        if (sub.plan === 'standard') maxDuration = 24 * 60 * 60 * 1000;
        else if (sub.plan === 'basic') maxDuration = 0.5 * 60 * 60 * 1000;
        const percent = Math.max(0, Math.min(1, remainingMs / maxDuration));
        drawTimerRing(percent);
    }

    function startTimer() {
        if (timerInterval) clearInterval(timerInterval);
        updateSubscriptionDisplay();
        timerInterval = setInterval(updateSubscriptionDisplay, 1000);
    }
    startTimer();

    // --- Reveal PIN functionality ---
    let pinVisible = false;
    revealPinBtn.addEventListener('click', () => {
        if (!pinVisible) {
            pinSpan.textContent = storedPin;
            pinVisible = true;
            revealPinBtn.innerHTML = '<i class="fas fa-eye-slash"></i> Hide';
        } else {
            pinSpan.textContent = '••••';
            pinVisible = false;
            revealPinBtn.innerHTML = '<i class="fas fa-eye"></i> Reveal';
        }
    });

    // --- Copy full access key to clipboard ---
    async function copyFullKey() {
        try {
            await navigator.clipboard.writeText(fullKey);
            PX.showModal(
                'Copied',
                'کاپی ہوگیا',
                'Your 99-character access key has been copied to clipboard.',
                'آپ کی 99 حروف والی رسائی کلید کلپ بورڈ پر کاپی ہوگئی۔',
                null,
                false
            );
        } catch (err) {
            PX.showModal(
                'Copy Failed',
                'کاپی ناکام',
                'Please copy manually.',
                'براہ کرم دستی طور پر کاپی کریں۔',
                null,
                false
            );
        }
    }
    copyKeyBtn.addEventListener('click', copyFullKey);
    copyAccessKeyBtn.addEventListener('click', copyFullKey);

    // --- Nuclear logout: wipe all localStorage and redirect ---
    function wipeAndLogout() {
        localStorage.clear();
        window.location.href = '/';
    }
    logoutBtn.addEventListener('click', () => {
        logoutModal.style.display = 'flex';
    });
    logoutCancel.addEventListener('click', () => {
        logoutModal.style.display = 'none';
    });
    logoutConfirm.addEventListener('click', () => {
        logoutModal.style.display = 'none';
        wipeAndLogout();
    });

    // --- Support: open WhatsApp with random owner ---
    function openSupportWhatsApp(ownerNumber, ownerName) {
        const message = `Hello ${ownerName}, I need assistance with my PeshoX Intelligence profile. My ID key is: ${fullKey}`;
        const url = `https://wa.me/${ownerNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    }
    supportBtn.addEventListener('click', () => {
        supportModal.style.display = 'flex';
    });
    supportCancel.addEventListener('click', () => {
        supportModal.style.display = 'none';
    });
    contactOwner1.addEventListener('click', () => {
        supportModal.style.display = 'none';
        openSupportWhatsApp(PX.CONFIG.owner1, 'Dark Echo');
    });
    contactOwner2.addEventListener('click', () => {
        supportModal.style.display = 'none';
        openSupportWhatsApp(PX.CONFIG.owner2, 'Ibn e Sina');
    });
});
