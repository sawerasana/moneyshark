/**
 * loading.js – 20‑second cinematic transition
 * - SVG progress ring fills exactly over 20 seconds using requestAnimationFrame
 * - Rotating bilingual messages every 4 seconds
 * - Redirects to /engine/dashboard.html after completion
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Authentication guard: only logged‑in users can see this page ---
    const userKey = PX.getCurrentUserKey();
    if (!userKey) {
        window.location.href = '/';
        return;
    }

    // --- DOM elements ---
    const statusEng = document.getElementById('statusEng');
    const statusUrdu = document.getElementById('statusUrdu');
    const progressRing = document.querySelector('.progress-ring-fill');

    // --- Constants ---
    const TOTAL_DURATION = 20000; // 20 seconds in milliseconds
    const CIRCUMFERENCE = 2 * Math.PI * 88; // r=88 => approx 553.0
    let startTime = null;
    let animationFrame = null;
    let messageInterval = null;
    let currentMessageIndex = 0;

    // --- Bilingual message pairs (5 pairs, rotate every 4 seconds) ---
    const messagePairs = [
        {
            eng: "Syncing with Global Aviation Servers...",
            urdu: "عالمی ایوی ایشن سرورز کے ساتھ ہم آہنگ ہو رہا ہے..."
        },
        {
            eng: "Analyzing Historical Multiplier Data...",
            urdu: "ملٹی پلیئر ڈیٹا کا تجزیہ کیا جا رہا ہے..."
        },
        {
            eng: "Calibrating Atmospheric Pressure Sensors...",
            urdu: "ماحولیاتی دباؤ کے سینسرز کو کیلیبریٹ کیا جا رہا ہے..."
        },
        {
            eng: "Establishing Secure Encryption Tunnel...",
            urdu: "محفوظ انکرپشن ٹنل قائم کی جا رہی ہے..."
        },
        {
            eng: "Finalizing Radar Sweep Interface...",
            urdu: "ریڈار سویپ انٹرفیس کو حتمی شکل دی جا رہی ہے..."
        }
    ];

    // --- Function to change message (every 4 seconds) ---
    function rotateMessage() {
        currentMessageIndex = (currentMessageIndex + 1) % messagePairs.length;
        const pair = messagePairs[currentMessageIndex];
        statusEng.textContent = pair.eng;
        statusUrdu.textContent = pair.urdu;
    }

    // --- Progress ring update based on elapsed time ---
    function updateProgress(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(1, elapsed / TOTAL_DURATION);
        const offset = CIRCUMFERENCE * (1 - progress);
        progressRing.style.strokeDashoffset = offset;

        if (elapsed < TOTAL_DURATION) {
            animationFrame = requestAnimationFrame(updateProgress);
        } else {
            // Complete: set to 0 offset (full ring)
            progressRing.style.strokeDashoffset = 0;
            finishLoading();
        }
    }

    // --- Finish loading: stop intervals, redirect to dashboard ---
    function finishLoading() {
        if (animationFrame) cancelAnimationFrame(animationFrame);
        if (messageInterval) clearInterval(messageInterval);

        // Final status update
        statusEng.textContent = "Access Granted. Redirecting...";
        statusUrdu.textContent = "رسائی دی گئی۔ ری ڈائریکٹ ہو رہا ہے...";

        // Use global loader for smooth transition (optional but consistent)
        PX.showLoader(1000, () => {
            window.location.href = '/engine/dashboard.html';
        });
    }

    // --- Start the loading sequence ---
    function startLoading() {
        // Set initial ring state
        progressRing.style.strokeDasharray = CIRCUMFERENCE;
        progressRing.style.strokeDashoffset = CIRCUMFERENCE;

        // Start progress animation
        startTime = null;
        animationFrame = requestAnimationFrame(updateProgress);

        // Rotate messages every 4 seconds
        messageInterval = setInterval(rotateMessage, 4000);

        // Set first message immediately
        const firstPair = messagePairs[0];
        statusEng.textContent = firstPair.eng;
        statusUrdu.textContent = firstPair.urdu;
    }

    startLoading();
});
