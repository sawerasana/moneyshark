/**
 * index.js – Entry Portal Logic
 * - Handles "GET ACCESS": plays audio, shows audio preference modal, then 2s loader → redirect to /auth/signup.html
 * - Handles "LOGIN WITH ID KEY": modal for ID key, validates with PX.getUser(), redirects to dashboard on success
 */

document.addEventListener('DOMContentLoaded', () => {
    const getAccessBtn = document.getElementById('getAccessBtn');
    const loginBtn = document.getElementById('loginBtn');
    const audio = document.getElementById('bgMusic');
    let audioPlaying = false;

    // Helper: Stop audio and reset state
    function stopAudio() {
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
        audioPlaying = false;
    }

    // Helper: Start audio (with error handling)
    function startAudio() {
        if (audio && !audioPlaying) {
            audio.play().catch(e => {
                console.log("Audio play failed:", e);
            });
            audioPlaying = true;
        }
    }

    // Helper: Show audio preference modal after starting audio
    function showAudioModal(onContinue, onOff) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-container">
                <h3><i class="fas fa-music"></i> Background Music</h3>
                <div class="bilingual">
                    <span class="english-text">Background music is now active. Would you like to continue with audio or turn it off?</span>
                    <span class="urdu-text">پس منظر کی موسیقی آن ہے۔ کیا آپ اسے جاری رکھنا چاہتے ہیں یا بند کرنا چاہتے ہیں؟</span>
                </div>
                <div class="modal-buttons">
                    <button id="audioContinueBtn" class="btn-primary">Continue with Audio</button>
                    <button id="audioOffBtn" class="btn-secondary">Turn Off Audio</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        setTimeout(() => overlay.classList.add('active'), 10);

        const continueBtn = overlay.querySelector('#audioContinueBtn');
        const offBtn = overlay.querySelector('#audioOffBtn');

        continueBtn.onclick = () => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
            if (onContinue) onContinue();
        };
        offBtn.onclick = () => {
            stopAudio();
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
            if (onOff) onOff();
        };
    }

    // --- GET ACCESS BUTTON ---
    if (getAccessBtn) {
        getAccessBtn.addEventListener('click', () => {
            // Start audio immediately
            startAudio();

            // Show audio preference modal, then proceed with loader and redirect
            showAudioModal(
                () => {
                    // User chose to keep audio – do nothing extra
                    proceedToSignup();
                },
                () => {
                    // User turned off audio – still proceed to signup
                    proceedToSignup();
                }
            );
        });
    }

    function proceedToSignup() {
        PX.showLoader(2000, () => {
            window.location.href = '/auth/signup.html';
        });
    }

    // --- LOGIN BUTTON ---
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            // Create modal for ID key input
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.innerHTML = `
                <div class="modal-container" style="max-width: 450px;">
                    <h3><i class="fas fa-lock"></i> Enter Your ID Key</h3>
                    <div class="bilingual">
                        <span class="english-text">Please paste your unique access key</span>
                        <span class="urdu-text">براہ کرم اپنی منفرد رسائی کلید پیسٹ کریں</span>
                    </div>
                    <input type="text" id="loginKeyInput" placeholder="Paste your ID key here..." maxlength="99" autocomplete="off">
                    <div class="modal-buttons">
                        <button id="modalCancelBtn" class="btn-secondary">Cancel</button>
                        <button id="modalConfirmBtn" class="btn-primary">Verify & Enter</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            setTimeout(() => overlay.classList.add('active'), 10);

            const input = overlay.querySelector('#loginKeyInput');
            const confirmBtn = overlay.querySelector('#modalConfirmBtn');
            const cancelBtn = overlay.querySelector('#modalCancelBtn');

            const closeModal = () => {
                overlay.classList.remove('active');
                setTimeout(() => overlay.remove(), 300);
            };

            confirmBtn.onclick = () => {
                const enteredKey = input.value.trim();
                if (!enteredKey) {
                    PX.showModal(
                        'Input Required',
                        'درج کرنا ضروری ہے',
                        'Please enter your ID key.',
                        'براہ کرم اپنی شناختی کلید درج کریں۔',
                        null,
                        false
                    );
                    return;
                }
                const user = PX.getUser(enteredKey);
                if (user) {
                    // Valid key: set session, show loader, redirect to dashboard
                    PX.setCurrentUser(enteredKey);
                    closeModal();
                    PX.showLoader(1500, () => {
                        window.location.href = '/engine/dashboard.html';
                    });
                } else {
                    // Invalid key
                    PX.showModal(
                        'Invalid Key',
                        'غلط کلید',
                        'No account found with this ID key. Please sign up first.',
                        'اس شناختی کلید سے کوئی اکاؤنٹ نہیں ملا۔ براہ کرم پہلے سائن اپ کریں۔',
                        null,
                        false
                    );
                    input.style.borderColor = '#ff0000';
                    setTimeout(() => { input.style.borderColor = ''; }, 1000);
                }
            };

            cancelBtn.onclick = closeModal;
            input.addEventListener('keypress', (e) => { if (e.key === 'Enter') confirmBtn.click(); });
        });
    }
});
