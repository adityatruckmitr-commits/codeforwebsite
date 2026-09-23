# Accessibility Regression & Conformance Report

**Project:** Easy Learning Educational Portal  
**Target Standards:** WCAG 2.1 Level AA & Guidelines for Indian Government Websites (GIGW 3.0)  
**Date of Regression Audit:** 23 September 2026  
**Auditor:** Senior Accessibility Engineer & Frontend Architect  
**Automated Test Tool:** `axe-core` v4.x via Node.js test harness (`tests/a11y.test.mjs`)  

---

## 1. Executive Summary & Status Overview

A full accessibility regression audit was conducted across all pages, interactive components, media viewers, and design tokens of the Easy Learning portal.

### Status Summary Breakdown:
- **FIXED (Application & Code Level):** 16 of 18 issues (**100% of UI/code-level barriers resolved**)
- **PARTIALLY FIXED (Upstream / Content Governance Dependent):** 2 issues (Legacy Scanned PDF Content & Third-Party Video Captions)
- **UNRESOLVED (Code Blocker):** 0 issues (**0 code-level blockers**)
- **MANUAL ACTION REQUIRED (Content & Operational Governance):** 3 ongoing operational governance items

---

## 2. Issue Resolution & Regression Matrix

| Issue ID | Area / Component | WCAG 2.1 AA & GIGW 3.0 Reference | Severity | Initial Problem | Remediation Applied | Status | Regression Test Result |
|---|---|---|---|---|---|---|---|
| **A11Y-001** | Global Page Shell | **WCAG 2.4.1** (Bypass Blocks), **GIGW 5.2.1** | **CRITICAL** | Missing skip to main content mechanism. | Added `<nav aria-label="Skip links"><a href="#main-content" class="skip-link">Skip to main content</a></nav>` targeting `<main id="main-content" tabindex="-1">`. | **FIXED** | **PASS** (Focuses on 1st Tab press; jumps focus to main content) |
| **A11Y-002** | Page Structure | **WCAG 1.3.1** (Info & Relationships), **GIGW 5.1.1** | **CRITICAL** | Non-semantic `<div>` layout; missing `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`. | Refactored `app_common.js` layout factories to render full semantic HTML5 landmarks with `aria-label` tags. | **FIXED** | **PASS** (axe `region` rule clean; screen reader landmark traversal verified) |
| **A11Y-003** | Document Head & Language | **WCAG 3.1.1** (Language of Page), **WCAG 2.4.2** (Page Titled) | **HIGH** | Static title `<title>Easy Learning</title>` and missing `<html lang="en">`. | Added `<html lang="en">` and dynamic title updater: `[Chapter] — [Subject] — [Class] \| Easy Learning`. | **FIXED** | **PASS** (axe `html-has-lang` clean; dynamic title verified on navigation) |
| **A11Y-004** | Keyboard Focus | **WCAG 2.4.7** (Focus Visible), **WCAG 1.4.11** (Non-text Contrast) | **CRITICAL** | Inconsistent/missing focus outlines on darker background themes. | Implemented global `:focus-visible` ring (`outline: 3px solid #f59e0b; outline-offset: 3px; box-shadow: 0 0 0 5px rgba(0,0,0,0.65)`). | **FIXED** | **PASS** (High-contrast focus ring clearly visible on all interactive elements) |
| **A11Y-005** | Top Subject Navigation | **WCAG 2.1.1** (Keyboard), **WCAG 4.1.2** (Name, Role, Value) | **HIGH** | Subject tabs lacked arrow key traversal and multi-modal active state. | Added `<nav aria-label="Subjects">`, arrow key navigation (`ArrowLeft`/`ArrowRight`/`Home`/`End`), and `border-bottom` active cues. | **FIXED** | **PASS** (Full roving tabindex arrow navigation; `aria-current="page"`) |
| **A11Y-006** | Class Selector | **WCAG 2.1.1** (Keyboard), **WCAG 4.1.2** (Name, Role, Value) | **CRITICAL** | Custom dropdown lacked ARIA combobox/listbox roles, labels, and keyboard handling. | Implemented full ARIA combobox pattern with `<label for="...">`, arrow navigation, Escape, Enter, Space, and typeahead search. | **FIXED** | **PASS** (WAI-ARIA combobox pattern fully compliant; no keyboard traps) |
| **A11Y-007** | Content Section Tabs | **WCAG 4.1.2** (Name, Role, Value), **WCAG 2.1.1** (Keyboard) | **HIGH** | Content switcher lacked `role="tabpanel"` and arrow key traversal. | Implemented `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, and `role="tabpanel"` with Arrow key navigation. | **FIXED** | **PASS** (Tabs ARIA pattern verified; screen reader announces tab selection) |
| **A11Y-008** | Books & Chapters Sidebar | **WCAG 1.3.1** (Info & Relationships), **WCAG 1.4.1** (Use of Color) | **HIGH** | Sidebar lacked `<aside>`/`<nav>` semantic structure and non-color active cues. | Rendered inside `<aside>` and `<nav aria-label="Books and Chapters">` with `<h2>` headings, left accent border, and bullet dot. | **FIXED** | **PASS** (Multi-modal active indicator; accessible chapter disclosure) |
| **A11Y-009** | PDF Viewer Controls | **WCAG 4.1.2** (Name, Role, Value), **WCAG 1.4.4** (Resize Text) | **CRITICAL** | PDF toolbar buttons lacked static fallback `aria-label`s; zoom restricted by `maximum-scale=1`. | Added fallback `aria-label`s to all toolbar buttons/inputs in `viewer.html` and removed viewport zoom restrictions. | **FIXED** | **PASS** (axe `button-name` and `meta-viewport` rules 100% clean) |
| **A11Y-010** | Accessible Book Alternative | **WCAG 1.1.1** (Non-text Content), **GIGW 5.4.2** | **HIGH** | Scanned PDFs can be inaccessible to screen readers without fallback text. | Added "📖 Read Accessible HTML Version" switcher and direct chapter PDF download link above iframe. | **PARTIALLY FIXED** | **PASS (Code-level)**. Code switcher functional; requires ongoing HTML tagging of newly added textbooks. |
| **A11Y-011** | Color Contrast | **WCAG 1.4.3** (Contrast Minimum), **GIGW 5.2.3** | **HIGH** | Muted amber/gold text on translucent backgrounds failed 4.5:1 ratio. | Adjusted tokens to exceed 4.5:1 on dark backgrounds; built dedicated High Contrast theme (`[data-contrast="high"]`). | **FIXED** | **PASS** (Contrast verified with Color Contrast Analyser; High Contrast mode functional) |
| **A11Y-012** | Color Independence | **WCAG 1.4.1** (Use of Color) | **MEDIUM** | Active tab/chapter states communicated solely via color. | Added persistent non-color visual indicators: underline, left border, indicator dots, and `aria-current`. | **FIXED** | **PASS** (Identifiable in monochrome/grayscale simulation) |
| **A11Y-013** | Zoom & Reflow | **WCAG 1.4.4** (Resize Text), **WCAG 1.4.10** (Reflow) | **HIGH** | Layout broke at 320px width and 200% zoom with horizontal scrolling. | Added responsive reflow breakpoints at 960px, 600px, 480px, and 320px with zero 2D horizontal scroll. | **FIXED** | **PASS** (Verified at 320px viewport width and 200% browser zoom) |
| **A11Y-014** | Image Alternatives & Tables | **WCAG 1.1.1** (Non-text Content), **WCAG 1.3.1** (Info & Relationships) | **MEDIUM** | Images had filename alt text (`alt="ch1.png"`); tables lacked `<th> scope="col"`. | Updated `MathRenderer.noMath.js` to output clean diagram descriptions and added `scope="col"` to table header cells. | **FIXED** | **PASS** (Descriptive alt text verified; table headers properly associated) |
| **A11Y-015** | Video Accessibility | **WCAG 1.2.2** (Captions), **WCAG 4.1.2** (Name, Role, Value) | **HIGH** | Video iframes lacked descriptive titles; playlist buttons lacked accessible lesson names. | Added descriptive `title` to iframes, accessible playlist labels (`Play Video Lesson N: Title`), and CC notice. | **PARTIALLY FIXED** | **PASS (Code-level)**. Iframe titles & controls accessible; YouTube video captions depend on video creator uploads. |
| **A11Y-016** | GIGW Accessibility Toolbar | **GIGW 3.0 Section 5.2 Mandatory Requirements** | **CRITICAL** | Missing mandatory accessibility toolbar with text resizers and contrast toggle. | Built top toolbar with A-/A/A+/A++ font scaling, High Contrast toggle, and Help dialog with `localStorage` persistence. | **FIXED** | **PASS** (Toolbar fully operable via keyboard and persists preferences across sessions) |
| **A11Y-017** | GIGW Policy Modals & Footer | **GIGW 3.0 Compliance Framework Section 6** | **HIGH** | Missing Accessibility Statement, Feedback Form, Sitemap, Privacy, Copyright, Terms. | Built focus-trapped dialog system for all mandatory GIGW policies and feedback form with accessible validation. | **FIXED** | **PASS** (Dialogs trap focus, restore focus on close, and validate fields with accessible errors) |
| **A11Y-018** | Screen Reader Announcements | **WCAG 4.1.3** (Status Messages) | **MEDIUM** | Dynamic content and chapter selection silent to screen readers. | Implemented `#a11y-live-region` (`role="status" aria-live="polite"`) with `announceLive()` helper. | **FIXED** | **PASS** (Dynamic updates reliably announced across route/chapter changes) |

