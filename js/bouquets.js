import { apiClient } from "./apiClient.js";
import { showErrorNotification } from "./notifications.js";
import { extractErrorMessage } from "./utils.js";

const itemsPerPage = 8;

const catalogueList = document.getElementById("bouquets-list");
const catalogueListShell = document.querySelector(".bouquets-list-shell");
const catalogueLoader = document.getElementById("bouquets-loader");
const showMoreButton = document.querySelector(".bouqets-item-show-more-button");

let lastLoadedPage = 0;
let totalPages = 1;
let allProducts = [];

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
      <p class="bestsellers-bouqets-title price-text"></p>
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

function updateShowMore() {
  if (!showMoreButton) return;
  showMoreButton.hidden = lastLoadedPage >= totalPages;
}

async function fetchPage(page, appendItems = false) {
  const isInitial = !appendItems;

  if (isInitial) {
    setCatalogueInitialLoading(true);
  } else {
    setShowMoreLoading(true);
  }

  try {
    if (allProducts.length === 0) {
      const response = await apiClient.get("/products");
      const body = response.data;

      if (Array.isArray(body)) {
        allProducts = body;
      } else {
        allProducts = body?.data ?? [];
      }
    }

    totalPages = Math.ceil(allProducts.length / itemsPerPage);
    const start = (page - 1) * itemsPerPage;
    const chunk = allProducts.slice(start, start + itemsPerPage);

    renderChunk(chunk, !appendItems);
    lastLoadedPage = page;
    updateShowMore();

  } catch (error) {
    showErrorNotification(extractErrorMessage(error));
  } finally {
    if (isInitial) setCatalogueInitialLoading(false);
    else setShowMoreLoading(false);
  }
}

async function init() {
  if (showMoreButton) {
    showMoreButton.hidden = true;
    showMoreButton.addEventListener("click", () => {
      fetchPage(lastLoadedPage + 1, true);
    });
  }

  await fetchPage(1, false);
}

init();