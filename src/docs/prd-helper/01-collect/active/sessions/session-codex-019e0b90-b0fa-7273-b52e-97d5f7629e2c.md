---
source_id: scan-codex-019e0b90-b0fa-7273-b52e-97d5f7629e2c
source_type: agent_conversation_turn
source_channel: active
source_time: 2026-05-19T16:26:14+08:00
captured_at: 2026-05-19T16:26:14+08:00
source_from: codex_conversation
agent: codex
session_id: 019e0b90-b0fa-7273-b52e-97d5f7629e2c
turn_count: 40
capture_scope: full_turn
status: collected
content_hash: sha256:eb3deb262bd28664
---

## Turn 1

### User Query

调度规则配置（implementation/dispatch/rule-config）里面的配置主要是关于。自动调度的配置，就是说你要去思考一下是否适合调度，就是我通过规则来生成巡检规划之后，具体在规划多久之前会生成任务，都会在这个调度规则配置里面去做，所以说你需要完善一下。


### Agent Answer

我先看一下现有 `implementation/dispatch/rule-config` 的结构和周边调度代码，确认这块现在表达了哪些规则、缺了哪些自动调度配置。

---

## Turn 2

### User Query

去除开启和关闭状态，都是开启状态，同 his存的时候二次确认变更


### Agent Answer

我会继续改同一个配置页：移除“启用状态”这项，让配置默认始终生效；保存按钮改成先弹出二次确认，确认后再提示保存成功。

---

## Turn 3

### User Query

源基础配置 /implementation/dispatch/resource-config 去除生效状态，说明这里是配置机器人优先巡检的区域。也就是说，当规划生成任务的时候，会优先按照这里的区域去指派。机器人，当，只是说当机器人没有空闲的时候，才会涉及到跨区域调度其他区域空闲机器人。


### Agent Answer

我先看资源基础配置页当前字段和说明，再按你的业务语义改成“机器人优先巡检区域配置”，并移除生效状态。

---

## Turn 4

### User Query

通知配置 /implementation/dispatch/notify-config优化下现在还缺少一个内容，可能就一个配置的短信内容。


### Agent Answer

我先看通知配置页当前内容，再把它补成包含短信内容模板的配置项，尽量保持和前面调度配置页面风格一致。

---

## Turn 5

### User Query

重新设计一下边巡边检implementation/dispatch/edge-inspection的页面。这里的话主要还是分为两块，一块是安全行为的边训边检，一个是气体分析的边训边检。另外的话，你还要看历史的数据吧，下面的热力图的话，我觉得你需要用那个地图作为背景去默克一下热力分布，就是说在地图上的一个热力分布。你在做之前先 commit 一下，如果不对，我会换，让你回退。但是大体的信息的话，就和现在这种是一样的，这个页面是一样的，你调整一下呢。


### Agent Answer

我先把目前已完成的调度规则、资源基础配置、通知配置这三处改动单独提交，避免后面重做边巡边检时混在一起。提交后再改 `edge-inspection` 页面。

---

## Turn 6

### User Query

重新设计一下边巡边检implementation/dispatch/edge-inspection的页面。这里的话主要还是分为两块，一块是安全行为的边训边检，一个是气体分析的边训边检。另外的话，你还要看历史的数据吧，下面的热力图的话，我觉得你需要用那个地图作为背景去默克一下热力分布，就是说在地图上的一个热力分布。你在做之前先 commit 一下，如果不对，我会换，让你回退。但是大体的信息的话，就和现在这种是一样的，这个页面是一样的，你调整一下呢。（尽可能在改动前把前面都 commit 了，不然的话，我怕到时候回滚的时候把前面回滚出问题。这个反正我要达到目的，你修改后不对，我可以进行回滚，回滚后的效果和当前是一样的，所有页面都是一样的就行了。）


### Agent Answer

我先确认刚才的提交是否已经成功落库，以及边巡边检文件是否还没动。只要前置提交存在，后面这个页面不满意就能单独回退。

---

## Turn 7

### User Query

你调整下，地图上用瓦片热力


### Agent Answer

我会把地图上的圆形热点改成瓦片热力覆盖：仍然用地图作底图，但热点按网格瓦片铺在对应区域，点击瓦片查看走势。

---

## Turn 8

### User Query

或者说调整一下，让他们作为特别切换，一个是安全行为的，一个是气体分析的。因为他们的核心的都会用到热力分布的地图，热力分布的瓦片地图，所以说可以合到一起。另外，你除了显示次数以外，啥，什么情况触发了？是类型是啥子？安全行为类型是啥子？或者说是气体的类型是哪个最高？百分比最高是多少？啥子气体最高，这都需要调整一下。


### Agent Answer

我会把两张并列卡改成一个共享的“瓦片热力地图”工作区，上方用切换控件在安全行为和气体分析之间切换；同时把瓦片和指标补充成“触发类型/最高气体类型/最高值/占比”这些业务信息。

---

## Turn 9

### User Query

<skill>
<name>ui-ux-pro-max</name>
<path>/Users/ldh/Downloads/project/极客光年/bot/.agents/skills/ui-ux-pro-max/SKILL.md</path>
---
name: ui-ux-pro-max
description: "UI/UX design intelligence for web and mobile. Includes 50+ styles, 161 color palettes, 57 font pairings, 161 product types, 99 UX guidelines, and 25 chart types across 10 stacks (React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, Tailwind, shadcn/ui, and HTML/CSS). Actions: plan, build, create, design, implement, review, fix, improve, optimize, enhance, refactor, and check UI/UX code. Projects: website, landing page, dashboard, admin panel, e-commerce, SaaS, portfolio, blog, and mobile app. Elements: button, modal, navbar, sidebar, card, table, form, and chart. Styles: glassmorphism, claymorphism, minimalism, brutalism, neumorphism, bento grid, dark mode, responsive, skeuomorphism, and flat design. Topics: color systems, accessibility, animation, layout, typography, font pairing, spacing, interaction states, shadow, and gradient. Integrations: shadcn/ui MCP for component search and examples."
---

# UI/UX Pro Max - Design Intelligence

Comprehensive design guide for web and mobile applications. Contains 50+ styles, 161 color palettes, 57 font pairings, 161 product types with reasoning rules, 99 UX guidelines, and 25 chart types across 10 technology stacks. Searchable database with priority-based recommendations.

## When to Apply

This Skill should be used when the task involves **UI structure, visual design decisions, interaction patterns, or user experience quality control**.

### Must Use

This Skill must be invoked in the following situations:

- Designing new pages (Landing Page, Dashboard, Admin, SaaS, Mobile App)
- Creating or refactoring UI components (buttons, modals, forms, tables, charts, etc.)
- Choosing color schemes, typography systems, spacing standards, or layout systems
- Reviewing UI code for user experience, accessibility, or visual consistency
- Implementing navigation structures, animations, or responsive behavior
- Making product-level design decisions (style, information hierarchy, brand expression)
- Improving perceived quality, clarity, or usability of interfaces

### Recommended

This Skill is recommended in the following situations:

- UI looks "not professional enough" but the reason is unclear
- Receiving feedback on usability or experience
- Pre-launch UI quality optimization
- Aligning cross-platform design (Web / iOS / Android)
- Building design systems or reusable component libraries

### Skip

This Skill is not needed in the following situations:

- Pure backend logic development
- Only involving API or database design
- Performance optimization unrelated to the interface
- Infrastructure or DevOps work
- Non-visual scripts or automation tasks

**Decision criteria**: If the task will change how a feature **looks, feels, moves, or is interacted with**, this Skill should be used.

## Rule Categories by Priority

*For human/AI reference: follow priority 1→10 to decide which rule category to focus on first; use `--domain <Domain>` to query details when needed. Scripts do not read this table.*

| Priority | Category | Impact | Domain | Key Checks (Must Have) | Anti-Patterns (Avoid) |
|----------|----------|--------|--------|------------------------|------------------------|
| 1 | Accessibility | CRITICAL | `ux` | Contrast 4.5:1, Alt text, Keyboard nav, Aria-labels | Removing focus rings, Icon-only buttons without labels |
| 2 | Touch & Interaction | CRITICAL | `ux` | Min size 44×44px, 8px+ spacing, Loading feedback | Reliance on hover only, Instant state changes (0ms) |
| 3 | Performance | HIGH | `ux` | WebP/AVIF, Lazy loading, Reserve space (CLS &lt; 0.1) | Layout thrashing, Cumulative Layout Shift |
| 4 | Style Selection | HIGH | `style`, `product` | Match product type, Consistency, SVG icons (no emoji) | Mixing flat & skeuomorphic randomly, Emoji as icons |
| 5 | Layout & Responsive | HIGH | `ux` | Mobile-first breakpoints, Viewport meta, No horizontal scroll | Horizontal scroll, Fixed px container widths, Disable zoom |
| 6 | Typography & Color | MEDIUM | `typography`, `color` | Base 16px, Line-height 1.5, Semantic color tokens | Text &lt; 12px body, Gray-on-gray, Raw hex in components |
| 7 | Animation | MEDIUM | `ux` | Duration 150–300ms, Motion conveys meaning, Spatial continuity | Decorative-only animation, Animating width/height, No reduced-motion |
| 8 | Forms & Feedback | MEDIUM | `ux` | Visible labels, Error near field, Helper text, Progressive disclosure | Placeholder-only label, Errors only at top, Overwhelm upfront |
| 9 | Navigation Patterns | HIGH | `ux` | Predictable back, Bottom nav ≤5, Deep linking | Overloaded nav, Broken back behavior, No deep links |
| 10 | Charts & Data | LOW | `chart` | Legends, Tooltips, Accessible colors | Relying on color alone to convey meaning |

