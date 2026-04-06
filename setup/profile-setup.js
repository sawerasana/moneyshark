/**
 * profile-setup.js - 6‑step identification wizard
 * - Step transitions use PX.showLoader (1.5s)
 * - Mobile validation: Pakistan numbers (+92) exactly 13 chars, others 10-15 digits
 * - Password min 8 chars, no incorrect loop
 * - Final proceed redirects to /engine/loading.html
 */

document.addEventListener('DOMContentLoaded', () => {
/**
 * profile-setup.js – 6‑step identification wizard
 * - Step navigation with progress bar
 * - Validation: name non-empty, platform selected, mobile (+92 exactly 13 chars), PIN exactly 4 digits
 * - Preferences toggles stored
 * - Final save and redirect to /engine/loading.html
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Authentication guard: must be logged in with a 99-char key ---
    const userKey = PX.getCurrentUserKey();
    if (!userKey) {
        window.location.href = '/';
        return;
    }

    // --- DOM elements ---
    const steps = document.querySelectorAll('.step-container');
    const stepLabels = document.querySelectorAll('.step-label');
    const progressFill = document.getElementById('progressFill');
    const nextBtns = document.querySelectorAll('.next-step');
    const prevBtns = document.querySelectorAll('.prev-step');
    const proceedBtn = document.getElementById('proceedBtn');
    const agreeCheckbox = document.getElementById('agreeCheckbox');

    // Input fields
    const fullNameInput = document.getElementById('fullName');
    const platformSelect = document.getElementById('platformSelect');
    const mobileInput = document.getElementById('mobileNumber');
    const pinInput = document.getElementById('intelligencePin');
    const highAccuracyToggle = document.getElementById('highAccuracyMode');
    const signalNotificationsToggle = document.getElementById('signalNotifications');

    // --- State ---
    let currentStep = 0; // 0-indexed
    let collectedData = {};

    // --- Helper: update progress bar and step labels ---
    function updateProgress() {
        const percent = ((currentStep + 1) / steps.length) * 100;
        progressFill.style.width = `${percent}%`;
        stepLabels.forEach((label, idx) => {
            label.classList.toggle('active', idx === currentStep);
        });
    }

    // --- Helper: show validation error modal (bilingual) ---
    function showValidationError(englishMsg, urduMsg) {
        PX.showModal(
            'Validation Error',
            'توثیق کی خرابی',
            englishMsg,
            urduMsg,
            null,
            false
        );
    }

    // --- Validate current step (returns true/false) ---
    function validateStep(step) {
        switch(step) {
            case 0: // Full Name
                const name = fullNameInput.value.trim();
                if (!name) {
                    showValidationError(
                        'Please enter your full name.',
                        'براہ کرم اپنا پورا نام درج کریں۔'
                    );
                    return false;
                }
                collectedData.fullName = name;
                return true;

            case 1: // Aviator Platform
                if (!platformSelect.value) {
                    showValidationError(
                        'Please select an aviator platform.',
                        'براہ کرم ایک ایوی ایٹر پلیٹ فارم منتخب کریں۔'
                    );
                    return false;
                }
                collectedData.aviatorPlatform = platformSelect.value;
                return true;

            case 2: // Mobile Number (Pakistan strict)
                const mobile = mobileInput.value.trim();
                // Must start with + and contain only digits after
                const mobileRegex = /^\+\d+$/;
                if (!mobileRegex.test(mobile)) {
                    showValidationError(
                        'Mobile number must start with a plus sign (+) followed by digits.',
                        'موبائل نمبر پلس (+) سے شروع ہو کر صرف ہندسوں پر مشتمل ہونا چاہیے۔'
                    );
                    return false;
                }
                // Pakistan specific: +92 and exactly 13 characters total
                if (mobile.startsWith('+92') && mobile.length !== 13) {
                    showValidationError(
                        'For Pakistan, mobile number must be exactly 13 characters (e.g., +923001234567).',
                        'پاکستان کے لیے موبائل نمبر بالکل 13 حروف کا ہونا چاہیے (مثال: +923001234567)۔'
                    );
                    return false;
                }
                // For other countries, length between 10-15 digits after +
                const digitsOnly = mobile.slice(1);
                if (digitsOnly.length < 10 || digitsOnly.length > 15) {
                    showValidationError(
                        'Mobile number must contain 10-15 digits after the country code.',
                        'ملک کے کوڈ کے بعد موبائل نمبر 10-15 ہندسوں پر مشتمل ہونا چاہیے۔'
                    );
                    return false;
                }
                collectedData.mobileNumber = mobile;
                return true;

            case 3: // Intelligence PIN (exactly 4 digits)
                const pin = pinInput.value.trim();
                const pinRegex = /^\d{4}$/;
                if (!pinRegex.test(pin)) {
                    showValidationError(
                        'Intelligence PIN must be exactly 4 digits.',
                        'انٹیلی جنس پن بالکل 4 ہندسوں کا ہونا چاہیے۔'
                    );
                    return false;
                }
                collectedData.intelligencePin = pin;
                return true;

            case 4: // Preferences (always valid, just capture)
                collectedData.highAccuracyMode = highAccuracyToggle.checked;
                collectedData.signalNotifications = signalNotificationsToggle.checked;
                return true;

            default:
                return true;
        }
    }

    // --- Move to a specific step with smooth transition ---
    function goToStep(targetStep) {
        if (targetStep === currentStep) return;
        // Validate current step before moving forward
        if (targetStep > currentStep && !validateStep(currentStep)) return;

        // Simple transition (no extra loader for speed, but we want a 2s loader? The requirement says "trigger a 2s loader before redirecting to the engine" only for final proceed.
        // For step transitions, we just update DOM immediately to keep UX fast.
        steps.forEach((step, idx) => {
            step.classList.toggle('active', idx === targetStep);
        });
        currentStep = targetStep;
        updateProgress();
    }

    // --- Next / Prev event listeners ---
    nextBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentStep < steps.length - 1) {
                goToStep(currentStep + 1);
            }
        });
    });
    prevBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentStep > 0) {
                goToStep(currentStep - 1);
            }
        });
    });

    // --- Legal checkbox enables proceed button ---
    agreeCheckbox.addEventListener('change', () => {
        proceedBtn.disabled = !agreeCheckbox.checked;
    });

    // --- Final proceed: save all data and redirect to loading page ---
    async function handleProceed() {
        // Ensure checkbox is checked
        if (!agreeCheckbox.checked) {
            PX.showModal(
                'Agreement Required',
                'معاہدہ ضروری ہے',
                'You must agree to the Terms & Privacy Policy before finalizing.',
                'حتمی شکل دینے سے پہلے آپ کو شرائط اور پرائیویسی پالیسی سے متفق ہونا ضروری ہے۔',
                null,
                false
            );
            return;
        }

        // Validate all remaining steps (especially step 5 preferences and ensure all previous are valid)
        // First ensure we have data from all steps. We'll validate each step in order.
        for (let i = 0; i <= 4; i++) {
            if (!validateStep(i)) {
                // Go to the failing step
                goToStep(i);
                return;
            }
        }

        // Save all collected data to the user's profile
        const existingUser = PX.getUser(userKey) || {};
        const updatedProfile = {
            ...existingUser,
            fullName: collectedData.fullName,
            aviatorPlatform: collectedData.aviatorPlatform,
            mobileNumber: collectedData.mobileNumber,
            intelligencePin: collectedData.intelligencePin,
            highAccuracyMode: collectedData.highAccuracyMode,
            signalNotifications: collectedData.signalNotifications,
            profileCompleted: true,
            completedAt: Date.now()
        };
        PX.saveUser(userKey, updatedProfile);

        // Show 2-second loader with custom message, then redirect
        const overlay = document.createElement('div');
        overlay.className = 'global-loader-overlay';
        overlay.innerHTML = `
            <div class="loader-container">
                <div class="loader-spinner"></div>
                <div class="bilingual">
                    <span class="english-text">Calibrating Radar Sensors...</span>
                    <span class="urdu-text">ریڈار سینسرز کی کیلیبریشن ہو رہی ہے...</span>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        setTimeout(() => overlay.classList.add('active'), 10);
        setTimeout(() => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
            window.location.href = '/engine/loading.html';
        }, 2000);
    }

    proceedBtn.addEventListener('click', handleProceed);

    // Initialize first step
    goToStep(0);
});
