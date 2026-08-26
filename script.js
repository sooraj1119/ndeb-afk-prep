document.addEventListener('DOMContentLoaded', () => {
    // Scroll animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in-up, .fade-in-left, .fade-in-right').forEach((el) => {
        observer.observe(el);
    });

    // Form Validation & Modal
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        const inputs = bookingForm.querySelectorAll('input[required], select[required], textarea[required]');

        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                if (input.checkValidity()) {
                    input.classList.remove('is-invalid');
                    input.classList.add('is-valid');
                } else {
                    input.classList.remove('is-valid');
                    input.classList.add('is-invalid');
                }
            });
        });

        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            let isValid = true;
            inputs.forEach(input => {
                if (!input.checkValidity()) {
                    isValid = false;
                    input.classList.add('is-invalid');
                }
            });

            if (isValid) {
                document.getElementById('success-modal').classList.add('show');
                bookingForm.reset();
                inputs.forEach(input => {
                    input.classList.remove('is-valid', 'is-invalid');
                });
            }
        });
    }

    const closeModal = document.getElementById('close-modal');
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            document.getElementById('success-modal').classList.remove('show');
        });
    }
});

// Navbar Scroll & Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.querySelector('.navbar');
    
    // Scroll Effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-links');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    // FAQ Drawer Logic
    const faqBtn = document.getElementById('faq-toggle');
    const faqDrawer = document.getElementById('faq-drawer');
    const faqOverlay = document.getElementById('faq-overlay');
    const closeFaqBtn = document.getElementById('close-faq');

    if (faqBtn && faqDrawer && faqOverlay && closeFaqBtn) {
        const toggleFaq = () => {
            faqDrawer.classList.toggle('open');
            faqOverlay.classList.toggle('open');
            // Prevent body scroll when drawer is open
            document.body.style.overflow = faqDrawer.classList.contains('open') ? 'hidden' : '';
        };

        faqBtn.addEventListener('click', toggleFaq);
        closeFaqBtn.addEventListener('click', toggleFaq);
        faqOverlay.addEventListener('click', toggleFaq);
    }
});
