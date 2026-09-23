// content_load.js
// UI constants + UI shell + renderers live here (per your rules).
// NOTE: content_parser.js remains as your data/model + shared helpers.
// We ONLY adjusted imagegroup rendering to be a slideshow (data/image/*) with image-extension validation.

import { appState } from "./app_state.js";
import { el, container, button, on, announceLive } from "./app_common.js";
import { initializeShadbroopTable } from "./content_shabdroop.js";
import { createInlineMathRenderer, renderLineWithDirectives } from "./MathRenderer.noMath.js";
import { updateDocumentTitle } from "./app_accessibility.js";

// Keep ALL existing parser functions; we only import helpers we need.
import {
  getChapterModel,
  buildCsvTable,
  buildTxtTable,
  buildTsvTree,
  buildTimelineView,
  // imagegroup helpers appended to parser
  isValidImageFilename,
  detailRow,
  getYoutubeThumb,
  pdfExists,
  buildPdfJsSrc,
  wireTxtBlockExpand
} from "./content_parser.js";


/* ============================================================
Periodic Table Data (ALWAYS keep in content_load.js if you render PT here)
============================================================ */
const CATEGORY_COLORS={
  'alkali metal':'#ef4444','alkaline earth metal':'#f59e0b','transition metal':'#22c55e',
  'post-transition metal':'#10b981','metalloid':'#84cc16','polyatomic nonmetal':'#06b6d4',
  'diatomic nonmetal':'#0ea5e9','noble gas':'#a78bfa','halogen':'#f97316',
  'lanthanoid':'#eab308','actinoid':'#fb7185','unknown':'#64748b'
};

const ATOMIC_WEIGHT={
1:1.008,2:4.0026,3:6.94,4:9.0122,5:10.81,6:12.011,7:14.007,8:15.999,9:18.998,10:20.180,
11:22.990,12:24.305,13:26.982,14:28.085,15:30.974,16:32.06,17:35.45,18:39.948,19:39.098,20:40.078,
21:44.956,22:47.867,23:50.942,24:51.996,25:54.938,26:55.845,27:58.933,28:58.693,29:63.546,30:65.38,
31:69.723,32:72.630,33:74.922,34:78.971,35:79.904,36:83.798,37:85.468,38:87.62,39:88.906,40:91.224,
41:92.906,42:95.95,43:98,44:101.07,45:102.905,46:106.42,47:107.868,48:112.414,49:114.818,50:118.710,
51:121.760,52:127.60,53:126.904,54:131.293,55:132.905,56:137.327,57:138.905,58:140.116,59:140.908,60:144.242,
61:145,62:150.36,63:151.964,64:157.25,65:158.925,66:162.500,67:164.930,68:167.259,69:168.934,70:173.045,
71:174.967,72:178.49,73:180.948,74:183.84,75:186.207,76:190.23,77:192.217,78:195.084,79:196.967,80:200.592,
81:204.38,82:207.2,83:208.980,84:209,85:210,86:222,87:223,88:226,89:227,90:232.0377,
91:231.0359,92:238.0289,93:237,94:244,95:243,96:247,97:247,98:251,99:252,100:257,
101:258,102:259,103:266,104:267,105:268,106:269,107:270,108:269,109:278,110:281,
111:282,112:285,113:286,114:289,115:290,116:293,117:294,118:294
};

const ELEMENTS=[
  {z:1,s:'H',n:'Hydrogen',c:'diatomic nonmetal',p:1,g:1},
  {z:2,s:'He',n:'Helium',c:'noble gas',p:1,g:18},
  {z:3,s:'Li',n:'Lithium',c:'alkali metal',p:2,g:1},
  {z:4,s:'Be',n:'Beryllium',c:'alkaline earth metal',p:2,g:2},
  {z:5,s:'B',n:'Boron',c:'metalloid',p:2,g:13},
  {z:6,s:'C',n:'Carbon',c:'polyatomic nonmetal',p:2,g:14},
  {z:7,s:'N',n:'Nitrogen',c:'diatomic nonmetal',p:2,g:15},
  {z:8,s:'O',n:'Oxygen',c:'diatomic nonmetal',p:2,g:16},
  {z:9,s:'F',n:'Fluorine',c:'halogen',p:2,g:17},
  {z:10,s:'Ne',n:'Neon',c:'noble gas',p:2,g:18},
  {z:11,s:'Na',n:'Sodium',c:'alkali metal',p:3,g:1},
  {z:12,s:'Mg',n:'Magnesium',c:'alkaline earth metal',p:3,g:2},
  {z:13,s:'Al',n:'Aluminium',c:'post-transition metal',p:3,g:13},
  {z:14,s:'Si',n:'Silicon',c:'metalloid',p:3,g:14},
  {z:15,s:'P',n:'Phosphorus',c:'polyatomic nonmetal',p:3,g:15},
  {z:16,s:'S',n:'Sulfur',c:'polyatomic nonmetal',p:3,g:16},
  {z:17,s:'Cl',n:'Chlorine',c:'halogen',p:3,g:17},
  {z:18,s:'Ar',n:'Argon',c:'noble gas',p:3,g:18},
  {z:19,s:'K',n:'Potassium',c:'alkali metal',p:4,g:1},
  {z:20,s:'Ca',n:'Calcium',c:'alkaline earth metal',p:4,g:2},
  {z:21,s:'Sc',n:'Scandium',c:'transition metal',p:4,g:3},
  {z:22,s:'Ti',n:'Titanium',c:'transition metal',p:4,g:4},
  {z:23,s:'V',n:'Vanadium',c:'transition metal',p:4,g:5},
  {z:24,s:'Cr',n:'Chromium',c:'transition metal',p:4,g:6},
  {z:25,s:'Mn',n:'Manganese',c:'transition metal',p:4,g:7},
  {z:26,s:'Fe',n:'Iron',c:'transition metal',p:4,g:8},
  {z:27,s:'Co',n:'Cobalt',c:'transition metal',p:4,g:9},
  {z:28,s:'Ni',n:'Nickel',c:'transition metal',p:4,g:10},
  {z:29,s:'Cu',n:'Copper',c:'transition metal',p:4,g:11},
  {z:30,s:'Zn',n:'Zinc',c:'transition metal',p:4,g:12},
  {z:31,s:'Ga',n:'Gallium',c:'post-transition metal',p:4,g:13},
  {z:32,s:'Ge',n:'Germanium',c:'metalloid',p:4,g:14},
  {z:33,s:'As',n:'Arsenic',c:'metalloid',p:4,g:15},
  {z:34,s:'Se',n:'Selenium',c:'metalloid',p:4,g:16},
  {z:35,s:'Br',n:'Bromine',c:'halogen',p:4,g:17},
  {z:36,s:'Kr',n:'Krypton',c:'noble gas',p:4,g:18},
  {z:37,s:'Rb',n:'Rubidium',c:'alkali metal',p:5,g:1},
  {z:38,s:'Sr',n:'Strontium',c:'alkaline earth metal',p:5,g:2},
  {z:39,s:'Y',n:'Yttrium',c:'transition metal',p:5,g:3},
  {z:40,s:'Zr',n:'Zirconium',c:'transition metal',p:5,g:4},
  {z:41,s:'Nb',n:'Niobium',c:'transition metal',p:5,g:5},
  {z:42,s:'Mo',n:'Molybdenum',c:'transition metal',p:5,g:6},
  {z:43,s:'Tc',n:'Technetium',c:'transition metal',p:5,g:7},
  {z:44,s:'Ru',n:'Ruthenium',c:'transition metal',p:5,g:8},
  {z:45,s:'Rh',n:'Rhodium',c:'transition metal',p:5,g:9},
  {z:46,s:'Pd',n:'Palladium',c:'transition metal',p:5,g:10},
  {z:47,s:'Ag',n:'Silver',c:'transition metal',p:5,g:11},
  {z:48,s:'Cd',n:'Cadmium',c:'transition metal',p:5,g:12},
  {z:49,s:'In',n:'Indium',c:'post-transition metal',p:5,g:13},
  {z:50,s:'Sn',n:'Tin',c:'post-transition metal',p:5,g:14},
  {z:51,s:'Sb',n:'Antimony',c:'metalloid',p:5,g:15},
  {z:52,s:'Te',n:'Tellurium',c:'metalloid',p:5,g:16},
  {z:53,s:'I',n:'Iodine',c:'halogen',p:5,g:17},
  {z:54,s:'Xe',n:'Xenon',c:'noble gas',p:5,g:18},
  {z:55,s:'Cs',n:'Caesium',c:'alkali metal',p:6,g:1},
  {z:56,s:'Ba',n:'Barium',c:'alkaline earth metal',p:6,g:2},
  {z:72,s:'Hf',n:'Hafnium',c:'transition metal',p:6,g:4},
  {z:73,s:'Ta',n:'Tantalum',c:'transition metal',p:6,g:5},
  {z:74,s:'W',n:'Tungsten',c:'transition metal',p:6,g:6},
  {z:75,s:'Re',n:'Rhenium',c:'transition metal',p:6,g:7},
  {z:76,s:'Os',n:'Osmium',c:'transition metal',p:6,g:8},
  {z:77,s:'Ir',n:'Iridium',c:'transition metal',p:6,g:9},
  {z:78,s:'Pt',n:'Platinum',c:'transition metal',p:6,g:10},
  {z:79,s:'Au',n:'Gold',c:'transition metal',p:6,g:11},
  {z:80,s:'Hg',n:'Mercury',c:'transition metal',p:6,g:12},
  {z:81,s:'Tl',n:'Thallium',c:'post-transition metal',p:6,g:13},
  {z:82,s:'Pb',n:'Lead',c:'post-transition metal',p:6,g:14},
  {z:83,s:'Bi',n:'Bismuth',c:'post-transition metal',p:6,g:15},
  {z:84,s:'Po',n:'Polonium',c:'metalloid',p:6,g:16},
  {z:85,s:'At',n:'Astatine',c:'halogen',p:6,g:17},
  {z:86,s:'Rn',n:'Radon',c:'noble gas',p:6,g:18},
  {z:87,s:'Fr',n:'Francium',c:'alkali metal',p:7,g:1},
  {z:88,s:'Ra',n:'Radium',c:'alkaline earth metal',p:7,g:2},
  {z:104,s:'Rf',n:'Rutherfordium',c:'transition metal',p:7,g:4},
  {z:105,s:'Db',n:'Dubnium',c:'transition metal',p:7,g:5},
  {z:106,s:'Sg',n:'Seaborgium',c:'transition metal',p:7,g:6},
  {z:107,s:'Bh',n:'Bohrium',c:'transition metal',p:7,g:7},
  {z:108,s:'Hs',n:'Hassium',c:'transition metal',p:7,g:8},
  {z:109,s:'Mt',n:'Meitnerium',c:'unknown',p:7,g:9},
  {z:110,s:'Ds',n:'Darmstadtium',c:'unknown',p:7,g:10},
  {z:111,s:'Rg',n:'Roentgenium',c:'unknown',p:7,g:11},
  {z:112,s:'Cn',n:'Copernicium',c:'unknown',p:7,g:12},
  {z:113,s:'Nh',n:'Nihonium',c:'unknown',p:7,g:13},
  {z:114,s:'Fl',n:'Flerovium',c:'unknown',p:7,g:14},
  {z:115,s:'Mc',n:'Moscovium',c:'unknown',p:7,g:15},
  {z:116,s:'Lv',n:'Livermorium',c:'unknown',p:7,g:16},
  {z:117,s:'Ts',n:'Tennessine',c:'unknown',p:7,g:17},
  {z:118,s:'Og',n:'Oganesson',c:'unknown',p:7,g:18},
];

const LANTH=[
  {z:57,s:'La',n:'Lanthanum',c:'lanthanoid'},
  {z:58,s:'Ce',n:'Cerium',c:'lanthanoid'},
  {z:59,s:'Pr',n:'Praseodymium',c:'lanthanoid'},
  {z:60,s:'Nd',n:'Neodymium',c:'lanthanoid'},
  {z:61,s:'Pm',n:'Promethium',c:'lanthanoid'},
  {z:62,s:'Sm',n:'Samarium',c:'lanthanoid'},
  {z:63,s:'Eu',n:'Europium',c:'lanthanoid'},
  {z:64,s:'Gd',n:'Gadolinium',c:'lanthanoid'},
  {z:65,s:'Tb',n:'Terbium',c:'lanthanoid'},
  {z:66,s:'Dy',n:'Dysprosium',c:'lanthanoid'},
  {z:67,s:'Ho',n:'Holmium',c:'lanthanoid'},
  {z:68,s:'Er',n:'Erbium',c:'lanthanoid'},
  {z:69,s:'Tm',n:'Thulium',c:'lanthanoid'},
  {z:70,s:'Yb',n:'Ytterbium',c:'lanthanoid'},
  {z:71,s:'Lu',n:'Lutetium',c:'lanthanoid'},
];

