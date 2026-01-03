/* ========================================
   SUMWORDS LANDING PAGE JAVASCRIPT
   Handles smooth scrolling and animations
   ======================================== */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {
  // ========================================
  // THEME TOGGLE FUNCTIONALITY
  // ========================================

  const themeToggle = document.getElementById('theme-toggle');
  const html = document.documentElement;
  const THEME_KEY = 'sumwords_landing_theme';

  /**
   * Get the initial theme to apply
   * Priority: 1) localStorage, 2) system preference, 3) light mode default
   */
  function getInitialTheme() {
    // Check localStorage first
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme) {
      return savedTheme;
    }

    // Check system preference
    if (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark';
    }

    // Default to light
    return 'light';
  }

  /**
   * Apply theme to the page
   * @param {string} theme - 'light' or 'dark'
   */
  function applyTheme(theme) {
    if (theme === 'dark') {
      html.setAttribute('data-theme', 'dark');
    } else {
      html.removeAttribute('data-theme');
    }
    localStorage.setItem(THEME_KEY, theme);
  }

  /**
   * Toggle between light and dark themes
   */
  function toggleTheme() {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);

    // Log theme change for debugging
    console.log(`Theme switched to: ${newTheme}`);
  }

  // Apply initial theme immediately (before page renders)
  const initialTheme = getInitialTheme();
  applyTheme(initialTheme);
  console.log(`Initial theme applied: ${initialTheme}`);

  // Add click handler to toggle button
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // Listen for system theme changes (if user changes OS setting while page is open)
  if (window.matchMedia) {
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => {
        // Only auto-switch if user hasn't manually set a preference
        const savedTheme = localStorage.getItem(THEME_KEY);
        if (!savedTheme) {
          const newTheme = e.matches ? 'dark' : 'light';
          applyTheme(newTheme);
          console.log(`System theme changed, applied: ${newTheme}`);
        }
      });
  }

  // ========================================
  // EXISTING FUNCTIONALITY
  // ========================================

  // Smooth scroll for anchor links (if any added in future)
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    });
  });

  // Add fade-in animation to sections on scroll
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
  };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  // Observe all major sections
  const sections = document.querySelectorAll(
    '.stats, .how-to-play, .features, .categories, .cta'
  );
  sections.forEach((section) => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(20px)';
    section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(section);
  });

  // Animate stat numbers counting up
  const animateStats = () => {
    const statNumbers = document.querySelectorAll('.stat-number');

    statNumbers.forEach((stat) => {
      const target = parseInt(stat.textContent);
      const duration = 1500; // 1.5 seconds
      const increment = target / (duration / 16); // 60fps
      let current = 0;

      const updateNumber = () => {
        current += increment;
        if (current < target) {
          stat.textContent = Math.floor(current);
          requestAnimationFrame(updateNumber);
        } else {
          stat.textContent = target;
        }
      };

      updateNumber();
    });
  };

  // Trigger stat animation when stats section is visible
  const statsSection = document.querySelector('.stats');
  const statsObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateStats();
          statsObserver.unobserve(entry.target); // Only animate once
        }
      });
    },
    { threshold: 0.5 }
  );

  if (statsSection) {
    statsObserver.observe(statsSection);
  }

  // Add hover effect to feature cards
  const featureCards = document.querySelectorAll('.feature-card');
  featureCards.forEach((card) => {
    card.addEventListener('mouseenter', function () {
      this.style.transform = 'translateY(-5px) scale(1.02)';
    });

    card.addEventListener('mouseleave', function () {
      this.style.transform = 'translateY(0) scale(1)';
    });
  });

  // Log page load for analytics (placeholder for future tracking)
  console.log('Sumwords landing page loaded');
  console.log('Ready to play at:', new Date().toISOString());
});
