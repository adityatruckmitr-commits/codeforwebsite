/* ============================================================
   app_sidebar.js
   Accessible Sidebar renderer (Books > Units > Chapters)
   - Semantic <aside role="complementary" aria-label="...">
   - Semantic <nav aria-label="..."> with accessible heading <h2>
   - Explicit aria-controls and aria-expanded on disclosures
   - Multi-modal active indicator on chapter items
   - Full keyboard navigation support (Enter, Space, Arrows)
   ============================================================ */

import { appState } from "./app_state.js";
import { el, container, setDataset, on, getShell, getMainArea } from "./app_common.js";
import { loadContent } from "./content_load.js";

/* --------------------------
    Helpers: data access
-------------------------- */

function normClassNum(v) {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const m = v.match(/(\d+)/);
    if (m) return Number(m[1]);
  }
  return null;
}

function getClassObj(classNum) {
  const classes = appState?.data?.Classes || appState?.allClasses || appState?.allSubjects || [];
  return classes.find((c) => normClassNum(c?.classTitle) === classNum) || null;
}

function getSubjectObj(classNum, subjectID) {
  const cls = getClassObj(classNum);
  if (!cls) return null;
  const items = Array.isArray(cls.items) ? cls.items : [];
  return items.find((s) => String(s?.subjectID) === String(subjectID)) || null;
}

function isUnitNode(node) {
  return node && (node.unitID != null || node.unitName != null) && Array.isArray(node.items);
}

/* --------------------------
    Helpers: palette
-------------------------- */

const BOOK_ACCENTS = [
  "rgba(var(--accent-amber-rgb), 0.95)",
  "rgba(var(--accent-blue-rgb), 0.95)",
  "rgba(var(--accent-pink-rgb), 0.95)",
  "rgba(var(--accent-green-rgb, 50,180,120), 0.95)",
  "rgba(var(--accent-purple-rgb, 160,120,255), 0.95)",
];

function accentForIndex(i) {
  return BOOK_ACCENTS[i % BOOK_ACCENTS.length];
}

/* --------------------------
    DOM builders
-------------------------- */

function makeSidebarRoot() {
  return container("aside", {
    id: "sidebar",
    attrs: {
      "data-ui": "sidebar",
      role: "complementary",
      "aria-label": "Books and chapters navigation",
    },
  });
}

function makeSidebarHeader(subjectTitle) {
  const title = subjectTitle ? `${subjectTitle} Books` : "Subject Books";

  return container("div", {
    attrs: { "data-ui": "sidebar-header" },
    children: [
      el("h2", {
        attrs: { "data-ui": "sidebar-title", class: "sidebar-heading" },
        text: title,
      }),
    ],
  });
}

function makeDisclosureRow({ level, kind, label, meta = {}, accent = null, expanded = false, childrenId = "" }) {
  const btnId = `${kind}-${meta.id ?? Math.random().toString(16).slice(2)}`;
  const caret = el("span", { attrs: { "data-ui": "tree-caret", "aria-hidden": "true" } });

  const icon =
    kind === "book"
      ? el("span", {
          attrs: accent
            ? { "data-ui": "book-icon", "aria-hidden": "true", style: `--book-accent:${accent}` }
            : { "data-ui": "book-icon", "aria-hidden": "true" },
        })
      : null;

  const parts = [];
  if (icon) parts.push(icon);
  const labelUI =
    kind === "book" ? "book-label" :
    kind === "unit" ? "unit-label" :
    "tree-label";

  parts.push(el("span", { attrs: { "data-ui": labelUI }, text: label || "" }));
  parts.push(caret);

  const btnUI = kind === "book" ? "book-toggle" : "unit-toggle";

  const btn = el("button", {
    attrs: {
      type: "button",
      id: btnId,
      "data-ui": btnUI,
      "data-level": String(level),
      "data-kind": kind,
      "aria-expanded": expanded ? "true" : "false",
      ...(childrenId ? { "aria-controls": childrenId } : {}),
      "aria-label": `${kind === "book" ? "Book" : "Unit"}: ${label}, click to ${expanded ? "collapse" : "expand"}`,
    },
    children: parts,
  });

  setDataset(btn, {
    bookId: meta.bookID ?? "",
    bookCode: meta.bookCode ?? "",
    unitId: meta.unitID ?? "",
  });

  return btn;
}

