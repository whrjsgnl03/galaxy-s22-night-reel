/* ============================================================
   Galaxy S22 — Night Reel
   스크롤 시네마틱 모션 (Lenis + GSAP ScrollTrigger)
   ============================================================ */

import "./style.css";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, SplitText);

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ── 부드러운 스크롤 ─────────────────────────────────── */
const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, smoothWheel: true });

lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    lenis.scrollTo(target, { offset: 0, duration: 1.4 });
  });
});

/* ── HUD: 타임코드 · 레일 ────────────────────────────── */
const timecode = document.querySelector("[data-timecode]");
const railFill = document.querySelector("[data-rail-fill]");

function formatTimecode(progress) {
  const totalFrames = Math.floor(progress * 96 * 24); // 96초 분량의 "릴"
  const frames = totalFrames % 24;
  const totalSeconds = Math.floor(totalFrames / 24);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return `00:${pad(minutes)}:${pad(seconds)}:${pad(frames)}`;
}

function updateHud() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  if (timecode) timecode.textContent = formatTimecode(progress);
  if (railFill) railFill.style.height = `${progress * 100}%`;
  updateActiveChapter();
}
lenis.on("scroll", updateHud);
window.addEventListener("resize", updateHud);

/* ── 챕터 활성 표시 ──────────────────────────────────── */
const chapterSections = [...document.querySelectorAll("[data-chapter]")];
const chapterLinks = new Map(
  [...document.querySelectorAll("[data-chapter-link]")].map((a) => [a.dataset.chapterLink, a])
);

/* 핀으로 고정된 섹션도 정확히 잡히도록 뷰포트 중앙을 기준으로 판정한다 */
function updateActiveChapter() {
  const mid = window.innerHeight * 0.5;
  let current = null;

  for (const section of chapterSections) {
    const rect = section.getBoundingClientRect();
    if (rect.top <= mid && rect.bottom >= mid) {
      current = section.dataset.chapter;
      break;
    }
  }

  chapterLinks.forEach((link, key) => link.classList.toggle("is-active", key === current));
}

/* ── 텍스트 라인 분할 (폰트 로드 후) ─────────────────── */
let splits = [];

function buildSplits() {
  document.querySelectorAll("[data-split]").forEach((el) => {
    splits.push(SplitText.create(el, { type: "lines", mask: "lines" }));
  });
}

