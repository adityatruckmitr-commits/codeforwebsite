/* ============================================================
   app_tabs.js
   Top Subject Navigation component.
   - Semantic <nav aria-label="Subjects"> wrapper (Phase 4)
   - Full keyboard arrow key navigation (Left/Right/Home/End)
   - Multi-modal active indicator (aria-current="page", aria-selected, border, underline)
   ============================================================ */

import { el, container, button, on, tablist, frag } from "./app_common.js";

/**
 * Create tabs area.
 * @param {object} opts
 * @param {(tab: object) => void} [opts.onTabSelected]
 * @param {string} [opts.id="tabs-area"]
 * @returns {{
 *   root: HTMLElement,
 *   setTabs: (tabs: Array<object>) => void,
 *   clearTabs: () => void,
 *   selectFirst: () => void,
 *   selectTab: (value:any) => void,
 *   selectByValue: (subjectId:any) => boolean,
 *   getSelected: () => any
 * }}
 */
export function createTabsArea(opts = {}) {
  const id = opts.id ?? "tabs-area";
  const onTabSelected = typeof opts.onTabSelected === "function" ? opts.onTabSelected : null;

  // Semantic nav wrapper with accessible landmark label (WCAG 1.3.1 / Phase 4)
  const root = container("nav", {
    id,
    attrs: {
      "data-ui": "tabs-area",
      "aria-label": "Subjects",
    },
  });

  const list = tablist({
    attrs: {
      "data-ui": "tabs-list",
      "aria-label": "Subject navigation tabs",
    },
  });

  root.appendChild(list);

  /** @type {Array<{tab:object, btn:HTMLButtonElement}>} */
  let items = [];
  let selectedValue = null;

  function emitSelected(tabObj) {
    if (!onTabSelected) return;
    try {
      onTabSelected(tabObj);
    } catch (e) {
      console.error(e);
    }
  }

  function updateSelection(nextValue, { focusBtn = false } = {}) {
    selectedValue = nextValue;

    for (const it of items) {
      const isSel = String(it.tab?.value) === String(nextValue);
      it.btn.setAttribute("aria-selected", isSel ? "true" : "false");
      if (isSel) {
        it.btn.setAttribute("aria-current", "page");
        it.btn.setAttribute("tabindex", "0");
        it.btn.dataset.state = "selected";
        if (focusBtn) it.btn.focus();
      } else {
        it.btn.removeAttribute("aria-current");
        it.btn.setAttribute("tabindex", "-1");
        it.btn.dataset.state = "idle";
      }
    }

    const selected = items.find((x) => String(x.tab?.value) === String(nextValue))?.tab ?? null;
    if (selected) emitSelected(selected);
  }

  function handleKeydown(e, index) {
    const len = items.length;
    if (len <= 1) return;

    let targetIdx = -1;

    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        targetIdx = (index + 1) % len;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        targetIdx = (index - 1 + len) % len;
        break;
      case "Home":
        e.preventDefault();
        targetIdx = 0;
        break;
      case "End":
        e.preventDefault();
        targetIdx = len - 1;
        break;
      default:
        return;
    }

    if (targetIdx >= 0 && items[targetIdx]) {
      updateSelection(items[targetIdx].tab.value, { focusBtn: true });
    }
  }

  function clearTabs() {
    list.innerHTML = "";
    items = [];
    selectedValue = null;
    root.dataset.state = "empty";
  }

  function setTabs(tabs = []) {
    clearTabs();

    if (!Array.isArray(tabs) || tabs.length === 0) {
      root.dataset.state = "empty";
      return;
    }

    root.dataset.state = "ready";

    const f = frag();

    items = tabs.map((t, idx) => {
      const subjectID = t?.subjectID ?? t?.SubjectID ?? t?.id ?? t?.ID ?? null;
      const subjectName = t?.subjectName ?? t?.SubjectName ?? t?.subjectTitle ?? t?.label ?? null;
      const value = t?.value ?? subjectID ?? String(idx);
      const label = subjectName ?? String(value);

      const tabId = `subject-tab-${String(value).replace(/[^a-zA-Z0-9_-]/g, "") || idx}`;

      const btn = button({
        text: label,
        id: tabId,
        attrs: {
          role: "tab",
          "aria-selected": "false",
          tabindex: "-1",
          "data-ui": "tab",
          "data-value": String(value),
          "data-subject-id": subjectID != null ? String(subjectID) : "",
          "aria-controls": "main-content",
        },
        dataset: { state: "idle" },
      });

      on(btn, "click", () => updateSelection(value));
      on(btn, "keydown", (e) => handleKeydown(e, idx));

      f.appendChild(btn);

      return {
        tab: {
          ...t,
          value,
          label,
          subjectID,
          subjectName,
        },
        btn,
      };
    });

    list.appendChild(f);

    // Default select first tab
    if (items.length > 0) {
      updateSelection(items[0].tab.value);
    }
  }

  function selectFirst() {
    if (items.length) updateSelection(items[0].tab.value);
  }

  function selectTab(value) {
    const exists = items.some((x) => String(x.tab?.value) === String(value));
    if (exists) updateSelection(value);
  }

  function selectByValue(subjectId) {
    const want = String(subjectId);
    const found = items.find((x) => {
      const sid = x.tab?.subjectID;
      const val = x.tab?.value;
      return (sid != null && String(sid) === want) || (val != null && String(val) === want);
    });

    if (!found) return false;

    updateSelection(found.tab.value);
    return true;
  }

  function getSelected() {
    return selectedValue;
  }

  return { root, setTabs, clearTabs, selectFirst, selectTab, selectByValue, getSelected };
}