---

## 3. WCAG 2.1 AA Readiness Evaluation

### Principle 1: Perceivable
- **Text Alternatives (1.1.1):** **PASS** — Images provide descriptive alt text; PDF viewer includes Accessible HTML fallback.
- **Time-based Media (1.2.2, 1.2.3, 1.2.5):** **PARTIAL** (Code Ready, Content Dependent) — Iframes have descriptive titles and `cc_load_policy=1`. Video uploaders must ensure captions exist on third-party YouTube files.
- **Adaptable (1.3.1, 1.3.2, 1.3.3):** **PASS** — Landmarks, headings (`<h1>`-`<h3>`), data table `scope="col"`, and programmatic labels established.
- **Distinguishable (1.4.1, 1.4.3, 1.4.4, 1.4.10, 1.4.11, 1.4.12, 1.4.13):** **PASS** — Contrast >4.5:1, dedicated High Contrast mode, 200% zoom, 320px reflow, visible focus indicators.

### Principle 2: Operable
- **Keyboard Accessible (2.1.1, 2.1.2, 2.1.4):** **PASS** — All controls (tabs, dropdowns, sidebar, modals, PDF toolbar) operable via keyboard with zero traps.
- **Enough Time (2.2.1, 2.2.2):** **PASS** — No timed sessions or unpausable scrolling content.
- **Navigable (2.4.1, 2.4.2, 2.4.3, 2.4.4, 2.4.6, 2.4.7):** **PASS** — Skip link, dynamic page titles, logical focus order, descriptive link text, and prominent focus indicators.
- **Input Modalities (2.5.1, 2.5.2, 2.5.3):** **PASS** — Touch/pointer targets exceed 44x44px.

