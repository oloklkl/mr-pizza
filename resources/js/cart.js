import { RAW_ITEMS, EDGE_PRICE_MAP } from "./menu-data.js";

/* =========================================================
   cart.js
========================================================= */

const CART_STORAGE_KEY = "mrpizza-cart";
const AUTH_STORAGE_KEY = "mrpizza-auth";
const REMOVE_ANIMATION_MS = 220;

/* =========================================================
   0. auth guard
========================================================= */
function getLoggedInUser() {
  try {
    const auth = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY));
    if (!auth || !auth.isLoggedIn) return null;
    return auth;
  } catch {
    return null;
  }
}

function requireLogin() {
  const user = getLoggedInUser();
  if (user) return;

  const redirectUrl = `${window.location.pathname}${window.location.search}`;
  window.location.href = `/pages/auth/login.html?redirect=${encodeURIComponent(redirectUrl)}`;
}

requireLogin();

/* =========================================================
   1. DOM
========================================================= */
const cartRoot = document.querySelector(".cart");
const cartItemsWrap = document.querySelector(".cart__items");
const subtotalEl = document.querySelector("[data-cart-subtotal]");
const totalEl = document.querySelector("[data-cart-total]");
const orderTypeBtns = [...document.querySelectorAll(".cart__type-btn")];
const noticeEl = document.querySelector(".cart__notice");
const payBtn = document.querySelector(".cart-summary__pay");

if (!cartRoot || !cartItemsWrap) {
  console.warn("[cart] required root not found");
}

