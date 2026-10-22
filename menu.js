    // Phone menu: the three-line button in the top bar opens and closes the
    // list of pages and sections. It only shows on small screens (see the
    // PHONE MENU styles in styles.css); the desktop menu is unaffected.
    (function () {
      const button = document.querySelector('.menu-toggle');
      const menu = document.getElementById('mobile-menu');
      if (!button || !menu) return;

      function setOpen(open) {
        button.setAttribute('aria-expanded', open ? 'true' : 'false');
        button.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        menu.hidden = !open;
      }

      button.addEventListener('click', () => setOpen(menu.hidden));

      // Tapping a link goes there and closes the menu.
      menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));

      // Escape closes the menu and puts keyboard focus back on the button.
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !menu.hidden) { setOpen(false); button.focus(); }
      });

      // Turning a tablet or widening the window to desktop size closes it.
      window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && !menu.hidden) setOpen(false);
      });
    })();
