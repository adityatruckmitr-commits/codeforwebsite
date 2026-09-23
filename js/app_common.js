/* ============================================================
app_common.js
Common DOM factory helpers.
Ground rules:
- No inline CSS, no style.* usage
- Only structural attributes/classes; visual design handled in /css/base.css
- State toggles via attributes: hidden, aria-*, data-state, etc.
============================================================ */

/**
 * Create an element with flexible options.
 * @param {string} tag
 * @param {object} [opts]
 * @param {string} [opts.id]
 * @param {string} [opts.className]  // structural class, not dynamic styling
 * @param {object} [opts.attrs]
 * @param {object} [opts.dataset]
 * @param {Array<Node|string>} [opts.children]
 * @param {string} [opts.text]
 */
export function el(tag, opts = {}) {
  const n = document.createElement(tag);

  if (opts.id) n.id = String(opts.id);
  if (opts.className) n.className = String(opts.className);
  if (opts.text != null) n.textContent = String(opts.text);

  if (opts.attrs) setAttrs(n, opts.attrs);
  if (opts.dataset) setDataset(n, opts.dataset);

  if (Array.isArray(opts.children)) {
    for (const ch of opts.children) {
      if (ch == null) continue;
      n.appendChild(typeof ch === "string" ? document.createTextNode(ch) : ch);
    }
  }
  return n;
}

export function setAttrs(node, attrs = {}) {
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null) continue;
    if (v === false) {
      node.removeAttribute(k);
      continue;
    }
    if (v === true) {
      node.setAttribute(k, "");
      continue;
    }
    node.setAttribute(k, String(v));
  }
  return node;
}

export function setDataset(node, dataset = {}) {
  for (const [k, v] of Object.entries(dataset)) {
    if (v === undefined || v === null) continue;
    node.dataset[k] = String(v);
  }
  return node;
}

export function on(node, eventName, handler, options) {
  node.addEventListener(eventName, handler, options);
  return () => node.removeEventListener(eventName, handler, options);
}

/** Container helper */
export function container(tag = "div", opts = {}) {
  return el(tag, opts);
}

/** Button helper */
export function button(opts = {}) {
  const { attrs = {}, ...rest } = opts;
  return el("button", {
    ...rest,
    attrs: {
      type: "button",
      ...attrs,
    },
  });
}

/** Accessible visually-hidden text node container */
export function srOnlyText(text) {
  return el("span", { text, attrs: { "data-ui": "sr-only" } });
}

/** Simple region wrapper */
export function region(opts = {}) {
  const { label, ...rest } = opts;
  return el("div", {
    ...rest,
    attrs: {
      role: "region",
      ...(label ? { "aria-label": label } : {}),
      ...(rest.attrs || {}),
    },
  });
}

/** Build a basic listbox (role=listbox) */
export function listbox(opts = {}) {
  const { id, labelledBy, ...rest } = opts;
  return el("div", {
    ...rest,
    attrs: {
      role: "listbox",
      ...(id ? { id } : {}),
      ...(labelledBy ? { "aria-labelledby": labelledBy } : {}),
      ...(rest.attrs || {}),
    },
  });
}

/** Build a tablist (role=tablist) */
export function tablist(opts = {}) {
  const { id, labelledBy, ...rest } = opts;
  return el("div", {
    ...rest,
    attrs: {
      role: "tablist",
      ...(id ? { id } : {}),
      ...(labelledBy ? { "aria-labelledby": labelledBy } : {}),
      ...(rest.attrs || {}),
    },
  });
}



/** DocumentFragment helper */
export function frag(children = []) {
  const f = document.createDocumentFragment();
  if (Array.isArray(children)) {
    for (const ch of children) {
      if (ch == null) continue;
      f.appendChild(typeof ch === "string" ? document.createTextNode(ch) : ch);
    }
  }
  return f;
}

/* ============================================================
   Layout helpers (structural only)
   - These only create containers/regions; styling in base.css
============================================================ */

/**
 * Get the app shell element by id.
 * @param {object} opts
 * @param {string} [opts.id="appshell"]
 * @returns {HTMLElement}
 */
export function getShell(opts = {}) {
  const id = opts.id ?? "appshell";
  const shell = document.getElementById(id);
  if (!shell) throw new Error(`Missing root container #${id} in index.html`);
  return shell;
}

/**
 * Create the top row + top menu containers.
 * @param {object} opts
 * @param {string} [opts.topRowId="toprow"]
 * @param {string} [opts.topMenuId="topmenu"]
 * @returns {{ topRow: HTMLElement, topMenu: HTMLElement }}
 */
export function createTopRow(opts = {}) {
  const topRowId = opts.topRowId ?? "toprow";
  const topMenuId = opts.topMenuId ?? "topmenu";

  const topMenu = container("div", { id: topMenuId, attrs: { "data-ui": "topmenu" } });
  const topRow = container("header", {
    id: topRowId,
    attrs: { "data-ui": "toprow", role: "banner", "aria-label": "Site Header" },
    children: [topMenu],
  });
  return { topRow, topMenu };
}


/**
 * Get the main row container inside appshell.
 * @param {object} opts
 * @param {string} [opts.shellId="appshell"]
 * @param {string} [opts.mainRowId="mainrow"]
 * @returns {HTMLElement}
 */
export function getMainArea(opts = {}) {
  const shellId = opts.shellId ?? "appshell";
  const mainRowId = opts.mainRowId ?? "mainrow";
  const shell = getShell({ id: shellId });
  const main = shell.querySelector(`#${CSS.escape(mainRowId)}`);
  if (!main) throw new Error(`Missing main container #${mainRowId} inside #${shellId}`);
  return main;
}

/**
 * Create the main row container (holds content + sidebar).
 * @param {object} opts
 * @param {string} [opts.mainRowId="mainrow"]
 * @param {string} [opts.contentId="main"]
 * @returns {{ mainRow: HTMLElement, content: HTMLElement }}
 */
export function createMainRow(opts = {}) {
  const mainRowId = opts.mainRowId ?? "mainrow";
  const contentId = opts.contentId ?? "main";

  const content = container("main", {
    id: contentId,
    attrs: {
      "data-ui": "content",
      id: "main-content",
      role: "main",
      tabindex: "-1",
      "aria-label": "Chapter and learning content",
    },
  });
  const mainRow = container("div", {
    id: mainRowId,
    attrs: { "data-ui": "mainrow" },
    children: [content],
  });

  return { mainRow, content };
}

/**
 * Create the accessible footer container (GIGW 3.0).
 * @param {object} opts
 * @param {string} [opts.footerId="appfooter"]
 * @returns {HTMLElement}
 */
export function createFooter(opts = {}) {
  const footerId = opts.footerId ?? "appfooter";
  return container("footer", {
    id: footerId,
    attrs: {
      "data-ui": "footer",
      role: "contentinfo",
      "aria-label": "Site footer and policies",
    },
  });
}

/**
 * Accessible live region announcer for screen readers.
 * @param {string} message
 * @param {"polite"|"assertive"} [politeness="polite"]
 */
export function announceLive(message, politeness = "polite") {
  if (!message) return;
  let liveRegion = document.getElementById("a11y-live-region");
  if (!liveRegion) {
    liveRegion = el("div", {
      id: "a11y-live-region",
      attrs: {
        "aria-live": politeness,
        "aria-atomic": "true",
        class: "sr-only",
      },
    });
    document.body.appendChild(liveRegion);
  }
  liveRegion.setAttribute("aria-live", politeness);
  liveRegion.textContent = "";
  setTimeout(() => {
    liveRegion.textContent = message;
  }, 50);
}



