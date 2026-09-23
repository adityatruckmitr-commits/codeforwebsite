/* ============================================================
   app_gigw_pages.js
   GIGW 3.0 & WCAG 2.1 AA Mandatory Pages & Accessible Modals
   - Accessibility Statement
   - Help & Keyboard Navigation Guide
   - Feedback / Contact Us
   - Sitemap & Policies (Privacy, Terms, Copyright, Hyperlinking)
   - Accessible Footer
   ============================================================ */

import { el, container, button, on, announceLive } from "./app_common.js";
import { appState } from "./app_state.js";

let activeModal = null;
let lastFocusedElement = null;

/**
 * Trap focus within an active dialog.
 */
function trapFocus(modalEl) {
  const focusable = modalEl.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  first.focus();

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closeModal();
      return;
    }

    if (e.key === "Tab") {
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  };

  modalEl.addEventListener("keydown", handleKeyDown);
  modalEl._cleanupA11y = () => {
    modalEl.removeEventListener("keydown", handleKeyDown);
  };
}

/**
 * Open an accessible modal dialog.
 */
export function openModal({ title, contentHtml, triggerEl = null }) {
  closeModal();

  lastFocusedElement = triggerEl || document.activeElement;

  const overlay = container("div", {
    attrs: {
      class: "a11y-modal-overlay",
      id: "a11y-modal-overlay",
      role: "presentation",
    },
  });

  const dialogId = `dialog-${Math.random().toString(36).slice(2, 8)}`;
  const titleId = `${dialogId}-title`;

  const modal = container("div", {
    attrs: {
      class: "a11y-modal-dialog",
      id: dialogId,
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": titleId,
      tabindex: "-1",
    },
  });

  // Header
  const header = container("div", { attrs: { class: "a11y-modal-header" } });
  const titleEl = el("h2", {
    id: titleId,
    text: title,
    attrs: { class: "a11y-modal-title" },
  });

  const closeBtn = button({
    text: "✕",
    attrs: {
      class: "a11y-modal-close",
      "aria-label": `Close ${title} dialog`,
      type: "button",
    },
  });

  on(closeBtn, "click", closeModal);
  header.appendChild(titleEl);
  header.appendChild(closeBtn);

  // Body
  const body = container("div", { attrs: { class: "a11y-modal-body" } });
  if (typeof contentHtml === "string") {
    body.innerHTML = contentHtml;
  } else if (contentHtml instanceof HTMLElement) {
    body.appendChild(contentHtml);
  }

  // Footer
  const footer = container("div", { attrs: { class: "a11y-modal-footer" } });
  const okBtn = button({
    text: "Close",
    attrs: {
      class: "a11y-btn-primary",
      type: "button",
    },
  });
  on(okBtn, "click", closeModal);
  footer.appendChild(okBtn);

  modal.appendChild(header);
  modal.appendChild(body);
  modal.appendChild(footer);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  document.body.classList.add("modal-open");

  activeModal = overlay;

  on(overlay, "click", (e) => {
    if (e.target === overlay) closeModal();
  });

  trapFocus(modal);
  announceLive(`${title} dialog opened`);
}

/**
 * Close any active modal.
 */
export function closeModal() {
  if (!activeModal) return;

  const modalEl = activeModal.querySelector('[role="dialog"]');
  if (modalEl && modalEl._cleanupA11y) {
    modalEl._cleanupA11y();
  }

  activeModal.remove();
  activeModal = null;
  document.body.classList.remove("modal-open");

  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
    lastFocusedElement = null;
  }

  announceLive("Dialog closed");
}

/* ============================================================
   Page / Modal Content Definitions
   ============================================================ */

