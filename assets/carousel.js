const track = document.querySelector(".carousel-track");
const slides = Array.from(document.querySelectorAll(".carousel-item"));
const dots = Array.from(document.querySelectorAll(".carousel-dots .dot"));
const prevBtn = document.querySelector(".prev-btn");
const nextBtn = document.querySelector(".next-btn");

let currentIndex = 0;

function goToSlide(index) {
  if (!track || !slides.length) return;

  if (index < 0) index = slides.length - 1;
  if (index >= slides.length) index = 0;

  currentIndex = index;

  track.style.transform = `translateX(-${index * 100}%)`;

  if (dots.length) {
    dots.forEach((dot, i) => {
      dot.classList.toggle("active", i === index);
    });
  }
}

if (prevBtn) {
  prevBtn.addEventListener("click", () => {
    goToSlide(currentIndex - 1);
  });
}

if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    goToSlide(currentIndex + 1);
  });
}

if (dots.length) {
  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => {
      goToSlide(i);
    });
  });
}

// Set initial position
goToSlide(0);