const ACTIN=[
  {z:89,s:'Ac',n:'Actinium',c:'actinoid'},
  {z:90,s:'Th',n:'Thorium',c:'actinoid'},
  {z:91,s:'Pa',n:'Protactinium',c:'actinoid'},
  {z:92,s:'U',n:'Uranium',c:'actinoid'},
  {z:93,s:'Np',n:'Neptunium',c:'actinoid'},
  {z:94,s:'Pu',n:'Plutonium',c:'actinoid'},
  {z:95,s:'Am',n:'Americium',c:'actinoid'},
  {z:96,s:'Cm',n:'Curium',c:'actinoid'},
  {z:97,s:'Bk',n:'Berkelium',c:'actinoid'},
  {z:98,s:'Cf',n:'Californium',c:'actinoid'},
  {z:99,s:'Es',n:'Einsteinium',c:'actinoid'},
  {z:100,s:'Fm',n:'Fermium',c:'actinoid'},
  {z:101,s:'Md',n:'Mendelevium',c:'actinoid'},
  {z:102,s:'No',n:'Nobelium',c:'actinoid'},
  {z:103,s:'Lr',n:'Lawrencium',c:'actinoid'},
];

function isRadioactiveZ(z){ return z===43 || z===61 || z===83 || z>=84; }


/* ============================================================
Basic UI constants (ALWAYS keep in content_load.js)
============================================================ */
export const TYPE_LABELS = {
  pdf: "Chapter",
  txt: "Text Notes",
  tsv: "Pointers",
  csv: "Notes Table",
  flowchart: "Chart",
  imagegroup: "Images",
  periodictable: "Periodic Table",
  timeline: "Timeline",
  video: "Video Book",
  playlist: "Video Book",
  sanskrit: "शब्द रूप",
  dhatu: "धातु रूप",
  answers: "Answer Sheet",
  spell: "Spell Test",
};
export const DEFAULT_TYPE = "pdf";

const TSV_MATH = createInlineMathRenderer();
/* ============================================================
Basic UI Functions (ALWAYS keep in content_load.js)
============================================================ */
export async function loadContent({
  bookCode,
  bookID,
  unitID,
  chapterID,
  chapterItems = [],
  subjectTitle,
  bookTitle,
  unitTitle,
  chapterTitle,
} = {}) {
  // Ensure state is up to date
  appState.selectedBookCode = bookCode ?? appState.selectedBookCode ?? null;
  appState.selectedBookID = bookID ?? appState.selectedBookID ?? null;
  appState.selectedUnitID = unitID ?? appState.selectedUnitID ?? null;
  appState.selectedChapterID = chapterID ?? appState.selectedChapterID ?? null;

  // Build/refresh the content shell in #main
  const main = document.getElementById(appState.ui_main || "main");
  if (!main) throw new Error("Missing #main content mount");

  const view = buildContentShell();
  main.replaceChildren(view.root);

  const sidebarTitles = resolveTitlesFromSidebar();
  const effectiveChapterTitle = chapterTitle ?? sidebarTitles.chapterTitle ?? "";
  const effectiveSubjectTitle = subjectTitle ?? appState.selectedSubject ?? "";
  const effectiveBookTitle = bookTitle ?? sidebarTitles.bookTitle ?? "";
  const effectiveUnitTitle = unitTitle ?? sidebarTitles.unitTitle ?? "";

  // Fill header immediately (fast UI feedback) with single meaningful H1
  updateHeader(view, {
    subjectTitle: effectiveSubjectTitle,
    bookTitle: effectiveBookTitle,
    unitTitle: effectiveUnitTitle,
    chapterTitle: effectiveChapterTitle,
  });

  // Dynamic document title & lang update (WCAG 2.4.2 & 3.1.1)
  const subjLower = String(effectiveSubjectTitle).toLowerCase();
  const isIndic =
    subjLower.includes("hindi") ||
    subjLower.includes("sanskrit") ||
    subjLower.includes("संस्कृत") ||
    subjLower.includes("हिंदी");

  updateDocumentTitle({
    chapterTitle: effectiveChapterTitle,
    subjectTitle: effectiveSubjectTitle,
    classNum: appState.selectedClass,
    isIndic,
  });
  
  // Build model
  const model = await getChapterModel({
    bookCode: appState.selectedBookCode,
    bookID: appState.selectedBookID,
    unitID: appState.selectedUnitID,
    chapterID: appState.selectedChapterID,
    chapterItems,
  });

  const types = sanitizeTypes(model.types, model);
  const initialType = pickInitialType(types);

  renderTypeTabs(view, types, initialType, (nextType) => {
    appState.contentType = nextType;
    renderBody(view, nextType, model);
    announceLive(`Switched to ${TYPE_LABELS[nextType] || nextType} view for ${effectiveChapterTitle}`);
  });

  appState.contentType = initialType;
  renderBody(view, initialType, model);

  // Screen reader notification of loaded content (WCAG 4.1.3)
  announceLive(`Loaded ${effectiveChapterTitle || "Chapter"}, ${TYPE_LABELS[initialType] || initialType} view`);
}

export function buildContentShell() {
  const headerLeft = container("div", { attrs: { "data-ui": "content-header-left" } });
  const headerRight = container("div", { attrs: { "data-ui": "content-header-right" } });

  const headerRow = container("div", {
    attrs: { "data-ui": "content-toprow" },
    children: [headerLeft, headerRight],
  });

  const tabsRow = container("div", { attrs: { "data-ui": "content-midrow" } });
  const bodyRow = container("div", { attrs: { "data-ui": "content-bottomrow" } });

  const root = container("div", {
    attrs: { "data-ui": "spell-panel" },
    children: [headerRow, tabsRow, bodyRow],
  });

  return { root, headerLeft, headerRight, tabsRow, bodyRow };
}

export function updateHeader(view, { subjectTitle, bookTitle, unitTitle, chapterTitle }) {
  view.headerLeft.replaceChildren(
    el("h1", {
      id: "main-heading",
      attrs: { "data-ui": "content-chapter-title", class: "content-h1" },
      text: chapterTitle || "Easy Learning"
    })
  );
  view.headerRight.replaceChildren(makePillGroup({ subjectTitle, bookTitle, unitTitle }));
}

export function makePillGroup({ subjectTitle, bookTitle, unitTitle }) {
  const parts = [];

  parts.push(el("span", { attrs: { "data-ui": "pill-live-dot", "aria-hidden": "true" } }));
  parts.push(el("span", { attrs: { "data-ui": "pill-part" }, text: subjectTitle || "Subject" }));
  parts.push(el("span", { attrs: { "data-ui": "pill-sep", "aria-hidden": "true" }, text: "→" }));
  parts.push(el("span", { attrs: { "data-ui": "pill-part" }, text: bookTitle || "Book" }));

  if (String(unitTitle || "").trim()) {
    parts.push(el("span", { attrs: { "data-ui": "pill-sep", "aria-hidden": "true" }, text: "→" }));
    parts.push(el("span", { attrs: { "data-ui": "pill-part" }, text: unitTitle }));
  }

  return el("div", {
    attrs: {
      "data-ui": "pill-group",
      role: "navigation",
      "aria-label": "Breadcrumb trail",
    },
    children: parts,
  });
}

export function resolveTitlesFromSidebar() {
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) return {};

  const selectedChapterBtn = sidebar.querySelector('[data-ui="chapter-row"][aria-current="true"]');
  if (!selectedChapterBtn) return {};

  const chapterTitle =
    selectedChapterBtn.querySelector('[data-ui="chapter-label"]')?.textContent?.trim() ||
    selectedChapterBtn.textContent?.trim() ||
    "";

  const unitChildren = selectedChapterBtn.closest('[data-ui="tree-children"]');
  const unitToggle = unitChildren?.previousElementSibling?.matches?.('[data-ui="unit-toggle"]')
    ? unitChildren.previousElementSibling
    : null;

  const unitTitle = unitToggle?.querySelector('[data-ui="unit-label"]')?.textContent?.trim() || "";

  const bookChildren = unitToggle?.closest('[data-ui="tree-children"]');
  const bookToggle = bookChildren?.previousElementSibling?.matches?.('[data-ui="book-toggle"]')
    ? bookChildren.previousElementSibling
    : null;

  const bookTitle = bookToggle?.querySelector('[data-ui="book-label"]')?.textContent?.trim() || "";

  return { chapterTitle, unitTitle, bookTitle };
}

/* ============================================================
Basic data sanitization + helper functions (ALWAYS keep in content_load.js)
============================================================ */
export function sanitizeTypes(types, model) {
  const arr = Array.isArray(types) ? types : [];
  const filtered = arr
    .map(String)
    .map((s) => s.toLowerCase())
    .filter(Boolean)
    .map((t) => (t === "playlist" ? "video" : t));

  const pdfUrl = String(model?.payload?.pdf?.url || "").trim();
  const hasPdf = !!pdfUrl;
  const out = hasPdf ? ["pdf", ...filtered.filter(t => t !== "pdf")] : filtered.filter(t => t !== "pdf");
  //const out = ["pdf", ...filtered.filter((t) => t !== "pdf")];
  return Array.from(new Set(out));
}

export function pickInitialType(types) {
  const fromState = String(appState.contentType || "").toLowerCase();
  if (fromState && types.includes(fromState)) return fromState;
  return types.includes(DEFAULT_TYPE) ? DEFAULT_TYPE : types[0];
}

export function setSelectedType(tablist, type) {
  tablist.querySelectorAll('[data-ui="content-type-tab"]').forEach((b) => {
    const t = b.getAttribute("data-type");
    const isSel = t === type;
    b.setAttribute("aria-selected", isSel ? "true" : "false");
    b.setAttribute("tabindex", isSel ? "0" : "-1");
  });
}

function renderTypeTabs(view, types, selectedType, onSelected) {
  const list = container("div", {
    attrs: {
      "data-ui": "content-type-tabs",
      role: "tablist",
      "aria-label": "Chapter content sections",
    },
  });

  const buttons = [];

  for (let idx = 0; idx < types.length; idx++) {
    const type = types[idx];
    const isSel = type === selectedType;
    const tabId = `content-tab-${type}`;
    const panelId = `content-panel-body`;

    const btn = el("button", {
      attrs: {
        type: "button",
        role: "tab",
        id: tabId,
        "data-ui": "content-type-tab",
        "data-type": type,
        "aria-selected": isSel ? "true" : "false",
        "aria-controls": panelId,
        tabindex: isSel ? "0" : "-1",
      },
      text: TYPE_LABELS[type] || type,
    });

    on(btn, "click", () => {
      setSelectedType(list, type);
      onSelected(type);
    });

    on(btn, "keydown", (e) => {
      const count = buttons.length;
      let nextIdx = -1;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        nextIdx = (idx + 1) % count;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        nextIdx = (idx - 1 + count) % count;
      } else if (e.key === "Home") {
        e.preventDefault();
        nextIdx = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        nextIdx = count - 1;
      }

      if (nextIdx >= 0 && buttons[nextIdx]) {
        buttons[nextIdx].click();
        buttons[nextIdx].focus();
      }
    });

    buttons.push(btn);
    list.appendChild(btn);
  }

  view.tabsRow.replaceChildren(list);
}

/* ============================================================
renderBody is root function for loading file contents from data
(ALWAYS keep in content_load.js)
============================================================ */
async function renderBody(view, type, model) {
  const body = view.bodyRow;
  body.replaceChildren();
  body.setAttribute("role", "tabpanel");
  body.setAttribute("id", "content-panel-body");
  body.setAttribute("aria-labelledby", `content-tab-${type}`);
  body.setAttribute("tabindex", "0");

  if (type === "video" || type === "playlist") {
    body.appendChild(renderVideo(model));
    return;
  }
  if (type === "csv") {
    body.appendChild(renderCsv(model));
    return;
  }
  if (type === "txt") {
    body.appendChild(renderTxt(model));
    return;
  }
  if (type === "tsv") {
    body.appendChild(renderTsv(model));
    return;
  }
  if (type === "timeline") {
    body.appendChild(renderTimeline(model));
    return;
  }
  if (type === "imagegroup") {
    body.appendChild(renderImageGroup(model));
    return;
  }
  if (type === "pdf") {
    const pdfPanel = await renderPdf(model);
  if (pdfPanel) {
    body.appendChild(pdfPanel);
  }
    return;
  }
  if (type === "answers") {
    body.appendChild(renderAnswers(model));
    return;
  }
  if (type === "periodictable") {
    const { panel, refs } = renderPeriodicTablePanel();
    body.replaceChildren(panel);
    initPeriodicTable(panel, refs);
    return;
  }
  if (type === "flowchart") {
    body.appendChild(renderJSON(model));
    return;
  }
  if (type === "sanskrit") {
    loadsanskrit().then(el => body.appendChild(el));
    return;
  }
  if (type === "dhatu") {
    console.log("calling loadDhatuRoop");
    loadDhatuRoop().then(el => body.appendChild(el));
    return;
  }
  if (type === "spell") {
    body.appendChild(renderSpellTest(model));
    return;
  }

  body.appendChild(el("div", { attrs: { "data-ui": "content-empty" }, text: `No renderer for: ${type}` }));
}

