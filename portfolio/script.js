const menuBtn = document.getElementById("menuBtn");
const nav = document.getElementById("siteNav");
const form = document.getElementById("contactForm");
const formNote = document.getElementById("formNote");
const revealItems = document.querySelectorAll(".reveal");

menuBtn.addEventListener("click", () => {
  nav.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", nav.classList.contains("open"));
});

document.querySelectorAll("nav a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
  });
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
      }
    });
  },
  { threshold: 0.14 }
);

revealItems.forEach((item, index) => {
  item.style.transitionDelay = `${index * 80}ms`;
  observer.observe(item);
});

if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    formNote.textContent = "Thanks. Your message has been captured.";
    form.reset();
  });
}

document.getElementById("year").textContent = new Date().getFullYear();