## Quick Reference

### 1. Accessibility (CRITICAL)

- `color-contrast` - Minimum 4.5:1 ratio for normal text (large text 3:1); Material Design
- `focus-states` - Visible focus rings on interactive elements (2–4px; Apple HIG, MD)
- `alt-text` - Descriptive alt text for meaningful images
- `aria-labels` - aria-label for icon-only buttons; accessibilityLabel in native (Apple HIG)
- `keyboard-nav` - Tab order matches visual order; full keyboard support (Apple HIG)
- `form-labels` - Use label with for attribute
- `skip-links` - Skip to main content for keyboard users
- `heading-hierarchy` - Sequential h1→h6, no level skip
- `color-not-only` - Don't convey info by color alone (add icon/text)
- `dynamic-type` - Support system text scaling; avoid truncation as text grows (Apple Dynamic Type, MD)
- `reduced-motion` - Respect prefers-reduced-motion; reduce/disable animations when requested (Apple Reduced Motion API, MD)
- `voiceover-sr` - Meaningful accessibilityLabel/accessibilityHint; logical reading order for VoiceOver/screen readers (Apple HIG, MD)
- `escape-routes` - Provide cancel/back in modals and multi-step flows (Apple HIG)
- `keyboard-shortcuts` - Preserve system and a11y shortcuts; offer keyboard alternatives for drag-and-drop (Apple HIG)

### 2. Touch & Interaction (CRITICAL)

- `touch-target-size` - Min 44×44pt (Apple) / 48×48dp (Material); extend hit area beyond visual bounds if needed
- `touch-spacing` - Minimum 8px/8dp gap between touch targets (Apple HIG, MD)
- `hover-vs-tap` - Use click/tap for primary interactions; don't rely on hover alone
- `loading-buttons` - Disable button during async operations; show spinner or progress
- `error-feedback` - Clear error messages near problem
- `cursor-pointer` - Add cursor-pointer to clickable elements (Web)
- `gesture-conflicts` - Avoid horizontal swipe on main content; prefer vertical scroll
- `tap-delay` - Use touch-action: manipulation to reduce 300ms delay (Web)
- `standard-gestures` - Use platform standard gestures consistently; don't redefine (e.g. swipe-back, pinch-zoom) (Apple HIG)
- `system-gestures` - Don't block system gestures (Control Center, back swipe, etc.) (Apple HIG)
- `press-feedback` - Visual feedback on press (ripple/highlight; MD state layers)
- `haptic-feedback` - Use haptic for confirmations and important actions; avoid overuse (Apple HIG)
- `gesture-alternative` - Don't rely on gesture-only interactions; always provide visible controls for critical actions
- `safe-area-awareness` - Keep primary touch targets away from notch, Dynamic Island, gesture bar and screen edges
- `no-precision-required` - Avoid requiring pixel-perfect taps on small icons or thin edges
- `swipe-clarity` - Swipe actions must show clear affordance or hint (chevron, label, tutorial)
- `drag-threshold` - Use a movement threshold before starting drag to avoid accidental drags

### 3. Performance (HIGH)

- `image-optimization` - Use WebP/AVIF, responsive images (srcset/sizes), lazy load non-critical assets
- `image-dimension` - Declare width/height or use aspect-ratio to prevent layout shift (Core Web Vitals: CLS)
- `font-loading` - Use font-display: swap/optional to avoid invisible text (FOIT); reserve space to reduce layout shift (MD)
- `font-preload` - Preload only critical fonts; avoid overusing preload on every variant
- `critical-css` - Prioritize above-the-fold CSS (inline critical CSS or early-loaded stylesheet)
- `lazy-loading` - Lazy load non-hero components via dynamic import / route-level splitting
- `bundle-splitting` - Split code by route/feature (React Suspense / Next.js dynamic) to reduce initial load and TTI
- `third-party-scripts` - Load third-party scripts async/defer; audit and remove unnecessary ones (MD)
- `reduce-reflows` - Avoid frequent layout reads/writes; batch DOM reads then writes
- `content-jumping` - Reserve space for async content to avoid layout jumps (Core Web Vitals: CLS)
- `lazy-load-below-fold` - Use loading="lazy" for below-the-fold images and heavy media
- `virtualize-lists` - Virtualize lists with 50+ items to improve memory efficiency and scroll performance
- `main-thread-budget` - Keep per-frame work under ~16ms for 60fps; move heavy tasks off main thread (HIG, MD)
- `progressive-loading` - Use skeleton screens / shimmer instead of long blocking spinners for >1s operations (Apple HIG)
- `input-latency` - Keep input latency under ~100ms for taps/scrolls (Material responsiveness standard)
- `tap-feedback-speed` - Provide visual feedback within 100ms of tap (Apple HIG)
- `debounce-throttle` - Use debounce/throttle for high-frequency events (scroll, resize, input)
- `offline-support` - Provide offline state messaging and basic fallback (PWA / mobile)
- `network-fallback` - Offer degraded modes for slow networks (lower-res images, fewer animations)

### 4. Style Selection (HIGH)

- `style-match` - Match style to product type (use `--design-system` for recommendations)
- `consistency` - Use same style across all pages
- `no-emoji-icons` - Use SVG icons (Heroicons, Lucide), not emojis
- `color-palette-from-product` - Choose palette from product/industry (search `--domain color`)
- `effects-match-style` - Shadows, blur, radius aligned with chosen style (glass / flat / clay etc.)
- `platform-adaptive` - Respect platform idioms (iOS HIG vs Material): navigation, controls, typography, motion
- `state-clarity` - Make hover/pressed/disabled states visually distinct while staying on-style (Material state layers)
- `elevation-consistent` - Use a consistent elevation/shadow scale for cards, sheets, modals; avoid random shadow values
- `dark-mode-pairing` - Design light/dark variants together to keep brand, contrast, and style consistent
- `icon-style-consistent` - Use one icon set/visual language (stroke width, corner radius) across the product
- `system-controls` - Prefer native/system controls over fully custom ones; only customize when branding requires it (Apple HIG)
- `blur-purpose` - Use blur to indicate background dismissal (modals, sheets), not as decoration (Apple HIG)
- `primary-action` - Each screen should have only one primary CTA; secondary actions visually subordinate (Apple HIG)

### 5. Layout & Responsive (HIGH)

- `viewport-meta` - width=device-width initial-scale=1 (never disable zoom)
- `mobile-first` - Design mobile-first, then scale up to tablet and desktop
- `breakpoint-consistency` - Use systematic breakpoints (e.g. 375 / 768 / 1024 / 1440)
- `readable-font-size` - Minimum 16px body text on mobile (avoids iOS auto-zoom)
- `line-length-control` - Mobile 35–60 chars per line; desktop 60–75 chars
- `horizontal-scroll` - No horizontal scroll on mobile; ensure content fits viewport width
- `spacing-scale` - Use 4pt/8dp incremental spacing system (Material Design)
- `touch-density` - Keep component spacing comfortable for touch: not cramped, not causing mis-taps
- `container-width` - Consistent max-width on desktop (max-w-6xl / 7xl)
- `z-index-management` - Define layered z-index scale (e.g. 0 / 10 / 20 / 40 / 100 / 1000)
- `fixed-element-offset` - Fixed navbar/bottom bar must reserve safe padding for underlying content
- `scroll-behavior` - Avoid nested scroll regions that interfere with the main scroll experience
- `viewport-units` - Prefer min-h-dvh over 100vh on mobile
- `orientation-support` - Keep layout readable and operable in landscape mode
- `content-priority` - Show core content first on mobile; fold or hide secondary content
- `visual-hierarchy` - Establish hierarchy via size, spacing, contrast — not color alone

### 6. Typography & Color (MEDIUM)