/* ── 스크롤 등장 애니메이션 ──────────────────────────── */
function buildScrollAnimations() {
  /* 섹션별 페이드 */
  gsap.utils.toArray("[data-fade]").forEach((el) => {
    gsap.from(el, {
      opacity: 0,
      y: 26,
      duration: 1.1,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  });

  /* 분할된 라인 마스크 리빌 */
  splits.forEach((split) => {
    gsap.set(split.lines, { yPercent: 112 });
    gsap.to(split.lines, {
      yPercent: 0,
      duration: 1.15,
      ease: "expo.out",
      stagger: 0.09,
      scrollTrigger: { trigger: split.elements[0], start: "top 86%", once: true },
    });
  });

  /* 매니페스토: 고스트 워드 패럴랙스 */
  gsap.fromTo(
    ".manifesto__ghost",
    { xPercent: 4 },
    {
      xPercent: -4,
      ease: "none",
      scrollTrigger: {
        trigger: ".manifesto",
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    }
  );

  /* 히어로: 스크롤 아웃 */
  gsap
    .timeline({
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: 0.6,
      },
    })
    .to("[data-hero-phone]", { yPercent: -14, scale: 0.92, opacity: 0.35 }, 0)
    .to("[data-hero-glow]", { opacity: 0.2, scale: 1.4 }, 0)
    .to(".hero__copy", { yPercent: -12, opacity: 0 }, 0)
    .to(".hero__cue", { opacity: 0 }, 0);

  /* 02 카메라: 핀 + 스크럽 */
  const cameraTl = gsap.timeline({
    scrollTrigger: {
      trigger: ".camera",
      start: "top top",
      end: "+=240%",
      pin: ".camera__pin",
      scrub: 1,
      anticipatePin: 1,
    },
  });

  cameraTl
    .fromTo(
      "[data-camera-phone], [data-camera-marks]",
      { scale: 0.82, rotate: -5, yPercent: 6 },
      { scale: 1.05, rotate: 0, yPercent: 0, ease: "none", duration: 1 },
      0
    )
    .fromTo(
      ".camera__ghost",
      { opacity: 0.5, scale: 1.1 },
      { opacity: 1, scale: 1, ease: "none", duration: 1 },
      0
    )
    .to("[data-camera-flash]", { opacity: 0.85, duration: 0.22 }, 0.4)
    .fromTo(
      "[data-lens]",
      { opacity: 0, x: -18 },
      { opacity: 1, x: 0, stagger: 0.12, duration: 0.22 },
      0.44
    )
    .to("[data-camera-flash]", { opacity: 0.25, duration: 0.4 }, 0.72);

  /* STILL: 슬로우 줌 */
  gsap.fromTo(
    "[data-still-img]",
    { scale: 1.18 },
    {
      scale: 1,
      ease: "none",
      scrollTrigger: {
        trigger: ".still",
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    }
  );

  /* 04 스펙: 카운트업 */
  gsap.utils.toArray("[data-count]").forEach((el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const suffix = el.dataset.suffix || "";
    const state = { value: 0 };

    const render = () => {
      const value = decimals
        ? state.value.toFixed(decimals)
        : Math.round(state.value).toLocaleString("ko-KR");
      el.textContent = value + suffix;
    };

    ScrollTrigger.create({
      trigger: el,
      start: "top 90%",
      once: true,
      onEnter: () =>
        gsap.to(state, {
          value: target,
          duration: 1.8,
          ease: "power2.out",
          onUpdate: render,
          onComplete: () => {
            state.value = target;
            render();
          },
        }),
    });
  });

  /* 스펙 이퀄라이저 바 */
  gsap.utils.toArray(".specs__bars span").forEach((bar, i) => {
    gsap.from(bar, {
      scaleY: 0.1,
      duration: 0.9,
      ease: "expo.out",
      delay: i * 0.04,
      scrollTrigger: { trigger: ".specs__bars", start: "top 92%", once: true },
    });
    gsap.to(bar, {
      scaleY: () => gsap.utils.random(0.35, 1),
      duration: () => gsap.utils.random(0.5, 1.4),
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: i * 0.06,
    });
  });
}

/* ── 컬러 챕터: 가로 이동 ────────────────────────────── */
function buildColorsHorizontal() {
  const track = document.querySelector("[data-colors-track]");
  const progress = document.querySelector("[data-colors-progress]");
  if (!track) return;

  const mm = gsap.matchMedia();

  /* 데스크톱: 섹션을 고정하고 스크롤로 가로 이동 */
  mm.add("(min-width: 901px)", () => {
    /* 마지막 제품이 화면 오른쪽 패딩만큼 남도록 */
    const distance = () => {
      const pad = parseFloat(getComputedStyle(track).paddingRight) || 0;
      return Math.max(0, track.scrollWidth - window.innerWidth + pad);
    };

    gsap.to(track, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: {
        trigger: ".colors",
        start: "top top",
        end: () => `+=${distance()}`,
        pin: ".colors__pin",
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          if (progress) progress.style.width = `${self.progress * 100}%`;
        },
      },
    });
  });

  /* 모바일: 네이티브 가로 스크롤에 진행 바만 연결 */
  mm.add("(max-width: 900px)", () => {
    const onScroll = () => {
      const max = track.scrollWidth - track.clientWidth;
      if (progress) progress.style.width = `${max > 0 ? (track.scrollLeft / max) * 100 : 0}%`;
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => track.removeEventListener("scroll", onScroll);
  });
}

/* ── 인트로 + 히어로 등장 ────────────────────────────── */
function playIntro() {
  const counter = document.querySelector("[data-counter]");
  const state = { value: 0 };

  const heroTl = gsap.timeline({ delay: 0.15 });

  heroTl
    .to(state, {
      value: 100,
      duration: 1.15,
      ease: "power2.inOut",
      onUpdate: () => {
        if (counter) counter.textContent = String(Math.round(state.value)).padStart(3, "0");
      },
    })
    .to(".intro__inner", { opacity: 0, y: -14, duration: 0.45, ease: "power2.in" }, "-=0.15")
    .to(".intro", { yPercent: -100, duration: 1.1, ease: "expo.inOut" }, "-=0.1")
    .set(".intro", { display: "none" })
    .add(() => lenis.start(), "-=0.9")
    .from(
      ".film__bar",
      { height: "50vh", duration: 1.5, ease: "expo.inOut" },
      "-=0.9"
    )
    .to(
      "[data-hero-line]",
      { yPercent: 0, duration: 1.5, ease: "expo.out", stagger: 0.1 },
      "-=1.1"
    )
    .to(
      "[data-hero-phone]",
      { yPercent: 0, scale: 1, opacity: 1, rotate: 0, duration: 1.8, ease: "expo.out" },
      "-=1.4"
    )
    .to(
      "[data-hero-halo]",
      { scale: 1, opacity: 1, duration: 1.6, ease: "power2.out" },
      "-=1.5"
    )
    .to(
      "[data-hero-fade]",
      { opacity: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.08 },
      "-=1.3"
    );

  return heroTl;
}

/* ── 히어로 포인터 틸트 ──────────────────────────────── */
function buildHeroTilt() {
  const stage = document.querySelector("[data-hero-stage]");
  const phone = document.querySelector("[data-hero-phone]");
  if (!stage || !phone) return;

  gsap.set(phone, { transformPerspective: 900 });

  const quickRotX = gsap.quickTo(phone, "rotationX", { duration: 0.9, ease: "power3.out" });
  const quickRotY = gsap.quickTo(phone, "rotationY", { duration: 0.9, ease: "power3.out" });

  window.addEventListener("pointermove", (event) => {
    const x = event.clientX / window.innerWidth - 0.5;
    const y = event.clientY / window.innerHeight - 0.5;
    quickRotY(x * 14);
    quickRotX(-y * 10);
  });
}

/* ── 부팅 ────────────────────────────────────────────── */
async function boot() {
  /* 폰트가 준비된 뒤 분할해야 줄바꿈이 어긋나지 않는다 */
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      /* 폰트 로드 실패해도 진행 */
    }
  }

  if (reduceMotion) {
    document.querySelector(".intro")?.remove();
    document.querySelectorAll("[data-hero-phone], [data-camera-phone]").forEach((el) => {
      el.style.opacity = "1";
    });
    ScrollTrigger.refresh();
    return;
  }

  /* 인트로가 걷히기 전에 히어로 요소의 시작 상태를 고정해 깜빡임을 막는다 */
  gsap.set("[data-hero-line]", { yPercent: 118 });
  gsap.set("[data-hero-phone]", { yPercent: 12, scale: 0.9, opacity: 0, rotate: -6 });
  gsap.set("[data-hero-halo]", { scale: 0.6, opacity: 0 });
  gsap.set("[data-hero-fade]", { opacity: 0, y: 22 });

  updateHud();
  lenis.stop();
  buildSplits();
  buildScrollAnimations();
  buildColorsHorizontal();
  buildHeroTilt();
  playIntro();

  /* 모든 핀이 만들어진 뒤 한 번 더 정렬·재계산 */
  ScrollTrigger.sort();
  ScrollTrigger.refresh();

  /* 이미지 로드로 높이가 바뀌면 트리거 재계산 */
  window.addEventListener("load", () => ScrollTrigger.refresh());
}

boot();
