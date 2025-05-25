// web/public/js/effects.js - Advanced Effects and Interactions

document.addEventListener('DOMContentLoaded', function() {
  // Preloader
  const preloader = document.querySelector('.preloader');
  if (preloader) {
    setTimeout(() => {
      preloader.classList.add('fade-out');
      setTimeout(() => {
        preloader.remove();
      }, 500);
    }, 1500);
  }

  // Particle Background
  createParticleBackground();

  // Scroll Effects
  initScrollEffects();

  // Tab Indicator
  initTabIndicator();

  // Advanced Interactions
  initAdvancedInteractions();

  // Performance Monitoring
  monitorPerformance();
});

// Create Animated Particle Background
function createParticleBackground() {
  const particleContainer = document.createElement('div');
  particleContainer.className = 'particle-background';

  for (let i = 0; i < 15; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 6 + 's';
    particle.style.animationDuration = (Math.random() * 3 + 4) + 's';
    particleContainer.appendChild(particle);
  }

  document.body.appendChild(particleContainer);
}

// Scroll-triggered Animations
function initScrollEffects() {
  const navbar = document.querySelector('.navbar');
  const revealElements = document.querySelectorAll('.section, .stat-card, .option-card');

  // Navbar scroll effect
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Reveal elements on scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal', 'active');
      }
    });
  }, { threshold: 0.1 });

  revealElements.forEach(el => {
    el.classList.add('reveal');
    observer.observe(el);
  });
}

// Advanced Tab Indicator
function initTabIndicator() {
  const tabs = document.querySelector('.tabs');
  if (!tabs) return;

  const tabButtons = tabs.querySelectorAll('.tab-btn');
  const indicator = document.createElement('div');
  indicator.className = 'tab-indicator';
  tabs.appendChild(indicator);

  function updateIndicator(activeTab) {
    const rect = activeTab.getBoundingClientRect();
    const tabsRect = tabs.getBoundingClientRect();

    indicator.style.width = rect.width + 'px';
    indicator.style.left = (rect.left - tabsRect.left) + 'px';
  }

  // Initialize indicator position
  const activeTab = tabs.querySelector('.tab-btn.active');
  if (activeTab) {
    updateIndicator(activeTab);
  }

  // Update indicator on tab click
  tabButtons.forEach(tab => {
    tab.addEventListener('click', () => {
      updateIndicator(tab);
    });
  });
}

// Advanced Interactions
function initAdvancedInteractions() {
  // Magnetic buttons
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(button => {
    button.addEventListener('mousemove', (e) => {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      button.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px) scale(1.02)`;
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translate(0, 0) scale(1)';
    });
  });

  // Parallax effect for header
  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallax = document.querySelector('header');
    if (parallax) {
      const speed = scrolled * 0.5;
      parallax.style.transform = `translateY(${speed}px)`;
    }
  });

  // Interactive file upload
  const uploadArea = document.querySelector('.file-upload-area');
  if (uploadArea) {
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('dragging');
    });

    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('dragging');
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragging');
      // Add a success animation
      uploadArea.style.animation = 'pulse 0.6s ease';
      setTimeout(() => {
        uploadArea.style.animation = '';
      }, 600);
    });
  }
}

// Performance Monitoring
function monitorPerformance() {
  // Reduce animations on lower-end devices
  if (navigator.hardwareConcurrency < 4) {
    document.body.classList.add('reduced-motion');
  }

  // Pause animations when tab is not visible
  document.addEventListener('visibilitychange', () => {
    const particles = document.querySelectorAll('.particle');
    particles.forEach(particle => {
      if (document.hidden) {
        particle.style.animationPlayState = 'paused';
      } else {
        particle.style.animationPlayState = 'running';
      }
    });
  });
}

// Utility: Create ripple effect
function createRipple(event, element) {
  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;

  const ripple = document.createElement('div');
  ripple.style.cssText = `
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.5);
    transform: scale(0);
    animation: ripple 0.6s linear;
    left: ${x}px;
    top: ${y}px;
    width: ${size}px;
    height: ${size}px;
  `;

  element.appendChild(ripple);

  setTimeout(() => {
    ripple.remove();
  }, 600);
}

// Add ripple effect to buttons
document.addEventListener('click', (e) => {
  if (e.target.matches('.btn')) {
    createRipple(e, e.target);
  }
});