/* =========================================================
   2. storage
========================================================= */
function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) ?? [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

/* =========================================================
   3. util
========================================================= */
const formatKRW = (n) => `₩${Number(n || 0).toLocaleString("ko-KR")}`;

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function labelToSizeKey(label) {
  const raw = String(label ?? "").trim();
  const upper = raw.toUpperCase();

  if (["S", "M", "L"].includes(upper)) return upper;
  if (/^\d+\s*ML$/i.test(raw)) return raw.replace(/[^\d]/g, "");
  if (/^\d+(\.\d+)?\s*L$/i.test(raw)) return String(Math.round(parseFloat(raw) * 1000));
  if (/^\d+\s*조각$/.test(raw)) return raw.replace(/[^\d]/g, "");

  return "ONE";
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
        label,
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

function getBasePriceBySize(item, sizeKey) {
  const { basePrice } = parsePriceString(item?.price);
  return basePrice?.[sizeKey] ?? basePrice?.ONE ?? 0;
}

function getEdgePrice(item, edgeId, sizeKey) {
  if (!item || !edgeId) return 0;

  const byEdge = EDGE_PRICE_MAP?.[edgeId];
  const byLine = EDGE_PRICE_MAP?.[item.line]?.[edgeId];

  if (byEdge && typeof byEdge === "object" && byEdge[sizeKey] != null) {
    return Number(byEdge[sizeKey]) || 0;
  }

  if (byLine && typeof byLine === "object" && byLine[sizeKey] != null) {
    return Number(byLine[sizeKey]) || 0;
  }

  if (typeof byLine === "number") {
    return byLine;
  }

  if (typeof byEdge === "number") {
    return byEdge;
  }

  return 0;
}

function getEdgeLabel(edgeId) {
  const labelMap = {
    origin: "오리지널",
    signature: "시그니처",
    cheesecap: "치즈캡",
    gold: "골드엣지",
    cream: "크림치즈",
    thin: "씬",
    cheesecrown: "치즈크라운",
  };

  return labelMap[edgeId] ?? edgeId ?? "";
}

function getDisplaySizeLabel(item, sizeKey) {
  if (!sizeKey || sizeKey === "ONE") return "";

  if (sizeKey === "M") return "M (29cm)";
  if (sizeKey === "L") return "L (34cm)";
  if (sizeKey === "S") return "S";

  if (item?.line === "drink") {
    if (sizeKey === "500") return "500ml";
    if (sizeKey === "1250") return "1.25L";
  }

  if (/조각/.test(item?.title || "")) {
    return `${sizeKey}조각`;
  }

  return sizeKey;
}

function buildMetaText(item, cartItem) {
  const sizeText = getDisplaySizeLabel(item, cartItem.size);
  const edgeText = cartItem.edge ? `엣지-${getEdgeLabel(cartItem.edge)}` : "";

  if (sizeText && edgeText) return `${sizeText}, ${edgeText}`;
  if (sizeText) return sizeText;
  if (edgeText) return edgeText;

  return "";
}

function buildOptionText(item, cartItem) {
  if (!cartItem.edge) return "";

  const edgeLabel = getEdgeLabel(cartItem.edge);
  const edgePrice = getEdgePrice(item, cartItem.edge, cartItem.size);

  if (!edgeLabel || !edgePrice) return "";

  return `${edgeLabel} ${formatKRW(edgePrice)}`;
}

function isMainCard(item) {
  const line = String(item?.line ?? "");
  return ["premium", "classic", "suncrust", "solo", "special"].includes(line);
}

function findMenuItem(id) {
  return RAW_ITEMS.find((v) => Number(v.id) === Number(id));
}

function flashPrice(articleEl) {
  const totalElInItem = articleEl?.querySelector("[data-item-total]");
  if (!totalElInItem) return;

  totalElInItem.classList.remove("is-updated");
  void totalElInItem.offsetWidth;
  totalElInItem.classList.add("is-updated");
}

function showCartToast(message) {
  let toast = document.querySelector(".cart-toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.className = "cart-toast";
    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <p class="cart-toast__text">${escapeHtml(message)}</p>
  `;

  toast.classList.remove("is-show");
  void toast.offsetWidth;
  toast.classList.add("is-show");

  clearTimeout(showCartToast._timer);
  showCartToast._timer = setTimeout(() => {
    toast.classList.remove("is-show");
  }, 3000);
}

/* =========================================================
   4. state
========================================================= */
let cart = getCart();

/* =========================================================
   5. item html
========================================================= */
function createCartItemHTML(item, cartItem, index) {
  const basePrice = getBasePriceBySize(item, cartItem.size);
  const finalUnitPrice = basePrice + getEdgePrice(item, cartItem.edge, cartItem.size);
  const totalPrice = finalUnitPrice * cartItem.qty;

  const metaText = buildMetaText(item, cartItem);
  const optionText = buildOptionText(item, cartItem);

  const thumbClass = isMainCard(item) ? "cart-item__thumb" : "cart-item__thumb cart-item__thumb--sm";
  const articleClass = isMainCard(item) ? "cart-item cart-item--main" : "cart-item";
  const imgSrc = item.cartImg || item.img || "";

  const optionLabel = optionText.includes("₩") ? optionText.split(" ₩")[0] : optionText;
  const optionPrice = optionText.includes("₩") ? `₩${optionText.split("₩")[1]}` : "";

  return `
    <article class="${articleClass}" data-index="${index}" data-id="${item.id}">
      <div class="${thumbClass}">
        <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(item.title)}" />
      </div>

      <div class="cart-item__info">
        <div class="cart-item__head">
          <h3 class="cart-item__name">${escapeHtml(item.title)}</h3>
          <button
            type="button"
            class="cart-item__remove"
            data-remove
            aria-label="${escapeHtml(item.title)} 삭제"
          >
            <i data-lucide="trash-2"></i>
          </button>
        </div>

        ${metaText ? `<p class="cart-item__meta">${escapeHtml(metaText)}</p>` : ""}
        ${optionText ? `<p class="cart-item__option">${escapeHtml(optionLabel)} <strong>${optionPrice}</strong></p>` : ""}
      </div>

      <div class="cart-item__side">
        <div class="cart-qty">
          <button type="button" aria-label="수량 감소" data-qty="-1">-</button>
          <span data-qty-val>${cartItem.qty}</span>
          <button type="button" aria-label="수량 증가" data-qty="1">+</button>
        </div>

        <p class="cart-item__total" data-item-total>${formatKRW(totalPrice)}</p>
      </div>
    </article>
  `;
}

/* =========================================================
   6. summary
========================================================= */
function renderSummary() {
  const subtotal = cart.reduce((sum, cartItem) => {
    const item = findMenuItem(cartItem.id);
    if (!item) return sum;

    const basePrice = getBasePriceBySize(item, cartItem.size);
    const edgePrice = getEdgePrice(item, cartItem.edge, cartItem.size);
    const totalPrice = (basePrice + edgePrice) * cartItem.qty;

    return sum + totalPrice;
  }, 0);

  if (subtotalEl) subtotalEl.textContent = formatKRW(subtotal);
  if (totalEl) totalEl.textContent = formatKRW(subtotal);
}

/* =========================================================
   7. empty
========================================================= */
function renderEmpty() {
  cartItemsWrap.innerHTML = `
    <div class="cart-empty">
      <p class="cart-empty__title">장바구니가 비어 있어요.</p>
      <p class="cart-empty__desc">맛있는 메뉴를 담아보세요.</p>
      <a href="/pages/menu.html" class="cart-empty__btn">메뉴 보러가기</a>
    </div>
  `;

  if (subtotalEl) subtotalEl.textContent = formatKRW(0);
  if (totalEl) totalEl.textContent = formatKRW(0);
}

/* =========================================================
   8. render
========================================================= */
function renderCart() {
  if (!cartItemsWrap) return;

  if (!cart.length) {
    renderEmpty();
    return;
  }

  const html = cart
    .map((cartItem, index) => {
      const item = findMenuItem(cartItem.id);
      if (!item) return "";
      return createCartItemHTML(item, cartItem, index);
    })
    .join("");

  cartItemsWrap.innerHTML = html;

  bindQtyEvents();
  bindRemoveEvents();
  renderSummary();

  if (window.lucide) {
    lucide.createIcons();
  }
}

/* =========================================================
   9. qty event
========================================================= */
function updateQty(index, delta) {
  const target = cart[index];
  if (!target) return;

  target.qty = Math.max(1, Number(target.qty || 1) + delta);
  saveCart(cart);
  renderCart();

  const articleEl = cartItemsWrap.querySelector(`[data-index="${index}"]`);
  flashPrice(articleEl);
}

function bindQtyEvents() {
  const cartItemEls = [...cartItemsWrap.querySelectorAll(".cart-item")];

  cartItemEls.forEach((articleEl) => {
    const index = Number(articleEl.dataset.index);
    const qtyBtns = [...articleEl.querySelectorAll("[data-qty]")];

    qtyBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const delta = Number(btn.dataset.qty || 0);
        updateQty(index, delta);
      });
    });
  });
}

/* =========================================================
   10. remove event
========================================================= */
function removeCartItem(index) {
  const articleEl = cartItemsWrap.querySelector(`[data-index="${index}"]`);

  if (!articleEl || index < 0 || index >= cart.length) {
    cart.splice(index, 1);
    saveCart(cart);
    renderCart();
    return;
  }

  articleEl.classList.add("is-removing");

  setTimeout(() => {
    cart.splice(index, 1);
    saveCart(cart);
    renderCart();
  }, REMOVE_ANIMATION_MS);
}

function bindRemoveEvents() {
  const cartItemEls = [...cartItemsWrap.querySelectorAll(".cart-item")];

  cartItemEls.forEach((articleEl) => {
    const index = Number(articleEl.dataset.index);
    const removeBtn = articleEl.querySelector("[data-remove]");

    removeBtn?.addEventListener("click", () => {
      removeCartItem(index);
    });
  });
}

/* =========================================================
   11. order type
========================================================= */
function setActiveOrderType(activeBtn) {
  orderTypeBtns.forEach((btn) => {
    btn.classList.toggle("is-active", btn === activeBtn);
  });

  const isDelivery = activeBtn?.textContent?.includes("배달");

  if (!noticeEl) return;

  noticeEl.innerHTML = isDelivery
    ? `
      <p>* 예상 도착 시간: 45~55분</p>
      <p>* 배달은 15,000원 이상 주문 가능합니다.</p>
    `
    : `
      <p>* 포장 주문은 매장에서 직접 수령 가능합니다.</p>
      <p>* 준비 완료 시 안내해 드립니다.</p>
    `;
}

function bindOrderTypeEvents() {
  orderTypeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      setActiveOrderType(btn);
    });
  });
}

/* =========================================================
   12. pay
========================================================= */
function handlePayClick() {
  const user = getLoggedInUser();

  if (!user) {
    const redirectUrl = `${window.location.pathname}${window.location.search}`;
    window.location.href = `/pages/auth/login.html?redirect=${encodeURIComponent(redirectUrl)}`;
    return;
  }

  if (!cart.length) {
    showCartToast("장바구니가 비어 있어요.");
    return;
  }

  showCartToast("결제 기능은 현재 준비 중입니다.");
  // window.location.href = "/pages/order/order.html";
}

function bindPayEvent() {
  payBtn?.addEventListener("click", handlePayClick);
}

/* =========================================================
   13. init
========================================================= */
bindOrderTypeEvents();
bindPayEvent();
renderCart();

const initialActiveOrderBtn = document.querySelector(".cart__type-btn.is-active");
if (initialActiveOrderBtn) {
  setActiveOrderType(initialActiveOrderBtn);
}
