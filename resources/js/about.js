(() => {
  // 페이지 안전장치 (다른 페이지에서도 로드될 수 있으니)
  const page = document.querySelector("main.about");
  if (!page || typeof gsap === "undefined") return;

  // ---------- utils ----------
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const ioOnce = (targets, onEnter, options = {}) => {
    const els = Array.isArray(targets) ? targets : [targets];
    const obs = new IntersectionObserver((entries, observer) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        onEnter(e.target);
        observer.unobserve(e.target);
      });
    }, options);
    els.forEach((el) => el && obs.observe(el));
    return obs;
  };

  // ---------- HERO ----------
  const hero = qs(".about-hero");
  const heroBgImg = qs(".about-hero__bg img");
  const heroTitle = qs(".about-hero__title");
  const heroSub = qs(".about-hero__sub");
  const heroLine = qs(".about-hero__line");
  const heroScroll = qs(".about-hero__scroll");

  if (hero && heroBgImg && heroTitle) {
    if (prefersReduced) {
      // 모션 최소화
      gsap.set([heroTitle, heroSub, heroLine, heroScroll].filter(Boolean), { opacity: 1, y: 0 });
      gsap.set(heroBgImg, { y: 0, scale: 1.04 });
    } else {
      // "사진은 먼저, 글씨는 나중에"
      gsap.set([heroTitle, heroSub, heroLine, heroScroll].filter(Boolean), { opacity: 0, y: 16 });

      // 배경은 살짝만 (지지직 이슈 있었으니 scale/transform은 과하지 않게)
      gsap.fromTo(heroBgImg, { scale: 1.06 }, { scale: 1.04, duration: 1.4, ease: "power2.out" });

      const tlHero = gsap.timeline({ delay: 0.15 });
      tlHero.to(heroTitle, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" }).to(heroSub, { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" }, "-=0.35").to(heroLine, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, "-=0.25").to(heroScroll, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, "-=0.15");

      // Scroll hint 은은하게
      if (heroScroll) {
        gsap.to(heroScroll, { y: 6, duration: 1.4, ease: "sine.inOut", repeat: -1, yoyo: true });
      }

      // 배경 패럴랙스 (스크롤에 따라 아주 살짝)
      let rafId = null;
      const onScrollHero = () => {
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
          rafId = null;
          const rect = hero.getBoundingClientRect();
          const vh = window.innerHeight || 1;
          const progress = clamp((vh - rect.top) / (vh + rect.height), 0, 1);

          // -14px ~ +14px 정도 (티 거의 안 나게)
          const y = (progress - 0.5) * 28;

          gsap.to(heroBgImg, { y, duration: 0.25, ease: "power2.out", overwrite: true });
        });
      };

      window.addEventListener("scroll", onScrollHero, { passive: true });
      window.addEventListener("resize", onScrollHero);
      onScrollHero();
    }
  }

  // ---------- VALUES (cards reveal) ----------
  const valuesSection = qs(".about-values");
  const cards = qsa(".about-values .value-card");

  if (valuesSection && cards.length) {
    if (prefersReduced) {
      gsap.set(cards, { opacity: 1, y: 0 });
    } else {
      // 초기 상태
      gsap.set(cards, { opacity: 0, y: 26 });

      // 섹션 진입하면 카드 순차 등장
      ioOnce(
        valuesSection,
        () => {
          gsap.to(cards, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            stagger: 0.12,
            overwrite: true,
          });
        },
        { threshold: 0.18 },
      );

      // 카드 hover는 CSS로 이미 lift 있으니, 여기선 스크롤 연출만!
    }
  }

  // ---------- END (closing: cinematic reveal + bg slow follow) ----------
  const endSection = qs(".about-end");
  const endBgImg = qs(".about-end__bg img");
  const endQuote = qs(".about-end__quote");
  const endSub = qs(".about-end__sub");
  const endActions = qs(".about-end__actions");

  if (endSection) {
    if (prefersReduced) {
      gsap.set([endQuote, endSub, endActions].filter(Boolean), { opacity: 1, y: 0, clearProps: "filter" });
      if (endBgImg) gsap.set(endBgImg, { y: 0 });
    } else {
      // 1) 텍스트: "필름 엔딩" 느낌 (y + opacity + 아주 약한 blur)
      const endTargets = [endQuote, endSub, endActions].filter(Boolean);
      gsap.set(endTargets, { opacity: 0, y: 26, filter: "blur(4px)" });

      ioOnce(
        endSection,
        () => {
          endSection.classList.add("is-inview");
          const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

          // 1️⃣ 메인 문구
          if (endQuote) {
            tl.to(
              endQuote,
              {
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                duration: 0.9,
              },
              0,
            );
          }

          // 2️⃣ 서브 문구
          if (endSub) {
            tl.to(
              endSub,
              {
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                duration: 0.8,
              },
              0.18,
            );
          }

          // 3️⃣ 버튼 (🔥 눌렸다가 올라오는 느낌)
          if (endActions) {
            tl.fromTo(
              endActions,
              {
                opacity: 0,
                y: 18,
                scale: 0.96,
                filter: "blur(3px)",
              },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                filter: "blur(0px)",
                duration: 0.85,
                ease: "back.out(1.6)", // ← 이게 포인트
              },
              0.34,
            );
          }
        },
        { threshold: 0.55, rootMargin: "0px 0px -10% 0px" },
      );

      // 2) 배경: 섹션 보일 때만 실행되는 "slow follow parallax"
      if (endBgImg) {
        gsap.set(endBgImg, { y: 0 });

        let rafId = null;
        let currentY = 0;
        let targetY = 0;
        let active = false;

        const updateTarget = () => {
          const rect = endSection.getBoundingClientRect();
          const vh = window.innerHeight || 1;

          // visible 범위 조금 넓게 잡기(부드러운 진입/이탈)
          const visible = rect.top < vh * 1.1 && rect.bottom > -vh * 0.1;
          if (!visible) return;

          // progress: 섹션이 뷰포트에 들어오고 나갈 때 0~1
          const progress = clamp((vh - rect.top) / (vh + rect.height), 0, 1);

          // 이동 범위(네가 쓰던 60 유지) : -30 ~ +30 정도 체감
          targetY = (progress - 0.5) * 60;
        };

        const tick = () => {
          rafId = null;

          // 천천히 따라가기 (0.08 좋음)
          currentY += (targetY - currentY) * 0.08;
          gsap.set(endBgImg, { y: currentY });

          if (active) rafId = requestAnimationFrame(tick);
        };

        const start = () => {
          if (active) return;
          active = true;
          updateTarget();
          tick();
        };

        const stop = () => {
          active = false;
          if (rafId) cancelAnimationFrame(rafId);
          rafId = null;
        };

        // 섹션이 화면에 들어오면 start, 나가면 stop (성능 + 깔끔)
        const io = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) start();
              else stop();
            });
          },
          { threshold: 0.02 },
        );
        io.observe(endSection);

        // 스크롤/리사이즈는 target만 업데이트
        const onScroll = () => updateTarget();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
      }
    }
  }
})();