export function openAccessibilityStatement(triggerEl) {
  const contentHtml = `
    <div class="a11y-statement-content">
      <p><strong>Commitment to Accessibility:</strong> Easy Learning is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards under <strong>Guidelines for Indian Government Websites (GIGW 3.0)</strong> and <strong>World Wide Web Consortium (W3C) Web Content Accessibility Guidelines (WCAG) 2.1 Level AA</strong>.</p>
      
      <h3>Compliance Target</h3>
      <p>This website targets full conformance with <strong>WCAG 2.1 Level AA</strong> and <strong>GIGW 3.0</strong> compliance rules.</p>
      
      <h3>Key Accessibility Features</h3>
      <ul>
        <li><strong>Keyboard Navigation:</strong> Complete keyboard access across all menus, subject tabs, sidebars, PDF controls, video players, and dialogs.</li>
        <li><strong>Screen Reader Optimization:</strong> Proper HTML5 landmark regions, logical heading hierarchies (H1 to H3), accessible ARIA labels, and live region announcements.</li>
        <li><strong>Visual Flexibility:</strong> Built-in text resizing (87.5% to 130%), 200% browser zoom reflow without text clipping, and High Contrast mode toggle.</li>
        <li><strong>Alternative Reading Formats:</strong> Text notes and Accessible HTML alternative viewing for textbooks and science diagrams.</li>
        <li><strong>Multilingual Support:</strong> Explicit language tags for English (<code>en</code>) and Hindi/Sanskrit (<code>hi</code>) materials.</li>
      </ul>

      <h3>Known Limitations & Ongoing Remediation</h3>
      <p>Certain legacy scanned PDF materials and third-party mathematical equations are actively undergoing tagging remediation. An accessible HTML text version is provided for all core science and mathematics chapters.</p>

      <h3>Feedback & Grievance Mechanism</h3>
      <p>We welcome your feedback on the accessibility of Easy Learning. If you encounter accessibility barriers, please contact our Accessibility Officer:</p>
      <ul>
        <li><strong>Email:</strong> accessibility@easylearning.edu.in</li>
        <li><strong>Phone:</strong> +91-11-23456789 (Toll Free: 1800-111-000)</li>
        <li><strong>Postal Address:</strong> National Educational Portal Accessibility Division, New Delhi, India.</li>
      </ul>
      <p><small><em>Statement last reviewed & updated on: September 22, 2026.</em></small></p>
    </div>
  `;

  openModal({
    title: "Accessibility Statement",
    contentHtml,
    triggerEl,
  });
}

export function openHelpModal(triggerEl) {
  const contentHtml = `
    <div class="a11y-help-content">
      <p>Use the following standard keyboard shortcuts and guidelines to navigate the Easy Learning portal effortlessly:</p>
      <table class="a11y-table" aria-label="Keyboard Shortcuts Guide">
        <thead>
          <tr>
            <th scope="col">Shortcut Key</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><kbd>Tab</kbd></td>
            <td>Move to next interactive link, button, or input field</td>
          </tr>
          <tr>
            <td><kbd>Shift</kbd> + <kbd>Tab</kbd></td>
            <td>Move to previous interactive element</td>
          </tr>
          <tr>
            <td><kbd>Enter</kbd> / <kbd>Space</kbd></td>
            <td>Activate focused button, expand dropdown, or open chapter</td>
          </tr>
          <tr>
            <td><kbd>Arrow Keys</kbd> (← / → / ↑ / ↓)</td>
            <td>Navigate between subject tabs, dropdown options, and timeline events</td>
          </tr>
          <tr>
            <td><kbd>Home</kbd> / <kbd>End</kbd></td>
            <td>Jump to first or last tab/item in a list</td>
          </tr>
          <tr>
            <td><kbd>Escape</kbd></td>
            <td>Close open dropdown, modal dialog, or full-screen viewer</td>
          </tr>
        </tbody>
      </table>

      <h3>Assistive Technology Features</h3>
      <ul>
        <li><strong>Skip to Main Content:</strong> Press <kbd>Tab</kbd> immediately upon loading any page to bypass navigation.</li>
        <li><strong>Text Resizing:</strong> Use the <code>A-</code>, <code>A</code>, <code>A+</code> buttons in the top accessibility bar.</li>
        <li><strong>High Contrast:</strong> Press the <code>High Contrast</code> button in the top bar to toggle high contrast colors.</li>
      </ul>
    </div>
  `;

  openModal({
    title: "Accessibility & Keyboard Help",
    contentHtml,
    triggerEl,
  });
}

