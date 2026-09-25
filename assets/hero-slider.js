class ZeeneHeroSlider {
  constructor(element) {
    this.slider = element;
    this.container = element.querySelector('.js-slider-container');
    this.slides = element.querySelectorAll('.hero-slider__image');
    this.dots = element.querySelectorAll('.hero-slider__dot');
    this.currentSlide = 0;
    this.startX = 0;
    this.isDragging = false;
    this.dragThreshold = 5;
    this.autoplayEnabled = this.slider.dataset.autoplay === 'true';
    this.autoplaySpeed = parseInt(this.slider.dataset.autoplaySpeed, 10) || 5000;
    this.autoplayTimer = null;
    this.isAnimating = false;

    if (this.slides.length <= 1) {
      this.ensureInitialActive();
      this.applyGradientFromActive();
      return;
    }

    this.ensureInitialActive();
    this.initializeSlider();
    this.applyGradientFromActive();
  }

  ensureInitialActive() {
    const slidesArr = Array.from(this.slides);
    let activeIndex = slidesArr.findIndex((s) => s.classList.contains('active'));
    if (activeIndex < 0) {
      activeIndex = 0;
      this.slides[0]?.classList.add('active');
      this.dots[0]?.classList.add('active');
    } else {
      slidesArr.forEach((s, i) => {
        if (i !== activeIndex) s.classList.remove('active');
      });
      this.dots.forEach((d, i) => d.classList.toggle('active', i === activeIndex));
    }
    this.currentSlide = activeIndex;
  }

  applyGradientFromActive() {
    const gradient = this.slides[this.currentSlide]?.dataset.gradient;
    if (gradient) this.slider.style.background = gradient;
  }

  initializeSlider() {
    this.container.addEventListener('touchstart', (e) => this.handleDragStart(e), { passive: true });
    this.container.addEventListener('touchmove', (e) => this.handleDragMove(e), { passive: false });
    this.container.addEventListener('touchend', () => this.handleDragEnd());
    this.container.addEventListener('mousedown', (e) => this.handleDragStart(e));
    this.container.addEventListener('mousemove', (e) => this.handleDragMove(e));
    this.container.addEventListener('mouseup', () => this.handleDragEnd());
    this.container.addEventListener('mouseleave', () => this.handleDragEnd());
    this.container.addEventListener('click', (e) => {
      if (this.isDragging) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    this.dots.forEach((dot) => {
      dot.addEventListener('click', () => this.goToSlide(parseInt(dot.dataset.index, 10)));
    });

    if (this.autoplayEnabled) {
      this.startAutoplay();
      this.container.addEventListener('mouseenter', () => this.stopAutoplay());
      this.container.addEventListener('mouseleave', () => this.startAutoplay());
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) this.stopAutoplay();
        else this.startAutoplay();
      });
    }
  }

  handleDragStart(e) {
    if (this.isAnimating) return;
    this.isDragging = false;
    this.startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    this.stopAutoplay();
  }

  handleDragMove(e) {
    if (this.startX === 0 || this.isAnimating) return;
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const diff = this.startX - clientX;
    if (Math.abs(diff) > this.dragThreshold) {
      this.isDragging = true;
      e.preventDefault();
    }
    if (this.isDragging && Math.abs(diff) > 50) {
      if (diff > 0) this.goToNextSlide();
      else this.goToPrevSlide();
      this.handleDragEnd();
    }
  }

  handleDragEnd() {
    this.startX = 0;
    setTimeout(() => {
      this.isDragging = false;
    }, 100);
    if (this.autoplayEnabled) this.startAutoplay();
  }

  goToNextSlide() {
    this.goToSlide((this.currentSlide + 1) % this.slides.length);
  }

  goToPrevSlide() {
    this.goToSlide((this.currentSlide - 1 + this.slides.length) % this.slides.length);
  }

  goToSlide(index) {
    if (this.isAnimating || index === this.currentSlide) return;
    if (index < 0 || index >= this.slides.length) return;
    this.isAnimating = true;
    const currentSlideEl = this.slides[this.currentSlide];
    const nextSlideEl = this.slides[index];

    currentSlideEl.classList.remove('active');
    this.dots.forEach((dot) => dot.classList.remove('active'));

    requestAnimationFrame(() => {
      this.currentSlide = index;
      this.applyGradientFromActive();
      nextSlideEl.classList.add('active');
      this.dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
      setTimeout(() => {
        this.isAnimating = false;
      }, 600);
    });
  }

  startAutoplay() {
    this.stopAutoplay();
    this.autoplayTimer = setInterval(() => this.goToNextSlide(), this.autoplaySpeed);
  }

  stopAutoplay() {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }
}

function initZeeneHeroSliders() {
  document.querySelectorAll('.js-hero-slider').forEach((slider) => {
    if (slider.dataset.heroSliderBound === 'true') return;
    slider.dataset.heroSliderBound = 'true';
    new ZeeneHeroSlider(slider);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initZeeneHeroSliders);
} else {
  initZeeneHeroSliders();
}

document.addEventListener('shopify:section:load', initZeeneHeroSliders);
