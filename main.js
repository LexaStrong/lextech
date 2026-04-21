/* ============================================================
   LEXTECH — MAIN JAVASCRIPT
   ============================================================ */

'use strict';

/* ── Utility ─────────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ============================================================
   1. THEME TOGGLE (Dark / Light Mode)
   ============================================================ */
const ThemeManager = (() => {
  const STORAGE_KEY = 'lextech-theme';
  const btn = $('#theme-toggle-btn');
  const html = document.documentElement;

  function getPreferred() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    return 'light';
  }

  function apply(theme) {
    html.setAttribute('data-theme', theme);
    if (btn) btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    localStorage.setItem(STORAGE_KEY, theme);
  }

  function toggle() {
    const current = html.getAttribute('data-theme') || 'light';
    apply(current === 'dark' ? 'light' : 'dark');
  }

  function init() {
    apply(getPreferred());
    if (btn) btn.addEventListener('click', toggle);
  }

  return { init };
})();

/* ============================================================
   2. NAVBAR — Scroll Shrink & Active Link
   ============================================================ */
const NavbarManager = (() => {
  const navbar = $('#navbar');
  const links  = $$('.nav-link, .mobile-link');

  function updateScroll() {
    const scrolled = window.scrollY > 20;
    navbar?.classList.toggle('scrolled', scrolled);
  }

  function setActiveLink() {
    const scrollY = window.scrollY + 120;
    const sections = $$('section[id], div[id]');
    let current = '';

    sections.forEach(sec => {
      if (sec.offsetTop <= scrollY) current = sec.id;
    });

    links.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) link.classList.add('active');
    });
  }

  function init() {
    updateScroll();
    setActiveLink();
    window.addEventListener('scroll', () => { updateScroll(); setActiveLink(); }, { passive: true });
  }

  return { init };
})();

/* ============================================================
   3. MOBILE MENU — Hamburger Toggle
   ============================================================ */
const MobileMenu = (() => {
  const btn  = $('#hamburger-btn');
  const menu = $('#mobile-menu');

  function open() {
    menu?.classList.add('open');
    btn?.classList.add('open');
    btn?.setAttribute('aria-expanded', 'true');
    menu?.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    menu?.classList.remove('open');
    btn?.classList.remove('open');
    btn?.setAttribute('aria-expanded', 'false');
    menu?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function toggle() {
    menu?.classList.contains('open') ? close() : open();
  }

  function init() {
    btn?.addEventListener('click', toggle);

    // Close on mobile link click
    $$('.mobile-link, .mobile-cta').forEach(link => {
      link.addEventListener('click', close);
    });

    // Close on outside click
    document.addEventListener('click', e => {
      if (menu?.classList.contains('open') &&
          !menu.contains(e.target) &&
          !btn?.contains(e.target)) {
        close();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && menu?.classList.contains('open')) close();
    });
  }

  return { init };
})();

/* ============================================================
   4. SMOOTH SCROLL — Offset for fixed navbar
   ============================================================ */
const SmoothScroll = (() => {
  const NAV_HEIGHT = 80;

  function init() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', e => {
        const id = anchor.getAttribute('href').slice(1);
        if (!id) return;
        const target = document.getElementById(id);
        if (!target) return;

        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT;
        window.scrollTo({ top, behavior: 'smooth' });
      });
    });
  }

  return { init };
})();

/* ============================================================
   5. SCROLL ANIMATIONS — Intersection Observer
   ============================================================ */
const AnimationObserver = (() => {
  let observer;

  function init() {
    const elements = $$('[data-animate]');
    if (!elements.length) return;

    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      elements.forEach(el => el.classList.add('in-view'));
      return;
    }

    observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -48px 0px' });

    // Stagger children inside grids
    const staggerParents = $$('.services-grid, .about-pillars, .testimonials-grid, .process-steps, .why-features');
    staggerParents.forEach(parent => {
      const children = $$('[data-animate]', parent);
      children.forEach((child, i) => {
        child.style.transitionDelay = `${i * 80}ms`;
      });
    });

    elements.forEach(el => observer.observe(el));
  }

  return { init };
})();

/* ============================================================
   6. CONTACT FORM — Validation & Submission
   ============================================================ */
const ContactForm = (() => {
  const form    = $('#contact-form');
  const wrapper = $('.contact-form-wrap');

  function showError(input, message) {
    input.classList.add('error');
    const existing = input.parentElement.querySelector('.field-error');
    if (!existing) {
      const err = document.createElement('span');
      err.className = 'field-error';
      err.style.cssText = 'display:block;font-size:.75rem;color:#ef4444;margin-top:4px;';
      err.textContent = message;
      input.parentElement.appendChild(err);
    }
  }

  function clearError(input) {
    input.classList.remove('error');
    input.parentElement.querySelector('.field-error')?.remove();
  }

  function validate() {
    let valid = true;
    const name    = $('#contact-name');
    const email   = $('#contact-email-input');
    const message = $('#contact-message');

    [name, email, message].forEach(clearError);

    if (!name?.value.trim()) {
      showError(name, 'Please enter your full name.');
      valid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email?.value.trim()) {
      showError(email, 'Please enter your email address.');
      valid = false;
    } else if (!emailRegex.test(email.value.trim())) {
      showError(email, 'Please enter a valid email address.');
      valid = false;
    }

    if (!message?.value.trim()) {
      showError(message, 'Please tell us about your project.');
      valid = false;
    }

    return valid;
  }

  function setLoading(loading) {
    const btn = $('#contact-submit-btn');
    if (!btn) return;
    btn.disabled = loading;
    btn.classList.toggle('loading', loading);
    const text = btn.querySelector('.btn-text');
    if (text) text.textContent = loading ? 'Sending…' : 'Send Message';
  }

  function showSuccess() {
    if (!wrapper) return;
    wrapper.innerHTML = `
      <div class="form-success" role="status" aria-live="polite">
        <div class="form-success-icon" aria-hidden="true">✓</div>
        <h3>Message sent!</h3>
        <p>Thank you for reaching out. We'll get back to you within one business day.</p>
      </div>
    `;
  }

  function init() {
    if (!form) return;

    // Clear errors on input
    $$('.form-input', form).forEach(input => {
      input.addEventListener('input', () => clearError(input));
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validate()) return;

      setLoading(true);

      // Simulate async form submission (replace with real endpoint)
      await new Promise(resolve => setTimeout(resolve, 1400));

      setLoading(false);
      showSuccess();
    });
  }

  return { init };
})();

/* ============================================================
   7. HERO CARD — Progress bar trigger on load
   ============================================================ */
const HeroVisual = (() => {
  function init() {
    // Stagger the floating node animations
    $$('.float-node').forEach((node, i) => {
      node.style.animationDelay = `${i * 0.6}s`;
    });
  }

  return { init };
})();

/* ============================================================
   8. NAV ACTIVE STATE — add CSS for active
   ============================================================ */
const injectActiveStyles = () => {
  const style = document.createElement('style');
  style.textContent = `
    .nav-link.active {
      color: var(--clr-primary) !important;
      background: var(--clr-accent-soft) !important;
    }
    .mobile-link.active {
      color: var(--clr-primary) !important;
      background: var(--clr-surface) !important;
    }
  `;
  document.head.appendChild(style);
};

/* ============================================================
   INIT — Run everything when DOM is ready
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  injectActiveStyles();
  ThemeManager.init();
  NavbarManager.init();
  MobileMenu.init();
  SmoothScroll.init();
  AnimationObserver.init();
  ContactForm.init();
  HeroVisual.init();
});
