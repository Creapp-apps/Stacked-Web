// ═══════════ SHARED LOGIC FOR INNER PAGES ═══════════

// FAQ Accordion
document.querySelectorAll('.faq-question').forEach((btn) => {
    btn.addEventListener('click', () => {
        const item = btn.parentElement;
        const wasActive = item.classList.contains('active');
        document.querySelectorAll('.faq-item').forEach((i) => i.classList.remove('active'));
        if (!wasActive) item.classList.add('active');
    });
});

// Reveal on scroll
const revealObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
);
document.querySelectorAll('[data-reveal]').forEach((el) => revealObserver.observe(el));

// Contact Form (Supabase)
const SUPABASE_URL = 'https://dmsopzbozbcvbvxhpkln.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtc29wemJvemJjdmJ2eGhwa2xuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNTMyOTYsImV4cCI6MjA4OTgyOTI5Nn0.FIhQPzLPrtNvBPYU-D_vDgjhlx4W6NaYCvLojf6UW_4';

const contactForm = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');

if (contactForm) {
    const toastOverlay = document.getElementById('toast-overlay');
    const toastClose = document.getElementById('toast-close');

    function showToast() {
        toastOverlay.classList.add('visible');
    }

    function hideToast() {
        toastOverlay.classList.remove('visible');
    }

    if (toastClose) toastClose.addEventListener('click', hideToast);
    if (toastOverlay) toastOverlay.addEventListener('click', (e) => {
        if (e.target === toastOverlay) hideToast();
    });

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = contactForm.querySelector('.form-submit');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';

        const formData = {
            name: contactForm.nombre.value.trim(),
            email: contactForm.email.value.trim(),
            phone: contactForm.telefono.value.trim(),
            business: contactForm.local.value.trim(),
            message: contactForm.mensaje.value.trim(),
        };

        try {
            if (typeof supabase !== 'undefined') {
                const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                const { error } = await sb.from('contact_leads').insert([formData]);
                if (error) throw error;
            }

            contactForm.reset();
            showToast();
        } catch (err) {
            console.error('Form error:', err);
            alert('Hubo un error al enviar. Intentá de nuevo.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Quiero Stacked →';
        }
    });
}

// ═══════════ PRICING MODULES ACCORDION ═══════════
document.querySelectorAll('.module-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
        const item = btn.parentElement;
        const wasActive = item.classList.contains('active');
        
        // Find other modules in the SAME pricing card and deactivate them
        const card = btn.closest('.pricing-card');
        if (card) {
            card.querySelectorAll('.module-item').forEach((i) => {
                i.classList.remove('active');
                const content = i.querySelector('.module-content');
                if (content) content.style.maxHeight = null;
            });
        }
        
        const content = item.querySelector('.module-content');
        if (!wasActive) {
            item.classList.add('active');
            if (content) {
                content.style.maxHeight = content.scrollHeight + 'px';
            }
        } else {
            item.classList.remove('active');
            if (content) {
                content.style.maxHeight = null;
            }
        }
    });
});

// Initialize active modules heights on load
setTimeout(() => {
    document.querySelectorAll('.module-item.active').forEach((item) => {
        const content = item.querySelector('.module-content');
        if (content) {
            content.style.maxHeight = content.scrollHeight + 'px';
        }
    });
}, 150);

// ═══════════ COMMISSION MODAL & TOP BANNER ═══════════
const commissionModal = document.getElementById('commission-modal');
const closeCommissionModalBtn = document.getElementById('close-commission-modal');
const commissionTopBanner = document.getElementById('commission-top-banner');

if (commissionModal) {
    // Show modal after 3.5 seconds
    setTimeout(() => {
        commissionModal.classList.add('active');
    }, 3500);

    // Close modal event
    if (closeCommissionModalBtn) {
        closeCommissionModalBtn.addEventListener('click', () => {
            // Trigger exit animation
            commissionModal.classList.add('closing');

            // Wait for transition to finish (500ms)
            setTimeout(() => {
                commissionModal.classList.remove('active');
                commissionModal.classList.remove('closing');

                // Reveal permanent top banner
                if (commissionTopBanner) {
                    commissionTopBanner.classList.remove('hidden');
                    // Add reveal class to trigger slide down and fade in
                    setTimeout(() => {
                        commissionTopBanner.classList.add('reveal-banner');
                    }, 50);
                }
            }, 500);
        });
    }
}
