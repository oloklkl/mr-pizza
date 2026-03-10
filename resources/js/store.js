import { STORE_DATA } from "./store-data.js";

const storeList = document.getElementById("storeList");
const storeDetail = document.getElementById("storeDetail");
const storeDetailClose = document.getElementById("storeDetailClose");
const storeHead = document.querySelector(".store__head");

const storeSearchInput = document.querySelector(".store__search-input");
const storeSearchBox = document.querySelector(".store__search-box");
const storeSearchClear = document.querySelector(".store__search-clear");
const storeCount = document.querySelector(".store__count");

const detailImage = document.getElementById("storeDetailImage");
const detailName = document.getElementById("storeDetailName");
const detailAddress = document.getElementById("storeDetailAddress");
const detailPhone = document.getElementById("storeDetailPhone");
const detailTime = document.getElementById("storeDetailTime");
const detailMap = document.getElementById("storeDetailMap");

const hasGSAP = typeof window.gsap !== "undefined";

let activeStoreId = null;
let isDetailOpen = false;
let filteredStores = [...STORE_DATA];

/* =========================
   검색 유틸
========================= */

function normalizeKeyword(value = "") {
  return String(value).toLowerCase().replace(/\s+/g, "").trim();
}

function getStoreSearchText(store) {
  return [store.name, store.address, store.phone, store.hours].filter(Boolean).join(" ");
}

function filterStores(keyword) {
  const normalized = normalizeKeyword(keyword);

  if (!normalized) return [...STORE_DATA];

  return STORE_DATA.filter((store) => normalizeKeyword(getStoreSearchText(store)).includes(normalized));
}

/* =========================
   마크업 생성
========================= */

function createStoreItemMarkup(store, isActive = false) {
  return `
    <li class="store__item">
      <button
        type="button"
        class="store__link ${isActive ? "is-active" : ""}"
        data-store-id="${store.id}"
        aria-expanded="${isActive && isDetailOpen ? "true" : "false"}"
        aria-controls="storeDetail"
      >
        <span class="store__accent ${isActive ? "is-active" : ""}" aria-hidden="true"></span>

        <div class="store__info">
          <strong class="store__name">${store.name}</strong>
          <p class="store__address">${store.address}</p>
          <span class="store__hours">${store.hours}</span>
        </div>

        <span class="store__arrow" aria-hidden="true">›</span>
      </button>
    </li>
  `;
}

function renderEmptyState() {
  if (!storeList) return;

  storeList.innerHTML = `
    <li class="store__empty" aria-live="polite">
      검색 결과가 없습니다.
    </li>
  `;
}

/* =========================
   리스트 렌더
========================= */

function renderStoreList(stores = filteredStores) {
  if (!storeList) return;

  if (!stores.length) {
    renderEmptyState();
    return;
  }

  storeList.innerHTML = stores.map((store) => createStoreItemMarkup(store, store.id === activeStoreId)).join("");
}

function setActiveListItem(storeId) {
  const buttons = document.querySelectorAll(".store__link");

  buttons.forEach((button) => {
    const isActive = button.dataset.storeId === storeId;

    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-expanded", String(isActive && isDetailOpen));

    const accent = button.querySelector(".store__accent");
    accent?.classList.toggle("is-active", isActive);
  });
}

/* =========================
   디테일
========================= */

function fillDetail(store) {
  if (!store) return;

  detailImage.src = store.image;
  detailImage.alt = `${store.name} 매장 외관`;

  detailName.textContent = store.name;
  detailAddress.textContent = store.address;
  detailPhone.textContent = store.phone;
  detailTime.textContent = store.hours;
  detailMap.href = store.mapUrl;
}

function resetDetailScroll() {
  if (!storeDetail) return;
  storeDetail.scrollTop = 0;
}

