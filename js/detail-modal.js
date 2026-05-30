import { apiClient } from "./apiClient.js";
import { showErrorNotification, showSuccessNotification } from "./notifications.js";
import { extractErrorMessage } from "./utils.js";

const bouquetsList = document.getElementById("bouquets-list");
const detailModal = document.getElementById("detail-modal");
const closeButtons = document.querySelectorAll("#close-modal-button");
const detailModalContent = document.getElementById("detail-modal-content");
const orderModal = document.getElementById("order-modal");
const orderButtons = document.querySelectorAll("#order-button");
const orderModalForm = document.getElementById("order-modal-form");
const orderSubmitButton = orderModalForm?.querySelector(".order-modal-cta");

const orderSubmitDefaultLabel = "Замовити";
const orderSubmitLoadingLabel = "Завантаження...";

let selectedProductId = null;
let isOrderSubmitting = false;

function syncModalOpenState() {
  const anyModalOpen = detailModal.classList.contains("is-open") || orderModal.classList.contains("is-open");
  document.body.classList.toggle("modal-open", anyModalOpen);
  document.documentElement.classList.toggle("modal-open", anyModalOpen);
}

function isOverlayScrollLockActive() {
  const html = document.documentElement;
  return html.classList.contains("modal-open") || html.classList.contains("menu-open");
}

function trapScrollBehindOverlays(event) {
  if (!isOverlayScrollLockActive()) return;
  if (event.target.closest(".modal-container") || event.target.closest("[data-menu]")) return;
  event.preventDefault();
}

document.addEventListener("touchmove", trapScrollBehindOverlays, { passive: false });
document.addEventListener("wheel", trapScrollBehindOverlays, { passive: false });

function openDetailModal() {
  detailModal.classList.add("is-open");
  syncModalOpenState();
}

function openOrderModal(productId = null) {
  selectedProductId = productId;
  orderModal.classList.add("is-open");
  syncModalOpenState();
}

function closeOrderModal() {
  orderModal.classList.remove("is-open");
  syncModalOpenState();
  selectedProductId = null;
  orderModalForm.reset();
}

function closeDetailModal() {
  detailModal.classList.remove("is-open");
  syncModalOpenState();
}

function setOrderSubmitLoading(isLoading) {
  if (!orderSubmitButton) return;
  orderSubmitButton.disabled = isLoading;
  orderSubmitButton.classList.toggle("is-loading", isLoading);
  orderSubmitButton.textContent = isLoading ? orderSubmitLoadingLabel : orderSubmitDefaultLabel;
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

function fillDetailModal(title, price, text, src, rawSrcset, productId) {
  detailModalContent.replaceChildren();
  detailModalContent.insertAdjacentHTML("beforeend", buildDetailModalMarkup());
  detailModalContent.dataset.productId = productId ?? "";

  const detailImage = detailModalContent.querySelector(".detail-modal-image");
  detailImage.src = src;
  if (rawSrcset) detailImage.setAttribute("srcset", rawSrcset);
  detailImage.alt = title;

  detailModalContent.querySelector(".detail-modal-title").textContent = title;
  detailModalContent.querySelector(".detail-modal-price").textContent = price;
  detailModalContent.querySelector(".detail-modal-text").textContent = text;

  openDetailModal();
}

// Bestsellers картки
document.addEventListener("click", (event) => {
  const card = event.target.closest(".bestsellers-card");
  if (!card) return;

  const titleEl = card.querySelector(".bestsellers-bouqets-title");
  const priceEl = card.querySelector(".price-text");
  const imgElement = card.querySelector(".bestsellers-image");

  if (!titleEl || !priceEl || !imgElement) return;

  fillDetailModal(
    titleEl.textContent,
    priceEl.textContent,
    card.dataset.text ?? "",
    imgElement.getAttribute("src"),
    imgElement.getAttribute("srcset"),
    card.dataset.productId ? Number(card.dataset.productId) : null
  );
});

// Букети
bouquetsList?.addEventListener("click", (event) => {
  const detailsTrigger = event.target.closest(".bouquets-more-button");
  if (!detailsTrigger) return;

  const parentItem = detailsTrigger.closest(".bouquets-list-item");

  fillDetailModal(
    parentItem.querySelector(".bestsellers-bouqets-title").textContent,
    parentItem.querySelector(".price-text").textContent,
    parentItem.querySelector(".bestsellers-bouqets-subtitle").textContent,
    parentItem.querySelector(".bouqets-item-image").getAttribute("src"),
    parentItem.querySelector(".bouqets-item-image").getAttribute("srcset"),
    parentItem.dataset.productId ?? ""
  );
});

closeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    closeDetailModal();
    closeOrderModal();
  });
});document.getElementById("close-order-modal-button")?.addEventListener("click", () => {
  closeOrderModal();
});



detailModal.addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closeDetailModal();
});

orderModal.addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closeOrderModal();
});

detailModalContent.addEventListener("click", (e) => {
  if (e.target.id === "detail-modal-cta" || e.target.closest("#detail-modal-cta")) {
    const productIdRaw = detailModalContent.dataset.productId;
    const productId = productIdRaw ? Number(productIdRaw) : null;
    closeDetailModal();
    openOrderModal(productId ?? null);
  }
});

orderButtons.forEach((button) =>
  button.addEventListener("click", () => {
    openOrderModal(null);
  })
);

orderModalForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (isOrderSubmitting || orderModalForm.dataset.submitting === "true") return;

  isOrderSubmitting = true;
  orderModalForm.dataset.submitting = "true";

  const formData = new FormData(e.currentTarget);
  const payload = Object.fromEntries(formData.entries());

  setOrderSubmitLoading(true);

  try {
    await apiClient.post("/orders", {
      name: payload.name,
      phone: payload.phone,
      address: payload.address,
      comment: payload.comment ?? "",
      productId: selectedProductId,
    });

    showSuccessNotification(`Дякуємо, ${payload.name}! Ми зателефонуємо вам за номером ${payload.phone}.`);
    closeOrderModal();
  } catch (error) {
    const message = extractErrorMessage(error, "Не вдалося оформити замовлення. Спробуйте пізніше.");
    if (message) showErrorNotification(message);
  } finally {
    isOrderSubmitting = false;
    delete orderModalForm.dataset.submitting;
    setOrderSubmitLoading(false);
  }
});

document.querySelector(".hero-button")?.addEventListener("click", () => {
  document.getElementById("bestsellers")?.scrollIntoView({ behavior: "smooth" });
});

document.querySelector(".header-order-button")?.addEventListener("click", () => {
  document.getElementById("bouquets")?.scrollIntoView({ behavior: "smooth" });
});