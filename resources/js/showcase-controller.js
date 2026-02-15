import { HERO_ITEMS } from "./menu-data.js";

(() => {
  const showcaseData = HERO_ITEMS;
  if (!showcaseData || showcaseData.length === 0) return;

  const $hero = document.querySelector("#hero");
  if (!$hero) return;

  const $curImg = $hero.querySelector(".hero__img--current");
  const $nextImg = $hero.querySelector(".hero__img--next");

  const $curWrap = $hero.querySelector(".hero__imgWrap--current");
  const $nextWrap = $hero.querySelector(".hero__imgWrap--next");

  const $category = $hero.querySelector("[data-hero='category']");
  const $title = $hero.querySelector("[data-hero='title']");
  const $price = $hero.querySelector("[data-hero='price']");
  const $desc = $hero.querySelector("[data-hero='desc']");
  const $tags = $hero.querySelector("[data-hero='tags']");
  const $pick = $hero.querySelector("[data-hero='pick']");

  const $ctaBtns = Array.from($hero.querySelectorAll(".hero__cta .btn"));

  // ✅ progress
  const $progressFill = $hero.querySelector(".hero__progress-fill");
  const $current = $hero.querySelector(".hero__current");
  const $total = $hero.querySelector(".hero__total");

  let currentIndex = 0;
  let isAnimating = false;
  let timer = null;
  const autoDelay = 4500;

  const safeText = (el, value) => {
    if (!el) return;
    el.textContent = value ?? "";
  };

  function animateProgress(index) {
    if (!$progressFill || !$current || !$total) return;

    const total = showcaseData.length;

    // 숫자 세팅
    $current.textContent = String(index + 1).padStart(2, "0");
    $total.textContent = String(total).padStart(2, "0");

    // 기존 애니메이션 죽이기
    gsap.killTweensOf($progressFill);

    // width 초기화
    gsap.set($progressFill, { width: "0%" });

    // 4.5초 동안 채워짐
    gsap.to($progressFill, {
      width: "100%",
      duration: 4.5,
      ease: "none",
    });
  }

  function updateText(item) {
    safeText($category, item.category);
    safeText($title, item.title);
    safeText($price, item.price);
    safeText($desc, item.desc);

    const badge = item.tags?.[0] ?? "";
    safeText($tags, badge);
    if ($tags) $tags.style.display = badge ? "inline-block" : "none";

    safeText($pick, item.pick ?? "");
    if ($pick) $pick.style.display = item.pick ? "block" : "none";
  }

  function setMotionVars(el, vars) {
    if (!el) return;
    gsap.set(el, vars);
  }

  // 🔥 오프닝
  function introAnim() {
    const textEls = [$tags, $category, $title, $price, $pick, $desc].filter(Boolean);

    gsap.set(textEls, { opacity: 0, y: 16 });
    gsap.set($ctaBtns, { opacity: 0, y: 18 });

    gsap.set($curWrap, { rotateZ: -6, rotateY: -10, scale: 0.92 });
    setMotionVars($curImg, { "--sx": "380px", "--sy": "40px" });

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.to($curWrap, { rotateZ: 0, rotateY: 0, scale: 1, duration: 0.9 }, 0);
    tl.to($curImg, { "--sx": "0px", "--sy": "0px", duration: 0.9 }, 0);

    tl.to(textEls, { opacity: 1, y: 0, duration: 0.35, stagger: 0.05 }, 0.3);
    tl.to($ctaBtns, { opacity: 1, y: 0, duration: 0.3 }, 0.6);
  }

  // 🔥 전환
  function transitionTo(nextIndex, dir = 1) {
    if (isAnimating) return;
    if (!$curImg || !$nextImg || !$curWrap || !$nextWrap) return;

    isAnimating = true;

    const nextItem = showcaseData[nextIndex];
    const textEls = [$tags, $category, $title, $price, $pick, $desc].filter(Boolean);

    $nextImg.src = nextItem.img;
    $nextImg.style.visibility = "visible";

    gsap.set($nextWrap, { opacity: 1, rotateY: dir * 15, scale: 0.96 });
    setMotionVars($nextImg, { opacity: 0, "--sx": `${dir * 140}px` });

    const tl = gsap.timeline({
      defaults: { ease: "power3.out" },
      onComplete: () => {
        $curImg.src = nextItem.img;
        updateText(nextItem);
        animateProgress(nextIndex);

        currentIndex = nextIndex;

        gsap.set($curWrap, { rotateY: 0, scale: 1 });
        setMotionVars($curImg, { opacity: 1, "--sx": "0px" });

        gsap.set($nextWrap, { opacity: 0, rotateY: 0, scale: 1 });
        setMotionVars($nextImg, { opacity: 0, "--sx": "0px" });
        $nextImg.style.visibility = "hidden";

        isAnimating = false;
      },
    });

    // brightness flash
    tl.to($hero, { filter: "brightness(0.92)", duration: 0.15 }, 0);
    tl.to($hero, { filter: "brightness(1)", duration: 0.4 }, 0.25);

    // 텍스트 OUT
    tl.to(textEls, { opacity: 0, y: 12, duration: 0.2 }, 0);

    // current OUT
    tl.to($curWrap, { rotateY: -dir * 20, scale: 0.9, duration: 0.5 }, 0);
    tl.to($curImg, { opacity: 0, "--sx": `${-dir * 100}px`, duration: 0.5 }, 0);

    // next IN
    tl.to($nextWrap, { rotateY: 0, scale: 1, duration: 0.7 }, 0.08);
    tl.to($nextImg, { opacity: 1, "--sx": "0px", duration: 0.7 }, 0.08);

    // 텍스트 IN
    tl.to(textEls, { opacity: 1, y: 0, duration: 0.3 }, 0.35);
  }

  const goNext = () => transitionTo((currentIndex + 1) % showcaseData.length, 1);

  const startAuto = () => {
    stopAuto();
    timer = setInterval(goNext, autoDelay);
  };

  const stopAuto = () => {
    if (timer) clearInterval(timer);
    timer = null;
  };

  function init() {
    updateText(showcaseData[0]);
    animateProgress(0);

    $curImg.src = showcaseData[0].img;
    $nextImg.src = showcaseData[1]?.img ?? showcaseData[0].img;
    $nextImg.style.visibility = "hidden";

    setMotionVars($curImg, {
      opacity: 1,
      "--sx": "0px",
      "--sy": "0px",
      "--px": "0px",
      "--py": "0px",
      "--fy": "0px",
    });

    // floating
    gsap.to($curImg, {
      "--fy": "10px",
      duration: 2.6,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });

    // parallax
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (canHover) {
      $hero.addEventListener("mousemove", (e) => {
        if (isAnimating) return;
        const r = $hero.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;

        gsap.to($curImg, {
          "--px": `${nx * 18}px`,
          "--py": `${ny * 14}px`,
          duration: 0.35,
          ease: "power2.out",
        });
      });

      $hero.addEventListener("mouseleave", () => {
        gsap.to($curImg, {
          "--px": "0px",
          "--py": "0px",
          duration: 0.4,
          ease: "power2.out",
        });
      });
    }

    introAnim();
    startAuto();
  }

  init();
})();