function scrollStorePanelTopIntoView() {
  if (!storeHead) return;

  storeHead.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function openDetail(storeId) {
  const store = STORE_DATA.find((item) => item.id === storeId);
  if (!store || !storeDetail) return;

  activeStoreId = storeId;
  isDetailOpen = true;

  fillDetail(store);
  resetDetailScroll();
  setActiveListItem(storeId);
  storeDetail.setAttribute("aria-hidden", "false");
  scrollStorePanelTopIntoView();

  if (hasGSAP) {
    gsap.killTweensOf(storeDetail);
    gsap.killTweensOf(".store-detail__inner");

    gsap.set(storeDetail, { pointerEvents: "auto" });

    gsap.to(storeDetail, {
      x: 0,
      duration: 0.5,
      ease: "power3.out",
    });

    gsap.fromTo(".store-detail__inner", { x: 28, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.42, delay: 0.06, ease: "power2.out" });
  } else {
    storeDetail.classList.add("is-open");
  }
}

function closeDetail() {
  if (!storeDetail) return;

  isDetailOpen = false;
  storeDetail.setAttribute("aria-hidden", "true");

  const buttons = document.querySelectorAll(".store__link");

  buttons.forEach((button) => {
    const isActive = button.dataset.storeId === activeStoreId;

    button.setAttribute("aria-expanded", "false");
    button.classList.toggle("is-active", isActive);

    const accent = button.querySelector(".store__accent");
    accent?.classList.toggle("is-active", isActive);
  });

  if (hasGSAP) {
    gsap.killTweensOf(storeDetail);
    gsap.killTweensOf(".store-detail__inner");

    gsap.to(".store-detail__inner", {
      x: 20,
      autoAlpha: 0,
      duration: 0.18,
      ease: "power2.in",
    });

    gsap.to(storeDetail, {
      x: "100%",
      duration: 0.42,
      ease: "power3.inOut",
      onComplete: () => {
        gsap.set(storeDetail, { pointerEvents: "none" });
      },
    });
  } else {
    storeDetail.classList.remove("is-open");
  }
}

/* =========================
   검색 UI
========================= */

function updateSearchUI() {
  const hasValue = !!storeSearchInput?.value.trim();
  storeSearchBox?.classList.toggle("has-value", hasValue);
}

function updateStoreCount() {
  if (!storeCount) return;

  const total = STORE_DATA.length;
  const current = filteredStores.length;
  const hasKeyword = !!storeSearchInput?.value.trim();

  if (!hasKeyword) {
    storeCount.textContent = `총 ${total}개 매장`;
    return;
  }

  storeCount.textContent = `검색 결과 ${current}개 / 전체 ${total}개`;
}

function applyStoreSearch() {
  const keyword = storeSearchInput?.value ?? "";
  const normalizedKeyword = normalizeKeyword(keyword);

  filteredStores = filterStores(keyword);

  updateSearchUI();
  updateStoreCount();

  if (!filteredStores.length) {
    activeStoreId = null;
    closeDetail();
    renderEmptyState();
    return;
  }

  const hasActiveStore = filteredStores.some((store) => store.id === activeStoreId);

  if (!hasActiveStore) {
    activeStoreId = filteredStores[0].id;
    fillDetail(filteredStores[0]);
  }

  renderStoreList(filteredStores);

  if (normalizedKeyword && filteredStores.length === 1) {
    openDetail(filteredStores[0].id);
    return;
  }

  closeDetail();
}

function resetSearch() {
  if (!storeSearchInput) return;

  storeSearchInput.value = "";
  filteredStores = [...STORE_DATA];
  activeStoreId = filteredStores[0]?.id ?? null;

  updateSearchUI();
  updateStoreCount();

  if (filteredStores[0]) {
    fillDetail(filteredStores[0]);
  }

  renderStoreList(filteredStores);
  closeDetail();
  storeSearchInput.focus();
}

/* =========================
   이벤트
========================= */

function bindEvents() {
  if (!storeList) return;

  storeList.addEventListener("click", (event) => {
    const button = event.target.closest(".store__link");
    if (!button) return;

    const storeId = button.dataset.storeId;
    if (!storeId) return;

    openDetail(storeId);
  });

  storeSearchInput?.addEventListener("input", applyStoreSearch);
  storeSearchInput?.addEventListener("search", applyStoreSearch);

  storeSearchInput?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    if (!filteredStores.length) return;

    openDetail(filteredStores[0].id);
  });

  storeSearchClear?.addEventListener("click", resetSearch);

  storeDetailClose?.addEventListener("click", closeDetail);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isDetailOpen) {
      closeDetail();
    }
  });
}

/* =========================
   초기 상태
========================= */

function initMotionState() {
  if (!storeDetail || !hasGSAP) return;

  gsap.set(storeDetail, {
    x: "100%",
    pointerEvents: "none",
  });

  gsap.set(".store-detail__inner", {
    x: 20,
    autoAlpha: 0,
  });
}

function initStore() {
  if (!storeList || !STORE_DATA.length) return;

  filteredStores = [...STORE_DATA];
  activeStoreId = filteredStores[0].id;

  fillDetail(filteredStores[0]);
  renderStoreList(filteredStores);

  bindEvents();
  initMotionState();
  updateSearchUI();
  updateStoreCount();
}

document.addEventListener("DOMContentLoaded", initStore);
