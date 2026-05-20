const detailModal = document.getElementById("detail-modal");
const closeDetailButton = document.getElementById("close-modal-button");
const closeOrderButton = document.getElementById("close-order-modal-button");
const detailModalContent = document.getElementById("detail-modal-content");
const orderModal = document.getElementById("order-modal");
const orderModalForm = document.getElementById("order-modal-form");

let scrollPosition = 0;

function syncModalOpenState() {
  const anyModalOpen =
    detailModal.classList.contains("is-open") ||
    orderModal.classList.contains("is-open");
  document.body.classList.toggle("modal-open", anyModalOpen);
  document.documentElement.classList.toggle("modal-open", anyModalOpen);
}

function isOverlayScrollLockActive() {
  const html = document.documentElement;
  return (
    html.classList.contains("modal-open") ||
    html.classList.contains("menu-open")
  );
}

function trapScrollBehindOverlays(event) {
  if (!isOverlayScrollLockActive()) return;
  if (
    event.target.closest(".modal-container") ||
    event.target.closest("[data-menu]")
  )
    return;
  event.preventDefault();
}

document.addEventListener("touchmove", trapScrollBehindOverlays, { passive: false });
document.addEventListener("wheel", trapScrollBehindOverlays, { passive: false });

function openDetailModal() {
  detailModal.classList.add("is-open");
  syncModalOpenState();
}

function switchToOrderModal() {
  detailModal.classList.remove("is-open");
  orderModal.classList.add("is-open");
  syncModalOpenState();
}

function closeOrderModal() {
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.width = "";
  window.scrollTo(0, scrollPosition);
  orderModal.classList.remove("is-open");
  syncModalOpenState();
  orderModalForm.reset();
}

function closeDetailModal() {
  detailModal.classList.remove("is-open");
  syncModalOpenState();
}

function buildDetailModalMarkup() {
  return `
    <img class="detail-modal-image" alt="">
    <div class="detail-modal-text-block">
      <h3 class="detail-modal-title"></h3>
      <p class="detail-modal-price"></p>
      <p class="detail-modal-text"></p>
      <div class="modal-buy-block">
        <button type="button" id="detail-modal-cta" class="order-button detail-modal-button">Buy now</button>
        <input type="number" class="modal-quantity" value="1" min="1" />
      </div>
    </div>`;
}

// Працює і для статичних і для динамічних карток
document.addEventListener("click", (event) => {
  const card = event.target.closest(".bestsellers-card");
  if (!card) return;
  if (event.target.closest(".modal-background")) return;

  const titleEl = card.querySelector(".bestsellers-bouqets-title");
  const priceEl = card.querySelector(".price-text");
  const imgElement = card.querySelector(".bestsellers-image");

  if (!titleEl || !priceEl || !imgElement) return;

  const title = titleEl.textContent;
  const price = priceEl.textContent;
  const text = card.dataset.text ?? "";
  const src = imgElement.getAttribute("src");
  const rawSrcset = imgElement.getAttribute("srcset");

  detailModalContent.replaceChildren();
  detailModalContent.insertAdjacentHTML("beforeend", buildDetailModalMarkup());

  const detailImage = detailModalContent.querySelector(".detail-modal-image");
  detailImage.src = src;
  if (rawSrcset) detailImage.setAttribute("srcset", rawSrcset);
  detailImage.alt = title;

  detailModalContent.querySelector(".detail-modal-title").textContent = title;
  detailModalContent.querySelector(".detail-modal-price").textContent = price;
  detailModalContent.querySelector(".detail-modal-text").textContent = text;

  openDetailModal();
});

closeDetailButton?.addEventListener("click", closeDetailModal);
closeOrderButton?.addEventListener("click", closeOrderModal);

detailModal.addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closeDetailModal();
});

orderModal.addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closeOrderModal();
});

detailModalContent.addEventListener("click", (e) => {
  if (e.target.id === "detail-modal-cta" || e.target.closest("#detail-modal-cta")) {
    switchToOrderModal();
  }
});

orderModalForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
  const data = Object.fromEntries(formData.entries());
  alert(`Thank you, ${data.name}! We will call you at ${data.phone}.`);
  e.currentTarget.reset();
  closeOrderModal();
});

const phoneInput = document.getElementById("phone");

if (phoneInput) {
  phoneInput.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && phoneInput.value.length <= 1) {
      phoneInput.value = "";
    }
  });

  phoneInput.addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (!value) { e.target.value = ""; return; }
    if (value.length > 10) value = value.slice(0, 10);
    let formatted = "";
    if (value.length >= 1) formatted = "(" + value.slice(0, 3);
    if (value.length >= 4) formatted += ") " + value.slice(3, 6);
    if (value.length >= 7) formatted += "-" + value.slice(6, 10);
    if (value.length < 4) formatted = value.slice(0, 3);
    e.target.value = formatted;
  });
}

document.querySelector(".hero-button")?.addEventListener("click", () => {
  document.getElementById("bestsellers")?.scrollIntoView({ behavior: "smooth" });
});

document.querySelector(".header-order-button")?.addEventListener("click", () => {
  document.getElementById("bouquets")?.scrollIntoView({ behavior: "smooth" });
});