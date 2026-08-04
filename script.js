// ---------- theme toggle ----------
(function themeToggle() {
  const root = document.documentElement;
  const btn = document.getElementById('theme-toggle');
  const stored = localStorage.getItem('theme');
  if (stored) root.setAttribute('data-theme', stored);

  function label() {
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    const current = root.getAttribute('data-theme') || (prefersLight ? 'light' : 'dark');
    btn.textContent = 'theme: ' + current;
  }
  label();

  btn.addEventListener('click', () => {
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    const current = root.getAttribute('data-theme') || (prefersLight ? 'light' : 'dark');
    const next = current === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    label();
  });
})();

// ---------- mobile nav toggle ----------
(function mobileNav() {
  const toggle = document.getElementById('nav-toggle');
  const links = document.getElementById('nav-links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  links.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
})();

// ---------- active nav link on scroll ----------
(function activeNav() {
  const links = Array.from(document.querySelectorAll('.nav-links a'));
  const sections = links
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = '#' + entry.target.id;
        links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === id));
      });
    },
    { rootMargin: '-40% 0px -50% 0px', threshold: 0 }
  );

  sections.forEach((s) => observer.observe(s));
})();

// ---------- scroll reveal ----------
(function scrollReveal() {
  const els = document.querySelectorAll('.reveal');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    els.forEach((el) => el.classList.add('in-view'));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  els.forEach((el) => observer.observe(el));
})();

// ---------- hero ambient node-graph canvas ----------
(function heroCanvas() {
  const canvas = document.getElementById('hero-canvas');
  const ctx = canvas.getContext('2d');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let width, height, dpr;
  let nodes = [];
  let raf;

  function accentColor() {
    const styles = getComputedStyle(document.documentElement);
    return {
      dot: styles.getPropertyValue('--accent').trim() || '#e8a33d',
      line: styles.getPropertyValue('--accent-2').trim() || '#5b9ee8',
    };
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth = window.innerWidth;
    height = canvas.clientHeight = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.round((width * height) / 26000);
    nodes = Array.from({ length: Math.max(18, Math.min(46, count)) }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.12,
      r: Math.random() * 1.4 + 0.9,
      pulse: Math.random() * Math.PI * 2,
    }));
  }

  function step() {
    const { dot, line } = accentColor();
    ctx.clearRect(0, 0, width, height);

    nodes.forEach((n) => {
      n.x += n.vx;
      n.y += n.vy;
      n.pulse += 0.01;
      if (n.x < 0 || n.x > width) n.vx *= -1;
      if (n.y < 0 || n.y > height) n.vy *= -1;
    });

    const linkDist = Math.min(180, width / 5);
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < linkDist) {
          const alpha = (1 - dist / linkDist) * 0.16;
          ctx.strokeStyle = hexToRgba(line, alpha);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    nodes.forEach((n) => {
      const glow = (Math.sin(n.pulse) + 1) / 2;
      ctx.beginPath();
      ctx.fillStyle = hexToRgba(dot, 0.35 + glow * 0.45);
      ctx.arc(n.x, n.y, n.r + glow * 0.6, 0, Math.PI * 2);
      ctx.fill();
    });

    raf = requestAnimationFrame(step);
  }

  function hexToRgba(hex, alpha) {
    const h = hex.replace('#', '');
    const bigint = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    const r = (bigint >> 16) & 255, g = (bigint >> 8) & 255, b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function drawStatic() {
    const { dot, line } = accentColor();
    ctx.clearRect(0, 0, width, height);
    const linkDist = Math.min(180, width / 5);
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < linkDist) {
          ctx.strokeStyle = hexToRgba(line, (1 - dist / linkDist) * 0.14);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    nodes.forEach((n) => {
      ctx.beginPath();
      ctx.fillStyle = hexToRgba(dot, 0.5);
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  window.addEventListener('resize', () => {
    cancelAnimationFrame(raf);
    resize();
    if (reduced) drawStatic();
    else step();
  });

  resize();
  if (reduced) {
    drawStatic();
  } else {
    step();
  }
})();