/* ============================================================
Type render functions (ALWAYS keep in content_load.js)
============================================================ */
/*
function renderVideo(model) {
  console.log("Rendering video with model:", model);
  let mode = String(model?.payload?.video?.mode || "").toLowerCase();
  let ids = Array.isArray(model?.payload?.video?.ids) ? model.payload.video.ids : [];

  if (!mode) mode = ids.length > 1 ? "playlist" : "video";

  if (!mode || ids.length === 0) {
    return container("div", {
      attrs: { "data-ui": "content-panel" },
      children: [el("div", { attrs: { "data-ui": "content-empty" }, text: "No videos available for this chapter." })],
    });
  }

  const ytEmbed = (id) => `https://www.youtube.com/embed/${encodeURIComponent(id)}?rel=0&modestbranding=1`;

  if (mode === "video") {
    const panel = container("div", { attrs: { "data-ui": "video-panel" } });
    const frame = el("iframe", {
      attrs: {
        src: ytEmbed(ids[0]),
        "data-ui": "video-frame",
        loading: "lazy",
        title: "Chapter Video",
        allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
        allowfullscreen: "true",
      },
    });
    panel.appendChild(frame);
    return panel;
  }

  const layout = container("div", { attrs: { "data-ui": "playlist-layout" } });

  const player = container("div", { attrs: { "data-ui": "playlist-player" } });
  const frame = el("iframe", {
    attrs: {
      src: ytEmbed(ids[0]),
      "data-ui": "video-frame",
      loading: "lazy",
      title: "Playlist Player",
      allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
      allowfullscreen: "true",
    },
  });
  player.appendChild(frame);

  const list = container("div", { attrs: { "data-ui": "playlist-list" } });

  ids.forEach((id, idx) => {
    const btn = el("button", {
      attrs: { "data-ui": "playlist-item", type: "button", title: id }
    });

    const thumb = el("img", {
      attrs: {
        "data-ui": "playlist-thumb",
        src: getYoutubeThumb(id),
        alt: `Video ${idx + 1}`,
        loading: "lazy"
      }
    });

    // Optional fallback (useful if you try maxres and it doesn't exist)
    thumb.addEventListener("error", () => {
      thumb.src = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    });

    const label = el("span", {
      attrs: { "data-ui": "playlist-label" },
      text: `Video ${idx + 1}`
    });

    btn.appendChild(thumb);
    btn.appendChild(label);

    btn.addEventListener("click", () => {
      list.querySelectorAll('[data-ui="playlist-item"]').forEach((n) => n.removeAttribute("aria-current"));
      btn.setAttribute("aria-current", "true");
      frame.setAttribute("src", ytEmbed(id));
    });

    if (idx === 0) btn.setAttribute("aria-current", "true");
    list.appendChild(btn);
  });

  layout.appendChild(player);
  layout.appendChild(list);
  return layout;
}*/
function renderVideo(model) {
  const video = model?.payload?.video || {};
  let mode = String(video?.mode || "").toLowerCase();

  const itemsRaw = Array.isArray(video?.items) ? video.items : [];
  const idsRaw = Array.isArray(video?.ids) ? video.ids : [];

  let listItems = [];

  if (itemsRaw.length) {
    listItems = itemsRaw
      .map((x) => {
        if (!x) return null;
        if (typeof x === "string" || typeof x === "number") {
          const id = String(x).trim();
          return id ? { id, title: "" } : null;
        }
        if (typeof x === "object") {
          const id = String(x.id ?? "").trim();
          const title = String(x.title ?? "").trim();
          return id ? { id, title } : null;
        }
        return null;
      })
      .filter(Boolean);
  } else {
    listItems = idsRaw
      .map((id) => String(id).trim())
      .filter(Boolean)
      .map((id) => ({ id, title: "" }));
  }

  if (!mode) mode = listItems.length > 1 ? "playlist" : "video";

  if (!mode || listItems.length === 0) {
    return container("div", {
      attrs: { "data-ui": "content-panel" },
      children: [
        el("div", {
          attrs: { "data-ui": "content-empty", role: "status" },
          text: "No videos available for this chapter.",
        }),
      ],
    });
  }

  const ytEmbed = (id) =>
    `https://www.youtube.com/embed/${encodeURIComponent(id)}?rel=0&modestbranding=1&cc_load_policy=1`;

  // --- VIDEO (single) ---
  if (mode === "video") {
    const first = listItems[0];
    const videoTitle = first.title || "Chapter Video Lesson";

    const panel = container("div", {
      attrs: {
        "data-ui": "video-panel",
        role: "region",
        "aria-label": `Video: ${videoTitle}`,
      },
    });

    const frame = el("iframe", {
      attrs: {
        src: ytEmbed(first.id),
        "data-ui": "video-frame",
        loading: "lazy",
        title: `Educational Video Lesson: ${videoTitle}`,
        allow:
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
        allowfullscreen: "true",
      },
    });

    const metaBox = container("div", {
      attrs: { class: "video-a11y-meta" },
      children: [
        el("p", {
          attrs: { class: "video-caption-note" },
          text: "Closed captions (CC) and subtitles can be toggled directly within the video player controls.",
        }),
      ],
    });

    panel.appendChild(frame);
    panel.appendChild(metaBox);
    return panel;
  }

  // --- PLAYLIST ---
  const layout = container("div", {
    attrs: {
      "data-ui": "playlist-layout",
      role: "region",
      "aria-label": "Video Lessons Playlist",
    },
  });

  const firstTitle = listItems[0]?.title || "Video Lesson 1";
  const player = container("div", { attrs: { "data-ui": "playlist-player" } });
  const frame = el("iframe", {
    attrs: {
      src: ytEmbed(listItems[0].id),
      "data-ui": "video-frame",
      loading: "lazy",
      title: `Active Playlist Video: ${firstTitle}`,
      allow:
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
      allowfullscreen: "true",
    },
  });
  player.appendChild(frame);

  const list = container("div", {
    attrs: {
      "data-ui": "playlist-list",
      role: "region",
      "aria-label": "Playlist Video Selector",
    },
  });

  const hasTitles =
    itemsRaw.length &&
    itemsRaw.some((x) => x && typeof x === "object" && String(x.title ?? "").trim());

  listItems.forEach(({ id, title }, idx) => {
    const labelText = hasTitles && title ? title : `Video Lesson ${idx + 1}`;

    const btn = el("button", {
      attrs: {
        "data-ui": "playlist-item",
        type: "button",
        "aria-label": `Play ${labelText}`,
        "aria-current": idx === 0 ? "true" : "false",
        tabindex: "0",
      },
    });

    const thumb = el("img", {
      attrs: {
        "data-ui": "playlist-thumb",
        src: getYoutubeThumb(id),
        alt: `Thumbnail preview for ${labelText}`,
        loading: "lazy",
      },
    });

    thumb.addEventListener("error", () => {
      thumb.src = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    });

    const label = el("span", {
      attrs: { "data-ui": "playlist-label" },
      text: labelText,
    });

    btn.appendChild(thumb);
    btn.appendChild(label);

    btn.addEventListener("click", () => {
      list
        .querySelectorAll('[data-ui="playlist-item"]')
        .forEach((n) => n.setAttribute("aria-current", "false"));
      btn.setAttribute("aria-current", "true");
      frame.setAttribute("src", ytEmbed(id));
      frame.setAttribute("title", `Active Playlist Video: ${labelText}`);
      announceLive(`Now playing: ${labelText}`);
    });

    list.appendChild(btn);
  });

  layout.appendChild(player);
  layout.appendChild(list);
  return layout;
}

function renderCsv(model) {
  const tables = Array.isArray(model?.payload?.csv?.tables) ? model.payload.csv.tables : [];
  if (!tables.length) {
    return container("div", { attrs: { "data-ui": "content-panel" }, children: [el("div", { attrs: { "data-ui": "content-empty" }, text: "CSV not available." })] });
  }

  const panel = container("div", { attrs: { "data-ui": "csv-panel" } });
  for (const t of tables) {
    const block = container("div", { attrs: { "data-ui": "csv-block" } });
    const title = String(t?.title || "").trim();
    if (title) block.appendChild(el("div", { attrs: { "data-ui": "csv-title" }, text: title }));
    const rows = Array.isArray(t?.rows) ? t.rows : [];
    block.appendChild(buildCsvTable(rows));
    panel.appendChild(block);
  }
  return panel;
}

function renderTxt(model) {
  const blocks = Array.isArray(model?.payload?.txt?.blocks) ? model.payload.txt.blocks : [];
  if (!blocks.length) {
    return container("div", {
      attrs: { "data-ui": "content-panel" },
      children: [el("div", { attrs: { "data-ui": "content-empty" }, text: "Text notes not available." })],
    });
  }

  const panel = container("div", { attrs: { "data-ui": "txt-panel" } });

  for (const b of blocks) {
    const block = container("div", { attrs: { "data-ui": "txt-block" } });

    const title = String(b?.title || "").trim();
    if (title) block.appendChild(el("div", { attrs: { "data-ui": "txt-title" }, text: title }));

    // rows can be strings or arrays; keep original behavior where possible
    let rows = Array.isArray(b?.rows) ? b.rows.slice() : [];

    // 1) width directive at very start:  "width"=50%
    // If present, apply inline width on txt-block and remove that directive line.
  const firstLineRaw = rows.length ? (Array.isArray(rows[0]) ? rows[0].join("\t") : String(rows[0] ?? "")) : "";
  const widthM = String(firstLineRaw).trim().match(
    /^"width"\s*=\s*([0-9.]+%|[0-9.]+px|[0-9.]+rem|[0-9.]+vw|[0-9.]+vh)\s*$/i
  );

  if (widthM) {
    block.style.width = widthM[1];
    rows.shift();
  } else {
    block.style.width = "100%";   // ✅ default when not given
  }

    block.appendChild(buildTxtTable(rows));
    panel.appendChild(block);
  }

  wireTxtBlockExpand(panel);
  return panel;
}

function renderTsv(model) {
  const blocks = Array.isArray(model?.payload?.tsv?.blocks) ? model.payload.tsv.blocks : [];
  if (!blocks.length) {
    return container("div", {
      attrs: { "data-ui": "content-panel" },
      children: [el("div", { attrs: { "data-ui": "content-empty" }, text: "Pointers not available." })],
    });
  }

  // optional: let caller override where relative images resolve from
  const imageBase = model?.payload?.tsv?.imageBase || "data/image/";

  const panel = container("div", { attrs: { "data-ui": "tsv-panel" } });

  const controls = container("div", { attrs: { "data-ui": "tsv-controls" } });
  const btnExpand = el("button", { attrs: { type: "button", "data-ui": "tsv-expandall" }, text: "Expand all" });
  const btnCollapse = el("button", { attrs: { type: "button", "data-ui": "tsv-collapseall" }, text: "Collapse all" });
  controls.appendChild(btnExpand);
  controls.appendChild(btnCollapse);
  panel.appendChild(controls);

  const blocksWrap = container("div", { attrs: { "data-ui": "tsv-blocks" } });

  for (const b of blocks) {
    const block = container("div", { attrs: { "data-ui": "tsv-block" } });

    const title = String(b?.title || "").trim();
    if (title) {
      const titleEl = container("div", { attrs: { "data-ui": "tsv-title" } });
      titleEl.appendChild(renderLineWithDirectives(title, { math: TSV_MATH, imageBase }));
      block.appendChild(titleEl);
    }

    const nodes = Array.isArray(b?.nodes) ? b.nodes : [];
    block.appendChild(buildTsvTree(nodes, { imageBase }));
    blocksWrap.appendChild(block);
  }

  panel.appendChild(blocksWrap);

  const setAll = (expand) => {
    panel.querySelectorAll('[data-ui="tsv-toggle"]').forEach((btn) => {
      btn.setAttribute("aria-expanded", expand ? "true" : "false");
      btn.textContent = expand ? "▾" : "▸";

      const row = btn.closest('[data-ui="tsv-row"]');
      const next = row?.nextElementSibling;
      if (next && next.matches('[data-ui="tsv-children"]')) {
        next.hidden = !expand;
        if (expand) TSV_MATH.typesetElement(next); // typeset newly shown math
      }
    });
  };

  on(btnExpand, "click", () => setAll(true));
  on(btnCollapse, "click", () => setAll(false));

  // typeset once after building panel
  queueMicrotask(() => TSV_MATH.typesetElement(panel));

  return panel;
}

function renderTimeline(model) {
  const timeline = model?.payload?.timeline || { groups: [] };
  const groups = Array.isArray(timeline?.groups) ? timeline.groups : [];
  if (!groups.length) {
    return container("div", { attrs: { "data-ui": "content-panel" }, children: [el("div", { attrs: { "data-ui": "content-empty" }, text: "Timeline not available." })] });
  }
  return buildTimelineView(timeline);
}

