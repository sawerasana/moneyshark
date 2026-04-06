/**
 * signup.js – Key Generation & Signup
 * - 3-second custom loader with rotating bilingual messages
 * - Generates 99-character key using PX.generateKey99()
 * - Copy to clipboard with success feedback
 * - Paste confirmation enables signup button
 * - Saves user and redirects to /setup/profile-setup.html
 */

document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generateKeyBtn');
    const keyDisplayArea = document.getElementById('keyDisplayArea');
    const generatedKeySpan = document.getElementById('generatedKey');
    const copyBtn = document.getElementById('copyKeyBtn');
    const pasteInput = document.getElementById('pasteKeyInput');
    const signupBtn = document.getElementById('signupSubmitBtn');

    let currentGeneratedKey = '';

    // Rotating messages for the loader (bilingual pairs)
    const rotatingMessages = [
        { eng: "Establishing Secure Uplink...", urdu: "محفوظ اپ لنک قائم کیا جا رہا ہے..." },
        { eng: "Injecting Neural Entropy...", urdu: "نیورل اینٹروپی انجکشن..." },
        { eng: "Finalizing ID Encryption...", urdu: "آئی ڈی انکرپشن کو حتمی شکل دی جا رہی ہے..." }
    ];

    // Custom loader with rotating messages
    function showCustomLoader(durationMs, onComplete) {
        const overlay = document.createElement('div');
        overlay.className = 'global-loader-overlay';
        overlay.innerHTML = `
            <div class="loader-container">
                <div class="loader-spinner"></div>
                <div class="bilingual">
                    <span class="english-text" id="customLoaderEng">Processing...</span>
                    <span class="urdu-text" id="customLoaderUrdu">عمل جاری ہے...</span>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        setTimeout(() => overlay.classList.add('active'), 10);

        let messageIndex = 0;
        const interval = setInterval(() => {
            const msg = rotatingMessages[messageIndex % rotatingMessages.length];
            const engSpan = overlay.querySelector('#customLoaderEng');
            const urduSpan = overlay.querySelector('#customLoaderUrdu');
            if (engSpan && urduSpan) {
                engSpan.textContent = msg.eng;
                urduSpan.textContent = msg.urdu;
            }
            messageIndex++;
        }, 750);

        setTimeout(() => {
            clearInterval(interval);
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
            if (onComplete) onComplete();
        }, durationMs);
    }

    // Generate key button
    if (generateBtn) {
        generateBtn.addEventListener('click', () => {
            showCustomLoader(3000, () => {
                currentGeneratedKey = PX.generateKey99();
                generatedKeySpan.textContent = currentGeneratedKey;
                keyDisplayArea.style.display = 'block';
                pasteInput.value = '';
                signupBtn.disabled = true;
                // Optional: small success modal
                PX.showModal(
                    'Key Generated',
                    'کلید بن گئی',
                    'Your unique access key is ready. Copy it and paste below to confirm.',
                    'آپ کی منفرد رسائی کلید تیار ہے۔ تصدیق کے لیے اسے کاپی کریں اور نیچے پیسٹ کریں۔',
                    null,
                    false
                );
            });
        });
    }

    // Copy key to clipboard
    if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
            if (!currentGeneratedKey) {
                PX.showModal(
                    'No Key',
                    'کوئی کلید نہیں',
                    'Please generate a key first.',
                    'براہ کرم پہلے کلید بنائیں۔',
                    null,
                    false
                );
                return;
            }
            try {
                await navigator.clipboard.writeText(currentGeneratedKey);
                PX.showModal(
                    'Copied',
                    'کاپی ہوگیا',
                    'Key copied to clipboard.',
                    'کلید کلپ بورڈ پر کاپی ہوگئی۔',
                    null,
                    false
                );
                copyBtn.innerHTML = '<i class="fas fa-check"></i> COPIED';
                setTimeout(() => {
                    copyBtn.innerHTML = '<i class="fas fa-copy"></i> COPY';
                }, 2000);
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
        });
    }

    // Paste confirmation: enable signup only if matches
    if (pasteInput) {
        pasteInput.addEventListener('input', () => {
            const pasted = pasteInput.value.trim();
            if (pasted === currentGeneratedKey && currentGeneratedKey !== '') {
                signupBtn.disabled = false;
                pasteInput.style.borderColor = '#00ff00';
            } else {
                signupBtn.disabled = true;
                pasteInput.style.borderColor = pasted.length > 0 ? '#ff0000' : '';
            }
        });
    }

    // Signup & Continue
    if (signupBtn) {
        signupBtn.addEventListener('click', () => {
            if (!currentGeneratedKey) return;

            // Check if key already exists (safety)
            if (PX.getUser(currentGeneratedKey)) {
                PX.showModal(
                    'Key Exists',
                    'کلید موجود ہے',
                    'This key already exists. Generate a new one.',
                    'یہ کلید پہلے سے موجود ہے۔ نئی کلید بنائیں۔',
                    null,
                    false
                );
                return;
            }

            // Save user profile with initial data
            PX.saveUser(currentGeneratedKey, {
                key: currentGeneratedKey,
                createdAt: Date.now(),
                profileCompleted: false,
                status: 'Free'
            });

            // Set as current logged-in user
            PX.setCurrentUser(currentGeneratedKey);

            // Show success modal, then redirect with loader
            PX.showModal(
                'Signup Successful',
                'سائن اپ کامیاب',
                'Your identity has been forged. Redirecting to profile setup...',
                'آپ کی شناخت بن گئی ہے۔ پروفائل سیٹ اپ پر ری ڈائریکٹ ہو رہا ہے...',
                () => {
                    PX.showLoader(1500, () => {
                        window.location.href = '/setup/profile-setup.html';
                    });
                },
                false
            );
        });
    }
});
