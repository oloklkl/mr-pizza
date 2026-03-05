(() => {
  // =========================================================
  // DROP HERO: parallax + petals wind + repel + sparkle + pizza tilt/shadow + noise
  // + COUNTDOWN(실제 타이머) + 출시 후 UI 전환(카운트 숨김/CTA 변경)
  // =========================================================

  const hero = document.querySelector(".drop-hero");
  if (!hero) return;

  const petalsWrap = hero.querySelector(".drop-petals");
  const inner = hero.querySelector(".drop-hero__inner"); // sparkle 기준
  const pizza = hero.querySelector(".drop-hero__pizza");
  const noise = hero.querySelector(".drop-noise");
  const groundShadow = hero.querySelector(".drop-ground-shadow");

  // ✅ 아무것도 없으면 종료
  if (!petalsWrap && !inner && !pizza && !noise && !groundShadow) return;

  // ✅ 모바일/터치에서는 과한 효과 off
  const isTouch = window.matchMedia("(hover: none)").matches || window.matchMedia("(pointer: coarse)").matches;

  let rafId = null;
  let running = false;

  // parallax 목표/현재값
  let targetX = 0,
    targetY = 0;
  let currentX = 0,
    currentY = 0;

  // repel(피하기)용 마우스 좌표
  let mouseX = null;
  let mouseY = null;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  // =========================
  //  TWEAK ZONE (취향 조절)
  // =========================
  const WIND_X = 28; // 바람 강도 X
  const WIND_Y = 20; // 바람 강도 Y
  const LERP = 0.12; // 따라오는 부드러움(작을수록 느림)

  // repel
  const REPEL_RADIUS = 120; // 영향 반경(px)
  const REPEL_STRENGTH = 16; // 밀림 강도(px)

  // pizza tilt
  const PIZZA_X = 0.45;
  const PIZZA_Y = 0.35;
  const TILT_X = 0.15; // deg per px
  const TILT_Y = -0.18;

  // shadow (pizza filter shadow 변수)
  const SHADOW_X = 0.6;
  const SHADOW_Y = 0.4;

  // sparkle / noise / hero shift
  const SPARKLE = 0.55;
  const NOISE = 0.12;
  const HERO_SHIFT = 0.08;

  // ground shadow (바닥 그림자)
  const GS_X = 0.35;
  const GS_Y = 0.18;
  // =========================

  const start = () => {
    if (running) return;
    running = true;
    rafId = requestAnimationFrame(tick);
  };

  const stop = () => {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  };

  const onMove = (e) => {
    if (isTouch) return;

    mouseX = e.clientX;
    mouseY = e.clientY;

    const rect = hero.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const nx = clamp((e.clientX - cx) / (rect.width / 2), -1, 1);
    const ny = clamp((e.clientY - cy) / (rect.height / 2), -1, 1);

    targetX = nx * WIND_X;
    targetY = ny * WIND_Y;

    if (!running) start();
  };

  const resetRepel = () => {
    if (!petalsWrap) return;
    petalsWrap.querySelectorAll(".petal").forEach((p) => {
      p.style.setProperty("--repel-x", "0px");
      p.style.setProperty("--repel-y", "0px");
    });
  };

  const applyRepel = () => {
    if (!petalsWrap || mouseX === null || mouseY === null) return;

    const petals = petalsWrap.querySelectorAll(".petal");
    if (!petals.length) return;

    petals.forEach((p) => {
      const r = p.getBoundingClientRect();
      const px = r.left + r.width / 2;
      const py = r.top + r.height / 2;

      const dx = px - mouseX;
      const dy = py - mouseY;
      const dist = Math.hypot(dx, dy);

      if (dist < REPEL_RADIUS && dist > 0.001) {
        const t = 1 - dist / REPEL_RADIUS; // 가까울수록 1
        const ox = (dx / dist) * (REPEL_STRENGTH * t);
        const oy = (dy / dist) * (REPEL_STRENGTH * t);

        p.style.setProperty("--repel-x", `${ox}px`);
        p.style.setProperty("--repel-y", `${oy}px`);
      } else {
        p.style.setProperty("--repel-x", "0px");
        p.style.setProperty("--repel-y", "0px");
      }
    });
  };

  const tick = () => {
    // lerp
    currentX += (targetX - currentX) * LERP;
    currentY += (targetY - currentY) * LERP;

    // 🌸 petals 바람 (transform 충돌 피하려고 변수로만)
    if (petalsWrap) {
      petalsWrap.style.setProperty("--wind-x", `${currentX}px`);
      petalsWrap.style.setProperty("--wind-y", `${currentY}px`);
    }

    // 🌸 repel
    if (!isTouch) applyRepel();

    // ✨ sparkle (inner::before)
    if (inner) {
      inner.style.setProperty("--sparkle-shift", `${-currentX * SPARKLE}px, ${-currentY * SPARKLE}px`);
    }

    // 🌑 ground shadow (바닥 그림자)
    if (groundShadow) {
      groundShadow.style.setProperty("--gs-x", `${currentX * GS_X}px`);
      groundShadow.style.setProperty("--gs-y", `${currentY * GS_Y}px`);
    }

    // 🍕 pizza (CSS 변수로)
    if (pizza) {
      const tiltX = currentY * TILT_X;
      const tiltY = currentX * TILT_Y;

      pizza.style.setProperty("--pizza-x", `${currentX * PIZZA_X}px`);
      pizza.style.setProperty("--pizza-y", `${currentY * PIZZA_Y}px`);

      pizza.style.setProperty("--pizza-tilt-x", `${tiltX}deg`);
      pizza.style.setProperty("--pizza-tilt-y", `${tiltY}deg`);

      pizza.style.setProperty("--shadow-x", `${currentX * SHADOW_X}px`);
      pizza.style.setProperty("--shadow-y", `${currentY * SHADOW_Y}px`);
    }

    // 🧂 noise
    if (noise) {
      noise.style.setProperty("--noise-x", `${-currentX * NOISE}px`);
      noise.style.setProperty("--noise-y", `${-currentY * NOISE}px`);
    }

    // 🌸 hero 전체도 아주 미세하게
    hero.style.setProperty("--hero-shift", `${-currentX * HERO_SHIFT}px ${-currentY * HERO_SHIFT}px`);

    // 멈출지 판단
    const dx = Math.abs(targetX - currentX);
    const dy = Math.abs(targetY - currentY);
    const keepAlive = mouseX !== null && mouseY !== null;

    if (!keepAlive && dx < 0.05 && dy < 0.05) {
      stop();
      return;
    }

    rafId = requestAnimationFrame(tick);
  };

  hero.addEventListener("mousemove", onMove);

  hero.addEventListener("mouseleave", () => {
    targetX = 0;
    targetY = 0;

    mouseX = null;
    mouseY = null;
    resetRepel();

    if (!running) start();
  });

  // ✅ 처음부터 살짝 “숨쉬는” 느낌 원하면 주석 해제
  // start();

  // =========================================================
  // ✅ COUNTDOWN (실제 타이머) + 출시 후 UI 전환
  // =========================================================
  const elDD = document.getElementById("dd");
  const elHH = document.getElementById("hh");
  const elMM = document.getElementById("mm");
  const elSS = document.getElementById("ss");

  // 2026.05.01 AM 10:00 (로컬 기준)
  const target = new Date(2026, 4, 1, 10, 0, 0);

  const pad2 = (n) => String(Math.max(0, n)).padStart(2, "0");

  const switchToLiveState = () => {
    // 카운트 숨기기
    const count = document.querySelector(".drop-count");
    if (count) count.style.display = "none";

    // CTA 텍스트만 변경 (아이콘 유지)
    const cta = document.querySelector(".drop-hero__cta");
    if (cta) {
      const ctaText = cta.querySelector(".drop-hero__cta-text");
      if (ctaText) ctaText.textContent = "지금 주문하기"; // 원하는 문구로 변경 가능

      // 프로젝트 구조에 맞춰 경로 수정 가능
      cta.setAttribute("href", "/pages/menu.html");
      cta.classList.add("live");
    }
  };

  const renderCountdown = () => {
    // 타이머 요소가 없으면 종료
    if (!elDD || !elHH || !elMM || !elSS) return false;

    const now = new Date();
    const diff = target.getTime() - now.getTime();

    if (diff <= 0) {
      elDD.textContent = "00";
      elHH.textContent = "00";
      elMM.textContent = "00";
      elSS.textContent = "00";

      switchToLiveState();
      return false;
    }

    const sec = Math.floor(diff / 1000);

    const days = Math.floor(sec / 86400);
    const hours = Math.floor((sec % 86400) / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;

    elDD.textContent = pad2(days);
    elHH.textContent = pad2(hours);
    elMM.textContent = pad2(mins);
    elSS.textContent = pad2(secs);

    return true;
  };

  // 첫 렌더
  if (elDD && elHH && elMM && elSS) {
    renderCountdown();

    // 매 초 정각에 맞춰 업데이트 (드리프트 줄임)
    const tickCountdown = () => {
      if (!renderCountdown()) return;
      const ms = 1000 - (Date.now() % 1000);
      setTimeout(tickCountdown, ms);
    };

    tickCountdown();
  }
})();
