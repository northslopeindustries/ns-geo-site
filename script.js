    // Intersection Observer for fade-up animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } });
    }, { threshold: 0.12 });
    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

    // Animated counters
    function animateCounter(el) {
      const target = parseInt(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      const duration = 1600;
      const start = performance.now();
      function step(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          animateCounter(e.target);
          counterObserver.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('[data-target]').forEach(el => counterObserver.observe(el));

    // Smooth nav highlight
    const sections = document.querySelectorAll('section[id], div[id]');
    const navLinks = document.querySelectorAll('.nav-links a');
    window.addEventListener('scroll', () => {
      let current = '';
      sections.forEach(s => {
        if (window.scrollY >= s.offsetTop - 120) current = s.id;
      });
      navLinks.forEach(a => {
        a.style.color = a.getAttribute('href') === '#' + current ? 'var(--primary)' : '';
      });
    });

    // Form submit handler — posts to Netlify Forms (or any host supporting form-encoded POST to "/")
    function handleFormSubmit(event, form) {
      event.preventDefault();
      const btn = form.querySelector('.form-submit');
      const data = new FormData(form);
      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(data).toString()
      })
        .then((response) => {
          // fetch() resolves even for 4xx/5xx, so an unchecked .then() would
          // tell the customer "Request Sent" while Netlify refused the
          // submission and the lead was silently lost. Treat a bad status as
          // a failure so the error path below runs instead.
          if (!response.ok) throw new Error("Submission rejected: " + response.status);
          btn.textContent = "✓ Request Sent — We'll be in touch within 24 hours!";
          btn.style.background = '#16a34a';
          btn.disabled = true;
          form.reset();
        })
        .catch(() => {
          btn.textContent = "Something went wrong — please call (385) 437-6527";
          btn.style.background = '#dc2626';
        });
      return false;
    }