/*
async function renderPdf(model) {
  const pdfPath = String(model?.payload?.pdf?.url || "").trim();

  if (!pdfPath) {
    return container("div", {
      attrs: { "data-ui": "content-panel" },
      children: [
        el("div", {
          attrs: { "data-ui": "content-empty" },
          text: "PDF not available."
        })
      ]
    });
  }

  const exists = await pdfExists(pdfPath);
  if (!exists) {
    return null; // ⬅️ IMPORTANT: do NOT create the PDF tab
  }

  const panel = container("div", { attrs: { "data-ui": "pdf-panel" } });
  const frame = el("iframe", {
    attrs: {
      src: pdfPath + "#zoom=75",
      "data-ui": "pdf-frame",
      loading: "lazy",
      title: "Chapter PDF"
    }
  });

  panel.appendChild(frame);
  return panel;
}*/
async function renderPdf(model) {
  const pdfPath = String(model?.payload?.pdf?.url || "").trim();
  const page = Number(model?.payload?.pdf?.page || 1);

  if (!pdfPath) {
    return container("div", {
      attrs: { "data-ui": "content-panel" },
      children: [
        el("div", { attrs: { "data-ui": "content-empty", role: "status" }, text: "PDF not available." })
      ]
    });
  }

  const exists = await pdfExists(pdfPath);
  if (!exists) return null;

  const panel = container("div", {
    attrs: {
      "data-ui": "pdf-panel",
      role: "region",
      "aria-label": "Textbook PDF and Accessible Alternative View",
    },
  });

  // Accessible Controls Toolbar above PDF frame (Phase 8 & 9)
  const controlsBar = container("div", {
    attrs: {
      class: "pdf-accessible-controls",
      role: "toolbar",
      "aria-label": "PDF and Accessible Reading Options",
    },
  });

  // "Read Accessible HTML Version" Button
  const toggleHtmlBtn = button({
    text: "📖 Read Accessible HTML Version",
    attrs: {
      class: "a11y-btn-accent",
      "aria-label": "Read accessible structured HTML text version with formula and diagram support",
    },
  });

  on(toggleHtmlBtn, "click", () => {
    const txtBtn = document.querySelector('[data-ui="content-type-tab"][data-type="txt"]');
    const tsvBtn = document.querySelector('[data-ui="content-type-tab"][data-type="tsv"]');
    if (txtBtn) {
      txtBtn.click();
    } else if (tsvBtn) {
      tsvBtn.click();
    } else {
      renderBody({ bodyRow: panel }, "txt", model);
    }
    announceLive("Switched to accessible text reading mode.");
  });

  // Descriptive PDF Download Link with metadata (Phase 23)
  const filename = pdfPath.split("/").pop() || "chapter.pdf";
  const downloadLink = el("a", {
    attrs: {
      href: pdfPath,
      download: filename,
      class: "a11y-pdf-download-link",
      "aria-label": `Download chapter textbook PDF file: ${filename}`,
    },
    text: `⬇ Download Chapter PDF (${filename})`,
  });

  controlsBar.appendChild(toggleHtmlBtn);
  controlsBar.appendChild(downloadLink);
  panel.appendChild(controlsBar);

  const frame = el("iframe", {
    attrs: {
      src: buildPdfJsSrc(pdfPath, model.payload.pdf.page, 75, appState.themefile),
      "data-ui": "pdf-frame",
      loading: "lazy",
      title: `NCERT Textbook Chapter PDF Viewer - ${filename}`,
      "aria-label": "NCERT Textbook Chapter PDF Viewer",
    },
  });

  panel.appendChild(frame);
  return panel;
}

function renderImageGroup(model) {
  const ig = model?.payload?.imagegroup || { files: [], urls: [] };
  const rawFiles = Array.isArray(ig.files) ? ig.files : [];
  const rawUrls = Array.isArray(ig.urls) ? ig.urls : [];

  const files = [];
  const urls = [];
  for (let i = 0; i < rawFiles.length; i++) {
    const f = String(rawFiles[i] || "").trim();
    const u = String(rawUrls[i] || "").trim();
    if (!f || !u) continue;
    if (!isValidImageFilename(f)) continue;
    files.push(f);
    urls.push(u);
  }

  if (!urls.length) {
    return container("div", {
      attrs: { "data-ui": "content-panel" },
      children: [el("div", { attrs: { "data-ui": "content-empty", role: "status" }, text: "Images not available." })],
    });
  }

  let idx = 0;

  const panel = container("div", {
    attrs: {
      "data-ui": "imagegroup-panel",
      role: "region",
      "aria-label": "Educational diagrams and images gallery",
    },
  });

  const stage = container("div", { attrs: { "data-ui": "imagegroup-stage" } });

  const cleanAlt = files[0].replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

  const img = el("img", {
    attrs: {
      "data-ui": "imagegroup-img",
      alt: `Educational diagram: ${cleanAlt}`,
      loading: "lazy",
      src: urls[0],
    },
  });

  const btnPrev = button({
    attrs: {
      "data-ui": "imagegroup-nav",
      "data-dir": "prev",
      "aria-label": "Previous image",
    },
    text: "‹",
  });
  const btnNext = button({
    attrs: {
      "data-ui": "imagegroup-nav",
      "data-dir": "next",
      "aria-label": "Next image",
    },
    text: "›",
  });

  stage.appendChild(btnPrev);
  stage.appendChild(img);
  stage.appendChild(btnNext);

  const footer = container("div", { attrs: { "data-ui": "imagegroup-footer" } });
  const dots = container("div", {
    attrs: {
      "data-ui": "imagegroup-dots",
      role: "tablist",
      "aria-label": "Select image slide",
    },
  });
  const label = el("div", { attrs: { "data-ui": "imagegroup-label", "aria-live": "polite" }, text: cleanAlt });

  const dotButtons = urls.map((_, i) => {
    const curName = files[i].replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    const b = button({
      attrs: {
        "data-ui": "imagegroup-dot",
        role: "tab",
        "aria-selected": i === 0 ? "true" : "false",
        "aria-label": `Image ${i + 1} of ${urls.length}: ${curName}`,
        tabindex: i === 0 ? "0" : "-1",
      },
      text: "●",
    });
    on(b, "click", () => setIndex(i));
    dots.appendChild(b);
    return b;
  });

  footer.appendChild(dots);
  footer.appendChild(label);

  panel.appendChild(stage);
  panel.appendChild(footer);

  const setIndex = (next) => {
    const n = urls.length;
    if (n <= 0) return;
    idx = ((next % n) + n) % n;

    const curAlt = files[idx].replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    img.setAttribute("src", urls[idx]);
    img.setAttribute("alt", `Educational diagram: ${curAlt}`);
    label.textContent = curAlt;

    dotButtons.forEach((b, i) => {
      const isCur = i === idx;
      b.setAttribute("aria-selected", isCur ? "true" : "false");
      b.setAttribute("tabindex", isCur ? "0" : "-1");
    });

    announceLive(`Displaying image ${idx + 1} of ${n}: ${curAlt}`);
  };

  const step = (delta) => setIndex(idx + delta);

  on(btnPrev, "click", () => step(-1));
  on(btnNext, "click", () => step(1));

  panel.tabIndex = 0;
  panel.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      step(-1);
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      step(1);
    }
  });

  return panel;
}


function renderAnswers(model) {
  const a = model?.payload?.answers?.kind;
  if (a === "images") {
    const ig = model?.payload?.answers || { files: [], urls: [] };
    const rawFiles = Array.isArray(ig.files) ? ig.files : [];
    const rawUrls = Array.isArray(ig.urls) ? ig.urls : [];
    
    // Extra safety: re-validate extensions in UI too (parser already filters)
    const files = [];
    const urls = [];
    for (let i = 0; i < rawFiles.length; i++) {
      const f = String(rawFiles[i] || "").trim();
      const u = String(rawUrls[i] || "").trim();
      if (!f || !u) continue;
      if (!isValidImageFilename(f)) continue;
      files.push(f);
      urls.push(u);
    }

    if (!urls.length) {
      return container("div", {
        attrs: { "data-ui": "content-panel" },
        children: [el("div", { attrs: { "data-ui": "content-empty" }, text: "Images not available." })],
      });
    }

    let idx = 0;

    const panel = container("div", { attrs: { "data-ui": "imagegroup-panel" } });

    const stage = container("div", { attrs: { "data-ui": "imagegroup-stage" } });

    const img = el("img", {
      attrs: { "data-ui": "imagegroup-img", alt: files[0] || "Image", loading: "lazy", src: urls[0] },
    });

    const btnPrev = el("button", {
      attrs: { type: "button", "data-ui": "imagegroup-nav", "data-dir": "prev", title: "Previous" },
      text: "‹",
    });
    const btnNext = el("button", {
      attrs: { type: "button", "data-ui": "imagegroup-nav", "data-dir": "next", title: "Next" },
      text: "›",
    });

    stage.appendChild(btnPrev);
    stage.appendChild(img);
    stage.appendChild(btnNext);

    const footer = container("div", { attrs: { "data-ui": "imagegroup-footer" } });
    const dots = container("div", { attrs: { "data-ui": "imagegroup-dots" } });
    const label = el("div", { attrs: { "data-ui": "imagegroup-label" }, text: files[0] || "" });

    const dotButtons = urls.map((_, i) => {
      const b = el("button", {
        attrs: {
          type: "button",
          "data-ui": "imagegroup-dot",
          "aria-current": i === 0 ? "true" : "false",
          title: files[i] || `Image ${i + 1}`,
        },
        text: "●",
      });
      on(b, "click", () => setIndex(i));
      dots.appendChild(b);
      return b;
    });

    footer.appendChild(dots);
    footer.appendChild(label);

    panel.appendChild(stage);
    panel.appendChild(footer);

    const setIndex = (next) => {
      const n = urls.length;
      if (n <= 0) return;
      idx = ((next % n) + n) % n;

      img.setAttribute("src", urls[idx]);
      img.setAttribute("alt", files[idx] || "Image");
      label.textContent = files[idx] || "";

      dotButtons.forEach((b, i) => b.setAttribute("aria-current", i === idx ? "true" : "false"));
    };

    const step = (delta) => setIndex(idx + delta);

    on(btnPrev, "click", () => step(-1));
    on(btnNext, "click", () => step(1));

    // Keyboard support (when panel focused)
    panel.tabIndex = 0;
    panel.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
      if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
    });

    return panel;
  }
  else if (a === "pdf") {
    const pdfPath = model?.payload?.answers?.pdfUrl;
    if (!pdfPath) {
      return container("div", { attrs: { "data-ui": "content-panel" }, children: [el("div", { attrs: { "data-ui": "content-empty" }, text: "PDF not available." })] });
    }
    const panel = container("div", { attrs: { "data-ui": "pdf-panel" } });
    const frame = el("iframe", { attrs: { src: pdfPath + "#zoom=75", "data-ui": "pdf-frame", loading: "lazy", title: "Chapter PDF" } });
    panel.appendChild(frame);
    return panel;
  }
  return container("div", { attrs: { "data-ui": "content-panel" }, children: [el("div", { attrs: { "data-ui": "content-empty" }, text: "Unable to load data." })] });;
}