export function openFeedbackModal(triggerEl) {
  const formWrap = container("form", {
    attrs: {
      class: "a11y-feedback-form",
      id: "feedback-form",
      novalidate: "true",
    },
  });

  formWrap.innerHTML = `
    <p>Please share your feedback or report any accessibility barriers you encountered:</p>
    <div class="form-group">
      <label for="fb-name">Full Name <span class="required" aria-hidden="true">*</span></label>
      <input type="text" id="fb-name" name="name" required aria-required="true" autocomplete="name" class="form-input">
      <span class="form-error" id="fb-name-error" aria-live="polite"></span>
    </div>
    <div class="form-group">
      <label for="fb-email">Email Address <span class="required" aria-hidden="true">*</span></label>
      <input type="email" id="fb-email" name="email" required aria-required="true" autocomplete="email" class="form-input">
      <span class="form-error" id="fb-email-error" aria-live="polite"></span>
    </div>
    <div class="form-group">
      <label for="fb-category">Category</label>
      <select id="fb-category" name="category" class="form-select">
        <option value="accessibility">Accessibility Barrier / Assistive Tech Issue</option>
        <option value="content">Content Suggestion / Correction</option>
        <option value="general">General Feedback</option>
      </select>
    </div>
    <div class="form-group">
      <label for="fb-message">Message / Details <span class="required" aria-hidden="true">*</span></label>
      <textarea id="fb-message" name="message" rows="4" required aria-required="true" class="form-textarea"></textarea>
      <span class="form-error" id="fb-message-error" aria-live="polite"></span>
    </div>
    <div class="form-actions">
      <button type="submit" class="a11y-btn-primary" id="fb-submit">Submit Feedback</button>
    </div>
  `;

  on(formWrap, "submit", (e) => {
    e.preventDefault();
    let firstInvalid = null;

    const name = formWrap.querySelector("#fb-name");
    const nameErr = formWrap.querySelector("#fb-name-error");
    if (!name.value.trim()) {
      nameErr.textContent = "Please enter your name.";
      name.setAttribute("aria-invalid", "true");
      name.setAttribute("aria-describedby", "fb-name-error");
      valid = false;
      if (!firstInvalid) firstInvalid = name;
    } else {
      nameErr.textContent = "";
      name.removeAttribute("aria-invalid");
    }

    const email = formWrap.querySelector("#fb-email");
    const emailErr = formWrap.querySelector("#fb-email-error");
    if (!email.value.trim() || !email.value.includes("@")) {
      emailErr.textContent = "Please enter a valid email address.";
      email.setAttribute("aria-invalid", "true");
      email.setAttribute("aria-describedby", "fb-email-error");
      valid = false;
      if (!firstInvalid) firstInvalid = email;
    } else {
      emailErr.textContent = "";
      email.removeAttribute("aria-invalid");
    }

    const msg = formWrap.querySelector("#fb-message");
    const msgErr = formWrap.querySelector("#fb-message-error");
    if (!msg.value.trim()) {
      msgErr.textContent = "Please enter your feedback message.";
      msg.setAttribute("aria-invalid", "true");
      msg.setAttribute("aria-describedby", "fb-message-error");
      valid = false;
      if (!firstInvalid) firstInvalid = msg;
    } else {
      msgErr.textContent = "";
      msg.removeAttribute("aria-invalid");
    }

    if (!valid) {
      announceLive("Form contains errors. Please correct the highlighted fields.");
      firstInvalid?.focus();
      return;
    }

    formWrap.innerHTML = `
      <div class="alert alert-success" role="alert" tabindex="-1" id="fb-success">
        <h3>Thank You!</h3>
        <p>Your feedback has been submitted successfully. Our team will review your comments promptly.</p>
      </div>
    `;
    announceLive("Feedback submitted successfully.");
    formWrap.querySelector("#fb-success")?.focus();
  });

  openModal({
    title: "Feedback & Accessibility Support",
    contentHtml: formWrap,
    triggerEl,
  });
}

