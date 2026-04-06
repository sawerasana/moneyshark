/**
 * access-plans.js – VIP Gateway Logic
 * - Plan selection redirects to payment.html with plan parameter (basic/standard/premium)
 * - Key activation: validates length 33/44/55, saves subscription, redirects to dashboard
 * - Dynamic review feed: 12+ diverse reviews with suggestions, mixed English/Urdu
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Authentication guard ---
    const userKey = PX.getCurrentUserKey();
    if (!userKey) {
        window.location.href = '/';
        return;
    }

    // --- DOM elements ---
    const selectPlanBtns = document.querySelectorAll('.select-plan-btn');
    const activateBtn = document.getElementById('activateKeyBtn');
    const accessKeyInput = document.getElementById('accessKeyInput');
    const reviewsFeed = document.getElementById('reviewsFeed');

    // --- Plan selection: redirect to payment.html with plan param ---
    selectPlanBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const plan = btn.getAttribute('data-plan');
            PX.showLoader(1000, () => {
                window.location.href = `/vip/payment.html?plan=${plan}`;
            });
        });
    });

    // --- Key activation logic (33/44/55) ---
    function activateKey() {
        const key = accessKeyInput.value.trim();
        if (!key) {
            PX.showModal(
                'Activation Error',
                'ایکٹیویشن کی خرابی',
                'Please paste your access key before activating.',
                'ایکٹیویٹ کرنے سے پہلے براہ کرم اپنی رسائی کلید پیسٹ کریں۔',
                null,
                false
            );
            return;
        }
        let plan = null;
        let durationHours = 0;
        let isValid = false;
        if (key.length === 33) {
            plan = 'basic';
            durationHours = 0.5; // 30 minutes
            isValid = true;
        } else if (key.length === 44) {
            plan = 'standard';
            durationHours = 24;
            isValid = true;
        } else if (key.length === 55) {
            plan = 'premium';
            durationHours = 72;
            isValid = true;
        }
        if (!isValid) {
            PX.showModal(
                'Invalid Key',
                'غلط کلید',
                'Key must be exactly 33, 44, or 55 characters long. It can contain letters, numbers, symbols, and spaces.',
                'کلید بالکل 33، 44، یا 55 حروف کی ہونی چاہیے۔ اس میں حروف، اعداد، علامات اور خالی جگہیں ہو سکتی ہیں۔',
                null,
                false
            );
            return;
        }
        const expiry = Date.now() + (durationHours * 60 * 60 * 1000);
        PX.saveSubscription(expiry, plan);
        PX.showModal(
            'Activation Successful',
            'ایکٹیویشن کامیاب',
            `You now have ${plan.toUpperCase()} access for ${durationHours === 0.5 ? '30 minutes' : durationHours + ' hours'}. Redirecting to dashboard...`,
            `اب آپ کو ${plan.toUpperCase()} ایکسیس ${durationHours === 0.5 ? '30 منٹ' : durationHours + ' گھنٹے'} کے لیے مل گئی ہے۔ ڈیش بورڈ پر ری ڈائریکٹ ہو رہا ہے...`,
            () => {
                window.location.href = '/engine/dashboard.html';
            },
            false
        );
    }
    activateBtn.addEventListener('click', activateKey);
    accessKeyInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') activateKey(); });

    // --- Dynamic Review Feed (12+ diverse reviews) ---
    const reviews = [
        {
            name: "Ahmed R.",
            badge: "premium",
            stars: 5,
            textEng: "Absolutely incredible! The radar accuracy helped me recover my losses within hours. Premium plan is worth every rupee.",
            textUrdu: "بالکل ناقابل یقین! ریڈار کی درستگی نے گھنٹوں میں میرے نقصانات کو پورا کرنے میں مدد کی۔ پریمیم پلان ہر روپے کے قابل ہے۔",
            timestamp: "2 hours ago",
            likes: 1243
        },
        {
            name: "Sofia K.",
            badge: "standard",
            stars: 4,
            textEng: "Very good, but the 30-minute basic plan is too short. I upgraded to Standard and it's much better. Please consider a weekly plan!",
            textUrdu: "بہت اچھا، لیکن 30 منٹ کا بنیادی پلان بہت چھوٹا ہے۔ میں نے معیاری میں اپگریڈ کیا اور یہ بہت بہتر ہے۔ براہ کرم ہفتہ وار پلان پر غور کریں!",
            timestamp: "5 hours ago",
            likes: 892
        },
        {
            name: "Bilal M.",
            badge: "premium",
            stars: 5,
            textEng: "The VIP support channel is amazing. Quick responses and they helped me set up my key instantly.",
            textUrdu: "VIP سپورٹ چینل حیرت انگیز ہے۔ فوری جوابات اور انہوں نے فوری طور پر میری کلید ترتیب دینے میں مدد کی۔",
            timestamp: "1 day ago",
            likes: 567
        },
        {
            name: "Priya S.",
            badge: "basic",
            stars: 3,
            textEng: "Works fine but the sharing limit for invites is too low. Please increase it so we can earn more bonuses.",
            textUrdu: "ٹھیک کام کرتا ہے لیکن دعوتوں کی حد بہت کم ہے۔ براہ کرم اسے بڑھا دیں تاکہ ہم زیادہ بونس کما سکیں۔",
            timestamp: "3 days ago",
            likes: 234
        },
        {
            name: "Zain A.",
            badge: "standard",
            stars: 4,
            textEng: "Great tool! I would love to see a YouTube tutorial explaining how to maximize predictions. Also, add bank transfer for international members.",
            textUrdu: "بہترین ٹول! میں پیشن گوئیوں کو زیادہ سے زیادہ کرنے کے طریقہ کی وضاحت کرنے والا ایک YouTube ٹیوٹوریل دیکھنا پسند کروں گا۔ نیز، بین الاقوامی ممبران کے لیے بینک ٹرانسفر شامل کریں۔",
            timestamp: "1 week ago",
            likes: 445
        },
        {
            name: "Fatima Z.",
            badge: "premium",
            stars: 5,
            textEng: "The 72-hour premium plan is a lifesaver. I don't have to keep repurchasing every day. Highly recommend!",
            textUrdu: "72 گھنٹے کا پریمیم پلان جان بچانے والا ہے۔ مجھے ہر روز دوبارہ خریداری نہیں کرنی پڑتی۔ انتہائی سفارش!",
            timestamp: "2 days ago",
            likes: 789
        },
        {
            name: "Rahul V.",
            badge: "free",
            stars: 4,
            textEng: "I'm still on free tier but the radar preview looks promising. Will upgrade soon. Please add more payment options like JazzCash.",
            textUrdu: "میں ابھی بھی مفت ٹائر پر ہوں لیکن ریڈار کا پیش نظارہ امید افزا لگتا ہے۔ جلد اپگریڈ کروں گا۔ براہ کرم مزید ادائیگی کے اختیارات شامل کریں جیسے جاز کیش۔",
            timestamp: "4 days ago",
            likes: 312
        },
        {
            name: "Nadia T.",
            badge: "premium",
            stars: 5,
            textEng: "Best investment I've made. The prediction accuracy is unreal. The team should create a dedicated mobile app!",
            textUrdu: "میں نے اب تک کی بہترین سرمایہ کاری۔ پیشن گوئی کی درستگی غیر حقیقی ہے۔ ٹیم کو ایک وقف شدہ موبائل ایپ بنانی چاہیے!",
            timestamp: "6 hours ago",
            likes: 1021
        },
        {
            name: "Omar H.",
            badge: "standard",
            stars: 4,
            textEng: "Works great but I wish there was a 7-day plan for frequent users. The 24-hour plan is fine but I keep forgetting to renew.",
            textUrdu: "بہت اچھا کام کرتا ہے لیکن کاش بار بار استعمال کرنے والوں کے لیے 7 روزہ پلان ہوتا۔ 24 گھنٹے کا پلان ٹھیک ہے لیکن میں تجدید کرنا بھول جاتا ہوں۔",
            timestamp: "3 hours ago",
            likes: 678
        },
        {
            name: "Sara L.",
            badge: "basic",
            stars: 3,
            textEng: "The 30-minute basic plan is too rushed. I could barely test the radar. Will try Standard next time.",
            textUrdu: "30 منٹ کا بنیادی پلان بہت جلدی ہے۔ میں بمشکل ریڈار کی جانچ کر سکا۔ اگلی بار معیاری آزماؤں گا۔",
            timestamp: "1 day ago",
            likes: 189
        },
        {
            name: "Ibn e Sina",
            badge: "premium",
            stars: 5,
            textEng: "Excellent service. The neural engine is ahead of its time. Keep up the great work, team!",
            textUrdu: "شاندار سروس۔ نیورل انجن اپنے وقت سے آگے ہے۔ عظیم کام جاری رکھیں، ٹیم!",
            timestamp: "30 minutes ago",
            likes: 2056
        }
    ];

    // Helper to generate star HTML
    function renderStars(rating) {
        let stars = '';
        for (let i = 0; i < 5; i++) {
            stars += i < rating ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
        }
        return stars;
    }

    // Render reviews into feed
    function renderReviews() {
        reviewsFeed.innerHTML = '';
        reviews.forEach(review => {
            const reviewCard = document.createElement('div');
            reviewCard.className = 'review-card';
            reviewCard.innerHTML = `
                <div class="review-header">
                    <span class="reviewer-name">${review.name}</span>
                    <span class="review-badge ${review.badge}">${review.badge.toUpperCase()}</span>
                </div>
                <div class="review-stars">${renderStars(review.stars)}</div>
                <div class="review-text bilingual">
                    <span class="english-text">${review.textEng}</span>
                    <span class="urdu-text">${review.textUrdu}</span>
                </div>
                <div class="review-footer">
                    <span><i class="fas fa-clock"></i> ${review.timestamp}</span>
                    <span><i class="fas fa-thumbs-up"></i> ${review.likes} likes</span>
                </div>
            `;
            reviewsFeed.appendChild(reviewCard);
        });
    }
    renderReviews();
});
