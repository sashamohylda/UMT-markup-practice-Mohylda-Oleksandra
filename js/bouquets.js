import { apiClient } from "./apiClient.js";
import { showErrorNotification } from "./notifications.js";
import { extractErrorMessage } from "./utils.js";

const itemsPerPage = 8;

const catalogueList = document.getElementById("bouquets-list");
const catalogueListShell = document.querySelector(".bouquets-list-shell");
const catalogueLoader = document.getElementById("bouquets-loader");
const showMoreButton = document.querySelector(".bouqets-item-show-more-button");

let lastLoadedPage = 0;

function formatPrice(price) {
  if (!price) return "-";
  const str = String(price).trim();
  if (str.startsWith("$")) return str;
  const num = Number.parseInt(str.replace(/\s/g, ""), 10);
  if (Number.isNaN(num)) return str;
  return `$${num}`;
}

function buildItemMarkup() {
  return `
    <li class="bouquets-list-item">
      <img class="bouqets-item-image" alt="">
      <h3 class="bestsellers-bouqets-title"></h3>
      <p class="bestsellers-bouqets-subtitle"></p>
      <p class="price-text"></p>
    </li>`;
}

function fillItem(listItem, product) {
  const image = listItem.querySelector(".bouqets-item-image");
  image.src = product.img ?? "";
  image.alt = product.title ?? "";
  listItem.querySelector(".bestsellers-bouqets-title").textContent = product.title ?? "";
  listItem.querySelector(".bestsellers-bouqets-subtitle").textContent = product.desc ?? "";
  listItem.querySelector(".price-text").textContent = formatPrice(product.price);
}

function setCatalogueInitialLoading(isLoading) {
  if (catalogueLoader) catalogueLoader.hidden = !isLoading;
  if (catalogueListShell) {
    catalogueListShell.setAttribute("aria-busy", isLoading ? "true" : "false");
  }
}

function setShowMoreLoading(isLoading) {
  if (!showMoreButton) return;
  showMoreButton.disabled = isLoading;
  showMoreButton.classList.toggle("is-loading", isLoading);
  showMoreButton.textContent = isLoading ? "Loading..." : "Show More";
}

function renderChunk(products, shouldReplace) {
  if (!catalogueList) return;
  if (shouldReplace) catalogueList.replaceChildren();

  const startIndex = catalogueList.children.length;
  catalogueList.insertAdjacentHTML("beforeend", products.map(() => buildItemMarkup()).join(""));

  const listItems = catalogueList.querySelectorAll(":scope > .bouquets-list-item");
  for (let i = 0; i < products.length; i++) {
    fillItem(listItems[startIndex + i], products[i]);
  }
}

function updateShowMore(meta) {
  if (!showMoreButton) return;
  const currentPage = Number(meta.page);
  const totalPages = Number(meta.pages);
  showMoreButton.hidden = currentPage >= totalPages;
}

async function fetchPage(page, appendItems = false) {
  const isInitial = !appendItems;

  if (isInitial) {
    setCatalogueInitialLoading(true);
    if (catalogueList) catalogueList.replaceChildren();
  } else {
    setShowMoreLoading(true);
  }

  try {
    const response = await apiClient.get("/bouquets", {
      params: { page, "per-page": itemsPerPage },
    });

    const products = response.data?.data ?? [];
    const meta = response.data?.meta ?? {};

    renderChunk(products, false);
    lastLoadedPage = page;
    updateShowMore({ page, pages: meta.pages ?? 1 });

  } catch (error) {
    showErrorNotification(extractErrorMessage(error));
  } finally {
    if (isInitial) setCatalogueInitialLoading(false);
    else setShowMoreLoading(false);
  }
}

async function init() {
  if (!catalogueList) return;

  if (showMoreButton) {
    showMoreButton.hidden = true;
    showMoreButton.addEventListener("click", () => {
      fetchPage(lastLoadedPage + 1, true);
    });
  }

  await fetchPage(1, false);
}

init();