export function openPolicyModal(type, triggerEl) {
  const policies = {
    privacy: {
      title: "Privacy Policy",
      html: `<p>Easy Learning adheres to strict digital privacy standards. As an educational portal, we do not collect personal browsing data, tracking cookies, or sell information to third parties. Any voluntary feedback submitted is utilized solely for enhancing accessibility and educational quality under government data protection guidelines.</p>`,
    },
    copyright: {
      title: "Copyright Policy",
      html: `<p>All NCERT educational materials, curriculum guidelines, textbook content, and multimedia references available on this portal are published under educational fair-use provisions and Government of India open education licensing policies. Material may be freely downloaded for personal academic study and learning.</p>`,
    },
    terms: {
      title: "Terms & Conditions",
      html: `<p>By accessing the Easy Learning educational platform, users agree to utilize the materials for educational, non-commercial purposes. We strive to maintain continuous availability, accessible formatting, and accurate curriculum alignment in accordance with NEP 2020 objectives.</p>`,
    },
    hyperlink: {
      title: "Hyperlinking Policy",
      html: `<p>We permit direct links to educational resources on this portal without prior permission, provided links are not framed in misleading contexts. External links to third-party references (such as educational YouTube resources) are provided for learning convenience; Easy Learning does not endorse external commercial advertisements.</p>`,
    },
    sitemap: {
      title: "Portal Sitemap",
      html: `
        <div class="a11y-sitemap">
          <h3>Primary Subjects</h3>
          <ul>
            <li><strong>Class 1–10 Subjects:</strong> EVS, Mathematics, Science, Social Science (SST), English, Hindi, Sanskrit, ICT, Physical Education.</li>
            <li><strong>Class 11–12 Streams:</strong> Science (Physics, Chemistry, Biology, Mathematics), Commerce, Humanities.</li>
          </ul>
          <h3>Key Features</h3>
          <ul>
            <li>NCERT Textbook PDF Viewer with accessible controls</li>
            <li>Accessible HTML Text Notes & Formulas</li>
            <li>Interactive Learning Pointers (TSV)</li>
            <li>Video Books with Topic Playlists</li>
            <li>Periodic Table & Science Flowcharts</li>
            <li>शब्द रूप & धातु रूप (Sanskrit grammatical tables)</li>
          </ul>
        </div>
      `,
    },
  };

  const item = policies[type] || policies.terms;
  openModal({
    title: item.title,
    contentHtml: item.html,
    triggerEl,
  });
}

/**
 * Render the GIGW 3.0 Compliant Footer.
 */
export function initFooter() {
  const shell = document.getElementById(appState.ui_appshell || "appshell");
  if (!shell) return;

  if (document.getElementById("appfooter")) return;

  const footer = container("footer", {
    id: "appfooter",
    attrs: {
      "data-ui": "footer",
      role: "contentinfo",
      "aria-label": "Portal Footer and Policy Links",
    },
  });

  const topSection = container("div", { attrs: { class: "footer-top" } });

  const nav = container("nav", {
    attrs: { class: "footer-nav", "aria-label": "Policy and informational links" },
  });

  const links = [
    { label: "Accessibility Statement", action: openAccessibilityStatement },
    { label: "Help & Navigation", action: openHelpModal },
    { label: "Feedback & Support", action: openFeedbackModal },
    { label: "Sitemap", action: (btn) => openPolicyModal("sitemap", btn) },
    { label: "Privacy Policy", action: (btn) => openPolicyModal("privacy", btn) },
    { label: "Copyright Policy", action: (btn) => openPolicyModal("copyright", btn) },
    { label: "Terms & Conditions", action: (btn) => openPolicyModal("terms", btn) },
    { label: "Hyperlinking Policy", action: (btn) => openPolicyModal("hyperlink", btn) },
  ];

  const list = el("ul", { attrs: { class: "footer-link-list", role: "list" } });

  links.forEach((link) => {
    const li = el("li");
    const btn = button({
      text: link.label,
      attrs: {
        class: "footer-link-btn",
        "aria-haspopup": "dialog",
      },
    });

    on(btn, "click", () => link.action(btn));
    li.appendChild(btn);
    list.appendChild(li);
  });

  nav.appendChild(list);
  topSection.appendChild(nav);

  const bottomSection = container("div", { attrs: { class: "footer-bottom" } });
  const copyText = el("p", {
    text: "© 2026 Easy Learning — NEP 2020 Compliant Educational Portal. Designed in accordance with GIGW 3.0 & WCAG 2.1 Level AA Standards.",
    attrs: { class: "footer-copy" },
  });
  bottomSection.appendChild(copyText);

  footer.appendChild(topSection);
  footer.appendChild(bottomSection);

  shell.appendChild(footer);
}
