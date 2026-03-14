/* ===========================
   SANJAI CAR TAXI - MAIN SCRIPTS
   =========================== */

// ── DOM Ready ──
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initMobileMenu();
  initScrollAnimations();
  initCounters();
  initBookingForm();
  initContactForm();
  initSmoothScroll();
  setMinDate();
});

// ── Navbar Scroll Effect ──
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }, { passive: true });
}

// ── Mobile Menu Toggle ──
function initMobileMenu() {
  const btn = document.getElementById('mobile-menu-btn');
  const navLinks = document.getElementById('nav-links');
  if (!btn || !navLinks) return;

  btn.addEventListener('click', () => {
    btn.classList.toggle('active');
    navLinks.classList.toggle('open');
    document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
  });

  // Close menu when a link is clicked
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      btn.classList.remove('active');
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('open')) {
      btn.classList.remove('active');
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
}

// ── Scroll Animations (Intersection Observer) ──
function initScrollAnimations() {
  const elements = document.querySelectorAll('.animate-on-scroll');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  elements.forEach(el => observer.observe(el));
}

// ── Counter Animation ──
function initCounters() {
  const counters = document.querySelectorAll('[data-target]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(counter => observer.observe(counter));
}

function animateCounter(el) {
  const target = parseInt(el.getAttribute('data-target'));
  const duration = 2000; // ms
  const step = target / (duration / 16);
  let current = 0;

  const timer = setInterval(() => {
    current += step;
    if (current >= target) {
      el.textContent = target + '+';
      clearInterval(timer);
    } else {
      el.textContent = Math.floor(current) + '+';
    }
  }, 16);
}

// ── Booking Form Handler ──
function initBookingForm() {
  const form = document.getElementById('booking-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const tripType = document.getElementById('trip-type').value;
    const pickup = document.getElementById('pickup').value;
    const dropoff = document.getElementById('dropoff').value;
    const date = document.getElementById('pickup-date').value;
    const time = document.getElementById('pickup-time').value;
    const name = document.getElementById('passenger-name').value;
    const phone = document.getElementById('passenger-phone').value;

    // Validate phone
    if (!/^[6-9]\d{9}$/.test(phone.replace(/\s/g, '').replace('+91', ''))) {
      showNotification('Please enter a valid 10-digit phone number', 'error');
      return;
    }

    // Compose details
    const tripTypeText = tripType === 'oneway' ? 'One Way' : 'Round Trip';
    const rawMessage = `🚕 *New Taxi Booking Request*\n\n` +
      `📌 *Trip Type:* ${tripTypeText}\n` +
      `📍 *Pickup:* ${pickup}\n` +
      `📍 *Drop:* ${dropoff}\n` +
      `📅 *Date:* ${date}\n` +
      `⏰ *Time:* ${time}\n` +
      `👤 *Name:* ${name}\n` +
      `📞 *Phone:* ${phone}`;

    // 1. WhatsApp Integration
    const whatsappUrl = `https://wa.me/917418954062?text=${encodeURIComponent(rawMessage)}`;
    window.open(whatsappUrl, '_blank');

    // 2. Email Integration (mailto)
    const emailSubject = `New Taxi Booking Request - ${name}`;
    const emailBody = rawMessage.replace(/\*/g, '').replace(/%0A/g, '\n');
    const mailtoUrl = `mailto:sanjaicartaxi@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

    // Slight delay for email to not conflict with WhatsApp window
    setTimeout(() => {
      window.location.href = mailtoUrl;
    }, 1000);

    showNotification('Booking request sent! Connecting to WhatsApp and Email...', 'success');
    form.reset();
  });
}

// ── Contact Form Handler ──
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('contact-name').value;
    const phone = document.getElementById('contact-phone').value;
    const email = document.getElementById('contact-email').value;
    const subject = document.getElementById('contact-subject').value;
    const messageText = document.getElementById('contact-message').value;

    // Compose WhatsApp message
    const message = `📩 *Contact Form Message*%0A%0A` +
      `👤 *Name:* ${name}%0A` +
      `📞 *Phone:* ${phone}%0A` +
      `📧 *Email:* ${email || 'Not provided'}%0A` +
      `📌 *Subject:* ${subject || 'General'}%0A` +
      `💬 *Message:* ${messageText}`;

    const whatsappUrl = `https://wa.me/919361778524?text=${message}`;
    window.open(whatsappUrl, '_blank');

    showNotification('Message sent successfully! We\'ll get back to you soon.', 'success');
    form.reset();
  });
}

// ── Notification Toast ──
function showNotification(message, type = 'success') {
  // Remove existing notification
  const existing = document.querySelector('.notification-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `notification-toast notification-${type}`;
  toast.innerHTML = `
    <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
    <span>${message}</span>
  `;

  // Styles
  Object.assign(toast.style, {
    position: 'fixed',
    top: '24px',
    right: '24px',
    zIndex: '10000',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '16px 24px',
    borderRadius: '12px',
    fontFamily: 'Inter, sans-serif',
    fontSize: '0.9rem',
    fontWeight: '500',
    color: 'white',
    background: type === 'success'
      ? 'linear-gradient(135deg, #10b981, #059669)'
      : 'linear-gradient(135deg, #ef4444, #dc2626)',
    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
    transform: 'translateX(120%)',
    transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    maxWidth: '400px'
  });

  document.body.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(0)';
  });

  // Auto remove
  setTimeout(() => {
    toast.style.transform = 'translateX(120%)';
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

// ── Smooth Scroll for Anchor Links ──
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const navbarHeight = document.getElementById('navbar')?.offsetHeight || 0;
        const marqueeHeight = document.querySelector('.marquee-bar')?.offsetHeight || 0;
        const offset = navbarHeight + marqueeHeight + 16;

        window.scrollTo({
          top: target.offsetTop - offset,
          behavior: 'smooth'
        });
      }
    });
  });
}

// ── Set Minimum Date for Date Picker ──
function setMinDate() {
  const dateInput = document.getElementById('pickup-date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
    dateInput.value = today;
  }
}
