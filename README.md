# Galaxy S22 — Night Reel

갤럭시 S22를 소개하는 **스크롤 시네마틱 원페이지 사이트**입니다.
영상처럼 느껴지도록 필름 그레인 · 레터박스 · 타임코드 HUD를 깔고, 스크롤에 따라
제품이 움직이고 카피가 마스크 리빌되는 구조로 만들었습니다.

## 실행

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/ 에 정적 파일 생성
npm run preview  # 빌드 결과 미리보기
```

## 구성

| 챕터 | 내용 | 모션 |
| --- | --- | --- |
| 01 OPEN | 히어로 · 제품 컷아웃 | 라인 마스크 리빌, 포인터 틸트, 스크롤 아웃 |
| — | 매니페스토 | 워드 고스트 패럴랙스, 라인 리빌 |
| 02 NIGHT | 나이트그래피 카메라 | **핀 고정 + 스크럽**, 렌즈 콜아웃 순차 등장 |
| — | 스틸 컷 | 슬로우 줌(full-bleed) |
| 03 COLOR | 4가지 컬러 | **핀 + 가로 이동**, 컬러별 스테이지 |
| 04 SPEC | 스펙 6종 | 카운트업, 이퀄라이저 바 |
| 05 WRAP | 아웃트로 · CTA | 라인 리빌 |

### 스택

- **Vite** + 바닐라 JS (프레임워크 없음)
- **GSAP 3** — ScrollTrigger(핀/스크럽), SplitText(라인 분할)
- **Lenis** — 관성 스크롤 (GSAP ticker에 연결)

### 파일

```
index.html            섹션 마크업
src/style.css         디자인 시스템 · 레이아웃 · 반응형
src/main.js           스크롤 타임라인 · 인트로 · HUD
scripts/prepare-images.py   프레스컷 배경 제거 → 컷아웃 WebP 생성
assets/source/        원본 프레스컷 (배포 대상 아님)
public/images/        가공된 제품 이미지 · 그레인 텍스처
```

## 핀(pin) 순서 주의

스크롤 고정 섹션이 여러 개면 **반드시 DOM 순서대로 `ScrollTrigger`를 만들어야**
합니다. 순서가 어긋나면 앞 섹션의 핀 구간이 뒤 섹션 위치를 반영하지 못해 두 섹션이
동시에 고정되며 내용이 겹칩니다. `buildScrollAnimations → buildColorsHorizontal` 순서를 유지하세요.

`prepare-images.py`는 삼성 프레스컷의 흰 배경을 테두리부터 flood fill로 지워
투명 컷아웃을 만듭니다. 배경이 흰색인 제품(팬텀 화이트)도 본체가 날아가지 않도록
전역 임계값 대신 연결 영역만 지우는 방식을 씁니다.

```bash
python3 scripts/prepare-images.py   # Pillow 필요
```

## 접근성 / 성능

- `prefers-reduced-motion: reduce`이면 인트로와 모든 스크롤 모션을 건너뜁니다.
- 모바일(≤900px)에서는 가로 핀을 끄고 네이티브 스와이프로 전환합니다.
- 애니메이션은 `transform` / `opacity` 위주로 구성했습니다.

## 이미지 출처

제품 이미지 © Samsung Electronics — [Samsung Newsroom 프레스 자료](https://news.samsung.com/us/new-samsung-galaxy-s22-s22-deliver-revolutionary-camera-experiences-day-night).
이 페이지는 **비공식 데모**이며 삼성전자와 제휴 관계가 없습니다. 상업적 사용 전에는
이미지 라이선스를 직접 확인하세요.
