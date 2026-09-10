(() => {
  const toggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-site-nav]');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
    });
    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) {
        toggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('is-open');
      }
    });
  }

  const dropdowns = [...document.querySelectorAll('[data-nav-dropdown]')];
  dropdowns.forEach((dropdown) => {
    dropdown.addEventListener('toggle', () => {
      if (!dropdown.open) return;
      dropdowns.forEach((other) => {
        if (other !== dropdown) other.removeAttribute('open');
      });
    });
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-nav-dropdown]')) {
      dropdowns.forEach((dropdown) => dropdown.removeAttribute('open'));
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      dropdowns.forEach((dropdown) => dropdown.removeAttribute('open'));
    }
  });

  document.querySelectorAll('[data-map-load]').forEach((button) => {
    button.addEventListener('click', () => {
      const shell = button.closest('[data-map-shell]');
      if (!shell || shell.dataset.loaded === 'true') return;

      const iframe = document.createElement('iframe');
      iframe.className = 'map';
      iframe.title = 'Mapa de Restaurante Siete Mares en El Cangrejo';
      iframe.src = shell.dataset.mapSrc;
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      iframe.allowFullscreen = true;

      shell.replaceChildren(iframe);
      shell.dataset.loaded = 'true';
    });
  });

})();
