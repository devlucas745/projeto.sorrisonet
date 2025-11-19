let slideIndex = 0;
let slides = document.querySelectorAll(".slides img");
let dots = document.querySelectorAll(".dot");
let timer;

function showSlide(n) {
  slides.forEach((slide, i) => {
    slide.classList.remove("active");
    dots[i].classList.remove("active");
    if (i === n) {
      slide.classList.add("active");
      dots[i].classList.add("active");
    }
  });
  slideIndex = n;
}

function nextSlide() {
  slideIndex = (slideIndex + 1) % slides.length;
  showSlide(slideIndex);
}

function prevSlide() {
  slideIndex = (slideIndex - 1 + slides.length) % slides.length;
  showSlide(slideIndex);
}

function currentSlide(n) {
  showSlide(n);
}

document.querySelector(".next").addEventListener("click", () => {
  nextSlide();
  resetTimer();
});
document.querySelector(".prev").addEventListener("click", () => {
  prevSlide();
  resetTimer();
});
dots.forEach((dot, i) => {
  dot.addEventListener("click", () => {
    currentSlide(i);
    resetTimer();
  });
});

function startTimer() {
  timer = setInterval(nextSlide, 4000); // troca a cada 4s
}

function resetTimer() {
  clearInterval(timer);
  startTimer();
}

startTimer();
