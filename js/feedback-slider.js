import Swiper from "swiper";
import { A11y, Navigation } from "swiper/modules";
import "swiper/css";
import { apiClient } from "./apiClient";
import { showErrorNotification } from "./notifications";
import { extractErrorMessage } from "./utils";

const feedbackSliderStage = document.querySelector("#feedback-slider-stage");
const feedbackSliderTrack = document.getElementById("feedback-slider-list");
const feedbackLoader = document.getElementById("feedback-loader");
const feedbackSliderViewport = document.querySelector(".feedback-slider-viewport");

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function buildFeedbackCard(feedback) {
  const card = document.createElement("div");
  card.className = "feedbacks-item";
  card.setAttribute("data-feedback-id", String(feedback.id ?? ""));

  const text = document.createElement("p");
  text.className = "text feedback-text";
  text.textContent = feedback.text ?? "";

  const name = document.createElement("p");
  name.className = "feedback-person-name";
  name.textContent = feedback.author ?? "";

  card.append(text, name);
  return card;
}

function setFeedbackLoading(isLoading) {
  if (feedbackLoader) feedbackLoader.hidden = !isLoading;
  if (feedbackSliderViewport) {
    feedbackSliderViewport.setAttribute("aria-busy", isLoading ? "true" : "false");
  }
}

async function bootFeedbackSlider() {
  if (!feedbackSliderStage || !feedbackSliderTrack) {
    setFeedbackLoading(false);
    return;
  }

  try {
    const response = await apiClient.get("/feedbacks");
    const body = response.data;
    const feedbackItems = Array.isArray(body) ? body : (body?.data ?? []);

    if (feedbackItems.length === 0) return;

    feedbackSliderTrack.replaceChildren();

    // Кожен відгук — окремий слайд
    for (const item of feedbackItems) {
      const slide = document.createElement("li");
      slide.className = "swiper-slide feedback-slider-slide";
      slide.append(buildFeedbackCard(item));
      feedbackSliderTrack.append(slide);
    }

new Swiper(feedbackSliderStage, {
  modules: [Navigation, A11y],
  slidesPerView: 1,
  spaceBetween: 32,
  loop: feedbackItems.length > 3,
  speed: prefersReducedMotion() ? 0 : 480,
  navigation: {
    prevEl: "[data-feedback-prev]",
    nextEl: "[data-feedback-next]",
  },
  a11y: {
    prevSlideMessage: "Previous review",
    nextSlideMessage: "Next review",
  },
  breakpoints: {
    768: {
      slidesPerView: 2,
      spaceBetween: 32,
      allowTouchMove: feedbackItems.length > 2,
    },
    1440: {
      slidesPerView: 3,
      spaceBetween: 32,
      allowTouchMove: feedbackItems.length > 3,
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
    showErrorNotification(extractErrorMessage(error, "Failed to load reviews."));
  } finally {
    setFeedbackLoading(false);
  }
}

bootFeedbackSlider();