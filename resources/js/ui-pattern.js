/* ========= helpers ========= */
const get = (target) => document.querySelector(target);
const getAll = (target) => document.querySelectorAll(target);

/* ========= GNB 메뉴 기능 (PC용 드롭다운/서브메뉴 있을 때) ========= */
const navBar = () => {
  const $gnblis = getAll("#header .nav .gnb > li");
  const $gnbuls = getAll("#header .nav .gnb > li ul");

  if ($gnblis.length === 0 || $gnbuls.length === 0) return;

  $gnblis.forEach((li, idx) => {
    li.addEventListener("mouseenter", () => {
      $gnbuls.forEach((ulItem) => ulItem.classList.remove("on"));
      if ($gnbuls[idx]) $gnbuls[idx].classList.add("on");
    });
  });

  $gnblis.forEach((li, idx) => {
    li.addEventListener("mouseleave", () => {
      if ($gnbuls[idx]) $gnbuls[idx].classList.remove("on");
    });
  });
};

/* ========= Skip Navigation (Tab 키로 이동 문제 해결) ========= */
const skipNav = () => {
  const $skipLinks = getAll("#skip-nav a");
  if ($skipLinks.length === 0) return;

  $skipLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href");
      const targetElement = get(targetId);

      if (targetElement) {
        targetElement.setAttribute("tabindex", "-1");
        targetElement.focus();
      }
    });
  });
};

/* ========= 햄버거 / 모바일 메뉴 초기화 ========= */
const initMobileMenu = () => {
  const hamburger = document.querySelector(".hamburger");
  const mobileMenu = document.querySelector(".mobile-menu");

  if (!hamburger || !mobileMenu) return;

  if (hamburger.dataset.bound === "true") return;
  hamburger.dataset.bound = "true";

  if (!hamburger.hasAttribute("aria-expanded")) hamburger.setAttribute("aria-expanded", "false");
  if (!mobileMenu.hasAttribute("aria-hidden")) mobileMenu.setAttribute("aria-hidden", "true");

  const openMenu = () => {
    hamburger.classList.add("active");
    mobileMenu.classList.add("active");
    hamburger.setAttribute("aria-expanded", "true");
    mobileMenu.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closeMenu = () => {
    hamburger.classList.remove("active");
    mobileMenu.classList.remove("active");
    hamburger.setAttribute("aria-expanded", "false");
    mobileMenu.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  const closeBtn = mobileMenu.querySelector(".mobile-menu__close");
  if (closeBtn) closeBtn.addEventListener("click", closeMenu);

  hamburger.addEventListener("click", () => {
    hamburger.classList.contains("active") ? closeMenu() : openMenu();
  });

  mobileMenu.addEventListener("click", (e) => {
    if (e.target === mobileMenu) closeMenu();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && hamburger.classList.contains("active")) closeMenu();
  });

  mobileMenu.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      a.classList.add("tap");

      setTimeout(() => {
        a.classList.remove("tap");
        closeMenu();
      }, 120);
    });
  });
};

/* ========= 로그인 상태 관리 (공통) ========= */
const GLOBAL_AUTH_STORAGE_KEY = "mrpizza-auth";

function getAuthUser() {
  try {
    const auth = JSON.parse(localStorage.getItem(GLOBAL_AUTH_STORAGE_KEY));
    if (!auth || !auth.isLoggedIn) return null;
    return auth;
  } catch {
    return null;
  }
}

function logout() {
  localStorage.removeItem(GLOBAL_AUTH_STORAGE_KEY);
  location.reload();
}

function createHeaderAuth(name) {
  const wrapper = document.createElement("div");
  wrapper.className = "header-auth";

  const nameEl = document.createElement("span");
  nameEl.className = "header-auth__name";
  nameEl.textContent = name || "USER";

  const logoutBtn = document.createElement("button");
  logoutBtn.className = "header-auth__logout";
  logoutBtn.type = "button";
  logoutBtn.textContent = "LOGOUT";
  logoutBtn.addEventListener("click", logout);

  wrapper.appendChild(nameEl);
  wrapper.appendChild(logoutBtn);

  return wrapper;
}

function updateHeaderAuth() {
  const auth = getAuthUser();

  const desktopAccountBtn = document.querySelector('.header__utils a[href*="login.html"]');
  const desktopUserIcon = desktopAccountBtn?.querySelector(".icon.user, .icon");

  const mobileAccountBtn = document.querySelector('.mobile-menu__util[href*="login.html"]');
  const mobileUserIcon = mobileAccountBtn?.querySelector(".icon");
  const mobileUserText = mobileAccountBtn?.querySelector("span");

  if (!auth) return;

  if (desktopAccountBtn && desktopUserIcon) {
    desktopAccountBtn.setAttribute("aria-label", "Logout");
    desktopAccountBtn.dataset.logout = "true";
    desktopUserIcon.setAttribute("data-lucide", "user-round-check");

    desktopAccountBtn.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  }

  if (mobileAccountBtn && mobileUserIcon && mobileUserText) {
    mobileAccountBtn.setAttribute("aria-label", "Logout");
    mobileUserIcon.setAttribute("data-lucide", "user-round-check");
    mobileUserText.textContent = "LOGOUT";

    mobileAccountBtn.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  }

  if (window.lucide) lucide.createIcons();
}

includeHTML();

function includeHTML() {
  let z;
  let i;
  let elmnt;
  let file;
  let xhttp;

  z = document.getElementsByTagName("*");

  for (i = 0; i < z.length; i++) {
    elmnt = z[i];
    file = elmnt.getAttribute("include-html");

    if (file) {
      xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function () {
        if (this.readyState === 4) {
          if (this.status === 200) elmnt.innerHTML = this.responseText;
          if (this.status === 404) elmnt.innerHTML = "Page not found.";

          elmnt.removeAttribute("include-html");
          includeHTML();
        }
      };
      xhttp.open("GET", file, true);
      xhttp.send();
      return;
    }
  }

  if (window.lucide) lucide.createIcons();

  initMobileMenu();
  navBar();
  skipNav();
  updateHeaderAuth();
}