- `line-height` - Use 1.5-1.75 for body text
- `line-length` - Limit to 65-75 characters per line
- `font-pairing` - Match heading/body font personalities
- `font-scale` - Consistent type scale (e.g. 12 14 16 18 24 32)
- `contrast-readability` - Darker text on light backgrounds (e.g. slate-900 on white)
- `text-styles-system` - Use platform type system: iOS 11 Dynamic Type styles / Material 5 type roles (display, headline, title, body, label) (HIG, MD)
- `weight-hierarchy` - Use font-weight to reinforce hierarchy: Bold headings (600–700), Regular body (400), Medium labels (500) (MD)
- `color-semantic` - Define semantic color tokens (primary, secondary, error, surface, on-surface) not raw hex in components (Material color system)
- `color-dark-mode` - Dark mode uses desaturated / lighter tonal variants, not inverted colors; test contrast separately (HIG, MD)
- `color-accessible-pairs` - Foreground/background pairs must meet 4.5:1 (AA) or 7:1 (AAA); use tools to verify (WCAG, MD)
- `color-not-decorative-only` - Functional color (error red, success green) must include icon/text; avoid color-only meaning (HIG, MD)
- `truncation-strategy` - Prefer wrapping over truncation; when truncating use ellipsis and provide full text via tooltip/expand (Apple HIG)
- `letter-spacing` - Respect default letter-spacing per platform; avoid tight tracking on body text (HIG, MD)
- `number-tabular` - Use tabular/monospaced figures for data columns, prices, and timers to prevent layout shift
- `whitespace-balance` - Use whitespace intentionally to group related items and separate sections; avoid visual clutter (Apple HIG)

### 7. Animation (MEDIUM)

- `duration-timing` - Use 150–300ms for micro-interactions; complex transitions ≤400ms; avoid >500ms (MD)
- `transform-performance` - Use transform/opacity only; avoid animating width/height/top/left
- `loading-states` - Show skeleton or progress indicator when loading exceeds 300ms
- `excessive-motion` - Animate 1-2 key elements per view max
- `easing` - Use ease-out for entering, ease-in for exiting; avoid linear for UI transitions
- `motion-meaning` - Every animation must express a cause-effect relationship, not just be decorative (Apple HIG)
- `state-transition` - State changes (hover / active / expanded / collapsed / modal) should animate smoothly, not snap
- `continuity` - Page/screen transitions should maintain spatial continuity (shared element, directional slide) (Apple HIG)
- `parallax-subtle` - Use parallax sparingly; must respect reduced-motion and not cause disorientation (Apple HIG)
- `spring-physics` - Prefer spring/physics-based curves over linear or cubic-bezier for natural feel (Apple HIG fluid animations)
- `exit-faster-than-enter` - Exit animations shorter than enter (~60–70% of enter duration) to feel responsive (MD motion)
- `stagger-sequence` - Stagger list/grid item entrance by 30–50ms per item; avoid all-at-once or too-slow reveals (MD)
- `shared-element-transition` - Use shared element / hero transitions for visual continuity between screens (MD, HIG)
- `interruptible` - Animations must be interruptible; user tap/gesture cancels in-progress animation immediately (Apple HIG)
- `no-blocking-animation` - Never block user input during an animation; UI must stay interactive (Apple HIG)
- `fade-crossfade` - Use crossfade for content replacement within the same container (MD)
- `scale-feedback` - Subtle scale (0.95–1.05) on press for tappable cards/buttons; restore on release (HIG, MD)
- `gesture-feedback` - Drag, swipe, and pinch must provide real-time visual response tracking the finger (MD Motion)
- `hierarchy-motion` - Use translate/scale direction to express hierarchy: enter from below = deeper, exit upward = back (MD)
- `motion-consistency` - Unify duration/easing tokens globally; all animations share the same rhythm and feel
- `opacity-threshold` - Fading elements should not linger below opacity 0.2; either fade fully or remain visible
- `modal-motion` - Modals/sheets should animate from their trigger source (scale+fade or slide-in) for spatial context (HIG, MD)
- `navigation-direction` - Forward navigation animates left/up; backward animates right/down — keep direction logically consistent (HIG)
- `layout-shift-avoid` - Animations must not cause layout reflow or CLS; use transform for position changes

### 8. Forms & Feedback (MEDIUM)

- `input-labels` - Visible label per input (not placeholder-only)
- `error-placement` - Show error below the related field
- `submit-feedback` - Loading then success/error state on submit
- `required-indicators` - Mark required fields (e.g. asterisk)
- `empty-states` - Helpful message and action when no content
- `toast-dismiss` - Auto-dismiss toasts in 3-5s
- `confirmation-dialogs` - Confirm before destructive actions
- `input-helper-text` - Provide persistent helper text below complex inputs, not just placeholder (Material Design)
- `disabled-states` - Disabled elements use reduced opacity (0.38–0.5) + cursor change + semantic attribute (MD)
- `progressive-disclosure` - Reveal complex options progressively; don't overwhelm users upfront (Apple HIG)
- `inline-validation` - Validate on blur (not keystroke); show error only after user finishes input (MD)
- `input-type-keyboard` - Use semantic input types (email, tel, number) to trigger the correct mobile keyboard (HIG, MD)
- `password-toggle` - Provide show/hide toggle for password fields (MD)
- `autofill-support` - Use autocomplete / textContentType attributes so the system can autofill (HIG, MD)
- `undo-support` - Allow undo for destructive or bulk actions (e.g. "Undo delete" toast) (Apple HIG)
- `success-feedback` - Confirm completed actions with brief visual feedback (checkmark, toast, color flash) (MD)
- `error-recovery` - Error messages must include a clear recovery path (retry, edit, help link) (HIG, MD)
- `multi-step-progress` - Multi-step flows show step indicator or progress bar; allow back navigation (MD)
- `form-autosave` - Long forms should auto-save drafts to prevent data loss on accidental dismissal (Apple HIG)
- `sheet-dismiss-confirm` - Confirm before dismissing a sheet/modal with unsaved changes (Apple HIG)
- `error-clarity` - Error messages must state cause + how to fix (not just "Invalid input") (HIG, MD)
- `field-grouping` - Group related fields logically (fieldset/legend or visual grouping) (MD)
- `read-only-distinction` - Read-only state should be visually and semantically different from disabled (MD)
- `focus-management` - After submit error, auto-focus the first invalid field (WCAG, MD)
- `error-summary` - For multiple errors, show summary at top with anchor links to each field (WCAG)
- `touch-friendly-input` - Mobile input height ≥44px to meet touch target requirements (Apple HIG)
- `destructive-emphasis` - Destructive actions use semantic danger color (red) and are visually separated from primary actions (HIG, MD)
- `toast-accessibility` - Toasts must not steal focus; use aria-live="polite" for screen reader announcement (WCAG)
- `aria-live-errors` - Form errors use aria-live region or role="alert" to notify screen readers (WCAG)
- `contrast-feedback` - Error and success state colors must meet 4.5:1 contrast ratio (WCAG, MD)
- `timeout-feedback` - Request timeout must show clear feedback with retry option (MD)

### 9. Navigation Patterns (HIGH)

- `bottom-nav-limit` - Bottom navigation max 5 items; use labels with icons (Material Design)
- `drawer-usage` - Use drawer/sidebar for secondary navigation, not primary actions (Material Design)
- `back-behavior` - Back navigation must be predictable and consistent; preserve scroll/state (Apple HIG, MD)
- `deep-linking` - All key screens must be reachable via deep link / URL for sharing and notifications (Apple HIG, MD)
- `tab-bar-ios` - iOS: use bottom Tab Bar for top-level navigation (Apple HIG)
- `top-app-bar-android` - Android: use Top App Bar with navigation icon for primary structure (Material Design)
- `nav-label-icon` - Navigation items must have both icon and text label; icon-only nav harms discoverability (MD)
- `nav-state-active` - Current location must be visually highlighted (color, weight, indicator) in navigation (HIG, MD)
- `nav-hierarchy` - Primary nav (tabs/bottom bar) vs secondary nav (drawer/settings) must be clearly separated (MD)
- `modal-escape` - Modals and sheets must offer a clear close/dismiss affordance; swipe-down to dismiss on mobile (Apple HIG)
- `search-accessible` - Search must be easily reachable (top bar or tab); provide recent/suggested queries (MD)
- `breadcrumb-web` - Web: use breadcrumbs for 3+ level deep hierarchies to aid orientation (MD)
- `state-preservation` - Navigating back must restore previous scroll position, filter state, and input (HIG, MD)
- `gesture-nav-support` - Support system gesture navigation (iOS swipe-back, Android predictive back) without conflict (HIG, MD)
- `tab-badge` - Use badges on nav items sparingly to indicate unread/pending; clear after user visits (HIG, MD)
- `overflow-menu` - When actions exceed available space, use overflow/more menu instead of cramming (MD)
- `bottom-nav-top-level` - Bottom nav is for top-level screens only; never nest sub-navigation inside it (MD)
- `adaptive-navigation` - Large screens (≥1024px) prefer sidebar; small screens use bottom/top nav (Material Adaptive)
- `back-stack-integrity` - Never silently reset the navigation stack or unexpectedly jump to home (HIG, MD)
- `navigation-consistency` - Navigation placement must stay the same across all pages; don't change by page type
- `avoid-mixed-patterns` - Don't mix Tab + Sidebar + Bottom Nav at the same hierarchy level
- `modal-vs-navigation` - Modals must not be used for primary navigation flows; they break the user's path (HIG)
- `focus-on-route-change` - After page transition, move focus to main content region for screen reader users (WCAG)
- `persistent-nav` - Core navigation must remain reachable from deep pages; don't hide it entirely in sub-flows (HIG, MD)
- `destructive-nav-separation` - Dangerous actions (delete account, logout) must be visually and spatially separated from normal nav items (HIG, MD)
- `empty-nav-state` - When a nav destination is unavailable, explain why instead of silently hiding it (MD)

