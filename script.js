const carousel = document.querySelector(".video-carousel");
const track = document.querySelector(".video-track");
const originals = Array.from(track.children);

const SPEED = 300;        // pixels per second
const SPEED_REDUCED = 200; // slower when the OS asks for reduced motion
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let cards = [];
let setWidth = 0;
let step = 0;
let offset = 0;
let paused = false;
let centerFocus = 0;
let lastTime = 0;
let firstBuild = true;

// Build enough cloned sets to fill any screen width
function build() {
  track.querySelectorAll("[data-clone]").forEach(c => c.remove());
  cards = [...originals];

  const first = originals[0];
  step = first.offsetWidth + parseFloat(getComputedStyle(first).marginRight);
  setWidth = step * originals.length;

  const sets = Math.ceil(carousel.clientWidth / setWidth) + 1;
  for (let i = 0; i < sets; i++) {
    originals.forEach(card => {
      const clone = card.cloneNode(true);
      clone.dataset.clone = "";
      clone.setAttribute("aria-hidden", "true");
      clone.setAttribute("inert", "");
      track.appendChild(clone);
      cards.push(clone);
    });
  }

  // Start with the first video centered
  if (firstBuild) {
    offset = setWidth - (carousel.clientWidth / 2 - first.offsetWidth / 2);
    firstBuild = false;
  }
  offset %= setWidth;
}

function frame(time) {
  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;

  if (!paused) {
    const speed = reduceMotion.matches ? SPEED_REDUCED : SPEED;
    offset = (offset + speed * (1 - 0.75 * centerFocus) * dt) % setWidth;
    track.style.transform = `translate3d(${-offset}px, 0, 0)`;
  }

  // How close is each card to the centre of the carousel?
  const box = carousel.getBoundingClientRect();
  const centerX = box.left + box.width / 2;

  let best = 0.01;
  for (const card of cards) {
    const r = card.getBoundingClientRect();
    const dist = Math.abs(r.left + r.width / 2 - centerX);
    const t = Math.max(0, 1 - dist / step);   // 1 at centre, 0 one card away
    const focus = t * t * (3 - 2 * t);        // smooth easing
    best = Math.max(best, focus);
    card.style.setProperty("--focus", focus.toFixed(3));
    card.style.zIndex = Math.round(focus * 10);
  }
  centerFocus = best;

  requestAnimationFrame(frame);
}

// Pause while hovering so a video can be watched
carousel.addEventListener("mouseenter", () => (paused = true));
carousel.addEventListener("mouseleave", () => (paused = false));

// Rebuild on resize / motion-preference change
let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(build, 150);
});

build();
requestAnimationFrame(frame);