function initPeriodicTable(panelEl, refs = {}) {
  const ptable = refs.ptable || panelEl.querySelector("#ptable");
  const legend = refs.legend || panelEl.querySelector("#legend");
  const madGrid = refs.madGrid || panelEl.querySelector("#madGrid");
  const cfgText = refs.cfgText || panelEl.querySelector("#cfgText");
  const nucleus = refs.nucleus || panelEl.querySelector("#nucleus");
  const atom = panelEl.querySelector("#atom");

  if (!ptable || !legend || !madGrid || !atom) return;

  // Build once per mount
  if (panelEl.dataset.ptBuilt === "1") return;
  panelEl.dataset.ptBuilt = "1";

  ptable.replaceChildren();
  legend.replaceChildren();
  madGrid.replaceChildren();

  const elsym = panelEl.querySelector("#selsym");
  const elname = panelEl.querySelector("#selname");
  const elcat = panelEl.querySelector("#selcat");
  const elz = panelEl.querySelector("#selz");
  const elaw = panelEl.querySelector("#selaw");
  const elcategory = panelEl.querySelector("#selcategory");
  const elradio = panelEl.querySelector("#selradioYN");

  // ---------------------------
  // Aufbau/Madelung + exceptions
  // ---------------------------
  const SUBSHELL_CAP = { s: 2, p: 6, d: 10, f: 14 };
  const SUBSHELL_ORDER = { s: 0, p: 1, d: 2, f: 3 };
  const SHELL_LETTER = { 1: "K", 2: "L", 3: "M", 4: "N", 5: "O", 6: "P", 7: "Q" };

  const AUFBAU_ORDER = [
    [1, "s"], [2, "s"], [2, "p"], [3, "s"], [3, "p"],
    [4, "s"], [3, "d"], [4, "p"],
    [5, "s"], [4, "d"], [5, "p"],
    [6, "s"], [4, "f"], [5, "d"], [6, "p"],
    [7, "s"], [5, "f"], [6, "d"], [7, "p"],
  ];

  const NOBLE = { He: 2, Ne: 10, Ar: 18, Kr: 36, Xe: 54, Rn: 86 };

  const EXCEPTIONS = {
    24: "[Ar] 3d5 4s1",                 // Cr
    29: "[Ar] 3d10 4s1",                // Cu
    41: "[Kr] 4d4 5s1",                 // Nb
    42: "[Kr] 4d5 5s1",                 // Mo
    44: "[Kr] 4d7 5s1",                 // Ru
    45: "[Kr] 4d8 5s1",                 // Rh
    46: "[Kr] 4d10",                    // Pd
    47: "[Kr] 4d10 5s1",                // Ag
    57: "[Xe] 5d1 6s2",                 // La
    58: "[Xe] 4f1 5d1 6s2",             // Ce
    64: "[Xe] 4f7 5d1 6s2",             // Gd
    78: "[Xe] 4f14 5d9 6s1",            // Pt
    79: "[Xe] 4f14 5d10 6s1",           // Au
  };

  function parseExceptionCfg(str) {
    const parts = str.trim().split(/\s+/);
    let coreZ = 0;
    let i = 0;
    if (parts[0]?.startsWith("[")) {
      const core = parts[0].slice(1, -1);
      coreZ = NOBLE[core] ?? 0;
      i = 1;
    }
    const orbitals = [];
    for (; i < parts.length; i++) {
      const m = parts[i].match(/^(\d)([spdf])(\d+)$/);
      if (!m) continue;
      orbitals.push({ n: Number(m[1]), l: m[2], e: Number(m[3]) });
    }
    return { coreZ, orbitals };
  }

  function buildAufbauConfig(z) {
    const cfg = [];
    let remaining = z;
    for (const [n, l] of AUFBAU_ORDER) {
      if (remaining <= 0) break;
      const put = Math.min(SUBSHELL_CAP[l], remaining);
      cfg.push({ n, l, e: put });
      remaining -= put;
    }
    return cfg;
  }

  function buildConfigForZ(z) {
    if (!EXCEPTIONS[z]) return buildAufbauConfig(z);

    const { coreZ, orbitals } = parseExceptionCfg(EXCEPTIONS[z]);

    // Fill core via Aufbau
    const cfg = [];
    let remaining = coreZ;
    for (const [n, l] of AUFBAU_ORDER) {
      if (remaining <= 0) break;
      const put = Math.min(SUBSHELL_CAP[l], remaining);
      cfg.push({ n, l, e: put });
      remaining -= put;
    }

    // Merge exception orbitals
    for (const o of orbitals) {
      const hit = cfg.find(x => x.n === o.n && x.l === o.l);
      if (hit) hit.e = o.e;
      else cfg.push({ ...o });
    }

    // keep order consistent for fill animation
    cfg.sort((a, b) => {
      const ai = AUFBAU_ORDER.findIndex(x => x[0] === a.n && x[1] === a.l);
      const bi = AUFBAU_ORDER.findIndex(x => x[0] === b.n && x[1] === b.l);
      return ai - bi;
    });

    return cfg;
  }

  function cfgToText(cfg) {
    return cfg
      .filter(o => o.e > 0)
      .map(o => `${o.n}${o.l} ${o.e}`)
      .join(", ");
  }

  // ---------------------------
  // Atom electrons (rotation delayed until end)
  // ---------------------------
  function shellTotals(cfg) {
    const m = new Map();
    for (const o of cfg) m.set(o.n, (m.get(o.n) || 0) + o.e);
    return m;
  }

  function clearAtomElectrons() {
    atom.querySelectorAll(".orb").forEach(n => n.remove());
  }

  function renderAtomElectrons(cfg, stepCount = null, rotating = false) {
    clearAtomElectrons();

    const totals = shellTotals(cfg);
    const shells = [...totals.keys()].sort((a, b) => a - b);
    if (shells.length === 0) return;

    // limit drawn electrons during fill
    let remaining = (stepCount == null ? Infinity : stepCount);

    // ✅ PRECOMPUTE radii from the actual orbit DOM circles (matches CSS --r)
    const orbitRadiusPxByShell = new Map();
    for (let n = 1; n <= 7; n++) {
      const orbitEl = atom.querySelector(`.orbit.s${n}`);
      if (!orbitEl) continue;

      const cs = getComputedStyle(orbitEl);

      // content-box width is more stable than getBoundingClientRect for our use
      const w = parseFloat(cs.width) || orbitEl.getBoundingClientRect().width || 0;

      // subtract half the border so electron centers sit on the orbit stroke
      const bw = parseFloat(cs.borderTopWidth) || 0;

      if (w > 0) orbitRadiusPxByShell.set(n, (w / 2) - (bw / 2));
    }

    // fallback if something is 0 during first paint
    const atomRect = atom.getBoundingClientRect();
    const fallbackMaxR = Math.min(atomRect.width, atomRect.height) * 0.45;
    const fallbackStep = Math.min(atomRect.width, atomRect.height) * 0.055;

    for (const n of shells) {
      let count = totals.get(n) || 0;

      if (remaining <= 0) count = 0;
      else if (remaining !== Infinity) {
        const use = Math.min(remaining, count);
        remaining -= use;
        count = use;
      }
      if (count <= 0) continue;

      // ✅ radius comes from orbit ring, not custom math
      let radiusPx = orbitRadiusPxByShell.get(n);

      // fallback if orbit not found (or not measurable yet)
      if (!radiusPx || radiusPx <= 0) {
        radiusPx = Math.min(fallbackMaxR, (n - 1) * fallbackStep + (fallbackStep * 0.9));
      }

      const orb = document.createElement("div");
      orb.className = "orb";
      orb.style.left = "50%";
      orb.style.top = "50%";

      if (rotating) {
        const dur = 7 + n * 2.4;
        orb.style.animation = `spinCW ${dur}s linear infinite`;
      } else {
        orb.style.animation = "none";
      }

      for (let i = 0; i < count; i++) {
        const arm = document.createElement("div");
        arm.className = "arm";
        arm.style.transform = `rotate(${(360 / count) * i}deg)`;

        const e = document.createElement("div");
        e.className = "electron";
        e.style.left = "0";
        e.style.top = "0";
        e.style.transform = `translate(-50%,-50%) translateX(${radiusPx}px)`;

        arm.appendChild(e);
        orb.appendChild(arm);
      }

      atom.appendChild(orb);
    }
  }


  // ---------------------------
  // MAD Grid (DOM matches pt.css)
  // ---------------------------
  let fillTimer = null;

  function stopFillTimer() {
    if (fillTimer) clearTimeout(fillTimer);
    fillTimer = null;
  }

  function makeFillSteps(cfg) {
    // one step per electron in AUFBAU order
    const steps = [];
    for (const o of cfg) for (let i = 0; i < o.e; i++) steps.push({ n: o.n, l: o.l });
    return steps;
  }

  function renderMadGrid(cfg, animate = true) {
    stopFillTimer();
    madGrid.replaceChildren();

    // group orbitals by shell n (display order K,L,M,N..)
    const byN = new Map();
    for (const o of cfg) {
      if (o.e <= 0) continue;
      if (!byN.has(o.n)) byN.set(o.n, []);
      byN.get(o.n).push({ ...o });
    }
    const ns = [...byN.keys()].sort((a, b) => a - b);

    // Build rows in the structure pt.css expects:
    // countcell | ncell | rowSubs (contains .cell pills)
    const pillByKey = new Map();       // "3d" -> element
    const targetCountByKey = new Map();// "3d" -> final electron count
    const shellCountCell = new Map();  // n -> countcell

    for (const n of ns) {
      const subs = byN.get(n).slice().sort((a, b) => SUBSHELL_ORDER[a.l] - SUBSHELL_ORDER[b.l]);

      const totalFinal = subs.reduce((s, x) => s + x.e, 0);

      const cc = document.createElement("div");
      cc.className = "countcell";
      cc.textContent = animate ? "0" : String(totalFinal);
      shellCountCell.set(n, cc);

      const nc = document.createElement("div");
      nc.className = "ncell";
      nc.textContent = `${SHELL_LETTER[n] || "?"} (${n})`;

      const rs = document.createElement("div");
      rs.className = "rowSubs";

      for (const s of subs) {
        const key = `${s.n}${s.l}`;
        targetCountByKey.set(key, s.e);

        const cell = document.createElement("span");
        cell.className = "cell is-empty"; // start hidden
        cell.textContent = `${s.n}${s.l}`; // show label only when revealed
        cell.dataset.n = String(s.n);
        cell.dataset.l = s.l;

        if (!animate) {
          // If animation is OFF, show it immediately
          cell.classList.remove("is-empty");
          cell.textContent = `${s.n}${s.l} ${s.e}`;
          cell.classList.add("filled");
        }

        rs.appendChild(cell);

        pillByKey.set(key, cell);

        if (!animate) cell.classList.add("filled");
      }

      madGrid.appendChild(cc);
      madGrid.appendChild(nc);
      madGrid.appendChild(rs);
    }

    if (!animate) {
      // fully filled + start rotation
      renderAtomElectrons(cfg, null, true);
      return;
    }

    const steps = makeFillSteps(cfg);

    // current filled counts
    const filledKey = new Map(); // "3d" -> current count
    const filledShell = new Map(); // n -> current shell total

  function setPillText(key) {
    const pill = pillByKey.get(key);
    if (!pill) return;

    const cur = filledKey.get(key) || 0;
    const n = pill.dataset.n;
    const l = pill.dataset.l;

    // reveal only when it starts filling
    if (cur > 0) pill.classList.remove("is-empty");
    else pill.classList.add("is-empty");

    pill.textContent = cur > 0 ? `${n}${l} ${cur}` : `${n}${l}`;

    const target = targetCountByKey.get(key) || 0;
    if (cur >= target && target > 0) pill.classList.add("filled");
    else pill.classList.remove("filled");
  }



    function setShellCount(n) {
      const cc = shellCountCell.get(n);
      if (!cc) return;
      cc.textContent = String(filledShell.get(n) || 0);
    }

    function pulse(pill) {
      if (!pill) return;
      pill.classList.add("active");
      setTimeout(() => pill.classList.remove("active"), 250);
    }

    // during fill: show electrons placed but NOT rotating
    renderAtomElectrons(cfg, 0, false);

    function tick(i) {
      if (i >= steps.length) {
        // done -> start rotation
        renderAtomElectrons(cfg, null, true);
        return;
      }

      const { n, l } = steps[i];
      const key = `${n}${l}`;

      filledKey.set(key, (filledKey.get(key) || 0) + 1);
      filledShell.set(n, (filledShell.get(n) || 0) + 1);

      setPillText(key);
      setShellCount(n);

      const pill = pillByKey.get(key);
      pulse(pill);

      // show partial electrons, no rotation yet
      renderAtomElectrons(cfg, i + 1, false);

      fillTimer = setTimeout(() => tick(i + 1), 500); // 1s gap
    }

    // init display to zero
    for (const [key] of pillByKey) setPillText(key);
    for (const [n] of shellCountCell) setShellCount(n);

    tick(0);
  }

  // ---------------------------
  // UI + table building
  // ---------------------------
  function contrastText(hex) {
    try {
      const c = hex.replace("#", "");
      const r = parseInt(c.slice(0, 2), 16);
      const g = parseInt(c.slice(2, 4), 16);
      const b = parseInt(c.slice(4, 6), 16);
      const L = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return L > 0.62 ? "#111" : "#fff";
    } catch {
      return "#fff";
    }
  }

  function makeTile(el) {
    const col = CATEGORY_COLORS[el.c] || CATEGORY_COLORS.unknown;
    const t = contrastText(col);

    const tile = document.createElement("div");
    tile.className = "tile";
    tile.style.gridColumn = String(el.g);
    tile.style.gridRow = String(el.p);
    tile.style.background = col;
    tile.style.color = t;

    const aw = ATOMIC_WEIGHT[el.z];
    const awRound = aw != null && !Number.isNaN(aw) ? Math.round(aw) : null;

    tile.innerHTML = `
      ${awRound !== null ? `<div class="awTop">${awRound}</div>` : ""}
      ${isRadioactiveZ(el.z) ? `<span class="radDot" aria-hidden="true"></span>` : ""}
      <div class="z">${el.z}</div>
      <div class="sym">${el.s}</div>
      <div class="name">${el.n}</div>
    `;

    tile.addEventListener("click", () => selectElement(el, tile));
    return tile;
  }

  let activeTile = null;
  function setActiveTile(tile) {
    if (activeTile) activeTile.classList.remove("active");
    activeTile = tile;
    if (activeTile) activeTile.classList.add("active");
  }

  function selectElement(el, tile) {
    if (tile) setActiveTile(tile);

    const col = CATEGORY_COLORS[el.c] || CATEGORY_COLORS.unknown;
    const t = contrastText(col);

    if (elsym) { elsym.textContent = el.s; elsym.style.background = col; elsym.style.color = t; }
    if (elname) elname.textContent = el.n;
    if (elcat) elcat.textContent = el.c;
    if (elz) elz.textContent = String(el.z);
    if (elcategory) elcategory.textContent = el.c;

    const aw = ATOMIC_WEIGHT[el.z];
    if (elaw) elaw.textContent = aw != null ? String(Math.round(aw)) : "—";
    if (elradio) elradio.textContent = isRadioactiveZ(el.z) ? "Yes" : "No";
    if (nucleus) nucleus.textContent = String(el.z);

    const cfg = buildConfigForZ(el.z);
    if (cfgText) cfgText.textContent = `Configuration: ${cfgToText(cfg) || "—"}`;

    renderMadGrid(cfg, true);
  }

  // main table
  ELEMENTS.forEach((e) => {
    const t = makeTile(e);
    ptable.appendChild(t);
    if (e.z === 26) selectElement(e, t); // default Fe
  });

  // series stubs
  function makeSeriesStub(label, row) {
    const d = document.createElement("div");
    d.className = "tile";
    d.style.gridColumn = "3";
    d.style.gridRow = String(row);
    d.style.background = "rgba(255,255,255,0.06)";
    d.style.color = "var(--text-0)";
    d.style.border = "1px dashed rgba(255,255,255,0.25)";
    d.innerHTML = `<div class="sym" style="font-size:12px">${label}</div><div class="name">see below</div>`;
    return d;
  }
  ptable.appendChild(makeSeriesStub("La–Lu", 6));
  ptable.appendChild(makeSeriesStub("Ac–Lr", 7));

  function addSeriesRow(arr, row) {
    arr.forEach((e, i) => {
      const tile = makeTile({ ...e, p: row, g: 4 + i });
      ptable.appendChild(tile);
    });
  }
  addSeriesRow(LANTH, 8);
  addSeriesRow(ACTIN, 9);

  // legend
  const LEG = [
    "alkali metal", "alkaline earth metal", "transition metal", "post-transition metal",
    "metalloid", "polyatomic nonmetal", "diatomic nonmetal", "halogen",
    "noble gas", "lanthanoid", "actinoid", "unknown",
  ];

  LEG.forEach((k) => {
    const d = document.createElement("div");
    d.className = "lg";
    const col = CATEGORY_COLORS[k] || CATEGORY_COLORS.unknown;
    d.innerHTML = `<span class="color" style="background:${col}"></span><span>${k}</span>`;
    legend.appendChild(d);
  });
}