### 10. Charts & Data (LOW)

- `chart-type` - Match chart type to data type (trend → line, comparison → bar, proportion → pie/donut)
- `color-guidance` - Use accessible color palettes; avoid red/green only pairs for colorblind users (WCAG, MD)
- `data-table` - Provide table alternative for accessibility; charts alone are not screen-reader friendly (WCAG)
- `pattern-texture` - Supplement color with patterns, textures, or shapes so data is distinguishable without color (WCAG, MD)
- `legend-visible` - Always show legend; position near the chart, not detached below a scroll fold (MD)
- `tooltip-on-interact` - Provide tooltips/data labels on hover (Web) or tap (mobile) showing exact values (HIG, MD)
- `axis-labels` - Label axes with units and readable scale; avoid truncated or rotated labels on mobile
- `responsive-chart` - Charts must reflow or simplify on small screens (e.g. horizontal bar instead of vertical, fewer ticks)
- `empty-data-state` - Show meaningful empty state when no data exists ("No data yet" + guidance), not a blank chart (MD)
- `loading-chart` - Use skeleton or shimmer placeholder while chart data loads; don't show an empty axis frame
- `animation-optional` - Chart entrance animations must respect prefers-reduced-motion; data should be readable immediately (HIG)
- `large-dataset` - For 1000+ data points, aggregate or sample; provide drill-down for detail instead of rendering all (MD)
- `number-formatting` - Use locale-aware formatting for numbers, dates, currencies on axes and labels (HIG, MD)
- `touch-target-chart` - Interactive chart elements (points, segments) must have ≥44pt tap area or expand on touch (Apple HIG)
- `no-pie-overuse` - Avoid pie/donut for >5 categories; switch to bar chart for clarity
- `contrast-data` - Data lines/bars vs background ≥3:1; data text labels ≥4.5:1 (WCAG)
- `legend-interactive` - Legends should be clickable to toggle series visibility (MD)
- `direct-labeling` - For small datasets, label values directly on the chart to reduce eye travel
- `tooltip-keyboard` - Tooltip content must be keyboard-reachable and not rely on hover alone (WCAG)
- `sortable-table` - Data tables must support sorting with aria-sort indicating current sort state (WCAG)
- `axis-readability` - Axis ticks must not be cramped; maintain readable spacing, auto-skip on small screens
- `data-density` - Limit information density per chart to avoid cognitive overload; split into multiple charts if needed
- `trend-emphasis` - Emphasize data trends over decoration; avoid heavy gradients/shadows that obscure the data
- `gridline-subtle` - Grid lines should be low-contrast (e.g. gray-200) so they don't compete with data
- `focusable-elements` - Interactive chart elements (points, bars, slices) must be keyboard-navigable (WCAG)
- `screen-reader-summary` - Provide a text summary or aria-label describing the chart's key insight for screen readers (WCAG)
- `error-state-chart` - Data load failure must show error message with retry action, not a broken/empty chart
- `export-option` - For data-heavy products, offer CSV/image export of chart data
- `drill-down-consistency` - Drill-down interactions must maintain a clear back-path and hierarchy breadcrumb
- `time-scale-clarity` - Time series charts must clearly label time granularity (day/week/month) and allow switching

## How to Use

Search specific domains using the CLI tool below.

---

## Prerequisites

Check if Python is installed:

```bash
python3 --version || python --version
```

If Python is not installed, install it based on user's OS:

**macOS:**
```bash
brew install python3
```

**Ubuntu/Debian:**
```bash
sudo apt update && sudo apt install python3
```

**Windows:**
```powershell
winget install Python.Python.3.12
```

---

## How to Use This Skill

Use this skill when the user requests any of the following:

| Scenario | Trigger Examples | Start From |
|----------|-----------------|------------|
| **New project / page** | "Build a landing page", "Build a dashboard" | Step 1 → Step 2 (design system) |
| **New component** | "Create a pricing card", "Add a modal" | Step 3 (domain search: style, ux) |
| **Choose style / color / font** | "What style fits a fintech app?", "Recommend a color palette" | Step 2 (design system) |
| **Review existing UI** | "Review this page for UX issues", "Check accessibility" | Quick Reference checklist above |
| **Fix a UI bug** | "Button hover is broken", "Layout shifts on load" | Quick Reference → relevant section |
| **Improve / optimize** | "Make this faster", "Improve mobile experience" | Step 3 (domain search: ux, react) |
| **Implement dark mode** | "Add dark mode support" | Step 3 (domain: style "dark mode") |
| **Add charts / data viz** | "Add an analytics dashboard chart" | Step 3 (domain: chart) |
| **Stack best practices** | "React performance tips"、"SwiftUI navigation" | Step 4 (stack search) |

Follow this workflow:

### Step 1: Analyze User Requirements