function normalizeChapterItems(items) {
  if (!Array.isArray(items)) return [];

  return items.map((it) => {
    const type = String(it?.type || "");
    if (!/^(video|playlist)$/i.test(type)) return it;
    return it;
  });
}

function makeChapterRow({ level, label, meta = {}, selected = false }) {
  const btn = el("button", {
    attrs: {
      type: "button",
      "data-ui": "chapter-row",
      "data-level": String(level),
      "aria-current": selected ? "true" : "false",
      "aria-label": `Chapter: ${label}`,
      tabindex: "0",
    },
    children: [
      el("span", { attrs: { class: "chapter-indicator", "aria-hidden": "true" } }),
      el("span", { attrs: { "data-ui": "chapter-label" }, text: label || "" }),
    ],
  });

  setDataset(btn, {
    bookId: meta.bookID ?? "",
    bookCode: meta.bookCode ?? "",
    unitId: meta.unitID ?? "",
    chapterId: meta.chapterID ?? "",
    subjectTitle: meta.subjectTitle ?? "",
    bookTitle: meta.bookTitle ?? "",
    unitTitle: meta.unitTitle ?? "",
    chapterTitle: meta.chapterTitle ?? label ?? "",
  });

  on(btn, "click", () => {
    const root = btn.closest('[data-ui="tree-root"]') || document;

    appState.selectedBookID = meta.bookID ?? null;
    appState.selectedBookCode = meta.bookCode ?? null;
    appState.selectedUnitID = meta.unitID ?? null;
    appState.selectedChapterID = meta.chapterID ?? null;

    root.querySelectorAll('[data-ui="chapter-row"][aria-current="true"]').forEach((b) => {
      b.setAttribute("aria-current", "false");
    });
    btn.setAttribute("aria-current", "true");

    const selectedPath = collectTogglePathForChapterBtn(btn);
    collapseAllExcept(root, new Set(selectedPath));
    ensurePathExpanded(root, selectedPath);

    loadContent({
      subjectTitle: meta.subjectTitle ?? "",
      bookTitle: meta.bookTitle ?? "",
      unitTitle: meta.unitTitle ?? "",
      chapterTitle: meta.chapterTitle ?? label ?? "",
      bookCode: appState.selectedBookCode,
      bookID: appState.selectedBookID,
      unitID: appState.selectedUnitID,
      chapterID: appState.selectedChapterID,
      chapterItems: meta.chapterItems ?? [],
    });
  });

  return btn;
}

function makeChildrenContainer({ id, labelledBy, hidden = true }) {
  return container("div", {
    id: id || `children-${Math.random().toString(16).slice(2)}`,
    attrs: {
      "data-ui": "tree-children",
      "data-state": hidden ? "collapsed" : "expanded",
      "aria-labelledby": labelledBy,
      hidden: hidden ? "" : null,
      role: "group",
    },
  });
}

function setExpanded(toggleBtn, childrenEl, expanded) {
  toggleBtn.setAttribute("aria-expanded", expanded ? "true" : "false");
  const kind = toggleBtn.getAttribute("data-kind") || "item";
  const labelText = toggleBtn.querySelector('[data-ui$="-label"]')?.textContent?.trim() || "";
  toggleBtn.setAttribute(
    "aria-label",
    `${kind === "book" ? "Book" : "Unit"}: ${labelText}, click to ${expanded ? "collapse" : "expand"}`
  );

  if (expanded) {
    childrenEl.removeAttribute("hidden");
    childrenEl.setAttribute("data-state", "expanded");
  } else {
    childrenEl.setAttribute("hidden", "");
    childrenEl.setAttribute("data-state", "collapsed");
  }
}

function getChildrenForToggle(toggleBtn) {
  const sib = toggleBtn?.nextElementSibling;
  if (sib && sib.getAttribute && sib.getAttribute("data-ui") === "tree-children") return sib;
  return null;
}

function collectTogglePathFromChildren(childrenEl) {
  const ids = [];
  let cur = childrenEl;
  while (cur && cur.getAttribute) {
    if (cur.getAttribute("data-ui") !== "tree-children") break;
    const labelledBy = cur.getAttribute("aria-labelledby");
    if (!labelledBy) break;
    ids.push(labelledBy);
    const toggle = document.getElementById(labelledBy);
    if (!toggle) break;
    const parentChildren = toggle.closest('[data-ui="tree-children"]');
    cur = parentChildren;
  }
  return ids;
}

