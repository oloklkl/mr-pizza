import { HERO_ITEMS } from "./menu-data.js";

(() => {
  const showcaseData = HERO_ITEMS;
  if (!showcaseData?.length) return;

  const $hero = document.querySelector("#hero");
  if (!$hero) return;

  // imgs
  const $curImg = $hero.querySelector(".hero__img--current");
  const $nextImg = $hero.querySelector(".hero__img--next");

  // wraps (회전/opacity 담당)
  const $curWrap = $hero.querySelector(".hero__imgWrap--current");
  const $nextWrap = $hero.querySelector(".hero__imgWrap--next");

  // movers (이동 변수 담당 ⭐⭐⭐ 중요)
  const $curMover = $curWrap.querySelector(".hero__mover");
  const $nextMover = $nextWrap.querySelector(".hero__mover");

  // text
  const $category = $hero.querySelector("[data-hero='category']");
  const $title = $hero.querySelector("[data-hero='title']");
  const $price = $hero.querySelector("[data-hero='price']");
  const $desc = $hero.querySelector("[data-hero='desc']");
  const $tags = $hero.querySelector("[data-hero='tags']");
  const $pick = $hero.querySelector("[data-hero='pick']");
  const $ctaBtns = Array.from($hero.querySelectorAll(".hero__cta .btn"));

  // progress
  const $progressFill = $hero.querySelector(".hero__progress-fill");
  const $current = $hero.querySelector(".hero__current");
  const $total = $hero.querySelector(".hero__total");

  let currentIndex = 0;
  let isAnimating = false;
  let timer = null;
  const autoDelay = 4500;

  const getHeroSrc = (item) => item?.heroImg ?? item?.img ?? "";
  const textEls = [$tags, $category, $title, $price, $pick, $desc].filter(Boolean);

  function setMoveVars($mover, vars) {
    gsap.set($mover, vars);
  }

  function resetState($wrap, $mover) {
    gsap.set($wrap, { opacity: 1, rotateY: 0, rotateZ: 0, scale: 1 });
    gsap.set($mover, {
      "--sx": "0px",
      "--sy": "0px",
      "--px": "0px",
      "--py": "0px",
      "--fy": "0px",
    });
  }

  function safeText(el, value) {
    if (!el) return;
    el.textContent = value ?? "";
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

  function animateProgress(index) {
    if (!$progressFill) return;

    const total = showcaseData.length;
    $current.textContent = String(index + 1).padStart(2, "0");
    $total.textContent = String(total).padStart(2, "0");

    gsap.killTweensOf($progressFill);
    gsap.set($progressFill, { width: "0%" });
    gsap.to($progressFill, {
      width: "100%",
      duration: autoDelay / 1000,
      ease: "none",
    });
  }

  function textIn() {
    gsap.fromTo(textEls, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.04, ease: "power3.out" });

    gsap.fromTo($ctaBtns, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.35, ease: "power3.out", delay: 0.1 });
  }

  function textOut() {
    gsap.to([...textEls, ...$ctaBtns], {
      opacity: 0,
      y: 10,
      duration: 0.2,
      ease: "power2.in",
    });
  }

  // ⭐ 첫 로딩: 오른쪽 밖 → 슝
  function intro() {
    const first = showcaseData[0];

    updateText(first);
    animateProgress(0);

    $curImg.src = getHeroSrc(first);
    $nextImg.src = getHeroSrc(showcaseData[1] ?? first);

    gsap.set($nextWrap, { opacity: 0 });
    $nextImg.style.visibility = "hidden";

    resetState($curWrap, $curMover);

    gsap.set($curWrap, { rotateY: 10, scale: 0.96 });
    setMoveVars($curMover, { "--sx": "900px" });

    const tl = gsap.timeline();

    tl.to($curMover, { "--sx": "0px", duration: 0.85, ease: "power3.out" }, 0);
    tl.to($curWrap, { rotateY: 0, scale: 1, duration: 0.85, ease: "power3.out" }, 0);
    tl.add(() => textIn(), 0.2);

    // floating
    gsap.to($curMover, {
      "--fy": "10px",
      duration: 2.6,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
      delay: 1,
    });
  }

  // ⭐ 전환: 왼쪽으로 빠짐 + 오른쪽에서 등장
  function transitionTo(nextIndex) {
    if (isAnimating) return;
    isAnimating = true;

    const nextItem = showcaseData[nextIndex];

    $nextImg.src = getHeroSrc(nextItem);
    $nextImg.style.visibility = "visible";

    resetState($nextWrap, $nextMover);

    gsap.set($nextWrap, { rotateY: -8, scale: 0.96, opacity: 1 });
    setMoveVars($nextMover, { "--sx": "900px" });

    gsap.killTweensOf($curMover);

    const tl = gsap.timeline({
      onComplete: () => {
        $curImg.src = getHeroSrc(nextItem);

        updateText(nextItem);
        animateProgress(nextIndex);

        currentIndex = nextIndex;

        resetState($curWrap, $curMover);
        gsap.set($nextWrap, { opacity: 0 });
        $nextImg.style.visibility = "hidden";

        // floating 재시작
        gsap.to($curMover, {
          "--fy": "10px",
          duration: 2.6,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
          delay: 0.3,
        });

        isAnimating = false;
      },
    });

    textOut();

    tl.to($curMover, { "--sx": "-500px", duration: 0.6, ease: "power3.inOut" }, 0);
    tl.to($curWrap, { opacity: 0, scale: 0.9, rotateY: 6, duration: 0.6 }, 0);

    tl.to($nextMover, { "--sx": "0px", duration: 0.8, ease: "power3.out" }, 0.1);
    tl.to($nextWrap, { rotateY: 0, scale: 1, duration: 0.8 }, 0.1);

    tl.add(() => textIn(), 0.3);
  }

  const goNext = () => transitionTo((currentIndex + 1) % showcaseData.length);

  function startAuto() {
    stopAuto();
    timer = setInterval(goNext, autoDelay);
  }

  function stopAuto() {
    if (timer) clearInterval(timer);
  }

  function init() {
    resetState($curWrap, $curMover);
    resetState($nextWrap, $nextMover);
    gsap.set($nextWrap, { opacity: 0 });
    $nextImg.style.visibility = "hidden";

    intro();
    startAuto();
  }

  init();
})();
