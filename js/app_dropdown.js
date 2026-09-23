/* ============================================================
   app_dropdown.js
   Accessible Dropdown / Combobox Component (WCAG 2.1 AA / GIGW 3.0)
   - Proper <label for="..."> programmatic association
   - Full keyboard navigation (Arrow Up/Down, Home, End, Escape, Enter, Space, Typeahead)
   - ARIA combobox/listbox pattern with focus management
   ============================================================ */

import { el, container, button, listbox, on } from "./app_common.js";

/**
 * @typedef {{label:string, value:any}} Option
 */

/**
 * Create an accessible custom dropdown.
 * @param {object} opts
 * @param {string} opts.id
 * @param {string} opts.label
 * @param {Option[]} opts.options
 * @param {boolean} [opts.autoSelectFirst=true]
 * @param {boolean} [opts.hidden=false]
 * @param {() => void} [opts.onOpen]
 * @param {(opt: Option) => void} [opts.onChange]
 */
export function createDropdown(opts = {}) {
  const id = String(opts.id || "");
  if (!id) throw new Error("createDropdown: opts.id is required");
  const labelText = String(opts.label || "Select");
  let onOpenCb = typeof opts.onOpen === "function" ? opts.onOpen : null;
  let onChangeCb = typeof opts.onChange === "function" ? opts.onChange : null;

  let options = Array.isArray(opts.options) ? opts.options.slice() : [];

  const root = container("div", {
    attrs: { "data-ui": "dropdown", id },
  });

  if (opts.hidden) root.setAttribute("hidden", "");

  const labelId = `${id}__label`;
  const triggerId = `${id}__trigger`;
  const listId = `${id}__list`;

  // Semantic <label> element with for="..."
  const labelEl = el("label", {
    text: labelText,
    attrs: {
      "data-ui": "dropdown-label",
      id: labelId,
      for: triggerId,
    },
  });

  const trigger = button({
    id: triggerId,
    attrs: {
      "data-ui": "dropdown-trigger",
      "aria-haspopup": "listbox",
      "aria-expanded": "false",
      "aria-controls": listId,
      "aria-labelledby": `${labelId} ${triggerId}`,
    },
  });

  const valueEl = el("span", {
    attrs: { "data-ui": "dropdown-value", id: `${id}__value` },
  });

  const caret = el("span", {
    attrs: { "data-ui": "dropdown-caret", "aria-hidden": "true" },
    text: "▾",
  });

  trigger.appendChild(valueEl);
  trigger.appendChild(caret);

  const panel = container("div", {
    attrs: { "data-ui": "dropdown-panel" },
  });

  const list = listbox({
    id: listId,
    attrs: {
      "data-ui": "dropdown-list",
      "aria-labelledby": labelId,
      tabindex: "-1",
    },
  });

  panel.appendChild(list);

  root.appendChild(labelEl);
  root.appendChild(trigger);
  root.appendChild(panel);

  let openState = false;
  let selected = null;
  let focusedOptionIndex = -1;

  function renderOptions() {
    list.innerHTML = "";
    const frag = document.createDocumentFragment();

    options.forEach((opt, idx) => {
      const value = opt?.value ?? idx;
      const text = opt?.label ?? String(value);

      const row = button({
        text,
        id: `${id}__opt-${idx}`,
        attrs: {
          role: "option",
          "aria-selected": "false",
          "data-ui": "dropdown-option",
          "data-value": String(value),
          "data-index": String(idx),
          tabindex: "-1",
        },
        dataset: { state: "idle" },
      });

      on(row, "click", (e) => {
        selectInternal({ label: text, value });
        close();
        trigger.focus();
      });

      on(row, "keydown", handleOptionKeydown);

      frag.appendChild(row);
    });

    list.appendChild(frag);
  }

  function syncSelectedUI() {
    valueEl.textContent = selected ? String(selected.label) : "";

    const children = Array.from(list.children);
    children.forEach((node, idx) => {
      const btn = node;
      const val = btn.getAttribute("data-value");
      const isSel = selected && String(selected.value) === val;

      btn.setAttribute("aria-selected", isSel ? "true" : "false");
      btn.dataset.state = isSel ? "selected" : "idle";
    });
  }

  function selectInternal(opt) {
    selected = { label: String(opt.label), value: opt.value };
    syncSelectedUI();
    if (onChangeCb) {
      try {
        onChangeCb(selected);
      } catch (e) {
        console.error(e);
      }
    }
  }

  function focusOption(index) {
    const children = Array.from(list.children);
    if (!children.length) return;

    const clamped = Math.max(0, Math.min(index, children.length - 1));
    focusedOptionIndex = clamped;

    children.forEach((child, i) => {
      if (i === clamped) {
        child.setAttribute("tabindex", "0");
        child.focus();
      } else {
        child.setAttribute("tabindex", "-1");
      }
    });
  }

  function handleTriggerKeydown(e) {
    switch (e.key) {
      case "ArrowDown":
      case "ArrowUp":
      case "Enter":
      case " ":
        e.preventDefault();
        open();
        // Focus selected option if exists, else first
        const selectedIdx = options.findIndex(
          (o) => selected && String(o.value) === String(selected.value)
        );
        focusOption(selectedIdx >= 0 ? selectedIdx : 0);
        break;
      case "Escape":
        if (openState) {
          e.preventDefault();
          close();
        }
        break;
      default:
        // Typeahead on trigger
        if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
          const char = e.key.toLowerCase();
          const matchIdx = options.findIndex((o) =>
            String(o.label || "").toLowerCase().startsWith(char)
          );
          if (matchIdx >= 0) {
            selectInternal(options[matchIdx]);
          }
        }
        break;
    }
  }

  function handleOptionKeydown(e) {
    const children = Array.from(list.children);
    const count = children.length;
    if (!count) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        focusOption((focusedOptionIndex + 1) % count);
        break;
      case "ArrowUp":
        e.preventDefault();
        focusOption((focusedOptionIndex - 1 + count) % count);
        break;
      case "Home":
        e.preventDefault();
        focusOption(0);
        break;
      case "End":
        e.preventDefault();
        focusOption(count - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (focusedOptionIndex >= 0 && options[focusedOptionIndex]) {
          selectInternal(options[focusedOptionIndex]);
        }
        close();
        trigger.focus();
        break;
      case "Escape":
        e.preventDefault();
        close();
        trigger.focus();
        break;
      case "Tab":
        close();
        break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
          const char = e.key.toLowerCase();
          const startIdx = (focusedOptionIndex + 1) % count;
          let matchIdx = -1;

          for (let i = 0; i < count; i++) {
            const checkIdx = (startIdx + i) % count;
            if (String(options[checkIdx]?.label || "").toLowerCase().startsWith(char)) {
              matchIdx = checkIdx;
              break;
            }
          }

          if (matchIdx >= 0) {
            e.preventDefault();
            focusOption(matchIdx);
          }
        }
        break;
    }
  }

  function open() {
    if (openState) return;

    if (onOpenCb) {
      try {
        onOpenCb();
      } catch (e) {
        console.error(e);
      }
    }

    openState = true;
    trigger.setAttribute("aria-expanded", "true");
    panel.removeAttribute("hidden");
    root.dataset.state = "open";
  }

  function close() {
    if (!openState) return;
    openState = false;
    trigger.setAttribute("aria-expanded", "false");
    panel.setAttribute("hidden", "");
    root.dataset.state = "closed";
  }

  function toggle() {
    if (openState) close();
    else {
      open();
      const selectedIdx = options.findIndex(
        (o) => selected && String(o.value) === String(selected.value)
      );
      focusOption(selectedIdx >= 0 ? selectedIdx : 0);
    }
  }

  function show() {
    root.removeAttribute("hidden");
  }

  function hide() {
    root.setAttribute("hidden", "");
  }

  function setOptions(next = []) {
    options = Array.isArray(next) ? next.slice() : [];
    renderOptions();
    if (opts.autoSelectFirst !== false) selectFirst();
  }

  function selectFirst() {
    if (options.length) selectInternal(options[0]);
  }

  function selectByValue(value) {
    const found = options.find((o) => String(o?.value) === String(value));
    if (found) selectInternal(found);
  }

  function getValue() {
    return selected ? selected.value : null;
  }

  function isOpen() {
    return openState;
  }

  function setOnOpen(fn) {
    onOpenCb = typeof fn === "function" ? fn : null;
  }

  function setOnChange(fn) {
    onChangeCb = typeof fn === "function" ? fn : null;
  }

  // Bind trigger events
  on(trigger, "click", (e) => {
    e.preventDefault();
    toggle();
  });
  on(trigger, "keydown", handleTriggerKeydown);

  // Initial state
  panel.setAttribute("hidden", "");
  root.dataset.state = "closed";
  renderOptions();

  if (opts.autoSelectFirst !== false) {
    selectFirst();
  } else {
    syncSelectedUI();
  }

  return {
    root,
    open,
    close,
    toggle,
    isOpen,
    show,
    hide,
    setOptions,
    selectFirst,
    selectByValue,
    getValue,
    setOnOpen,
    setOnChange,
  };
}

/**
 * Create selection area container with 2 dropdowns.
 */
export function createSelectionArea(opts = {}) {
  const id = opts.id ?? "selection-area";
  const classDropdownOptions = opts.classDropdownOptions ?? {};
  const streamDropdownOptions = opts.streamDropdownOptions ?? {};

  const classDD = createDropdown(classDropdownOptions);
  const streamDD = createDropdown(streamDropdownOptions);

  const root = container("div", {
    id,
    attrs: { "data-ui": "selection-area", role: "region", "aria-label": "Class and Stream selection" },
    children: [classDD.root, streamDD.root],
  });

  return { root, classDD, streamDD };
}
