/* ============================================================
   app_branding.js
   Accessible Branding component (logo + portal name + motto)
   - Descriptive role="img" and aria-label for site logo
   - Semantic text grouping
   ============================================================ */

import { el, container } from "./app_common.js";

/**
 * Branding component (logo + site name + motto)
 * @param {object} opts
 * @param {string} [opts.siteName="Easy Learning"]
 * @param {string} [opts.moto="NEP 2020 Compliant"]
 * @param {string} [opts.logoLabel="Easy Learning Educational Portal Logo"]
 * @returns {HTMLElement}
 */
export function createBranding(opts = {}) {
  const siteName = opts.siteName ?? "Easy Learning";
  const moto = opts.moto ?? "NEP 2020 Compliant";
  const logoLabel = opts.logoLabel ?? "Easy Learning Educational Portal Logo";

  // Root
  const root = container("div", {
    attrs: { "data-ui": "branding", role: "banner" },
  });

  // Logo (rendered via CSS background-image token on [data-ui="branding-logo"])
  const logo = el("div", {
    attrs: {
      "data-ui": "branding-logo",
      role: "img",
      "aria-label": logoLabel,
    },
  });

  const textWrap = container("div", { attrs: { "data-ui": "branding-text" } });

  const nameEl = el("div", {
    text: siteName,
    attrs: {
      "data-ui": "branding-name",
      "aria-label": siteName,
    },
  });

  const motoEl = el("div", {
    text: moto,
    attrs: { "data-ui": "branding-moto" },
  });

  textWrap.appendChild(nameEl);
  textWrap.appendChild(motoEl);

  root.appendChild(logo);
  root.appendChild(textWrap);

  return root;
}
