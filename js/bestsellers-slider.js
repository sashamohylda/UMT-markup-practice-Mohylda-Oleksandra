import Swiper from "swiper";
import { A11y, Navigation } from "swiper/modules";
import "swiper/css";
import { apiClient } from "./apiClient";
import { showErrorNotification } from "./notifications";
import { extractErrorMessage } from "./utils";

const bestsellersSliderStage = document.querySelector("#bestsellers-slider-stage");
const bestsellersSliderTrack = document.getElementById("bestsellers-slider-list");
const bestsellersLoader = document.getElementById("bestsellers-loader");
const bestsellersViewport = document.querySelector(".bestsellers-slider-viewport");

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function buildBestsellerCard(item) {
  const card = document.createElement("div");
  card.className = "bestsellers-card";
  card.dataset.text = item.text ?? item.desc ?? ""; 

  card.innerHTML = `
    <img
      class="bestsellers-image"
      src="${item.img ?? ""}"
      alt="${item.title ?? ""}"
    />
    <div class="bestsellers-card-body">
      <h3 class="bestsellers-bouqets-title">${item.title ?? ""}</h3>
      <p class="bestsellers-bouqets-subtitle">${item.desc ?? ""}</p>
      <p class="bestsellers-bouqets-title price-text">${item.price ?? ""}</p>
    </div>
  `;

  return card;
}

function setBestsellersLoading(isLoading) {
  if (bestsellersLoader) bestsellersLoader.hidden = !isLoading;
  if (bestsellersViewport) {
    bestsellersViewport.setAttribute("aria-busy", isLoading ? "true" : "false");
  }
}

async function bootBestsellersSlider() {
  if (!bestsellersSliderStage || !bestsellersSliderTrack) {
    setBestsellersLoading(false);
    return;
  }

  try {
    const response = await apiClient.get("/bestsellers");
    const body = response.data;
    const items = Array.isArray(body) ? body : (body?.data ?? []);

    if (items.length === 0) return;

    bestsellersSliderTrack.replaceChildren();

    for (const item of items) {
      const slide = document.createElement("li");
      slide.className = "swiper-slide bestsellers-slider-slide";
      slide.append(buildBestsellerCard(item));
      bestsellersSliderTrack.append(slide);
    }

    new Swiper(bestsellersSliderStage, {
      modules: [Navigation, A11y],
      slidesPerView: 1,
      spaceBetween: 32,
      loop: true,
      speed: prefersReducedMotion() ? 0 : 480,
      navigation: {
        prevEl: "[data-bestsellers-prev]",
        nextEl: "[data-bestsellers-next]",
      },
      a11y: {
        prevSlideMessage: "Previous bouquet",
        nextSlideMessage: "Next bouquet",
      },
breakpoints: {
  768: {
    slidesPerView: 2,
    spaceBetween: 32,
  },
  1440: {
    slidesPerView: 3,  
    spaceBetween: 32,
  },
},
      on: {
        breakpoint(sw) {
          sw.params.speed = 0;
          sw.slideTo(0, 0, false);
          requestAnimationFrame(() => {
            sw.params.speed = prefersReducedMotion() ? 0 : 480;
          });
        },
      },
    });

  } catch (error) {
    showErrorNotification(extractErrorMessage(error, "Failed to load bestsellers."));
  } finally {
    setBestsellersLoading(false);
  }
}

bootBestsellersSlider();

