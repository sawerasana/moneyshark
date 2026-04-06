/**
 * invite-earn.js – Viral Engine
 * - Tracks shares in localStorage (_px_share_count, _px_share_cooldown)
 * - 1st share → owner WhatsApp (+923128942224) with user key
 * - Shares 2‑5 → standard WhatsApp share menu
 * - After 5 shares → 5s loader → PX.addToWallet(5000) → 24h cooldown
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Authentication guard: must have 99-char key ---
    const userKey = PX.getCurrentUserKey();
    if (!userKey) {
        window.location.href = '/';
        return;
    }

    // --- DOM elements ---
    const whatsappBtn = document.getElementById('whatsappShareBtn');
    const progressFill = document.getElementById('progressFill');
    const progressCounter = document.getElementById('progressCounter');
    const chestContainer = document.getElementById('chestContainer');
    const cooldownArea = document.getElementById('cooldownArea');
    const cooldownTimer = document.getElementById('cooldownTimer');

    // --- localStorage keys ---
    const SHARE_COUNT_KEY = '_px_share_count';
    const COOLDOWN_END_KEY = '_px_share_cooldown';

    // --- Helper: load share count and update UI ---
    let currentShares = parseInt(localStorage.getItem(SHARE_COUNT_KEY) || '0');
    function updateProgressUI() {
        const percent = (currentShares / 5) * 100;
        progressFill.style.width = `${percent}%`;
        progressCounter.textContent = `Shares: ${currentShares} / 5`;
        if (currentShares >= 5) {
            chestContainer.classList.add('unlocked');
            const chestIcon = document.querySelector('#chestIcon');
            if (chestIcon) chestIcon.className = 'fas fa-box-open';
            const chestText = document.querySelector('.chest-text');
            if (chestText) chestText.textContent = 'Unlocked!';
        } else {
            chestContainer.classList.remove('unlocked');
            const chestIcon = document.querySelector('#chestIcon');
            if (chestIcon) chestIcon.className = 'fas fa-box';
            const chestText = document.querySelector('.chest-text');
            if (chestText) chestText.textContent = 'Locked';
        }
    }

    // --- Helper: check if cooldown is active ---
    function isCooldownActive() {
        const cooldownEnd = localStorage.getItem(COOLDOWN_END_KEY);
        if (!cooldownEnd) return false;
        return Date.now() < parseInt(cooldownEnd);
    }

    // --- Helper: start 24-hour cooldown ---
    function startCooldown() {
        const cooldownUntil = Date.now() + (24 * 60 * 60 * 1000);
        localStorage.setItem(COOLDOWN_END_KEY, cooldownUntil);
        whatsappBtn.classList.add('disabled');
        whatsappBtn.disabled = true;
        cooldownArea.style.display = 'block';
        updateCooldownTimer();
        const timerInterval = setInterval(() => {
            const remaining = updateCooldownTimer();
            if (remaining <= 0) {
                clearInterval(timerInterval);
                cooldownArea.style.display = 'none';
                whatsappBtn.classList.remove('disabled');
                whatsappBtn.disabled = false;
                // Reset share count after cooldown
                currentShares = 0;
                localStorage.setItem(SHARE_COUNT_KEY, '0');
                updateProgressUI();
            }
        }, 1000);
    }

    function updateCooldownTimer() {
        const cooldownEnd = parseInt(localStorage.getItem(COOLDOWN_END_KEY) || '0');
        const remaining = Math.max(0, cooldownEnd - Date.now());
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (3600000)) / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        cooldownTimer.textContent = `${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
        return remaining;
    }

    // --- Increment share count and save ---
    async function incrementShareCount() {
        currentShares++;
        localStorage.setItem(SHARE_COUNT_KEY, currentShares);
        updateProgressUI();
        if (currentShares === 5) {
            // Show 5-second verification loader
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.innerHTML = `
                <div class="modal-container">
                    <div class="loader-spinner"></div>
                    <div class="bilingual">
                        <span class="english-text">Verifying Network Integrity...</span>
                        <span class="urdu-text">نیٹ ورک کی سالمیت کی تصدیق کی جا رہی ہے...</span>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            setTimeout(() => overlay.classList.add('active'), 10);
            await new Promise(resolve => setTimeout(resolve, 5000));
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
            
            // Add wallet bonus
            PX.addToWallet(5000);
            PX.showModal(
                'Bonus Added!',
                'بونس شامل!',
                '5,000 PKR has been credited to your wallet.',
                '5000 روپے آپ کے والٹ میں جمع کر دیے گئے ہیں۔',
                null,
                false
            );
            startCooldown();
        } else {
            PX.showModal(
                'Share Counted',
                'شیئر شمار ہوگیا',
                `You have completed ${currentShares}/5 shares. ${5 - currentShares} more to go!`,
                `آپ نے ${currentShares}/5 شیئرز مکمل کر لیے ہیں۔ ${5 - currentShares} مزید باقی ہیں!`,
                null,
                false
            );
        }
    }

    // --- WhatsApp share logic ---
    async function handleWhatsAppShare() {
        if (currentShares >= 5) {
            PX.showModal(
                'Already Completed',
                'پہلے ہی مکمل',
                'You have already completed 5 shares. Come back after 24 hours.',
                'آپ پہلے ہی 5 شیئرز مکمل کر چکے ہیں۔ 24 گھنٹے بعد واپس آئیں۔',
                null,
                false
            );
            return;
        }
        if (isCooldownActive()) {
            PX.showModal(
                'Cooldown Active',
                'کولڈاؤن فعال',
                'Please wait for the cooldown to finish before sharing again.',
                'براہ کرم دوبارہ شیئر کرنے سے پہلے کولڈاؤن ختم ہونے کا انتظار کریں۔',
                null,
                false
            );
            return;
        }

        let whatsappUrl = '';
        const isFirstShare = (currentShares === 0);
        if (isFirstShare) {
            // First share: send message to owner
            const ownerNumber = '923128942224'; // without '+'
            const message = `Hello Dark Echo, I am sharing the PeshoX link to earn rewards. My ID: ${userKey}`;
            whatsappUrl = `https://wa.me/${ownerNumber}?text=${encodeURIComponent(message)}`;
        } else {
            // Subsequent shares: standard share to any contact
            const siteUrl = window.location.origin;
            const message = `Join me on PeshoX Intelligence – the most accurate Aviator detector! ${siteUrl}`;
            whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        }

        window.open(whatsappUrl, '_blank');

        // Simulate return and increment share count after delay
        whatsappBtn.disabled = true;
        setTimeout(async () => {
            await incrementShareCount();
            if (currentShares < 5 && !isCooldownActive()) {
                whatsappBtn.disabled = false;
            }
        }, 2000);
    }

    // --- Event listeners ---
    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', handleWhatsAppShare);
    }

    // --- Initial UI update ---
    updateProgressUI();
    if (isCooldownActive()) {
        whatsappBtn.classList.add('disabled');
        whatsappBtn.disabled = true;
        cooldownArea.style.display = 'block';
        updateCooldownTimer();
        const timerInterval = setInterval(() => {
            const remaining = updateCooldownTimer();
            if (remaining <= 0) {
                clearInterval(timerInterval);
                cooldownArea.style.display = 'none';
                whatsappBtn.classList.remove('disabled');
                whatsappBtn.disabled = false;
                currentShares = 0;
                localStorage.setItem(SHARE_COUNT_KEY, '0');
                updateProgressUI();
            }
        }, 1000);
    }
});