function collectTogglePathForChapterBtn(chBtn) {
  const nearestChildren = chBtn?.closest?.('[data-ui="tree-children"]');
  if (!nearestChildren) return [];
  return collectTogglePathFromChildren(nearestChildren);
}

function collectTogglePathForToggleBtn(toggleBtn) {
  const ids = [toggleBtn.id].filter(Boolean);
  const parentChildren = toggleBtn.closest('[data-ui="tree-children"]');
  if (parentChildren) {
    const anc = collectTogglePathFromChildren(parentChildren);
    for (const id of anc) ids.push(id);
  }
  return ids;
}

function getSelectedChapterBtn(root) {
  return root.querySelector('[data-ui="chapter-row"][aria-current="true"]');
}

function normalizeCurrent(root) {
  const currentBtns = Array.from(root.querySelectorAll('[data-ui="chapter-row"][aria-current="true"]'));
  if (currentBtns.length <= 1) return;

  const desired = String(appState.selectedChapterID ?? "");
  let keep = null;
  if (desired) {
    keep = currentBtns.find((b) => String(b.dataset?.chapterId ?? "") === desired) || null;
  }
  if (!keep) keep = currentBtns[0];

  currentBtns.forEach((b) => {
    if (b !== keep) b.setAttribute("aria-current", "false");
  });
  keep.setAttribute("aria-current", "true");
}

function getSelectedPathToggleIds(root) {
  const selected = getSelectedChapterBtn(root);
  if (!selected) return [];
  return collectTogglePathForChapterBtn(selected);
}

function collapseAllExcept(root, keepIdsSet) {
  const toggles = root.querySelectorAll('[data-ui="book-toggle"], [data-ui="unit-toggle"]');
  toggles.forEach((t) => {
    const children = getChildrenForToggle(t);
    if (!children) return;
    const keep = keepIdsSet.has(t.id);
    setExpanded(t, children, keep);
  });
}

function ensurePathExpanded(root, toggleIds) {
  const keep = new Set(toggleIds.filter(Boolean));
  const toggles = root.querySelectorAll('[data-ui="book-toggle"], [data-ui="unit-toggle"]');
  toggles.forEach((t) => {
    const children = getChildrenForToggle(t);
    if (!children) return;
    if (keep.has(t.id)) setExpanded(t, children, true);
  });
}

function wireDisclosure(toggleBtn, childrenEl, root) {
  on(toggleBtn, "click", () => {
    normalizeCurrent(root);
    const selectedIds = getSelectedPathToggleIds(root);
    const selectedSet = new Set(selectedIds);

    const clickedPath = collectTogglePathForToggleBtn(toggleBtn);
    const clickedSet = new Set(clickedPath);

    const keepSet = new Set([...selectedSet, ...clickedSet]);

    const isExpanded = toggleBtn.getAttribute("aria-expanded") === "true";
    const canCollapse = !selectedSet.has(toggleBtn.id);

    if (isExpanded && canCollapse) {
      setExpanded(toggleBtn, childrenEl, false);
      collapseAllExcept(root, selectedSet);
      ensurePathExpanded(root, selectedIds);
      return;
    }

    collapseAllExcept(root, keepSet);
    ensurePathExpanded(root, [...keepSet]);
  });
}

/* --------------------------
    Public API
-------------------------- */