function renderPeriodicTablePanel() {
  const panel = container("div", {
    className: "pt-scale90",
    attrs: { "data-ui": "pt-panel" },
  });

  const app = container("div", {
    className: "pt-app",
    attrs: { "data-ui": "pt-app" },
  });

  const leftHeader = container("div", {
    className: "pt-lefthead",
    children: [
      el("h1", { className: "pt-title", text: "Periodic Table" }),
      el("div", { className: "pt-sub", text: "Click an element to update the panel" }),
    ],
  });

  const ptable = container("div", {
    id: "ptable",
    className: "ptable",
    attrs: { "aria-label": "Periodic table" },
  });

  const legend = container("div", { id: "legend", className: "legend" });

  const left = container("section", {
    className: "card pt-left",
    attrs: { "data-ui": "pt-left" },
    children: [leftHeader, ptable, legend],
  });

  const selSym = container("div", { id: "selsym", className: "pill pt-selsym", text: "H" });

  const selInfo = container("div", {
    className: "pt-selinfo",
    children: [
      container("div", { id: "selname", className: "pt-selname", text: "Hydrogen" }),
      container("div", { id: "selcat", className: "pt-sub", text: "diatomic nonmetal" }),
    ],
  });

  const selHdr = container("div", { className: "selhdr", children: [selSym, selInfo] });

  const details = container("div", {
    className: "details",
    children: [
      detailRow("Atomic Number", "selz", "1"),
      detailRow("Atomic Weight", "selaw", "1"),
      detailRow("Category", "selcategory", "—"),
      detailRow("Radioactive", "selradioYN", "No"),
    ],
  });

  const sel = container("div", { className: "sel", children: [selHdr, details] });

  const gridHdr = container("div", {
    className: "hdr",
    children: [
      container("div", { text: "Electron" }),
      container("div", { text: "Shell" }),
      container("div", { text: "Subshells" }),
    ],
  });

  const madGrid = container("div", { id: "madGrid", className: "grid" });

  const gridWrap = container("div", { className: "gridwrap", children: [gridHdr, madGrid] });

  const atomRow = container("div", { className: "atomrow", children: [container("div", { text: "Atom view" })] });

  const nucleus = container("div", { id: "nucleus", className: "nucleus", text: "Z" });

  const atom = container("div", {
    id: "atom",
    className: "atom",
    children: [
      container("div", { className: "orbit s7" }),
      container("div", { className: "orbit s6" }),
      container("div", { className: "orbit s5" }),
      container("div", { className: "orbit s4" }),
      container("div", { className: "orbit s3" }),
      container("div", { className: "orbit s2" }),
      container("div", { className: "orbit s1" }),
      nucleus,
    ],
  });

  const cfgText = container("div", { id: "cfgText", className: "pt-sub cfgfoot", text: "Configuration: —" });

  const atomWrap = container("div", { className: "atomwrap", children: [atomRow, atom, cfgText] });

  const right = container("section", {
    className: "card right",
    attrs: { "data-ui": "pt-right" },
    children: [sel, gridWrap, atomWrap],
  });

  app.appendChild(left);
  app.appendChild(right);
  panel.appendChild(app);

  const refs = { ptable, legend, selSym, madGrid, nucleus, cfgText, atom };

  // ✅ init once
  if (!panel.dataset.ptInit) {
    panel.dataset.ptInit = "1";
    queueMicrotask(() => initPeriodicTable(panel, refs));
  }

  return { panel, refs };
}