Extract key information from user request:
- **Product type**: Entertainment (social, video, music, gaming), Tool (scanner, editor, converter), Productivity (task manager, notes, calendar), or hybrid
- **Target audience**: C-end consumer users; consider age group, usage context (commute, leisure, work)
- **Style keywords**: playful, vibrant, minimal, dark mode, content-first, immersive, etc.
- **Stack**: React Native (this project's only tech stack)

### Step 2: Generate Design System (REQUIRED)

**Always start with `--design-system`** to get comprehensive recommendations with reasoning:

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<product_type> <industry> <keywords>" --design-system [-p "Project Name"]
```

This command:
1. Searches domains in parallel (product, style, color, landing, typography)
2. Applies reasoning rules from `ui-reasoning.csv` to select best matches
3. Returns complete design system: pattern, style, colors, typography, effects
4. Includes anti-patterns to avoid

**Example:**
```bash
python3 skills/ui-ux-pro-max/scripts/search.py "beauty spa wellness service" --design-system -p "Serenity Spa"
```

### Step 2b: Persist Design System (Master + Overrides Pattern)

To save the design system for **hierarchical retrieval across sessions**, add `--persist`:

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system --persist -p "Project Name"
```

This creates:
- `design-system/MASTER.md` — Global Source of Truth with all design rules
- `design-system/pages/` — Folder for page-specific overrides

**With page-specific override:**
```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system --persist -p "Project Name" --page "dashboard"
```

This also creates:
- `design-system/pages/dashboard.md` — Page-specific deviations from Master

**How hierarchical retrieval works:**
1. When building a specific page (e.g., "Checkout"), first check `design-system/pages/checkout.md`
2. If the page file exists, its rules **override** the Master file
3. If not, use `design-system/MASTER.md` exclusively

**Context-aware retrieval prompt:**
```
I am building the [Page Name] page. Please read design-system/MASTER.md.
Also check if design-system/pages/[page-name].md exists.
If the page file exists, prioritize its rules.
If not, use the Master rules exclusively.
Now, generate the code...
```

### Step 3: Supplement with Detailed Searches (as needed)

After getting the design system, use domain searches to get additional details:

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<keyword>" --domain <domain> [-n <max_results>]
```

**When to use detailed searches:**

| Need | Domain | Example |
|------|--------|---------|
| Product type patterns | `product` | `--domain product "entertainment social"` |
| More style options | `style` | `--domain style "glassmorphism dark"` |
| Color palettes | `color` | `--domain color "entertainment vibrant"` |
| Font pairings | `typography` | `--domain typography "playful modern"` |
| Chart recommendations | `chart` | `--domain chart "real-time dashboard"` |
| UX best practices | `ux` | `--domain ux "animation accessibility"` |
| Alternative fonts | `typography` | `--domain typography "elegant luxury"` |
| Individual Google Fonts | `google-fonts` | `--domain google-fonts "sans serif popular variable"` |
| Landing structure | `landing` | `--domain landing "hero social-proof"` |
| React Native perf | `react` | `--domain react "rerender memo list"` |
| App interface a11y | `web` | `--domain web "accessibilityLabel touch safe-areas"` |
| AI prompt / CSS keywords | `prompt` | `--domain prompt "minimalism"` |

### Step 4: Stack Guidelines (React Native)

Get React Native implementation-specific best practices:

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "<keyword>" --stack react-native
```

---

## Search Reference

### Available Domains

| Domain | Use For | Example Keywords |
|--------|---------|------------------|
| `product` | Product type recommendations | SaaS, e-commerce, portfolio, healthcare, beauty, service |
| `style` | UI styles, colors, effects | glassmorphism, minimalism, dark mode, brutalism |
| `typography` | Font pairings, Google Fonts | elegant, playful, professional, modern |
| `color` | Color palettes by product type | saas, ecommerce, healthcare, beauty, fintech, service |
| `landing` | Page structure, CTA strategies | hero, hero-centric, testimonial, pricing, social-proof |
| `chart` | Chart types, library recommendations | trend, comparison, timeline, funnel, pie |
| `ux` | Best practices, anti-patterns | animation, accessibility, z-index, loading |
| `google-fonts` | Individual Google Fonts lookup | sans serif, monospace, japanese, variable font, popular |
| `react` | React/Next.js performance | waterfall, bundle, suspense, memo, rerender, cache |
| `web` | App interface guidelines (iOS/Android/React Native) | accessibilityLabel, touch targets, safe areas, Dynamic Type |
| `prompt` | AI prompts, CSS keywords | (style name) |

### Available Stacks

| Stack | Focus |
|-------|-------|
| `react-native` | Components, Navigation, Lists |

---

## Example Workflow

**User request:** "Make an AI search homepage."

### Step 1: Analyze Requirements
- Product type: Tool (AI search engine)
- Target audience: C-end users looking for fast, intelligent search
- Style keywords: modern, minimal, content-first, dark mode
- Stack: React Native

### Step 2: Generate Design System (REQUIRED)

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "AI search tool modern minimal" --design-system -p "AI Search"
```

**Output:** Complete design system with pattern, style, colors, typography, effects, and anti-patterns.

### Step 3: Supplement with Detailed Searches (as needed)

```bash
# Get style options for a modern tool product
python3 skills/ui-ux-pro-max/scripts/search.py "minimalism dark mode" --domain style

# Get UX best practices for search interaction and loading
python3 skills/ui-ux-pro-max/scripts/search.py "search loading animation" --domain ux
```

### Step 4: Stack Guidelines

```bash
python3 skills/ui-ux-pro-max/scripts/search.py "list performance navigation" --stack react-native
```

**Then:** Synthesize design system + detailed searches and implement the design.

---

## Output Formats

The `--design-system` flag supports two output formats:

```bash
# ASCII box (default) - best for terminal display
python3 skills/ui-ux-pro-max/scripts/search.py "fintech crypto" --design-system

# Markdown - best for documentation
python3 skills/ui-ux-pro-max/scripts/search.py "fintech crypto" --design-system -f markdown
```

---

## Tips for Better Results

### Query Strategy

- Use **multi-dimensional keywords** — combine product + industry + tone + density: `"entertainment social vibrant content-dense"` not just `"app"`
- Try different keywords for the same need: `"playful neon"` → `"vibrant dark"` → `"content-first minimal"`
- Use `--design-system` first for full recommendations, then `--domain` to deep-dive any dimension you're unsure about
- Always add `--stack react-native` for implementation-specific guidance

### Common Sticking Points

| Problem | What to Do |
|---------|------------|
| Can't decide on style/color | Re-run `--design-system` with different keywords |
| Dark mode contrast issues | Quick Reference §6: `color-dark-mode` + `color-accessible-pairs` |
| Animations feel unnatural | Quick Reference §7: `spring-physics` + `easing` + `exit-faster-than-enter` |
| Form UX is poor | Quick Reference §8: `inline-validation` + `error-clarity` + `focus-management` |
| Navigation feels confusing | Quick Reference §9: `nav-hierarchy` + `bottom-nav-limit` + `back-behavior` |
| Layout breaks on small screens | Quick Reference §5: `mobile-first` + `breakpoint-consistency` |
| Performance / jank | Quick Reference §3: `virtualize-lists` + `main-thread-budget` + `debounce-throttle` |

### Pre-Delivery Checklist

- Run `--domain ux "animation accessibility z-index loading"` as a UX validation pass before implementation
- Run through Quick Reference **§1–§3** (CRITICAL + HIGH) as a final review
- Test on 375px (small phone) and landscape orientation
- Verify behavior with **reduced-motion** enabled and **Dynamic Type** at largest size
- Check dark mode contrast independently (don't assume light mode values work)
- Confirm all touch targets ≥44pt and no content hidden behind safe areas

---

## Common Rules for Professional UI

These are frequently overlooked issues that make UI look unprofessional:
Scope notice: The rules below are for App UI (iOS/Android/React Native/Flutter), not desktop-web interaction patterns.

### Icons & Visual Elements

| Rule | Standard | Avoid | Why It Matters |
|------|----------|--------|----------------|
| **No Emoji as Structural Icons** | Use vector-based icons (e.g., Lucide, react-native-vector-icons, @expo/vector-icons). | Using emojis (🎨 🚀 ⚙️) for navigation, settings, or system controls. | Emojis are font-dependent, inconsistent across platforms, and cannot be controlled via design tokens. |
| **Vector-Only Assets** | Use SVG or platform vector icons that scale cleanly and support theming. | Raster PNG icons that blur or pixelate. | Ensures scalability, crisp rendering, and dark/light mode adaptability. |
| **Stable Interaction States** | Use color, opacity, or elevation transitions for press states without changing layout bounds. | Layout-shifting transforms that move surrounding content or trigger visual jitter. | Prevents unstable interactions and preserves smooth motion/perceived quality on mobile. |
| **Correct Brand Logos** | Use official brand assets and follow their usage guidelines (spacing, color, clear space). | Guessing logo paths, recoloring unofficially, or modifying proportions. | Prevents brand misuse and ensures legal/platform compliance. |
| **Consistent Icon Sizing** | Define icon sizes as design tokens (e.g., icon-sm, icon-md = 24pt, icon-lg). | Mixing arbitrary values like 20pt / 24pt / 28pt randomly. | Maintains rhythm and visual hierarchy across the interface. |
| **Stroke Consistency** | Use a consistent stroke width within the same visual layer (e.g., 1.5px or 2px). | Mixing thick and thin stroke styles arbitrarily. | Inconsistent strokes reduce perceived polish and cohesion. |
| **Filled vs Outline Discipline** | Use one icon style per hierarchy level. | Mixing filled and outline icons at the same hierarchy level. | Maintains semantic clarity and stylistic coherence. |
| **Touch Target Minimum** | Minimum 44×44pt interactive area (use hitSlop if icon is smaller). | Small icons without expanded tap area. | Meets accessibility and platform usability standards. |
| **Icon Alignment** | Align icons to text baseline and maintain consistent padding. | Misaligned icons or inconsistent spacing around them. | Prevents subtle visual imbalance that reduces perceived quality. |
| **Icon Contrast** | Follow WCAG contrast standards: 4.5:1 for small elements, 3:1 minimum for larger UI glyphs. | Low-contrast icons that blend into the background. | Ensures accessibility in both light and dark modes. |


### Interaction (App)

| Rule | Do | Don't |
|------|----|----- |
| **Tap feedback** | Provide clear pressed feedback (ripple/opacity/elevation) within 80-150ms | No visual response on tap |
| **Animation timing** | Keep micro-interactions around 150-300ms with platform-native easing | Instant transitions or slow animations (>500ms) |
| **Accessibility focus** | Ensure screen reader focus order matches visual order and labels are descriptive | Unlabeled controls or confusing focus traversal |
| **Disabled state clarity** | Use disabled semantics (`disabled`/native disabled props), reduced emphasis, and no tap action | Controls that look tappable but do nothing |
| **Touch target minimum** | Keep tap areas >=44x44pt (iOS) or >=48x48dp (Android), expand hit area when icon is smaller | Tiny tap targets or icon-only hit areas without padding |
| **Gesture conflict prevention** | Keep one primary gesture per region and avoid nested tap/drag conflicts | Overlapping gestures causing accidental actions |
| **Semantic native controls** | Prefer native interactive primitives (`Button`, `Pressable`, platform equivalents) with proper accessibility roles | Generic containers used as primary controls without semantics |

### Light/Dark Mode Contrast

| Rule | Do | Don't |
|------|----|----- |
| **Surface readability (light)** | Keep cards/surfaces clearly separated from background with sufficient opacity/elevation | Overly transparent surfaces that blur hierarchy |
| **Text contrast (light)** | Maintain body text contrast >=4.5:1 against light surfaces | Low-contrast gray body text |
| **Text contrast (dark)** | Maintain primary text contrast >=4.5:1 and secondary text >=3:1 on dark surfaces | Dark mode text that blends into background |
| **Border and divider visibility** | Ensure separators are visible in both themes (not just light mode) | Theme-specific borders disappearing in one mode |
| **State contrast parity** | Keep pressed/focused/disabled states equally distinguishable in light and dark themes | Defining interaction states for one theme only |
| **Token-driven theming** | Use semantic color tokens mapped per theme across app surfaces/text/icons | Hardcoded per-screen hex values |
| **Scrim and modal legibility** | Use a modal scrim strong enough to isolate foreground content (typically 40-60% black) | Weak scrim that leaves background visually competing |

### Layout & Spacing

| Rule | Do | Don't |
|------|----|----- |
| **Safe-area compliance** | Respect top/bottom safe areas for all fixed headers, tab bars, and CTA bars | Placing fixed UI under notch, status bar, or gesture area |
| **System bar clearance** | Add spacing for status/navigation bars and gesture home indicator | Let tappable content collide with OS chrome |
| **Consistent content width** | Keep predictable content width per device class (phone/tablet) | Mixing arbitrary widths between screens |
| **8dp spacing rhythm** | Use a consistent 4/8dp spacing system for padding/gaps/section spacing | Random spacing increments with no rhythm |
| **Readable text measure** | Keep long-form text readable on large devices (avoid edge-to-edge paragraphs on tablets) | Full-width long text that hurts readability |
| **Section spacing hierarchy** | Define clear vertical rhythm tiers (e.g., 16/24/32/48) by hierarchy | Similar UI levels with inconsistent spacing |
| **Adaptive gutters by breakpoint** | Increase horizontal insets on larger widths and in landscape | Same narrow gutter on all device sizes/orientations |
| **Scroll and fixed element coexistence** | Add bottom/top content insets so lists are not hidden behind fixed bars | Scroll content obscured by sticky headers/footers |

---

## Pre-Delivery Checklist

Before delivering UI code, verify these items:
Scope notice: This checklist is for App UI (iOS/Android/React Native/Flutter).

### Visual Quality
- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons come from a consistent icon family and style
- [ ] Official brand assets are used with correct proportions and clear space
- [ ] Pressed-state visuals do not shift layout bounds or cause jitter
- [ ] Semantic theme tokens are used consistently (no ad-hoc per-screen hardcoded colors)

### Interaction
- [ ] All tappable elements provide clear pressed feedback (ripple/opacity/elevation)
- [ ] Touch targets meet minimum size (>=44x44pt iOS, >=48x48dp Android)
- [ ] Micro-interaction timing stays in the 150-300ms range with native-feeling easing
- [ ] Disabled states are visually clear and non-interactive
- [ ] Screen reader focus order matches visual order, and interactive labels are descriptive
- [ ] Gesture regions avoid nested/conflicting interactions (tap/drag/back-swipe conflicts)

### Light/Dark Mode
- [ ] Primary text contrast >=4.5:1 in both light and dark mode
- [ ] Secondary text contrast >=3:1 in both light and dark mode
- [ ] Dividers/borders and interaction states are distinguishable in both modes
- [ ] Modal/drawer scrim opacity is strong enough to preserve foreground legibility (typically 40-60% black)
- [ ] Both themes are tested before delivery (not inferred from a single theme)

### Layout
- [ ] Safe areas are respected for headers, tab bars, and bottom CTA bars
- [ ] Scroll content is not hidden behind fixed/sticky bars
- [ ] Verified on small phone, large phone, and tablet (portrait + landscape)
- [ ] Horizontal insets/gutters adapt correctly by device size and orientation
- [ ] 4/8dp spacing rhythm is maintained across component, section, and page levels
- [ ] Long-form text measure remains readable on larger devices (no edge-to-edge paragraphs)

### Accessibility
- [ ] All meaningful images/icons have accessibility labels
- [ ] Form fields have labels, hints, and clear error messages
- [ ] Color is not the only indicator
- [ ] Reduced motion and dynamic text size are supported without layout breakage
- [ ] Accessibility traits/roles/states (selected, disabled, expanded) are announced correctly
</skill>

### Agent Answer

我会按 `ui-ux-pro-max` 的布局原则调整：把“安全行为 / 气体分析”切换放到筛选区左上角，时间区间放在它下面，右侧只保留说明，形成清晰的主控区和辅助说明区。

---

## Turn 10

### User Query

优化一下，就是关于一些交互问题。比如说我为点几万片的时候，我最高的气体是按照现在进行这个方式去展示。但是当我选中了某一块片区之后，我的最高气体明细里面就要切换到设施。就是哪一个，具体是哪一个设施最高，就是按照这个片区里面的设施进行排序。同时历史走势也会根据我的选择进行调整。未点去，未未选择瓦片的时候，它可以不显示走势。我选择了完毕后，根据我所选择的，具体这个明星检测的设施，或者说是片区的名称，来显示具体的历史走势。这个类型安全行为和集体分析都是一样的。


### Agent Answer

我会把交互状态拆清楚：未选瓦片时只展示全局最高概览和区域排行；选中瓦片后，明细切到该片区内的设施排行，并且只有选中瓦片后才显示历史走势，走势标题跟随当前片区/设施。

---

## Turn 11

### User Query

还需要再优化。就是说这里是是显示了最高，是。我们有很多呀，气体里面，我们有可燃气体，我们还有一氧化碳。还有硫化氢这些，以最上面，只展示其中一个就不合理，默认全部的时候。要展示全区域最高的可燃气体，最高的硫化氢，最高的一氧化碳。之后我点击了瓦片之后，显示瓦片区里面设施最高的硫化氢。硫化、一氧化碳这些数据是哪个设施最高？当我点击了设施之后，我可以去看这个设施可能气体的，一氧化一一氧化碳的，硫化氢的，趋势是这样的，你现在这个逻辑需要优化一下。


### Agent Answer

我会按同一套交互重新整理气体数据：默认展示各类气体的全区域最高值；选中瓦片后展示该片区内各类气体分别由哪个设施最高；再点设施/气体项后，走势跟随具体设施和气体类型。

---

## Turn 12

### User Query

安全行为也是一眼，像像烟火识别、人员闯入、未带安全帽、未带工章、跌倒停留等，也是和气体分析一样的。


### Agent Answer

我会把安全行为也改成和气体分析同样的口径：默认按行为类型分别展示全区域最高，选中瓦片后按该片区内各行为类型分别定位最高设施，再点击设施/行为项看对应走势。

---

## Turn 13

### User Query

调整一下边巡边检，不管是安全行为还是气体分析，点击了瓦片后，再次点击就是取消选中。不然的话，我目前点击了某个瓦片后，我就再也看不到全局信息了，我需要刷新页面才行。所以说这个交互调整一下。


### Agent Answer

我会把瓦片点击改成可切换：点中某瓦片后再次点击同一瓦片会取消选择，并清空明细选择，回到全局信息。

---

## Turn 14

### User Query

教研一下变形监测这边的逻辑，我们主要是通过移动，机器人的移动来进行监测的。就机器人上面我们会挂了气体感应分析仪，以及双目摄像头、红外摄像头。云台摄像头这种去测这种去检测，它并没有固定的固定位置的摄像头去实时监控的。所以你这个逻辑要重新梳理一下，优化一下。


### Agent Answer

你说得对，当前页面把安全行为和气体分析都建模成“固定摄像头/固定设施”的监控逻辑了，这和移动机器人边巡边检不一致。我会把页面逻辑改成“机器人移动巡检 + 车载传感器载荷采样”：瓦片代表机器人巡检覆盖片区，明细代表机器人/路线/载荷采样记录，而不是固定摄像头或固定设施。

---

## Turn 15

### User Query

历史走势 优化项，这个折线又没有数据，又没有 X 轴 Y 轴，我怎么知道是多少？它趋势是啥样的呀？调调整一下。


### Agent Answer

我会把历史走势从裸折线改成带坐标轴、刻度、单位和数据点标签的趋势图，并根据当前模式显示“次数 / ppm / %LEL / %”等不同单位。

---

## Turn 16

### User Query

mplementation/detection-item-config/create这里的设计思路，你需要给我告诉我一下，这个页面设计思路是啥子样子的？为啥子要选用使用成绩和使用对象？选择了有啥子用？它和设施里面选择规则有啥子关系？难道说我这边配了之后，那边就自动装载了？如果是这样子的话，为啥子你不是用列表的形式进行展示，而是用下拉选择呢？


### Agent Answer

我先看一下 `detection-item-config/create` 对应的表单实现和设施配置里“选择规则”的使用方式，再给你解释当前设计逻辑，以及它现在是否真的能自动装载。

---

## Turn 17

### User Query

那你直接调整一下代码。首先第一个，将结果定义往上移，放在配置说明的下面，将适用对象范围往下挪，放到最下面。之后将它变成一个 表单，就说表单中显示这条规则当前适用哪些设施以内，以及设施内的哪些巡检对象以及链接。就是说最小颗粒度按照链链接进行展示，表的第一列就是适用对象（默认是显示的设施名称）、第二列适用巡检对象/连接


### Agent Answer

我会按你的最新口径直接改这个表单：先调整区块顺序，再把“适用对象范围”从抽象下拉改成面向设施/巡检对象/连接的表格化配置和预览。先读一下 UI 技能说明和设施数据结构，确保改法贴合现有代码。

---

## Turn 18

### User Query

你这边 mock 的数据需要通过设施设备里头同步过来。在这里的话，不能去填新增使用对象，他这里只能做一个数据的回显，你调整一下。


### Agent Answer

我会把这个表改成纯回显：数据从设施设备里各巡检对象/连接的 `ruleIds` 反查出来，不再允许在规则页新增、删除或选择适用对象。保存规则时也不会从这里写回设施绑定。

---

## Turn 19

### User Query

你这个数据结构不对，就说试用巡检对象这里，你是不是按道理应该是引用的是设施设备里面巡检对象的名称，还要显示它的巡检对象类型，比如说它可能叫入口阀门，那么它到底是压力阀还是 普通的水阀，这个肯定要 mock 一下。


### Agent Answer

我会把回显表的数据口径改细：第二列仍引用设施设备里的巡检对象/连接名称，但同时补一列“巡检对象类型/连接类型”，类型从设施设备对象上来；现有 mock 如果只有阀门这类粗类型，我会先做一层更细的展示映射，避免只看到“入口阀门”却不知道它是什么阀。

---

## Turn 20

### User Query

还有一个问题，标准巡检对象库和标准类型配置，这个是不是有冲突了？你从全局里面去看一下。


### Agent Answer

我会从路由、菜单、数据模型和使用点一起看，判断“标准巡检对象库”和“标准类型配置”是不是两个概念重复，还是一个是实例模板、一个是分类字典。

---

## Turn 21

### User Query

可以，那么你先将去除标准巡检对象库这东西先去除掉，就是说路由隐藏一下，我们直接沿用巡检对象类型配置。


### Agent Answer

我会按你的口径处理：先不删文件和数据，只把“标准巡检对象库”从路由和菜单入口隐藏，后续统一沿用“巡检对象类型配置”。

---

## Turn 22

### User Query

之后你把当前分支推送到，推送上github去，当前代码推送到当前分支上去。之后用当前分支配置一个 pages，这pages 与 main 分支的 pages 同存，只是路由不一样。。


### Agent Answer

我先确认当前分支、远端和项目的 Pages 构建方式，再决定是只推分支，还是还需要调整 Vite 的 `base`/GitHub Actions 配置来让它和 main 的 Pages 共存。

---

## Turn 23

### User Query

请你基于/Users/ldh/Downloads/Knowledge/MyKnowledge/wiki/02、工作任务/极客光年/机器人/机器人调度台与设备管理基线（2026-05-12）.md  设计一份整改计划，关注里面 P0 和 P1 级别的问题，现将计划给我看，我需要知道你如何调整，调整那个页面，调整什么内容


### Agent Answer

我先读取这份基线文档，并对照当前项目里相关页面路径做一次定位；只做检查，不改代码。

---

## Turn 24

### User Query

不对，如果P2 是对 P0 和 P1 问题的补充，那么你的计划中还是需要关注


### Agent Answer

<proposed_plan>
# 机器人调度台与设备管理 P0/P1/P2 关联整改计划

## Summary

整改范围以基线文档中的 P0、P1 为主，同时纳入所有“用于补齐 P0/P1 落地链路”的 P2 问题。也就是说：P2 不单独扩展新方向，但凡它是 P0/P1 的代码现状缺口、联动缺口、校验缺口或页面形态缺口，都进入本次整改。

## Key Changes

### 1. 调度台：范围、统计、临时任务、地图线路、权限口径

涉及页面：
- `DispatchCenter.vue`
- `DispatchSummaryCards.vue`
- `DispatchBoardColumns.vue`
- `DispatchMapPanel.vue`
- `DispatchControlBar.vue`

调整内容：
- 默认展示“所有机器人今日任务”，支持切换到单机器人视角，并在页面显式显示当前统计范围。
- 顶部统计卡片统一为：`今日计划`、`执行中`、`待执行`、`待处理`、`临时任务`。
- 统计卡片增加点击事件，下方任务列表按点击类型过滤。
- 临时任务独立展示，不能只混在待执行任务中。
- 地图默认展示执行中线路，增加“执行中线路 / 今日全部任务线路”切换。
- 计划统计文案统一为“今日计划”或“今日执行规划”。
- 机器人负载改为 `已分配任务数 / 当日可承载任务数`。
- 自动创建任务、任务插队开关补充租户/主账号策略说明和当前账号权限边界；当前版本用 mock 权限表达。

纳入的 P2 补充：
- 统计卡片当前无点击联动，必须补。
- 地图当前无线路范围切换，必须补。
- 权限开关当前只是本地状态，必须补策略/权限说明。
- 负载当前只有任务数，必须补分母。

### 2. 覆盖检查：任务归属、跳转、处理级别、取消原因和审计

涉及页面：
- 调度台覆盖检查弹窗/区域
- 任务列表取消操作
- 相关任务详情/执行规划跳转入口

调整内容：
- 覆盖检查列表增加：`所属任务名称`、`任务编号`、`所属执行规划`。
- 覆盖检查项支持跳转到任务详情或执行规划详情。
- 人工处理重复漏检时必须选择处理级别：`临时任务` 或 `巡检规划`。
- 从覆盖检查创建的任务取消时，必须填写取消原因。
- 取消后不恢复为待人工执行任务。
- 取消原因作为“不再补检”的依据。
- 保留取消审计：操作人、时间、原因、关联任务、关联覆盖检查项。

纳入的 P2 补充：
- 当前遗漏项没有所属任务和跳转，必须补。
- 当前取消任务没有原因弹窗，必须补。
- 当前人工补充没有处理级别选择，必须补。

### 3. 地图与区域：区域名称显示

涉及页面：
- `AreaManage.vue`

调整内容：
- 区域编辑增加“显示区域名称”开关。
- 开启后，在区域 polygon 中心展示区域名称。
- 关闭后，只显示区域边界和填充。
- 该开关只影响查看/编辑体验，不改变调度和统计规则。

纳入的 P2 补充：
- 当前区域中心不显示名称，也没有开关，必须补。

### 4. 设施设备管理：统一设施口径、字段顺序和新增定位

涉及页面：
- `FacilityDeviceList.vue`
- `FacilityDeviceForm.vue`
- `FacilityDeviceDetail.vue`
- `ComponentUsageList.vue`
- `ComponentUsageDetail.vue`

调整内容：
- 全部文案统一为设施口径：`设施编号`、`设施名称`、`设施编码`。
- 列表、详情、新增、编辑字段命名和顺序保持一致。
- 设施设备只管理客户现场被检对象；机器人本体、机器人内部组件不进入设施设备。
- 通讯网络独立管理，本轮不并入设施设备。
- 充电房和内部设施当前版本不做。
- 新增、复制成功后的数据放到列表第一条，并高亮或定位。

纳入的 P2 补充：
- 当前列表、表单、详情混用设备/设施文案，必须统一。
- 当前设施新增后返回列表但不保证第一条定位，必须补。
- 当前检测规则复制末尾追加，必须改为首行插入并高亮。

### 5. 检测规则配置：判断口径、风险等级隐藏、复制顺序

涉及页面：
- `DetectionItemConfigList.vue`
- `DetectionItemConfigForm.vue`
- `DetectionItemConfigDetail.vue`
- `detection-item-config/model.ts`

调整内容：
- “判定口径”统一改为“判断口径”。
- 判断口径作为规则备注/说明字段保留，用于后续模型接入解释。
- 当前版本前端隐藏“风险等级”输入、表格列和详情展示。
- 发布校验取消风险等级必填。
- 数据模型保留 `riskLevel` 字段，作为后续告警触达和第三方联动预留。
- 复制检测规则后，新数据插入列表第一条并高亮。

纳入的 P2 补充：
- 当前代码仍使用“判定口径”，必须改。
- 当前代码展示并强校验风险等级，必须隐藏并取消前端必填。

### 6. 调度规则配置：区域规则列表化

涉及页面：
- `DispatchRuleConfig.vue`

调整内容：
- 从单表单改为区域规则配置列表。
- 列表字段：`区域名称`、`规则名称`、`规则类型`、`生效状态`、`更新时间`、`操作`。
- 操作包含：查看、编辑、删除、启停。
- 新增/编辑使用弹窗或抽屉维护区域规则明细。
- 调度规则按区域生效，不再用一个全局区域多选字段表达。

纳入的 P2 补充：
- 当前是单表单，不是区域规则列表，必须重构。

## Public Interfaces / Types

- 调度任务 mock 补齐：`taskType`、`status`、`robotId`、`planId`、`planName`、`isTemporary`。
- 机器人 mock 补齐：`assignedTaskCount`、`dailyCapacity`。
- 覆盖检查项补齐：`taskId`、`taskName`、`taskNo`、`planId`、`planName`、`handlingLevel`、`cancelReason`、`auditLogs`。
- 区域数据补齐：`showName?: boolean`。
- 区域调度规则新增结构：`areaId`、`areaName`、`ruleName`、`ruleType`、`enabled`、`updatedAt`。
- 检测规则保留 `riskLevel` 字段，但当前前端不展示、不校验。

## Test Plan

- 执行 `npm run build`，确保类型检查和构建通过。
- 调度台验证：范围切换、统计卡片过滤、临时任务独立展示、地图线路切换、负载分母展示。
- 覆盖检查验证：任务/规划归属显示、跳转、处理级别选择、取消原因必填、取消后不恢复待人工执行。
- 区域管理验证：区域名称开关开启/关闭后显示正确。
- 设施设备验证：设施口径统一、字段顺序一致、新增/复制首行定位。
- 检测规则验证：判断口径文案正确、风险等级隐藏、发布不校验风险等级、复制首行插入。
- 调度规则验证：区域规则列表、新增、编辑、删除、启停流程正常。

## Assumptions

- P2 只要是 P0/P1 的实现补充，就纳入本次整改。
- P2 不作为独立新需求扩展，不处理与 P0/P1 无关的优化。
- 权限、审计、租户策略当前使用前端 mock 表达，不接真实后端。
- 通讯网络、充电房、机器人内部组件不在本轮新增管理页面。
</proposed_plan>

---

## Turn 25

### User Query

先 commit 保存以便后面回滚后，实施次计划


### Agent Answer

我先把当前工作树状态核对清楚，确认哪些是已提交代码、哪些是本地辅助文件；然后先做一个回滚点提交，再开始按计划实施。

---

## Turn 26

### User Query

/Users/ldh/Downloads/project/极客光年/bot/src/views/management/DispatchCenter.vue 统计范围需要支持全部（全部机器人）


### Agent Answer

你这个需求是给调度台的“统计范围”增加“全部（全部机器人）”选项。我先检查 [DispatchCenter.vue](/Users/ldh/Downloads/project/极客光年/bot/src/views/management/DispatchCenter.vue) 的当前筛选逻辑和默认值，再补上选项与统计计算兼容。

---

## Turn 27

### User Query

总调度台 去除调度记录（今日），让待执行任务和待处理任务变成上下分布，而不是现在的左右。
2


### Agent Answer

我会直接改总调度台布局：去掉“调度记录（今日）”面板，并把“待执行任务”和“待处理任务”改成上下堆叠。先看 [DispatchBoardColumns.vue](/Users/ldh/Downloads/project/极客光年/bot/src/views/management/dispatch-center/DispatchBoardColumns.vue) 结构后再落代码。

---

## Turn 28

### User Query

总调度台 的临时任务中点击查看详情，不在提示：已触发操作：view-detail / 隐患排查-危化区 ，而是直接跳转至临时任务详情页面management/task/detail/


### Agent Answer

我会把“临时任务 -> 查看详情”的行为改成直接路由跳转，并保留其他任务的现有提示逻辑。先确认项目里临时任务详情路由的实际路径格式。

---

## Turn 29

### User Query

覆盖检查 弹窗中点击任务和规划不在提示跳转到任务：task-002 和跳转到执行规划：plan-002 而是直接跳转至对应任务management/task/detail/ 和对应规划management/plan/list（使用规划搜索定位当前规划）


### Agent Answer

我会把覆盖检查弹窗里的“任务/规划”按钮改成真实路由跳转：任务直达详情页，规划跳到规划列表并带上检索参数定位当前规划。先确认规划列表支持的查询参数名。

---

## Turn 30

### User Query

覆盖检查 弹窗中的《待人工确认项》列表的操作和弹窗的操作（替换机器人、自动调整）是不是冲突的替换机器人（人工补充任务、一键自动补充） 如果不冲突如何理解


### Agent Answer

不冲突，作用层级不同。可以这样理解：

1. `待人工确认项`里的`替换机器人/自动调整`  
这是在处理“单条待确认项”的执行归属与处置方式，属于`微观处置`。  
- `替换机器人`：只改这条待确认项由谁执行。  
- `自动调整`：系统按规则把这条项落成具体任务调整（例如改派、补检入队等）。

2. 弹窗底部的`人工补充任务/一键自动补充`  
这是在处理“本次覆盖检查发现的遗漏集合”，属于`宏观补齐`。  
- `人工补充任务`：人工选择补齐方式（临时任务或转规划）。  
- `一键自动补充`：系统批量补齐遗漏，生成补偿任务。

核心区别：
- 前者面向`待人工确认项（已有项）`逐条处理。  
- 后者面向`覆盖遗漏（缺口集合）`整体补齐。  

如果你担心认知冲突，建议在 UI 文案上改成两块标题：  
`待确认项处置`（替换机器人/自动调整）和 `覆盖缺口补齐`（人工补充/一键补充），并加一句“互不替代，可组合使用”。

---

## Turn 31

### User Query

人工补充任务弹窗 提示内容为：重复漏检或长期缺失请选择巡检规划；单次缺失、补检、临时处置请选择临时任务。 的弹窗， 选择《巡检规划》后点击继续创建，应该跳转至《新建规划》management/plan/form页面才对


### Agent Answer

我会把“人工补充任务”弹窗里选中“巡检规划”后的“继续创建”改成直接跳转到新建规划页 `/management/plan/form`，并保留当前记录动作。改完会跑一次构建确认。

---

## Turn 32

### User Query

覆盖检查 弹窗中存在遗漏的区域、设施、巡检对象/连接和规则 mock 的数据不对，如果是区域漏检，那么他就应该没有所属亏规划，所以，我建议将《所属规划》和《所属任务》这 2个字段完善下，如果是遗漏任务了，所属任务就显示遗漏任务，如果是规划遗漏了就是遗漏规划。。

并且点击他们会有联动，默认是全部，点击遗漏区域中的一条数据，那么后续的联动遗漏设施、遗漏巡检对象/连接和规则，同理，区域、设施和巡检对象/连接都能点击联动，记住选中状态下在次点击就是取消选中。


### Agent Answer

我来把覆盖检查这块做成“真实漏检语义 + 三级联动筛选”。先改数据结构（任务遗漏/规划遗漏区分、可空归属），再加“区域/设施/巡检对象点击联动与再次点击取消”，最后联动规则列表并保留当前跳转能力。

---

## Turn 33

### User Query

你这个 mock 的逻辑不对，区域漏检了，那就代表这个区域下有设施漏检了，但是你选择区域后，居然直接跳过设施了，直接显示巡检对象？这个要调整。另外在漏检不能用《所属任务：-》代替，直接所属任务：漏检，就可以了


### Agent Answer

我会把这块修成你要的语义：  
1) 保证“区域漏检 -> 该区域下必有设施漏检”的 mock 关系；  
2) 文案不再出现 `所属任务：-`，改成 `所属任务：漏检`（规划同理我也统一成 `漏检`）。  
然后再跑 build。

---

## Turn 34

### User Query

新增设施（implementation/device/form）下面的 设施巡检对象配置（建议只配置需要检测的巡检对象/连接处） 中的巡检对象列表，调整下顺序，检测规则和优先级，将他们顺序互换，同时


### Agent Answer

我先按你明确的部分改：在新增设施页把“设施巡检对象配置”列表中的“检测规则”和“优先级”顺序互换。改完我会先编译确认；你这句最后的“同时 …”没说完，等你补充我再接着改。

---

## Turn 35

### User Query

设备管理（/implementation/device/iot-list）去除终端设备和感知设备，只有网关设备，将当前页面更名为《网络设备管理》


### Agent Answer

我来直接改这个页面：去掉“终端设备/感知设备”相关入口和筛选，只保留“网关设备”，并把页面标题改成“网络设备管理”。改完后我会编译确认。

---

## Turn 36

### User Query

新增检测规则（/implementation/detection-item-config/create）页面可以不显示《适用对象范围》，只在编辑和查看详情的时候显示（因为新增的规则一定是没有绑定的）


### Agent Answer

我会把“新增检测规则”页隐藏“适用对象范围”，仅在编辑/详情展示。先改表单页条件渲染，再跑构建确认。

---

## Turn 37

### User Query

网络设备管理 页面的菜单路由没有修改


### Agent Answer

你说得对，刚才只改了页面内容，菜单路由名称还没同步。我现在去改路由/菜单里的文案（`设备管理` -> `网络设备管理`，以及对应路径别名），并编译确认。

---

## Turn 38

### User Query

请你检查下每个月吗的 mock 数据，目前我 感觉很多页面 mock 数据是相互冲突的。请你检查调整下。


### Agent Answer

我会先做一次全局 mock 数据盘点，重点查同一业务对象在不同页面里的名称、编号、区域、类型、路由归属是否互相打架。先从 `mock`、页面内硬编码数组、store 初始化数据三类入口查起，再集中修正冲突最明显的数据源。

---

## Turn 39

### User Query

你帮我提交代码之后推送到 github 上去，记住不要合并 main 分支，只在当前分支上进行合并，之后更新当前分支上的 pages （https://wcof.github.io/inspection-system/codex/inspection-business-logic-refactor/）


### Agent Answer

我会按当前分支处理：先确认当前分支和待提交文件，只提交源码/路由这些已跟进的改动，不碰未跟踪的辅助目录和压缩包；然后推送当前分支，再检查项目的 Pages 部署方式并更新当前分支对应的 Pages 产物。

---

## Turn 40

### User Query

继续


### Agent Answer

提交已经完成。现在继续推送当前分支到 GitHub；推送成功后我会看一下 Actions/Pages 是否有可用的工作流状态，确认当前分支 Pages 更新已经被触发。

---
