import {
  EDGE_OPTIONS,
  EDGE_PRICE_MAP,
  RAW_ITEMS,
  PIZZA_LINE_LABELS,
  SIDE_LINE_LABELS,
  // SET_LINE_LABELS,
} from "./menu-data.js";

/* =========================================================
   1. 데이터 정규화
========================================================= */
const LINE_DEFAULTS = {
  suncrust: { defaultEdge: "thin", edgeLocked: true, allowedEdges: ["thin"] },
  solo: { defaultEdge: "thin", edgeLocked: true, allowedEdges: ["thin"] },
};

const withDefaults = (item) => ({
  ...item,
  ...(LINE_DEFAULTS[item.line] || {}),
});

const MENU_ITEMS = RAW_ITEMS.map(withDefaults);

/* =========================================================
   2. DOM
========================================================= */
const modal = document.querySelector("#menu-modal");
const card = modal?.querySelector(".auth-card--modal.menu-modal");
const closeBtn = modal?.querySelector(".modal-close");

const titleEl = modal?.querySelector(".menu-modal__title");
const descEl = modal?.querySelector(".menu-modal__desc");
const imgEl = modal?.querySelector(".menu-modal__img");
const priceEl = modal?.querySelector(".menu-modal__price-val");

const sizeBtns = [...(modal?.querySelectorAll("[data-size]") ?? [])];
const qtyBtns = modal?.querySelectorAll("[data-qty]") ?? [];
const qtyVal = modal?.querySelector("[data-qty-val]");

const originEl = modal?.querySelector("[data-origin]");
const nutritionEl = modal?.querySelector("[data-nutrition]");
const allergyEl = modal?.querySelector("[data-allergy]");

const edgeWrap = modal?.querySelector("[data-edge-wrap]");
const edgeSection = modal?.querySelector("[data-edge-section]");
const badgeEl = modal?.querySelector("[data-badge]");

const orderBtns = modal?.querySelectorAll("[data-order]") ?? [];

const tabBtns = document.querySelectorAll(".menu-tabs__btn");
const showcaseInner = document.querySelector(".menu-showcase__inner");
const ALL_ORIGINAL_HTML = showcaseInner?.innerHTML ?? "";

/* ✅ 사이즈 섹션 묶음 찾기 */
const sizeSection = modal?.querySelector("[data-size-section]") || sizeBtns[0]?.closest(".menu-modal__section") || sizeBtns[0]?.closest(".menu-modal__group") || sizeBtns[0]?.parentElement?.closest(".menu-modal__section") || sizeBtns[0]?.parentElement;

/* =========================================================
   3. 상태
========================================================= */
let currentItem = null;
let size = "M";
let qty = 1;
let selectedEdge = null;
let lastActiveEl = null;
let orderType = "delivery";

/* =========================================================
   4. 분류
========================================================= */
const PIZZA_LINES = new Set(["premium", "classic", "suncrust", "solo"]);
const SIDE_LINES = new Set(["pizzasand", "pasta", "salad", "drink"]);
const SET_LINES = new Set(["special"]);

const isDrinkLine = (line) => String(line) === "drink";
const isSoloLine = (line) => String(line) === "solo";
const isSetLine = (line) => SET_LINES.has(String(line));

/* =========================================================
   5. 유틸
========================================================= */
const formatKRW = (n) => `₩ ${Number(n).toLocaleString("ko-KR")}`;

function setActive(btns, active) {
  btns.forEach((b) => b.classList.toggle("is-active", b === active));
}

function bumpPrice() {
  if (!priceEl) return;
  priceEl.classList.remove("is-bump");
  void priceEl.offsetWidth;
  priceEl.classList.add("is-bump");
}