function renderJSON(model) {
  console.log(model);
  const root = container("div", { attrs: { "data-ui": "flowchart-panel" } });

  const status = el("div", { attrs: { "data-ui": "flowchart-status" }, text: "" });
  root.appendChild(status);

  const fc = model?.payload?.flowchart || {};
  const charts = Array.isArray(fc.charts) ? fc.charts : [];
  console.log("flowchart charts:", charts);
  // Back-compat: if old single-file exists, convert to charts[]
  if (!charts.length) {
    const file = String(fc.file || "").trim();
    if (file) charts.push({ file, title: String(fc.title || fc.Title || "").trim() });
  }

  if (!charts.length) {
    status.textContent = "Flowchart JSON not available (missing flowchart charts/files).";
    return root;
  }

  status.textContent = "";

  // helper
  const looksLikePath = (file) =>
    /[\\/]/.test(file) || /^https?:\/\//i.test(file) || String(file).startsWith("data/");

  const toJsonPath = (file) =>
    looksLikePath(file) ? file : `data/json/${encodeURIComponent(file)}`;

  const isFlowchartJSON = (raw) => raw && Array.isArray(raw.nodes) && Array.isArray(raw.edges);

  // ---- you already have these inside renderJSON; keep them as-is ----
  // getNodeSize, dagreLayout, mountReactFlow (but modify mountReactFlow to accept a mount element)
  // ---------------------------------------------------------------
  function getNodeSize(n) {
    const t = String(n?.type || "");
    if (t === "decisionNode") return { w: 180, h: 180 };
    if (t === "startNode" || t === "endNode") return { w: 140, h: 75 };
    return { w: 220, h: 80 };
  }
  function dagreLayout(nodes, edges, dir) {
    const dagre = window.dagre;
    if (!dagre?.graphlib) return nodes;

    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));

    const rankdir = String(dir || "LR").toUpperCase();
    g.setGraph({
      rankdir,
      nodesep: 70,
      ranksep: 110,
      marginx: 20,
      marginy: 20,
    });

    // register nodes with sizes
    nodes.forEach((n) => {
      const { w, h } = getNodeSize(n);
      g.setNode(n.id, { width: w, height: h });
    });

    // register edges
    edges.forEach((e) => {
      if (e?.source && e?.target) g.setEdge(e.source, e.target);
    });

    dagre.layout(g);
    //console.log(rankdir);
    const isLR = rankdir === "LR" || rankdir === "RL";
    const isTB = rankdir === "TB" || rankdir === "BT";

    return nodes.map((n) => {
      const pos = g.node(n.id);
      if (!pos) return n;

      const { w, h } = getNodeSize(n);

      return {
        ...n,
        position: { x: pos.x - w / 2, y: pos.y - h / 2 },

        // 🔁 FLIP for TB
        sourcePosition: isLR ? "right" : isTB ? "bottom" : "top",
        targetPosition: isLR ? "left"  : isTB ? "top"    : "bottom",
      };
    });

  }

  const mountReactFlow = (raw, mountEl) => {
    // Same as your existing mountReactFlow(raw),
    // but replace every usage of `mount` with `mountEl`
    // and mount ReactFlow into mountEl instead of the single global mount.
    const React = window.React;
    const ReactDOM = window.ReactDOM;
    const RF = window.ReactFlow;

    if (!React || !ReactDOM || !RF) {
      mountEl.textContent = "Missing React/ReactDOM/ReactFlow imports.";
      return;
    }
    console.log("mountReactFlow", raw, mountEl);
    
    const { ReactFlow, Controls, MiniMap, Handle, Position, MarkerType } = RF;

    const baseBox = {
      background: "rgba(255,255,255,0.96)",
      color: "#0b1220",
      border: "1px solid rgba(0,0,0,0.22)",
      boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
      fontSize: 13,
      fontWeight: 700,
      lineHeight: 1.15,
      textAlign: "center",
      userSelect: "none",
    };

    const handleStyle = {
      width: 10,
      height: 10,
      borderRadius: 3,
      background: "#64748b",
      border: "1px solid rgba(255,255,255,0.7)",
    };

    const StartNode = ({ data, sourcePosition, targetPosition }) =>
      React.createElement(
        "div",
        { style: { ...baseBox, padding: "8px 14px", borderRadius: 999, minWidth: 95, fontWeight: 800 } },
        React.createElement(Handle, { type: "target", position: targetPosition }),
        React.createElement("div", null, data?.label || ""),
        React.createElement(Handle, { type: "source", position: sourcePosition })
      );

    const EndNode = ({ data, sourcePosition, targetPosition }) =>
      React.createElement(
        "div",
        { style: { ...baseBox, padding: "8px 14px", borderRadius: 999, minWidth: 95, fontWeight: 800 } },
        React.createElement(Handle, { type: "target", position: targetPosition }),
        React.createElement("div", null, data?.label || ""),
        React.createElement(Handle, { type: "source", position: sourcePosition })
      );

      const ProcessNode = ({ data, sourcePosition, targetPosition }) =>
        React.createElement(
          "div",
          { style: { ...baseBox, padding: "10px 12px", borderRadius: 12, minWidth: 160, maxWidth: 240, wordBreak: "break-word" } },
          React.createElement(Handle, { type: "target", position: targetPosition }),
          React.createElement("div", null, data?.label || ""),
          React.createElement(Handle, { type: "source", position: sourcePosition })
        );

      const DecisionNode = ({ data, sourcePosition, targetPosition }) => {
        const SIZE = 180;
        return React.createElement(
          "div",
          { style: { width: SIZE, height: SIZE, position: "relative" } },
          React.createElement(Handle, { type: "target", position: targetPosition }),
          React.createElement(
            "div",
            { style: { width: "100%", height: "100%", transform: "rotate(45deg)", ...baseBox, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center" } },
            React.createElement(
              "div",
              { style: { transform: "rotate(-45deg)", padding: "0 16px", maxWidth: SIZE - 40, wordBreak: "break-word" } },
              data?.label || ""
            )
          ),
          React.createElement(Handle, { type: "source", position: sourcePosition })
        );
      };
    const nodeTypes = {
      startNode: StartNode,
      endNode: EndNode,
      decisionNode: DecisionNode,
      processNode: ProcessNode,
      default: ProcessNode,
    };

    let nodes = (raw.nodes || []).map((n) => ({
      id: String(n.id),
      type: n.type || "default",
      data: n.data || { label: n.label || n.id },
      position: n.position || { x: 0, y: 0 },
    }));

    let edges = (raw.edges || []).map((e, i) => ({
      id: String(e.id || `e-${i}`),
      source: String(e.source),
      target: String(e.target),
      label: e.label || "",
      type: "smoothstep",
      markerEnd: MarkerType ? { type: MarkerType.ArrowClosed } : undefined,
      style: { strokeWidth: 2 },
      labelStyle: { fontSize: 12, fontWeight: 700, fill: "#0b1220" },
      labelBgStyle: { fill: "rgba(255,255,255,0.85)" },
      labelBgPadding: [8, 4],
      labelBgBorderRadius: 8,
    }));

    nodes = dagreLayout(nodes, edges, raw.layout || "LR");

    const fitViewOptions = { padding: 0.06, maxZoom: 1.35 };

    const Flow = () =>
      React.createElement(
        "div",
        { style: { width: "100%", height: "100%", background: "transparent" } },
        React.createElement(
          ReactFlow,
          {
            nodes,
            edges,
            nodeTypes,
            fitView: true,
            fitViewOptions,
            minZoom: 0.25,
            maxZoom: 2,
            nodesDraggable: true,
            nodesConnectable: false,
            proOptions: { hideAttribution: true },
          },
          //Controls ? React.createElement(Controls, { position: "bottom-left" }) : null,
          //MiniMap ? React.createElement(MiniMap, { position: "bottom-right" }) : null
        )
      );

    if (ReactDOM.createRoot) {
      ReactDOM.createRoot(mountEl).render(React.createElement(Flow));
    } else {
      ReactDOM.render(React.createElement(Flow), mountEl);
    }
  };

  // Render each chart in its own block
  charts.forEach((c, idx) => {
    const block = container("div", { attrs: { "data-ui": "flowchart-block" } });

    const title = String(c?.title || "").trim();
    if (title) {
      block.appendChild(el("div", { attrs: { "data-ui": "flowchart-title" }, text: title }));
    } else {
      block.appendChild(el("div", { attrs: { "data-ui": "flowchart-title" }, text: `Flowchart ${idx + 1}` }));
    }

    const scroller = container("div", { attrs: { "data-ui": "flowchart-scroll" } });

    const mount = document.createElement("div");
    mount.className = "flowchart-container";
    mount.style.width = "100%";
    mount.style.height = "100%";
    mount.style.background = "transparent";

    scroller.appendChild(mount);
    block.appendChild(scroller);
    root.appendChild(block);

    const file = String(c?.file || "").trim();
    const jsonPath = toJsonPath(file);
    console.log(`Loading flowchart JSON from: ${jsonPath}`);
    // load + mount
    fetch(jsonPath, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status} for ${jsonPath}`);
        return r.json();
      })
      .then((raw) => {
        if (!isFlowchartJSON(raw)) {
          mount.textContent = JSON.stringify(raw, null, 2);
          mount.style.whiteSpace = "pre";
          mount.style.overflow = "auto";
          return;
        }
        mountReactFlow(raw, mount);
      })
      .catch((err) => {
        mount.textContent = "Failed to load: " + (err?.message || err);
      });
  });

  return root;
}

async function loadsanskrit() {
  const root = container("div", { attrs: { className: "shabd-roop" } });

  let data;
  try {
    const response = await fetch("data/json/shabdroop.json", { cache: "no-store" });
    if (!response.ok) {
      root.textContent = `unable to fetch shabdroop.json (HTTP ${response.status})`;
      return root;
    }
    data = await response.json();
  } catch (err) {
    console.error("Fetch/JSON error:", err);
    root.textContent = "unable to fetch shabdroop.json";
    return root;
  }

  root.innerHTML = `
    <div class="sanskrit-filters">
      <div class="sanskrit-dd-wrap">
        <label for="filter-ending" class="sanskrit-label">शब्दरूप :</label>
        <div class="filter-ending" data-dd="filter-ending">
          <button type="button" class="sanskrit-select dd-btn" aria-haspopup="listbox" aria-expanded="false">
            <span class="dd-label"></span>
            <span class="dd-caret">▾</span>
          </button>
          <ul class="dd-menu" role="listbox" tabindex="-1"></ul>
          <select id="filter-ending" class="sanskrit-select dd-native" aria-hidden="true" tabindex="-1"></select>
        </div>
      </div>

      <div class="sanskrit-dd-wrap">
        <label for="filter-subtype" class="sanskrit-label">प्रकार :</label>
        <div class="filter-subtype" data-dd="filter-subtype">
          <button type="button" class="sanskrit-select dd-btn" aria-haspopup="listbox" aria-expanded="false">
            <span class="dd-label"></span>
            <span class="dd-caret">▾</span>
          </button>
          <ul class="dd-menu" role="listbox" tabindex="-1"></ul>
          <select id="filter-subtype" class="sanskrit-select dd-native" aria-hidden="true" tabindex="-1"></select>
        </div>
      </div>

      <div class="sanskrit-dd-wrap">
        <label for="filter-gender" class="sanskrit-label">लिङ्ग :</label>
        <div class="filter-gender" data-dd="filter-gender">
          <button type="button" class="sanskrit-select dd-btn" aria-haspopup="listbox" aria-expanded="false">
            <span class="dd-label"></span>
            <span class="dd-caret">▾</span>
          </button>
          <ul class="dd-menu" role="listbox" tabindex="-1"></ul>
          <select id="filter-gender" class="sanskrit-select dd-native" aria-hidden="true" tabindex="-1"></select>
        </div>
      </div>

      <div class="sanskrit-dd-wrap">
        <label for="filter-word" class="sanskrit-label">शब्द चुनिए :</label>
        <div class="filter-word" data-dd="filter-word">
          <button type="button" class="sanskrit-select dd-btn" aria-haspopup="listbox" aria-expanded="false">
            <span class="dd-label"></span>
            <span class="dd-caret">▾</span>
          </button>
          <ul class="dd-menu" role="listbox" tabindex="-1"></ul>
          <select id="filter-word" class="sanskrit-select dd-native" aria-hidden="true" tabindex="-1"></select>
        </div>
      </div>
    </div>

    <div id="word-info" class="sanskrit-info-row"></div>

    <div id="table-wrap" class="sanskrit-table-wrapper">
      <table id="study-table" class="sanskrit-table">
        <thead>
          <tr>
            <th class="sanskrit-th">विभक्ति</th>
            <th class="sanskrit-th">एकवचन</th>
            <th class="sanskrit-th">द्विवचन</th>
            <th class="sanskrit-th">बहुवचन</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>

    <div class="sanskrit-small-note">
      सभी शब्द "शब्द चुनिए" सूची से चुनकर देखे जा सकते हैं।
      प्रत्येक शब्द का शब्दरूप उसके वर्ग के पैटर्न पर आधारित है।
    </div>
  `;

  initializeShadbroopTable(data, root);
  return root;
}

function renderSpellTest(model) {
  const allWords = Array.isArray(model?.payload?.spell?.words) ? model.payload.spell.words : [];
  const langHint = inferSpellLang(model); // "en-IN" or "hi-IN"

  const root = container("div", { attrs: { "data-ui": "spell-panel" } });
  const card = container("div", { attrs: { "data-ui": "spell-card" } });

  // Header
  const header = container("div", { attrs: { style: "margin-bottom:12px;" } });
  header.appendChild(el("div", { attrs: { style: "font-size:20px;font-weight:700;" }, text: "Spell Test" }));
  header.appendChild(el("div", { attrs: { style: "opacity:.85;margin-top:4px;" }, text: "Listen carefully. Spelling is hidden until you finish 10 words." }));
  card.appendChild(header);

  // Status / voice
  const statusLine = el("div", { attrs: { "data-ui": "spell-status" }, text: "" });
  const voiceLine = el("div", { attrs: { "data-ui": "spell-voice" }, text: "" });
  card.appendChild(statusLine);
  card.appendChild(voiceLine);

  // Row 1: New/Restart + Speed
  const row1 = container("div", { attrs: { "data-ui": "spell-actions" } });

  const btnNew = el("button", { text: "New set of 10", attrs: { "data-ui": "spell-btn" } });
  const btnRestart = el("button", { text: "Restart same 10", attrs: { "data-ui": "spell-btn" } });
  btnRestart.disabled = true;

  const speedWrap = container("div", { attrs: { "data-ui": "spell-speed" } });
  const speedLabel = el("label", { text: "Speed:" });
  const speed = el("input", { attrs: { type: "range", min: "0.35", max: "0.85", step: "0.05", value: "0.50" } });

  speedWrap.appendChild(speedLabel);
  speedWrap.appendChild(speed);

  row1.appendChild(btnNew);
  row1.appendChild(btnRestart);
  row1.appendChild(speedWrap);
  card.appendChild(row1);

  // Row 2: Prev/Repeat/Next
  const row2 = container("div", { attrs: { "data-ui": "spell-nav" } });
  const btnPrev = el("button", { text: "◀ Previous", attrs: { "data-ui": "spell-btn" } }); btnPrev.disabled = true;
  const btnRepeat = el("button", { text: "🔁 Repeat", attrs: { "data-ui": "spell-btn" } }); btnRepeat.disabled = true;
  const btnNext = el("button", { text: "Next ▶", attrs: { "data-ui": "spell-btn" } }); btnNext.disabled = true;

  row2.appendChild(btnPrev);
  row2.appendChild(btnRepeat);
  row2.appendChild(btnNext);
  card.appendChild(row2);

  // Row 3: Answers
  const row3 = container("div", { attrs: { "data-ui": "spell-footer" } });
  const btnAnswers = el("button", { text: "✅ Show Answers", attrs: { "data-ui": "spell-btn" } }); btnAnswers.disabled = true;
  row3.appendChild(btnAnswers);
  card.appendChild(row3);

  // Answers panel
  const answersPanel = container("div", { attrs: { "data-ui": "spell-answers", style: "display:none;" } });
  const answersTitle = el("div", { attrs: { style: "font-weight:700;margin-bottom:8px;" }, text: "Answers" });
  const answersList = el("ol", { attrs: { style: "margin:0;padding-left:18px;" } });
  answersPanel.appendChild(answersTitle);
  answersPanel.appendChild(answersList);
  card.appendChild(answersPanel);

  root.appendChild(card);

  // ---------------- state ----------------
  let sessionWords = [];
  let idx = -1;
  let spoken = [];

  function setStatus(msg) { statusLine.textContent = msg; }
  function setVoice(msg) { voiceLine.textContent = msg; }

  function hideAnswers() {
    answersPanel.style.display = "none";
    answersList.replaceChildren();
    btnAnswers.textContent = "✅ Show Answers";
  }

  function showAnswers() {
    answersList.replaceChildren();
    for (const w of sessionWords) answersList.appendChild(el("li", { text: w }));
    answersPanel.style.display = "block";
    btnAnswers.textContent = "🙈 Hide Answers";
  }

  function toggleAnswers() {
    if (answersPanel.style.display === "none") showAnswers();
    else hideAnswers();
  }

  function updateButtons() {
    const has = sessionWords.length === 10 && idx >= 0;
    btnPrev.disabled = !(has && idx > 0);
    btnRepeat.disabled = !has;
    btnNext.disabled = !(has && idx < 9);
    btnRestart.disabled = !has;
  }

  function updateCountLine() {
    if (idx < 0) {
      setStatus(allWords.length ? "Press “New set of 10” to start." : "No spell words available for this chapter.");
      return;
    }
    setStatus(`Word ${idx + 1} of 10 — listening mode`);
  }

  function pick10(list) {
    const uniq = [...new Set(list.map(x => String(x).trim()).filter(Boolean))];
    for (let i = uniq.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [uniq[i], uniq[j]] = [uniq[j], uniq[i]];
    }
    return uniq.slice(0, 10);
  }

  function detectVoiceFor(langCode) {
    const voices = window.speechSynthesis?.getVoices?.() || [];
    const want = langCode.startsWith("hi") ? ["hi-IN", "hi"] : ["en-IN", "en-US", "en-GB", "en"];
    for (const pref of want) {
      const v = voices.find(x => (x.lang || "").toLowerCase().startsWith(pref.toLowerCase()));
      if (v) return v;
    }
    return null;
  }

  function speak(word) {
    if (!("speechSynthesis" in window)) {
      setStatus("Speech is not supported in this browser.");
      return;
    }
    window.speechSynthesis.cancel();

    const u = new SpeechSynthesisUtterance(word);
    u.lang = langHint;

    const r = parseFloat(speed.value);
    u.rate = (Number.isFinite(r) ? Math.min(1, Math.max(0.1, r)) : 0.5);

    u.pitch = 1.0;
    u.volume = 1.0;

    const v = detectVoiceFor(langHint);
    if (v) u.voice = v;

    const vName = v ? `${v.name} (${v.lang})` : "Default voice";
    setVoice(`Voice: ${vName} • Language: ${u.lang} • Speed: ${u.rate.toFixed(1)}x`);

    u.onend = () => {
      if (idx >= 0) {
        spoken[idx] = true;
        if (idx === 9) {
          btnAnswers.disabled = false;
          setStatus("Completed 10/10 — click “Show Answers”.");
        }
        updateButtons();
      }
    };

    window.speechSynthesis.speak(u);
  }

  async function ensureVoicesLoaded() {
    await new Promise(resolve => {
      const s = window.speechSynthesis;
      if (!s) return resolve();
      let tries = 0;
      const tick = () => {
        tries += 1;
        const vs = s.getVoices();
        if ((vs && vs.length) || tries > 15) return resolve();
        setTimeout(tick, 100);
      };
      tick();
    });
  }

  async function startNew() {
    hideAnswers();
    btnAnswers.disabled = true;

    if (!allWords || allWords.length < 10) {
      setStatus("Not enough spell words for this chapter (need at least 10).");
      return;
    }

    await ensureVoicesLoaded();

    sessionWords = pick10(allWords);
    idx = 0;
    spoken = Array(10).fill(false);
    updateButtons();
    updateCountLine();
    speak(sessionWords[idx]);
  }

  function restartSame() {
    if (sessionWords.length !== 10) return;
    window.speechSynthesis.cancel();

    hideAnswers();
    btnAnswers.disabled = true;

    idx = 0;
    spoken = Array(10).fill(false);
    updateButtons();
    updateCountLine();
    speak(sessionWords[idx]);
  }

  function prev() {
    if (idx <= 0) return;
    hideAnswers();
    idx -= 1;
    updateButtons();
    updateCountLine();
    speak(sessionWords[idx]);
  }

  function next() {
    if (idx < 0 || idx >= 9) return;
    hideAnswers();
    idx += 1;
    updateButtons();
    updateCountLine();
    speak(sessionWords[idx]);
  }

  function repeat() {
    if (idx < 0) return;
    speak(sessionWords[idx]);
  }

  // Speed control should apply immediately
  speed.addEventListener("input", () => {
    if (idx >= 0 && sessionWords.length) speak(sessionWords[idx]);
    else voiceLine.textContent = `Speed: ${parseFloat(speed.value).toFixed(2)}x`;
  });

  // events
  btnNew.addEventListener("click", startNew);
  btnRestart.addEventListener("click", restartSame);
  btnPrev.addEventListener("click", prev);
  btnNext.addEventListener("click", next);
  btnRepeat.addEventListener("click", repeat);
  btnAnswers.addEventListener("click", toggleAnswers);

  // initial
  updateButtons();
  updateCountLine();

  return root;
}

function inferSpellLang(model) {
  // If you have a real language flag somewhere, use it.
  // Quick heuristic: if chapterTitle has Devanagari => hi
  const title = String(model?.meta?.chapterTitle || model?.ids?.chapterID || "");
  const hasDev = /[\u0900-\u097F]/.test(title);
  return hasDev ? "hi-IN" : "en-IN";
}

function loadDhatuRoop() {
  return Promise.resolve((() => {
    const wrapper = document.createElement("div");
    wrapper.className = "lakar-wrapper";

    const selection = document.createElement("div");
    selection.className = "lakar-selection";

    const lakars = [
      "लट् लकार",
      "लङ् लकार",
      "लिट् लकार",
      "लुट् लकार",
      "लृट् लकार",
      "लोट् लकार",
      "लिङ् लकार",
      "लुङ् लकार",
      "लृङ् लकार",
    ];

    const upavargas = ["परस्मैपदी", "आत्मनेपदी", "उभयपदी"];

    const COMMON_DHATUS = ["भू", "गम्", "पठ्", "कृ", "दा"];

    const dhatuMap = {};
    lakars.forEach((lakar) => {
      dhatuMap[lakar] = COMMON_DHATUS;
    });

    // suffix patterns for each lakar + upavarga (used to fill the 3x3 cells)
    const SUFFIX_PATTERNS = {
"लट् लकार": {
  "परस्मैपदी": {
    r2: ["ति", "तः", "न्ति"],
    r3: ["सि", "थः", "थ"],
    r4: ["मि", "वः", "मः"]
  },

  // ✅ Correct आत्मनेपदी for भू → भूयते, भूयसे, भूये …
  "आत्मनेपदी": {
    baseOverride: "भू",   // IMPORTANT
    r2: ["यते", "येते", "यन्ते"],
    r3: ["यसे", "येथे", "यध्वे"],
    r4: ["ये", "यावहे", "यामहे"]
  },

  "उभयपदी": {
    r2: ["ति", "तः", "न्ति"],
    r3: ["सि", "थः", "थ"],
    r4: ["मि", "वः", "मः"]
  }
},

      "लङ् लकार": {
        "परस्मैपदी": { r2: ["त्", "ताम्", "न्"], r3: ["ः", "तम्", "त"], r4: ["म्", "व", "म"] },
        "आत्मनेपदी": { r2: ["त", "आताम्", "न्त"], r3: ["थाः", "आथाम्", "ध्वम्"], r4: ["इ", "वहि", "महि"] },
        "उभयपदी":   { r2: ["त्", "ताम्", "न्"], r3: ["ः", "तम्", "त"], r4: ["म्", "व", "म"] },
      },
      "लिट् लकार": {
        "परस्मैपदी": { r2: ["आ", "अतुः", "उः"], r3: ["थ", "अथुः", "अ"], r4: ["आ", "व", "म"] },
        "आत्मनेपदी": { r2: ["ए", "आते", "इरे"], r3: ["से", "आथे", "ध्वे"], r4: ["ए", "वहे", "महे"] },
        "उभयपदी":   { r2: ["आ", "अतुः", "उः"], r3: ["थ", "अथुः", "अ"], r4: ["आ", "व", "म"] },
      },
      "लुट् लकार": {
        "परस्मैपदी": { r2: ["ता", "तारौ", "तारः"], r3: ["तासि", "तास्थः", "तास्थ"], r4: ["तास्मि", "तास्वः", "तास्मः"] },
        "आत्मनेपदी": { r2: ["ता", "तारौ", "तारः"], r3: ["तासे", "तासाथे", "तासध्वे"], r4: ["तासे", "तास्वहे", "तास्महे"] },
        "उभयपदी":   { r2: ["ता", "तारौ", "तारः"], r3: ["तासि", "तास्थः", "तास्थ"], r4: ["तास्मि", "तास्वः", "तास्मः"] },
      },
      "लृट् लकार": {
        "परस्मैपदी": { r2: ["स्यति", "स्यतः", "स्यन्ति"], r3: ["स्यसि", "स्यथः", "स्यथ"], r4: ["स्यामि", "स्यावः", "स्यामः"] },
        "आत्मनेपदी": { r2: ["स्यते", "स्येते", "स्यन्ते"], r3: ["स्यसे", "स्येथे", "स्यध्वे"], r4: ["स्ये", "स्यावहे", "स्यामहे"] },
        "उभयपदी":   { r2: ["स्यति", "स्यतः", "स्यन्ति"], r3: ["स्यसि", "स्यथः", "स्यथ"], r4: ["स्यामि", "स्यावः", "स्यामः"] },
      },
      "लोट् लकार": {
        "परस्मैपदी": { r2: ["तु", "ताम्", "न्तु"], r3: ["हि", "तम्", "त"], r4: ["आनि", "आव", "आम"] },
        "आत्मनेपदी": { r2: ["ताम्", "आताम्", "न्ताम्"], r3: ["स्व", "आथाम्", "ध्वम्"], r4: ["ऐ", "आवहै", "आमहै"] },
        "उभयपदी":   { r2: ["तु", "ताम्", "न्तु"], r3: ["हि", "तम्", "त"], r4: ["आनि", "आव", "आम"] },
      },
      "लिङ् लकार": {
        "परस्मैपदी": { r2: ["एत्", "एताम्", "एयुः"], r3: ["एः", "एतम्", "एत"], r4: ["एयम्", "एव", "एम"] },
        "आत्मनेपदी": { r2: ["एत", "एताम्", "एरन्"], r3: ["एथाः", "एथाम्", "एध्वम्"], r4: ["एय", "एवहि", "एमहि"] },
        "उभयपदी":   { r2: ["एत्", "एताम्", "एयुः"], r3: ["एः", "एतम्", "एत"], r4: ["एयम्", "एव", "एम"] },
      },
      "लुङ् लकार": {
        "परस्मैपदी": { r2: ["त्", "ताम्", "न्"], r3: ["ः", "तम्", "त"], r4: ["म्", "व", "म"] },
        "आत्मनेपदी": { r2: ["त", "आताम्", "न्त"], r3: ["थाः", "आथाम्", "ध्वम्"], r4: ["इ", "वहि", "महि"] },
        "उभयपदी":   { r2: ["त्", "ताम्", "न्"], r3: ["ः", "तम्", "त"], r4: ["म्", "व", "म"] },
      },
      "लृङ् लकार": {
        "परस्मैपदी": { r2: ["स्यत्", "स्यताम्", "स्यन्"], r3: ["स्यः", "स्यतम्", "स्यत"], r4: ["स्यम्", "स्यव", "स्यम"] },
        "आत्मनेपदी": { r2: ["स्यत", "स्यताम्", "स्यन्त"], r3: ["स्यथाः", "स्यथाम्", "स्यध्वम्"], r4: ["स्यि", "स्यवहि", "स्यमहि"] },
        "उभयपदी":   { r2: ["स्यत्", "स्यताम्", "स्यन्"], r3: ["स्यः", "स्यतम्", "स्यत"], r4: ["स्यम्", "स्यव", "स्यम"] },
      },
    };

    // dhatu base (stem) for joining (भू -> भव, etc.)
    const DHATU_BASE = {
      "भू": "भव",
      "गम्": "गच्छ",
      "पठ्": "पठ",
      "कृ": "कर",
      "दा": "दद",
    };

    function getDhatuBase(dhatu) {
      return DHATU_BASE[dhatu] || dhatu;
    }

    let selectedLakar = lakars[0];
    let selectedUpavarga = upavargas[0];
    let selectedDhatu = "";

    function makeDropdown(labelText) {
      const dd = document.createElement("div");
      dd.className = "lakar-dd";

      const label = document.createElement("div");
      label.className = "lakar-dd-label";
      label.textContent = labelText;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "lakar-dd-btn";

      const btnText = document.createElement("span");
      btnText.className = "lakar-dd-btn-text";

      const arrow = document.createElement("span");
      arrow.className = "lakar-dd-btn-arrow";
      arrow.textContent = "▾";

      btn.appendChild(btnText);
      btn.appendChild(arrow);

      const menu = document.createElement("div");
      menu.className = "lakar-dd-menu";
      menu.hidden = true;

      btn.addEventListener("click", () => {
        const open = menu.hidden;
        menu.hidden = !open;
        dd.classList.toggle("lakar-open", open);
      });

      dd.append(label, btn, menu);
      return { dd, btnText, menu };
    }

    function fillMenu(menu, btnText, values, onSelect) {
      menu.innerHTML = "";
      btnText.textContent = values[0] || "";

      values.forEach((v, i) => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "lakar-dd-item";
        item.textContent = v;
        if (i === 0) item.classList.add("lakar-active");

        item.addEventListener("click", () => {
          btnText.textContent = v;
          menu.querySelector(".lakar-active")?.classList.remove("lakar-active");
          item.classList.add("lakar-active");
          menu.hidden = true;
          onSelect(v);
        });

        menu.appendChild(item);
      });
    }

    // ---- table ----
    const tableWrap = document.createElement("div");
    tableWrap.className = "lakar-table-wrap";

    const table = document.createElement("table");
    table.className = "lakar-table";

    const tbody = document.createElement("tbody");
    table.appendChild(tbody);

    const r1 = document.createElement("tr");
    const r1c1 = document.createElement("td"); r1c1.textContent = "";
    const r1c2 = document.createElement("td"); r1c2.textContent = "एकवचन";
    const r1c3 = document.createElement("td"); r1c3.textContent = "द्विवचन";
    const r1c4 = document.createElement("td"); r1c4.textContent = "बहुवचन";
    r1.append(r1c1, r1c2, r1c3, r1c4);

    const r2 = document.createElement("tr");
    const r2c1 = document.createElement("td"); r2c1.textContent = "प्रथम पुरुष";
    const r2c2 = document.createElement("td"); r2c2.textContent = "";
    const r2c3 = document.createElement("td"); r2c3.textContent = "";
    const r2c4 = document.createElement("td"); r2c4.textContent = "";
    r2.append(r2c1, r2c2, r2c3, r2c4);

    const r3 = document.createElement("tr");
    const r3c1 = document.createElement("td"); r3c1.textContent = "मध्यम पुरुष";
    const r3c2 = document.createElement("td"); r3c2.textContent = "";
    const r3c3 = document.createElement("td"); r3c3.textContent = "";
    const r3c4 = document.createElement("td"); r3c4.textContent = "";
    r3.append(r3c1, r3c2, r3c3, r3c4);

    const r4 = document.createElement("tr");
    const r4c1 = document.createElement("td"); r4c1.textContent = "उत्तम पुरुष";
    const r4c2 = document.createElement("td"); r4c2.textContent = "";
    const r4c3 = document.createElement("td"); r4c3.textContent = "";
    const r4c4 = document.createElement("td"); r4c4.textContent = "";
    r4.append(r4c1, r4c2, r4c3, r4c4);

    tbody.append(r1, r2, r3, r4);
    tableWrap.appendChild(table);

    function updateTableValues(values) {
      if (values && values.r2) {
        r2c2.textContent = values.r2[0] ?? "";
        r2c3.textContent = values.r2[1] ?? "";
        r2c4.textContent = values.r2[2] ?? "";
      }
      if (values && values.r3) {
        r3c2.textContent = values.r3[0] ?? "";
        r3c3.textContent = values.r3[1] ?? "";
        r3c4.textContent = values.r3[2] ?? "";
      }
      if (values && values.r4) {
        r4c2.textContent = values.r4[0] ?? "";
        r4c3.textContent = values.r4[1] ?? "";
        r4c4.textContent = values.r4[2] ?? "";
      }
    }

    function applyDhatuRoopToTable() {
      const patt =
        (SUFFIX_PATTERNS[selectedLakar] && SUFFIX_PATTERNS[selectedLakar][selectedUpavarga]) ||
        null;

      if (!patt || !selectedDhatu) {
        updateTableValues({ r2: ["", "", ""], r3: ["", "", ""], r4: ["", "", ""] });
        return;
      }

      const base = getDhatuBase(selectedDhatu);

      updateTableValues({
        r2: patt.r2.map((s) => `${base}${s}`),
        r3: patt.r3.map((s) => `${base}${s}`),
        r4: patt.r4.map((s) => `${base}${s}`),
      });
    }

    // ---- dropdowns ----
    const d1 = makeDropdown("लकार चुनें");
    const d2 = makeDropdown("लकार उपवर्ग चुनें");
    const d3 = makeDropdown("धातु चुनें");

    function loadDhatuMenuForCurrent() {
      fillMenu(d3.menu, d3.btnText, dhatuMap[selectedLakar], (d) => {
        selectedDhatu = d;
        applyDhatuRoopToTable();
      });
      selectedDhatu = dhatuMap[selectedLakar][0] || "";
      applyDhatuRoopToTable();
    }

    fillMenu(d1.menu, d1.btnText, lakars, (v) => {
      selectedLakar = v;

      fillMenu(d2.menu, d2.btnText, upavargas, (u) => {
        selectedUpavarga = u;
        loadDhatuMenuForCurrent();
      });

      selectedUpavarga = upavargas[0];
      loadDhatuMenuForCurrent();
    });

    fillMenu(d2.menu, d2.btnText, upavargas, (u) => {
      selectedUpavarga = u;
      loadDhatuMenuForCurrent();
    });

    loadDhatuMenuForCurrent();

    selection.append(d1.dd, d2.dd, d3.dd);
    wrapper.appendChild(selection);
    wrapper.appendChild(tableWrap);

    return wrapper;
  })());
}

