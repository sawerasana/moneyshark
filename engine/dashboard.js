/**
 * dashboard.js – Radar Hub (Final)
 * - Radar sweep animation (canvas)
 * - Weighted multiplier prediction (70% low, 20% mid, 10% high)
 * - 10-second cooldown after prediction
 * - Invite & Earn button redirects to /user/invite-earn.html
 * - Displays user name and platform from localStorage
 * - Free user redirect to /vip/access-plans.html on prediction click
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
    const userNameSpan = document.getElementById('userNameDisplay');
    const platformNameSpan = document.getElementById('platformName');
    const subscriptionBadge = document.getElementById('subscriptionBadge');
    const multiplierDisplay = document.getElementById('multiplierDisplay');
    const predictBtn = document.getElementById('predictBtn');
    const predictStatus = document.getElementById('predictStatus');
    const inviteEarnBtn = document.getElementById('inviteEarnBtn');
    const walletBtn = document.getElementById('walletBtn');
    const vipPlansBtn = document.getElementById('vipPlansBtn');
    const profileBtn = document.getElementById('profileBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutModal = document.getElementById('logoutModal');
    const logoutCancel = document.getElementById('logoutCancelBtn');
    const logoutConfirm = document.getElementById('logoutConfirmBtn');
    const terminalContainer = document.getElementById('terminalContainer');
    const radarCanvas = document.getElementById('radarCanvas');
    const ctx = radarCanvas.getContext('2d');

    // --- Radar dimensions ---
    let width = 600, height = 600;
    radarCanvas.width = width;
    radarCanvas.height = height;
    let angle = 0;
    let blips = [];

    // --- User info & subscription ---
    const fullName = userData.fullName || 'Pilot';
    userNameSpan.textContent = fullName;
    platformNameSpan.textContent = userData.aviatorPlatform || 'Aviator';
    let subscriptionActive = PX.isSubscriptionActive();
    let subscriptionPlan = 'free';
    const subObj = PX.getSubscription();
    if (subObj && subObj.plan) subscriptionPlan = subObj.plan;

    function updateSubscriptionUI() {
        subscriptionActive = PX.isSubscriptionActive();
        if (subscriptionActive && subObj && subObj.plan) {
            subscriptionPlan = subObj.plan;
            subscriptionBadge.textContent = subscriptionPlan.toUpperCase();
            subscriptionBadge.className = `badge ${subscriptionPlan}`;
            predictBtn.classList.remove('disabled');
            predictBtn.disabled = false;
            predictBtn.innerHTML = '<i class="fas fa-chart-simple"></i> GET PREDICTION <span class="urdu-text">پیشین گوئی حاصل کریں</span>';
            predictStatus.querySelector('.english-text').textContent = 'Ready to Scan...';
            predictStatus.querySelector('.urdu-text').textContent = 'اسکین کے لیے تیار...';
        } else {
            subscriptionPlan = 'free';
            subscriptionBadge.textContent = 'FREE';
            subscriptionBadge.className = 'badge free';
            predictBtn.classList.remove('disabled');
            predictBtn.disabled = false;
            predictBtn.innerHTML = '<i class="fas fa-lock"></i> GET PREDICTION (LOCKED) <span class="urdu-text">پیشین گوئی بند ہے</span>';
            predictBtn.style.background = '#555';
            predictStatus.querySelector('.english-text').textContent = 'Upgrade to VIP to unlock';
            predictStatus.querySelector('.urdu-text').textContent = 'VIP میں اپگریڈ کریں';
        }
    }
    updateSubscriptionUI();

    // --- Weighted random multiplier (70% low, 20% mid, 10% high) ---
    function getWeightedMultiplier() {
        const rand = Math.random();
        if (rand < 0.7) {
            return (Math.random() * 1.0 + 1.0).toFixed(2); // 1.0 - 2.0
        } else if (rand < 0.9) {
            return (Math.random() * 3.0 + 2.0).toFixed(2); // 2.0 - 5.0
        } else {
            return (Math.random() * 10.0 + 5.0).toFixed(2); // 5.0 - 15.0
        }
    }

    // --- Floating numbers on prediction ---
    let floatingNumbers = [];
    function spawnFloatingNumbers(multiplier) {
        const count = Math.floor(Math.random() * 2) + 3;
        for (let i = 0; i < count; i++) {
            const cx = width/2, cy = height/2;
            const radius = Math.random() * 200 + 50;
            const angleRad = Math.random() * Math.PI * 2;
            const x = cx + radius * Math.cos(angleRad);
            const y = cy + radius * Math.sin(angleRad);
            const value = (parseFloat(multiplier) + (Math.random() - 0.5) * 2).toFixed(2);
            floatingNumbers.push({
                x, y, value,
                alpha: 0.9,
                life: 1.0,
                dx: (Math.random() - 0.5) * 1.5,
                dy: (Math.random() - 0.5) * 1.5
            });
        }
    }

    // --- Prediction logic (VIP only) ---
    let isCooldown = false;
    let cooldownTimer = null;

    async function startPrediction() {
        if (!subscriptionActive || isCooldown) return;
        isCooldown = true;
        predictBtn.disabled = true;
        predictBtn.classList.add('cooldown');
        predictStatus.querySelector('.english-text').textContent = 'Calculating trajectory...';
        predictStatus.querySelector('.urdu-text').textContent = 'ٹریجیکٹری کا حساب لگایا جا رہا ہے...';
        multiplierDisplay.textContent = '---';
        await new Promise(resolve => setTimeout(resolve, 1500));
        const multiplier = getWeightedMultiplier();
        multiplierDisplay.textContent = `${multiplier}x`;
        spawnFloatingNumbers(multiplier);
        addTerminalLog(`PREDICTION GENERATED: ${multiplier}x`, `پیشین گوئی تیار: ${multiplier}x`);
        let remaining = 10;
        predictBtn.innerHTML = `<i class="fas fa-hourglass-half"></i> Ready for next scan in ${remaining}s... <span class="urdu-text">${remaining} سیکنڈ میں اگلے اسکین کے لیے تیار</span>`;
        cooldownTimer = setInterval(() => {
            remaining--;
            if (remaining <= 0) {
                clearInterval(cooldownTimer);
                isCooldown = false;
                predictBtn.disabled = false;
                predictBtn.classList.remove('cooldown');
                predictBtn.innerHTML = '<i class="fas fa-chart-simple"></i> GET PREDICTION <span class="urdu-text">پیشین گوئی حاصل کریں</span>';
                predictStatus.querySelector('.english-text').textContent = 'Ready to Scan...';
                predictStatus.querySelector('.urdu-text').textContent = 'اسکین کے لیے تیار...';
            } else {
                predictBtn.innerHTML = `<i class="fas fa-hourglass-half"></i> Ready for next scan in ${remaining}s... <span class="urdu-text">${remaining} سیکنڈ میں اگلے اسکین کے لیے تیار</span>`;
            }
        }, 1000);
    }

    // --- Prediction button click ---
    predictBtn.addEventListener('click', () => {
        if (!subscriptionActive) {
            PX.showLoader(1000, () => {
                window.location.href = '/vip/access-plans.html';
            });
            return;
        }
        if (!isCooldown) startPrediction();
    });

    // --- Invite & Earn button ---
    if (inviteEarnBtn) {
        inviteEarnBtn.addEventListener('click', () => {
            window.location.href = '/user/invite-earn.html';
        });
    }

    // --- Navigation buttons ---
    if (walletBtn) walletBtn.addEventListener('click', () => window.location.href = '/user/profile.html');
    if (vipPlansBtn) vipPlansBtn.addEventListener('click', () => window.location.href = '/vip/access-plans.html');
    if (profileBtn) profileBtn.addEventListener('click', () => window.location.href = '/user/profile.html');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => logoutModal.style.display = 'flex');
        logoutCancel.addEventListener('click', () => logoutModal.style.display = 'none');
        logoutConfirm.addEventListener('click', () => PX.logout());
    }

    // --- Terminal Log Stream ---
    const englishLogs = [
        "Intercepting satellite uplink...", "Packet 0x44A received", "Analyzing trajectory alpha",
        "Radar echo at 0.42ms", "Signal strength 92%", "Neural engine calibrated",
        "Encryption layer verified", "Firewall bypassed", "New contact bearing 045",
        "Doppler shift detected", "Frequency band scanned", "Target locked, confidence 98%",
        "Long-range scan initiated", "Bandwidth: 2400 MHz", "Processing 12.7k signals/sec"
    ];
    const urduLogs = [
        "سیٹلائٹ اپ لنک کو روکا جا رہا ہے...", "پیکٹ 0x44A موصول ہوا", "ٹریجیکٹری الفا کا تجزیہ کیا جا رہا ہے",
        "ریڈار ایکو 0.42ms پر", "سگنل کی طاقت 92%", "نیورل انجن کیلیبریٹ ہوگیا",
        "انکرپشن پرت کی تصدیق ہوگئی", "فائر وال کو بائی پاس کر دیا گیا", "نیا رابطہ بیرنگ 045",
        "ڈوپلر شفٹ کا پتہ چلا", "فریکوئنسی بینڈ اسکین ہوگیا", "ٹارگٹ لاک، اعتماد 98%",
        "لمبی رینج اسکین شروع ہوا", "بینڈوتھ: 2400 MHz", "12.7k سگنلز/سیکنڈ پروسیس ہو رہے ہیں"
    ];
    function addTerminalLog(engMsg, urduMsg) {
        const logLine = document.createElement('div');
        logLine.className = 'terminal-line';
        const timestamp = new Date().toLocaleTimeString();
        logLine.innerHTML = `[${timestamp}] ${engMsg} / <span class="urdu-text">${urduMsg}</span>`;
        terminalContainer.appendChild(logLine);
        terminalContainer.scrollTop = terminalContainer.scrollHeight;
        while (terminalContainer.children.length > 300) terminalContainer.removeChild(terminalContainer.firstChild);
    }
    for (let i = 0; i < 10; i++) addTerminalLog(englishLogs[i % englishLogs.length], urduLogs[i % urduLogs.length]);
    setInterval(() => {
        const idx = Math.floor(Math.random() * englishLogs.length);
        addTerminalLog(englishLogs[idx], urduLogs[idx]);
    }, 1000);

    // --- Radar Canvas Animation ---
    function drawRadar() {
        if (!ctx) return;
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#020202';
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = '#00ff00aa';
        ctx.lineWidth = 1;
        for (let r = 50; r <= 250; r += 50) {
            ctx.beginPath();
            ctx.arc(width/2, height/2, r, 0, 2*Math.PI);
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(width/2, 0);
        ctx.lineTo(width/2, height);
        ctx.moveTo(0, height/2);
        ctx.lineTo(width, height/2);
        ctx.stroke();
        for (let i = 0; i < blips.length; i++) {
            const b = blips[i];
            ctx.fillStyle = `rgba(0, 255, 0, ${b.alpha})`;
            ctx.beginPath();
            ctx.arc(b.x, b.y, 4, 0, 2*Math.PI);
            ctx.fill();
            b.alpha -= 0.01;
            if (b.alpha <= 0) blips.splice(i--,1);
        }
        if (Math.random() < 0.1) {
            const cx = width/2, cy = height/2;
            const radius = Math.random() * 220 + 20;
            const radAngle = Math.random() * Math.PI * 2;
            const x = cx + radius * Math.cos(radAngle);
            const y = cy + radius * Math.sin(radAngle);
            blips.push({ x, y, alpha: 0.8 });
        }
        for (let i = 0; i < floatingNumbers.length; i++) {
            const num = floatingNumbers[i];
            ctx.font = 'bold 16px monospace';
            ctx.fillStyle = `rgba(0, 255, 0, ${num.alpha})`;
            ctx.shadowBlur = 4;
            ctx.shadowColor = '#00ff00';
            ctx.fillText(`${num.value}x`, num.x - 15, num.y - 8);
            num.x += num.dx;
            num.y += num.dy;
            num.alpha -= 0.02;
            if (num.alpha <= 0) floatingNumbers.splice(i--,1);
        }
        ctx.shadowBlur = 0;
        const centerX = width/2, centerY = height/2;
        const radius = 240;
        const rad = angle * Math.PI / 180;
        const endX = centerX + radius * Math.cos(rad);
        const endY = centerY + radius * Math.sin(rad);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.stroke();
        const gradient = ctx.createLinearGradient(centerX, centerY, endX, endY);
        gradient.addColorStop(0, 'rgba(0,255,0,0.3)');
        gradient.addColorStop(1, 'rgba(0,255,0,0)');
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(endX, endY);
        ctx.lineTo(centerX + (endX - centerX) * 0.7, centerY + (endY - centerY) * 0.7);
        ctx.fillStyle = gradient;
        ctx.fill();
        angle = (angle + 2) % 360;
        requestAnimationFrame(drawRadar);
    }
    drawRadar();
});