function randPick(arr) {
  if (!arr?.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleCopy(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function poolByType(type) {
  const t = String(type).toLowerCase();
  if (t === "pizza") return MENU_ITEMS.filter((i) => PIZZA_LINES.has(i.line));
  if (t === "side") return MENU_ITEMS.filter((i) => SIDE_LINES.has(i.line));
  if (t === "set") return MENU_ITEMS.filter((i) => isSetLine(i.line));
  return MENU_ITEMS;
}

/* =========================================================
   5.1 배지
========================================================= */
function getBadgeLabel(item) {
  if (!item) return null;
  if (item.isNew) return "NEW";
  if (item.isBest) return "BEST";
  if (item.isSignature) return "SIGNATURE";
  return null;
}

function renderBadge(el, item) {
  if (!el) return;
  const label = getBadgeLabel(item);
  if (!label) {
    el.style.display = "none";
    el.textContent = "";
    el.removeAttribute("data-badge-kind");
    return;
  }
  el.style.display = "";
  el.textContent = label;
  el.dataset.badgeKind = label.toLowerCase();
}

/* =========================================================
   6. 가격/사이즈 파싱
   - M/L
   - S
   - 500ml / 1.25L
   - 4조각 / 8조각
   - 단일 가격
========================================================= */
function labelToSizeKey(label) {
  const raw = String(label ?? "").trim();
  const upper = raw.toUpperCase();

  if (["S", "M", "L"].includes(upper)) return upper;
  if (/^\d+\s*ML$/i.test(raw)) return raw.replace(/[^\d]/g, "");
  if (/^\d+(\.\d+)?\s*L$/i.test(raw)) return String(Math.round(parseFloat(raw) * 1000));
  if (/^\d+\s*조각$/.test(raw)) return raw.replace(/[^\d]/g, "");

  return "ONE";
}

function normalizeSizeLabel(label, key) {
  const raw = String(label ?? "").trim();
  if (raw) return raw;
  if (key === "ONE") return "기본";
  return key;
}

function parsePriceString(priceStr) {
  const raw = String(priceStr ?? "").trim();

  if (!raw) {
    return {
      basePrice: { ONE: 0 },
      sizeOptions: [{ key: "ONE", label: "기본", price: 0 }],
    };
  }

  const chunks = raw
    .split("·")
    .map((s) => s.trim())
    .filter(Boolean);

  const parsed = chunks
    .map((chunk) => {
      const match = chunk.match(/^(.*?)([\d,]+)$/);
      if (!match) return null;

      const label = match[1].trim();
      const price = Number(match[2].replaceAll(",", ""));
      const key = labelToSizeKey(label);

      return {
        key,
        label: normalizeSizeLabel(label, key),
        price,
      };
    })
    .filter(Boolean);

  if (!parsed.length) {
    const onlyNum = raw.match(/[\d,]+/);
    const price = onlyNum ? Number(onlyNum[0].replaceAll(",", "")) : 0;
    return {
      basePrice: { ONE: price },
      sizeOptions: [{ key: "ONE", label: "기본", price }],
    };
  }

  return {
    basePrice: Object.fromEntries(parsed.map((opt) => [opt.key, opt.price])),
    sizeOptions: parsed,
  };
}

function pickDefaultSize(item) {
  return item?.sizeOptions?.[0]?.key ?? "ONE";
}

function getPriceBySize(item, sizeKey) {
  return item?.basePrice?.[sizeKey] ?? 0;
}

/* ✅ 카드 리스트용 가격 표시
   - 옵션 2개 이상: 최소가~
   - 옵션 1개: 가격만
========================================================= */
function formatCardPrice(item) {
  const raw = String(item?.price ?? "").trim();
  if (!raw) return "";

  const normalized = item?.sizeOptions ? item : normalizeItem(item);
  const options = normalized?.sizeOptions ?? [];

  if (options.length > 1) {
    const minPrice = Math.min(...options.map((opt) => Number(opt.price || 0)));
    return `${minPrice.toLocaleString("ko-KR")}~`;
  }

  if (options.length === 1) {
    return `${Number(options[0].price).toLocaleString("ko-KR")}`;
  }

  return raw;
}

/* =========================================================
   6.1 nutrition
========================================================= */
function getNutritionForSize(item, sizeKey) {
  const info = item?.nutritionInfo;
  if (!info || typeof info !== "object") return null;

  if (info[sizeKey] && typeof info[sizeKey] === "object") return info[sizeKey];

  const compactKey = String(sizeKey).replace(/[^\dA-Z]/gi, "");
  if (info[compactKey] && typeof info[compactKey] === "object") return info[compactKey];

  for (const fallbackKey of ["ONE", "DEFAULT", "BASIC"]) {
    if (info[fallbackKey] && typeof info[fallbackKey] === "object") return info[fallbackKey];
  }

  if ("kcal" in info || "protein" in info || "sodium" in info || "sugar" in info) {
    return info;
  }

  return null;
}

/* =========================================================
   6.2 사이즈 UI
========================================================= */
function getSizeLabelEl(btn) {
  return btn.querySelector("[data-size-label]");
}

function getSizePriceEl(btn) {
  return btn.querySelector("[data-size-price]");
}

function setSizeButtonContent(btn, opt) {
  const labelEl = getSizeLabelEl(btn);
  const priceElInBtn = getSizePriceEl(btn);

  if (labelEl) {
    labelEl.textContent = opt.label;
  } else {
    btn.dataset.label = opt.label;
  }

  if (priceElInBtn) {
    priceElInBtn.textContent = formatKRW(opt.price);
  }
}

function shouldShowSizeSection(item) {
  const options = item?.sizeOptions ?? [];
  if (options.length <= 1) return false;

  if (isSoloLine(item?.line)) return false;

  return true;
}

function syncSizeButtons() {
  if (!currentItem || !sizeBtns.length) return;

  const options = currentItem.sizeOptions ?? [];
  const showSizeSection = shouldShowSizeSection(currentItem);

  if (sizeSection) {
    sizeSection.hidden = !showSizeSection;
  }

  sizeBtns.forEach((btn, index) => {
    const opt = options[index];

    if (!showSizeSection || !opt) {
      btn.hidden = true;
      btn.disabled = true;
      btn.classList.remove("is-active");
      return;
    }

    btn.hidden = false;
    btn.disabled = false;
    btn.dataset.size = opt.key;
    setSizeButtonContent(btn, opt);
    btn.classList.toggle("is-active", opt.key === size);
  });
}

/* =========================================================
   7. 엣지
========================================================= */
function getEdgePrice(edgeId) {
  if (!currentItem || !edgeId) return 0;

  const byEdge = EDGE_PRICE_MAP?.[edgeId];
  const byLine = EDGE_PRICE_MAP?.[currentItem.line]?.[edgeId];

  // 1) edgeId 바로 아래에 사이즈별 객체가 있는 경우
  if (byEdge && typeof byEdge === "object" && byEdge[size] != null) {
    return Number(byEdge[size]) || 0;
  }

  // 2) line > edgeId 아래에 사이즈별 객체가 있는 경우
  if (byLine && typeof byLine === "object" && byLine[size] != null) {
    return Number(byLine[size]) || 0;
  }

  // 3) line > edgeId 값이 숫자 하나인 경우
  if (typeof byLine === "number") {
    return byLine;
  }

  // 4) edgeId 값이 숫자 하나인 경우
  if (typeof byEdge === "number") {
    return byEdge;
  }

  return 0;
}

function getEdgeLabel(edgeId) {
  const found = EDGE_OPTIONS.find((o) => o.id === edgeId || o.value === edgeId);
  return found?.label ?? edgeId;
}

function renderEdges() {
  if (!edgeWrap || !currentItem) return;

  const allowed = currentItem.allowedEdges ?? [];
  const locked = Boolean(currentItem.edgeLocked);

  if (!PIZZA_LINES.has(String(currentItem.line)) || !allowed.length) {
    edgeWrap.innerHTML = "";
    return;
  }

  edgeWrap.innerHTML = allowed
    .map((edgeId) => {
      const label = getEdgeLabel(edgeId);
      const active = edgeId === selectedEdge ? "is-active" : "";
      const disabled = locked && edgeId !== selectedEdge ? "disabled" : "";
      return `<button class="seg ${active}" data-edge="${edgeId}" ${disabled}>${label}</button>`;
    })
    .join("");
}

/* =========================================================
   8. 렌더
========================================================= */
function updatePrice({ animate = true } = {}) {
  if (!currentItem || !priceEl) return;

  const base = getPriceBySize(currentItem, size);
  const edgeAdd = PIZZA_LINES.has(String(currentItem.line)) ? getEdgePrice(selectedEdge) : 0;
  const total = (base + edgeAdd) * qty;

  priceEl.textContent = formatKRW(total);
  if (animate) bumpPrice();
}

function updateNutrition() {
  if (!nutritionEl || !currentItem) return;

  const n = getNutritionForSize(currentItem, size);
  if (!n || typeof n !== "object") {
    nutritionEl.textContent = "-";
    return;
  }

  const parts = [];
  if (n.kcal != null) parts.push(`${n.kcal}kcal`);
  if (n.protein != null) parts.push(`단백질 ${n.protein}g`);
  if (n.sodium != null) parts.push(`나트륨 ${n.sodium}mg`);
  if (n.sugar != null) parts.push(`당류 ${n.sugar}g`);

  nutritionEl.textContent = parts.length ? parts.join(" · ") : "-";
}

function applyModalDataset(item) {
  if (!modal || !item) return;

  let kind = "pizza";
  if (SIDE_LINES.has(item.line)) kind = item.line;
  if (isSetLine(item.line)) kind = "set";

  modal.dataset.kind = kind;
  modal.dataset.line = item.line ?? "";

  if (isSetLine(item.line)) modal.dataset.setLine = item.line;
  else delete modal.dataset.setLine;
}

function toggleEdgeSection(item) {
  if (!edgeSection) return;

  const isPizza = PIZZA_LINES.has(String(item?.line));
  edgeSection.hidden = !isPizza;

  if (!isPizza && edgeWrap) edgeWrap.innerHTML = "";
}

function renderMediaStages() {
  const pizzaStage = modal.querySelector(".pizza-stage");
  const setStage = modal.querySelector(".set-stage");

  const setMain = modal.querySelector(".set-stage .set-main");
  const setOpt0 = modal.querySelector('.set-stage [data-set-opt="0"]');
  const setOpt1 = modal.querySelector('.set-stage [data-set-opt="1"]');

  const isSet = isSetLine(currentItem.line);

  if (pizzaStage) pizzaStage.hidden = isSet;
  if (setStage) setStage.hidden = !isSet;

  if (isSet) {
    if (setMain) {
      setMain.src = currentItem.img ?? "";
      setMain.alt = currentItem.title ?? "";
    }
    const opts = currentItem.setOptions ?? [];
    if (setOpt0) setOpt0.src = opts[0] ?? "";
    if (setOpt1) setOpt1.src = opts[1] ?? "";
  } else {
    if (imgEl) {
      imgEl.src = currentItem.img ?? "";
      imgEl.alt = currentItem.title ?? "";
    }
  }
}

function renderContent() {
  if (!currentItem) return;

  titleEl.textContent = currentItem.title ?? "";
  descEl.textContent = currentItem.desc ?? "";

  if (originEl) originEl.textContent = currentItem.originInfo ?? "-";
  if (allergyEl) allergyEl.textContent = currentItem.allergyInfo ?? "-";

  applyModalDataset(currentItem);
  renderBadge(badgeEl, currentItem);
  renderMediaStages();
  syncSizeButtons();

  toggleEdgeSection(currentItem);
  if (!edgeSection?.hidden) renderEdges();

  updateNutrition();
  updatePrice({ animate: false });
}

/* =========================================================
   9. 모달
========================================================= */
function openModal(item) {
  currentItem = normalizeItem(item);
  lastActiveEl = document.activeElement;

  qty = 1;
  if (qtyVal) qtyVal.textContent = 1;

  size = pickDefaultSize(currentItem);
  selectedEdge = currentItem.defaultEdge ?? currentItem.allowedEdges?.[0] ?? null;

  setOrderType(orderType);
  renderContent();

  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  closeBtn?.focus();
}

function closeModal() {
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
  lastActiveEl?.focus();
}

/* =========================================================
   10. ALL 랜덤 채우기
========================================================= */
function ensureCardBadgeSlot(articleEl) {
  const link = articleEl.querySelector(".menu-item__link");
  if (!link) return null;

  let el = link.querySelector(".menu-item__badge[data-badge]");
  if (el) return el;

  el = document.createElement("span");
  el.className = "menu-item__badge";
  el.setAttribute("data-badge", "");
  link.prepend(el);
  return el;
}

function renderCardBadge(articleEl, item) {
  const label = getBadgeLabel(item);
  if (!label) return;

  const badge = ensureCardBadgeSlot(articleEl);
  if (!badge) return;

  badge.textContent = label;
  badge.style.display = "";
  badge.dataset.badgeKind = label.toLowerCase();
}

function clearCardBadge(articleEl) {
  const badge = articleEl.querySelector(".menu-item__badge[data-badge]");
  if (!badge) return;
  badge.style.display = "none";
  badge.textContent = "";
  badge.removeAttribute("data-badge-kind");
}

function setCardUI(articleEl, item) {
  articleEl.dataset.id = item.id;
  articleEl.dataset.line = item.line ?? "";

  const name = articleEl.querySelector(".menu-item__name");
  const price = articleEl.querySelector(".menu-item__price");

  if (name) name.textContent = item.title ?? "";
  if (price) price.textContent = formatCardPrice(item);

  clearCardBadge(articleEl);

  // ALL 탭에서는 배지 표시 안함
  const isAllTab = document.querySelector(".menu-tabs__btn.is-active")?.dataset.filter === "all";

  if (!isAllTab) {
    renderCardBadge(articleEl, item);
  }

  if (articleEl.classList.contains("menu-item--set") || articleEl.dataset.type === "set") {
    const main = articleEl.querySelector(".set-main");
    const opt0 = articleEl.querySelector(".set-opt--wing");
    const opt1 = articleEl.querySelector(".set-opt--pasta");

    if (main) main.src = item.img ?? "";
    const opts = item.setOptions ?? [];
    if (opt0) opt0.src = opts[0] ?? "";
    if (opt1) opt1.src = opts[1] ?? "";
  } else {
    const img = articleEl.querySelector(".menu-item__img");
    if (img) img.src = item.img ?? "";
  }
}

function hydrateAll() {
  ["best", "premium", "combo", "side"].forEach((id) => {
    const section = document.getElementById(id);
    if (!section) return;

    const cards = [...section.querySelectorAll(".menu-item")];
    const type = cards[0]?.dataset.type ?? "pizza";

    let pool = poolByType(type);

    if (id === "best") {
      pool = MENU_ITEMS.filter((i) => i.isBest);
    }

    if (id === "side") {
      pool = pool.filter((i) => !isDrinkLine(i.line));
    }

    if (id === "premium") {
      pool = pool.filter((i) => i.line !== "solo");
    }

    const shuffled = shuffleCopy(pool);

    cards.forEach((cardEl, i) => {
      const item = shuffled[i] ?? randPick(pool);
      if (item) setCardUI(cardEl, item);
    });
  });
}

/* =========================================================
   11. 탭 + 저장
========================================================= */
const TAB_STORAGE_KEY = "mrpizza-menu-tab";

function saveActiveTab(filter) {
  try {
    localStorage.setItem(TAB_STORAGE_KEY, filter);
  } catch {}
}

function getSavedTab() {
  try {
    return localStorage.getItem(TAB_STORAGE_KEY);
  } catch {
    return null;
  }
}

function renderTab(filter) {
  showcaseInner.classList.toggle("is-pizza-compact", filter === "pizza");

  if (filter === "all") {
    showcaseInner.innerHTML = ALL_ORIGINAL_HTML;
    hydrateAll();
    return;
  }

  showcaseInner.innerHTML = "";

  let groups = [];
  if (filter === "pizza") groups = Object.entries(PIZZA_LINE_LABELS);
  if (filter === "side") groups = Object.entries(SIDE_LINE_LABELS);
  if (filter === "set") groups = [["special", "특제 세트"]];

  groups.forEach(([line, label]) => {
    const items = filter === "set" ? MENU_ITEMS.filter((i) => String(i.line) === String(line)) : MENU_ITEMS.filter((i) => i.line === line);

    if (!items.length) return;

    const block = document.createElement("section");
    block.className = "menu-block";
    block.dataset.group = filter;

    block.innerHTML = `
      <header class="menu-block__head">
        <h2 class="menu-block__title">${label}</h2>
        <div class="menu-block__line"></div>
      </header>
      <div class="menu-grid"></div>
    `;

    const grid = block.querySelector(".menu-grid");

    items.forEach((item) => {
      const article = document.createElement("article");
      article.dataset.id = item.id;
      article.dataset.type = filter;
      article.dataset.line = item.line ?? "";

      const badge = filter === "all" ? null : getBadgeLabel(item);

      const badgeHTML = badge ? `<span class="menu-item__badge" data-badge data-badge-kind="${badge.toLowerCase()}">${badge}</span>` : "";

      if (filter === "set") {
        article.className = "menu-item menu-item--set";
        article.dataset.type = "set";

        const opts = item.setOptions ?? [];
        const title = item.title ?? "";

        article.innerHTML = `
          <a class="menu-item__link" href="#" aria-label="${title} 자세히 보기">
            ${badgeHTML}
            <div class="set-card">
              <img class="set-main" src="${item.img ?? ""}" alt="${title} 세트 메인" />
              <div class="set-options" aria-hidden="true">
                <img class="set-opt set-opt--wing" src="${opts[0] ?? ""}" alt="" />
                <img class="set-opt set-opt--pasta" src="${opts[1] ?? ""}" alt="" />
              </div>
            </div>

            <div class="menu-item__info">
              <h3 class="menu-item__name">${title}</h3>
              <p class="menu-item__price">${formatCardPrice(item)}</p>
            </div>
          </a>
        `;
      } else {
        article.className = "menu-item";
        const title = item.title ?? "";

        article.innerHTML = `
          <a class="menu-item__link" href="#" aria-label="${title} 자세히 보기">
            ${badgeHTML}
            <div class="menu-item__media">
              <img class="menu-item__img" src="${item.img ?? ""}" alt="${title}" />
            </div>
            <div class="menu-item__info">
              <h3 class="menu-item__name">${title}</h3>
              <p class="menu-item__price">${formatCardPrice(item)}</p>
            </div>
          </a>
        `;
      }

      grid.appendChild(article);
    });

    showcaseInner.appendChild(block);
  });
}

function activateTab(filter) {
  tabBtns.forEach((b) => {
    const active = b.dataset.filter === filter;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-selected", String(active));
  });

  renderTab(filter);
  saveActiveTab(filter);
}

tabBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    activateTab(btn.dataset.filter);
  });
});

