/* ========= helpers ========= */
const get = (target) => document.querySelector(target);
const getAll = (target) => document.querySelectorAll(target);

/* ========= 기본 a 태그 클릭 이벤트 방지 ========= */
const preventDefaultAnchor = () => {
  const $links = getAll('a[href="#"]');
  $links.forEach((link) => link.addEventListener("click", (e) => e.preventDefault()));
};

/* ========= GNB 메뉴 기능 (PC용 드롭다운/서브메뉴 있을 때) ========= */
const navBar = () => {
  const $gnblis = getAll("#header .nav .gnb > li");
  const $gnbuls = getAll("#header .nav .gnb > li ul");

  // 요소가 없으면 그냥 종료 (에러 방지)
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

/* ========= ✅ 햄버거 / 모바일 메뉴 초기화 (중복 바인딩 방지 포함) ========= */
const initMobileMenu = () => {
  const hamburger = document.querySelector(".hamburger");
  const mobileMenu = document.querySelector(".mobile-menu");

  // include 타이밍 때문에 없을 수 있음
  if (!hamburger || !mobileMenu) return;

  // ✅ 같은 이벤트가 여러 번 붙는 걸 방지
  if (hamburger.dataset.bound === "true") return;
  hamburger.dataset.bound = "true";

  // 초기 aria 상태
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

  // 오버레이 빈 공간 클릭 시 닫기
  mobileMenu.addEventListener("click", (e) => {
    if (e.target === mobileMenu) closeMenu();
  });

  // ESC 닫기
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && hamburger.classList.contains("active")) closeMenu();
  });

  mobileMenu.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", (e) => {
      a.classList.add("tap");

      setTimeout(() => {
        a.classList.remove("tap");
        closeMenu();
      }, 120); // 0.12초 네온 보여주고 닫기
    });
  });
};

includeHTML();

function includeHTML() {
  var z, i, elmnt, file, xhttp;
  z = document.getElementsByTagName("*");

  for (i = 0; i < z.length; i++) {
    elmnt = z[i];
    file = elmnt.getAttribute("include-html");

    if (file) {
      xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function () {
        if (this.readyState == 4) {
          if (this.status == 200) elmnt.innerHTML = this.responseText;
          if (this.status == 404) elmnt.innerHTML = "Page not found.";

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

  preventDefaultAnchor();

  navBar();

  skipNav();
}

document.addEventListener("DOMContentLoaded", () => {
  preventDefaultAnchor();
  navBar();
  skipNav();
  initMobileMenu();
});