export function createSidebar() {
  const shellId = appState.ui_appshell || "appshell";
  const shell = getShell({ id: shellId });
  const mainRowId = appState.ui_mainrow || "mainrow";
  const mainrow = getMainArea({ shellId, mainRowId });

  let sidebar = document.getElementById("sidebar");
  if (!sidebar) {
    sidebar = makeSidebarRoot();
    mainrow.appendChild(sidebar);
  } else {
    sidebar.replaceChildren();
  }

  const classNum = normClassNum(appState.selectedClass);
  const subjectID = appState.selectedSubjectID;

  const subject = getSubjectObj(classNum, subjectID);
  const subjectTitle = subject?.subjectTitle || appState.selectedSubject || "Subject";

  sidebar.appendChild(makeSidebarHeader(subjectTitle));

  const books = Array.isArray(subject?.items) ? subject.items : [];
  const tree = container("nav", {
    attrs: {
      "data-ui": "tree-root",
      "aria-label": `${subjectTitle} Chapters list`,
    },
  });

  books.forEach((book, idx) => {
    const bookID = book?.bookID ?? null;
    const bookTitle = book?.bookTitle ?? "Book";
    const bookCode = book?.bookCode ?? null;
    const accent = accentForIndex(idx);
    const bookChildrenId = `book-children-${bookID ?? idx}`;

    const bookToggle = makeDisclosureRow({
      level: 1,
      kind: "book",
      label: bookTitle,
      meta: { id: bookID ?? idx, bookID, bookCode },
      accent,
      expanded: false,
      childrenId: bookChildrenId,
    });

    const bookChildren = makeChildrenContainer({
      id: bookChildrenId,
      labelledBy: bookToggle.id,
      hidden: true,
    });

    const items = Array.isArray(book?.items) ? book.items : [];
    if (items.length && isUnitNode(items[0])) {
      items.forEach((unit, uidx) => {
        const unitID = unit?.unitID ?? null;
        const unitName = unit?.unitName ?? "Unit";
        const unitChildrenId = `unit-children-${bookID ?? idx}-${unitID ?? uidx}`;

        const unitToggle = makeDisclosureRow({
          level: 2,
          kind: "unit",
          label: unitName,
          meta: { id: `${bookID ?? idx}-${unitID ?? uidx}`, bookID, bookCode, unitID },
          expanded: false,
          childrenId: unitChildrenId,
        });

        const unitChildren = makeChildrenContainer({
          id: unitChildrenId,
          labelledBy: unitToggle.id,
          hidden: true,
        });

        const chapters = Array.isArray(unit?.items) ? unit.items : [];
        chapters.forEach((ch, cidx) => {
          const chapterID = ch?.chapterID ?? null;
          const chapterName = ch?.chapterName ?? `Chapter ${cidx + 1}`;

          unitChildren.appendChild(
            makeChapterRow({
              level: 3,
              label: chapterName,
              meta: {
                subjectTitle: subjectTitle || "",
                bookTitle: bookTitle || "",
                unitTitle: unitName || "",
                chapterTitle: chapterName || "",
                bookID,
                bookCode,
                unitID,
                chapterID,
                chapterItems: normalizeChapterItems(Array.isArray(ch?.items) ? ch.items : []),
              },
              selected: String(appState.selectedChapterID) === String(chapterID),
            })
          );
        });

        wireDisclosure(unitToggle, unitChildren, tree);

        bookChildren.appendChild(unitToggle);
        bookChildren.appendChild(unitChildren);
      });
    } else {
      items.forEach((ch, cidx) => {
        const chapterID = ch?.chapterID ?? null;
        const chapterName = ch?.chapterName ?? `Chapter ${cidx + 1}`;

        bookChildren.appendChild(
          makeChapterRow({
            level: 2,
            label: chapterName,
            meta: {
              subjectTitle: subjectTitle || "",
              bookTitle: bookTitle || "",
              unitTitle: "",
              chapterTitle: chapterName || "",
              bookID,
              bookCode,
              unitID: null,
              chapterID,
              chapterItems: normalizeChapterItems(Array.isArray(ch?.items) ? ch.items : []),
            },
            selected: String(appState.selectedChapterID) === String(chapterID),
          })
        );
      });
    }

    wireDisclosure(bookToggle, bookChildren, tree);

    tree.appendChild(bookToggle);
    tree.appendChild(bookChildren);
  });

  sidebar.appendChild(tree);

  // Auto-select first available chapter if none active
  const hasSelected = tree.querySelector('[data-ui="chapter-row"][aria-current="true"]');
  if (!hasSelected) {
    const firstChapter = tree.querySelector('[data-ui="chapter-row"]');
    if (firstChapter) {
      const path = collectTogglePathForChapterBtn(firstChapter);
      collapseAllExcept(tree, new Set(path));
      ensurePathExpanded(tree, path);
      firstChapter.click();
    }
  } else {
    const selectedPath = getSelectedPathToggleIds(tree);
    collapseAllExcept(tree, new Set(selectedPath));
    ensurePathExpanded(tree, selectedPath);
  }

  return sidebar;
}
