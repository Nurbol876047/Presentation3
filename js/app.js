(function () {
  const slides = Array.from(document.querySelectorAll('.slide'));
  const total = slides.length;
  let current = 0;
  let animating = false;

  const progressFill = document.getElementById('progressFill');
  const curSlideEl = document.getElementById('curSlide');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const body = document.body;

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function animateIn(slide) {
    const items = slide.querySelectorAll('.reveal-up');
    gsap.killTweensOf(items);
    gsap.set(items, { opacity: 0, y: 22 });
    gsap.to(items, {
      opacity: 1, y: 0,
      duration: 0.8,
      ease: 'power3.out',
      stagger: 0.07,
      delay: 0.1,
    });
  }

  function goTo(index, direction) {
    if (animating || index === current || index < 0 || index >= total) return;
    animating = true;

    const outgoing = slides[current];
    const incoming = slides[index];
    const dir = direction || (index > current ? 1 : -1);

    const palette = incoming.dataset.palette || '0';
    body.setAttribute('data-palette', palette);
    if (window.setBgPalette) window.setBgPalette(parseInt(palette, 10));

    incoming.classList.add('active');
    gsap.set(incoming, { opacity: 0 });
    gsap.set(incoming.querySelector('.slide-inner'), { x: dir * 40, opacity: 0, scale: 0.98 });

    gsap.to(outgoing.querySelector('.slide-inner'), {
      x: -dir * 40, opacity: 0, scale: 0.98,
      duration: 0.55, ease: 'power2.inOut',
    });
    gsap.to(outgoing, {
      opacity: 0, duration: 0.55, ease: 'power2.inOut',
      onComplete() {
        outgoing.classList.remove('active');
        gsap.set(outgoing.querySelector('.slide-inner'), { clearProps: 'transform,opacity' });
      },
    });

    gsap.to(incoming, { opacity: 1, duration: 0.6, ease: 'power2.inOut' });
    gsap.to(incoming.querySelector('.slide-inner'), {
      x: 0, opacity: 1, scale: 1,
      duration: 0.7, ease: 'power3.out',
      onComplete() {
        animating = false;
      },
    });

    animateIn(incoming);

    current = index;
    const pct = ((current + 1) / total) * 100;
    progressFill.style.width = pct + '%';
    curSlideEl.textContent = pad(current + 1);
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === total - 1;
  }

  function next() { goTo(current + 1, 1); }
  function prev() { goTo(current - 1, -1); }

  // init first slide
  slides[0].classList.add('active');
  body.setAttribute('data-palette', slides[0].dataset.palette || '0');
  if (window.setBgPalette) window.setBgPalette(parseInt(slides[0].dataset.palette || '0', 10));
  animateIn(slides[0]);
  prevBtn.disabled = true;

  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);
  document.getElementById('zoneLeft').addEventListener('click', prev);
  document.getElementById('zoneRight').addEventListener('click', next);

  // fullscreen toggle
  const fsBtn = document.getElementById('fsBtn');
  const fsExpand = fsBtn.querySelector('.fs-icon-expand');
  const fsShrink = fsBtn.querySelector('.fs-icon-shrink');

  function updateFsIcon() {
    const isFs = !!document.fullscreenElement;
    fsExpand.hidden = isFs;
    fsShrink.hidden = !isFs;
    fsBtn.setAttribute('aria-label', isFs ? 'Толық экраннан шығу' : 'Толық экран');
    fsBtn.title = isFs ? 'Толық экраннан шығу' : 'Толық экран';
  }

  fsBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  document.addEventListener('fullscreenchange', updateFsIcon);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'f' || e.key === 'F') fsBtn.click();
  });

  window.addEventListener('keydown', (e) => {
    if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); next(); }
    else if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); prev(); }
    else if (e.key === 'Home') goTo(0, -1);
    else if (e.key === 'End') goTo(total - 1, 1);
  });

  // touch swipe
  let touchStartX = null;
  window.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  window.addEventListener('touchend', (e) => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) { dx < 0 ? next() : prev(); }
    touchStartX = null;
  }, { passive: true });

  // mouse wheel (debounced)
  let wheelLock = false;
  window.addEventListener('wheel', (e) => {
    if (wheelLock) return;
    if (Math.abs(e.deltaY) < 24) return;
    wheelLock = true;
    e.deltaY > 0 ? next() : prev();
    setTimeout(() => { wheelLock = false; }, 650);
  }, { passive: true });
})();