### Principle 3: Understandable
- **Readable (3.1.1, 3.1.2):** **PASS** — `<html lang="en">` declared with dynamic switching support for Hindi/Sanskrit.
- **Predictable (3.2.1, 3.2.2):** **PASS** — Component focus/input does not cause unexpected context changes.
- **Input Assistance (3.3.1, 3.3.2, 3.3.3, 3.3.4):** **PASS** — Accessible form validation, inline errors with `aria-describedby`, error announcements, and focus movement.

### Principle 4: Robust
- **Compatible (4.1.2, 4.1.3):** **PASS** — Complete WAI-ARIA combobox/listbox/tabs/dialog patterns and polite live region status messages.

---

## 4. Manual Actions & Operational Governance Required

To maintain ongoing WCAG 2.1 Level AA and GIGW 3.0 conformance:

1. **Curriculum PDF Tagging & HTML Alternative Maintenance:**
   - When new NCERT PDF textbook chapters are added to `data/pdf/`, verify they contain accessible digital text layers or generate corresponding HTML note entries.
2. **Third-Party Video Closed Captions:**
   - Ensure all video links added to chapter video playlists contain verified closed captions (.srt / .vtt) in English/Hindi on YouTube.
3. **Periodic Assistive Technology Testing:**
   - Perform periodic end-to-end smoke testing with physical screen readers (NVDA on Windows, VoiceOver on macOS/iOS, TalkBack on Android).
