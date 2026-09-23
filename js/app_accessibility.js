/* ============================================================
   app_accessibility.js
   Accessibility Utility Toolbar & Settings (GIGW 3.0 / WCAG 2.1 AA)
   - Text Resizing (A- / A / A+)
   - High Contrast & Standard Contrast modes
   - Theme switching with persistence
   - Keyboard navigation helpers
   ============================================================ */

import { el, container, button, on, announceLive } from "./app_common.js";
import { appState } from "./app_state.js";

const STORAGE_KEYS = {
  FONT_SIZE: "easylearn_a11y_fontsize",
  CONTRAST: "easylearn_a11y_contrast",
  THEME: "easylearn_theme",
};

const FONT_SIZES = [
  { label: "A-", scale: 0.875, name: "Decrease font size", percent: "87.5%" },
  { label: "A", scale: 1.0, name: "Default font size", percent: "100%" },
  { label: "A+", scale: 1.15, name: "Increase font size", percent: "115%" },
  { label: "A++", scale: 1.3, name: "Maximum font size", percent: "130%" },
];

export function initAccessibilityToolbar() {
  const toprow = document.getElementById(appState.ui_toprow || "toprow");
  if (!toprow) return;

  // Avoid duplicate injection
  if (document.getElementById("a11y-toolbar")) return;

  const toolbar = container("div", {
    id: "a11y-toolbar",
    attrs: {
      "data-ui": "a11y-toolbar",
      role: "region",
      "aria-label": "Accessibility Options Toolbar",
    },
  });

  // Left group: Skip to content & Keyboard help shortcut
  const leftGroup = container("div", {
    attrs: { "data-ui": "a11y-group", "aria-label": "Navigation Shortcuts" },
  });

  const skipBtn = el("a", {
    text: "Skip to Content",
    attrs: {
      href: "#main-content",
      "data-ui": "a11y-btn",
      "aria-label": "Skip to main content",
      class: "a11y-skip-quick",
    },
  });
  leftGroup.appendChild(skipBtn);

  // Center group: Font Resizers
  const fontGroup = container("div", {
    attrs: { "data-ui": "a11y-group", role: "group", "aria-label": "Text Size Controls" },
  });

  const fontLabel = el("span", {
    text: "Text Size:",
    attrs: { "data-ui": "a11y-label", "aria-hidden": "true" },
  });
  fontGroup.appendChild(fontLabel);

  const currentScale = parseFloat(localStorage.getItem(STORAGE_KEYS.FONT_SIZE) || "1.0");

  FONT_SIZES.forEach((size) => {
    const isCurrent = Math.abs(size.scale - currentScale) < 0.01;
    const btn = button({
      text: size.label,
      attrs: {
        "data-ui": "a11y-btn",
        "data-scale": String(size.scale),
        "aria-label": `${size.name} (${size.percent})`,
        "aria-pressed": isCurrent ? "true" : "false",
      },
    });

    on(btn, "click", () => {
      applyFontSize(size.scale);
      fontGroup.querySelectorAll("[data-scale]").forEach((b) => {
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      });
      announceLive(`Text size set to ${size.percent}`);
    });

    fontGroup.appendChild(btn);
  });

  // Right group: High Contrast Toggle
  const contrastGroup = container("div", {
    attrs: { "data-ui": "a11y-group", role: "group", "aria-label": "Contrast Controls" },
  });

  const contrastBtn = button({
    attrs: {
      "data-ui": "a11y-btn",
      id: "btn-toggle-contrast",
      "aria-pressed": "false",
      "aria-label": "Toggle high contrast mode",
    },
    children: [
      el("span", { attrs: { class: "a11y-icon", "aria-hidden": "true" }, text: "◐" }),
      el("span", { text: "High Contrast", attrs: { "data-ui": "a11y-btn-text" } }),
    ],
  });

  on(contrastBtn, "click", () => {
    const isHigh = document.documentElement.getAttribute("data-contrast") === "high";
    const next = isHigh ? "normal" : "high";
    applyContrast(next);
    contrastBtn.setAttribute("aria-pressed", next === "high" ? "true" : "false");
    announceLive(next === "high" ? "High contrast mode enabled" : "Standard contrast mode enabled");
  });

  contrastGroup.appendChild(contrastBtn);

  // Help & Info Button
  const helpBtn = button({
    attrs: {
      "data-ui": "a11y-btn",
      id: "btn-a11y-help",
      "aria-label": "Accessibility Help and Keyboard Shortcuts",
      "aria-haspopup": "dialog",
    },
    children: [
      el("span", { attrs: { class: "a11y-icon", "aria-hidden": "true" }, text: "⌨" }),
      el("span", { text: "Help", attrs: { "data-ui": "a11y-btn-text" } }),
    ],
  });

  on(helpBtn, "click", () => {
    import("./app_gigw_pages.js").then((m) => m.openHelpModal(helpBtn));
  });

  contrastGroup.appendChild(helpBtn);

  // Append all groups to toolbar
  toolbar.appendChild(leftGroup);
  toolbar.appendChild(fontGroup);
  toolbar.appendChild(contrastGroup);

  // Prepend toolbar to toprow before topmenu
  toprow.prepend(toolbar);

  // Restore saved preferences
  restoreSavedPreferences(contrastBtn);
}

function applyFontSize(scale) {
  document.documentElement.style.fontSize = `${scale * 100}%`;
  try {
    localStorage.setItem(STORAGE_KEYS.FONT_SIZE, String(scale));
  } catch (e) {
    /* storage quota / private browsing */
  }
}

function applyContrast(mode) {
  if (mode === "high") {
    document.documentElement.setAttribute("data-contrast", "high");
  } else {
    document.documentElement.removeAttribute("data-contrast");
  }
  try {
    localStorage.setItem(STORAGE_KEYS.CONTRAST, mode);
  } catch (e) {}
}

function restoreSavedPreferences(contrastBtn) {
  try {
    const savedScale = parseFloat(localStorage.getItem(STORAGE_KEYS.FONT_SIZE) || "1.0");
    if (savedScale && savedScale !== 1.0) {
      applyFontSize(savedScale);
    }

    const savedContrast = localStorage.getItem(STORAGE_KEYS.CONTRAST);
    if (savedContrast === "high") {
      applyContrast("high");
      if (contrastBtn) contrastBtn.setAttribute("aria-pressed", "true");
    }
  } catch (e) {}
}

/**
 * Update Document Title and HTML Lang dynamically.
 */
export function updateDocumentTitle({ chapterTitle, subjectTitle, classNum, isIndic = false }) {
  const parts = [];
  if (chapterTitle && String(chapterTitle).trim()) parts.push(String(chapterTitle).trim());
  if (classNum && subjectTitle) parts.push(`Class ${classNum} ${subjectTitle}`);
  else if (subjectTitle) parts.push(subjectTitle);
  parts.push("Easy Learning — NEP 2020");

  document.title = parts.join(" | ");

  const html = document.documentElement;
  if (isIndic) {
    html.setAttribute("lang", "hi");
  } else {
    html.setAttribute("lang", "en");
  }
}