/* =========================================================
   12. 카드 클릭
========================================================= */
showcaseInner.addEventListener("click", (e) => {
  const article = e.target.closest(".menu-item");
  if (!article) return;

  e.preventDefault();

  const id = Number(article.dataset.id);
  const item = MENU_ITEMS.find((i) => i.id === id);
  if (item) openModal(item);
});

/* =========================================================
   13. 기타 이벤트
========================================================= */
closeBtn?.addEventListener("click", closeModal);

modal?.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

card?.addEventListener("click", (e) => e.stopPropagation());

sizeBtns.forEach((btn) =>
  btn.addEventListener("click", () => {
    if (btn.hidden || btn.disabled) return;
    size = btn.dataset.size;
    setActive(
      sizeBtns.filter((b) => !b.hidden),
      btn,
    );
    updateNutrition();
    updatePrice();
  }),
);

orderBtns.forEach((btn) =>
  btn.addEventListener("click", () => {
    orderType = btn.dataset.order;
    setActive(orderBtns, btn);
  }),
);

edgeWrap?.addEventListener("click", (e) => {
  if (!currentItem || !PIZZA_LINES.has(String(currentItem.line))) return;

  const btn = e.target.closest("[data-edge]");
  if (!btn) return;

  selectedEdge = btn.dataset.edge;
  renderEdges();
  updatePrice();
});

qtyBtns.forEach((btn) =>
  btn.addEventListener("click", () => {
    qty = Math.max(1, qty + Number(btn.dataset.qty));
    if (qtyVal) qtyVal.textContent = qty;
    updatePrice();
  }),
);

function setOrderType(next) {
  orderType = next;
  const activeBtn = [...orderBtns].find((b) => b.dataset.order === orderType);
  if (activeBtn) setActive(orderBtns, activeBtn);
}

function normalizeItem(raw) {
  const { basePrice, sizeOptions } = parsePriceString(raw.price);

  return {
    ...raw,
    basePrice,
    sizeOptions,
  };
}

/* =========================================================
   초기 실행
========================================================= */
const initialTab = getSavedTab() || document.querySelector(".menu-tabs__btn.is-active")?.dataset.filter || "all";

activateTab(initialTab);
