/* ============================================================
content_parser.js
UI + rendering + data normalization.

Per request:
- content_load.js keeps ONLY renderTsv.
- All other functions remain and live here.
- Add imagegroup slideshow loading from data/image/* with image-extension validation.
- Do NOT add/remove any other content types.
============================================================ */

import { config } from "./app_config.js";
import { appState } from "./app_state.js";
import { el, container, on } from "./app_common.js";
import { createInlineMathRenderer, renderLineWithDirectives } from "./MathRenderer.noMath.js";

const TSV_MATH = createInlineMathRenderer();
/* ============================================================
TSV renderer injection (provided by content_load.js)
============================================================ */
export const IMAGE_EXTS = new Set(["jpg","jpeg","png","gif","webp","svg","bmp","avif","apng"]);
let _renderTsv = null;
/** Called by content_load.js */
export function setRenderTsv(fn) {
  _renderTsv = typeof fn === "function" ? fn : null;
}

/* ============================================================
Data loading + model builder
============================================================ */
function findBookByCode(appData, bookCode) {
  const bc = String(bookCode || "").trim();
  if (!appData?.Classes || !bc) return null;

  for (const cls of appData.Classes) {
    for (const subj of (cls?.items || [])) {
      for (const book of (subj?.items || [])) {
        if (String(book?.bookCode || "").trim() === bc) return book;
      }
    }
  }
  return null;
}

// ✅ continuous numbering across units (101..124 etc)
export function buildPdfUrl(bookCode, chapterID, unitID, appData) {
  const bc = String(bookCode || "").trim();
  const rawChap = String(chapterID ?? "").trim();
  if (!bc || !rawChap) return "";

  const chapN = parseInt(rawChap, 10);
  if (Number.isNaN(chapN) || chapN <= 0) return "";

  // If already encoded like 101/112/etc, keep as-is
  if (chapN >= 100) return `data/pdf/${bc}${chapN}.pdf`;

  // Try to read book structure from appData
  //const book = findBookByCode(appData, bc);
  //const items = Array.isArray(book?.items) ? book.items : [];
  const book = findBookByCode(appData, bc);
  if (!book) return "";

  // ✅ Single-PDF book → always return the book PDF
  if (String(book?.pdfMode || "").trim() === "single") {
    const f = String(book?.pdfFile || "").trim();
    return f || "";
  }

  const items = Array.isArray(book?.items) ? book.items : [];

  // Detect whether this is a "units book":
  // - units book: items[0] has unitID (and inside it, chapters in unit.items)
  // - no-units book: items[0] has chapterID directly
  const first = items[0] || null;
  const isUnitsBook = first && (first.unitID != null) && Array.isArray(first.items);

  // No units => old logic (chapter 1 -> 101)
  if (!isUnitsBook) {
    const fileId = 100 + chapN;
    return `data/pdf/${bc}${fileId}.pdf`;
  }

  // Units exist => continuous index = sum(previous units chapterCount) + chapN
  const unitN = parseInt(String(unitID ?? "").trim(), 10);
  if (Number.isNaN(unitN) || unitN <= 0) {
    // If unitID missing but book uses units, safest fallback:
    // treat as first unit offset 0
    const fileId = 100 + chapN;
    return `data/pdf/${bc}${fileId}.pdf`;
  }

  // Sort units by unitID and sum chapterCount for all earlier units
  const unitsSorted = [...items].sort((a, b) => (a?.unitID ?? 0) - (b?.unitID ?? 0));

  let offset = 0;
  for (const u of unitsSorted) {
    const uId = parseInt(String(u?.unitID ?? ""), 10);
    if (Number.isNaN(uId)) continue;

    if (uId < unitN) {
      const cc =
        parseInt(String(u?.chapterCount ?? ""), 10) ||
        (Array.isArray(u?.items) ? u.items.length : 0);

      offset += (Number.isFinite(cc) ? cc : 0);
    }
  }

  const globalIndex = offset + chapN;      // ✅ continuous chapter number in the whole book
  const fileId = 100 + globalIndex;        // ✅ 1 -> 101, 24 -> 124
  return `data/pdf/${bc}${fileId}.pdf`;
}

export function getSinglePdfPage({ book, unitID, chapterID }) {
  const chapN = parseInt(String(chapterID ?? ""), 10);
  const unitN = parseInt(String(unitID ?? ""), 10);

  const offset = parseInt(String(book?.pdfOffset ?? 0), 10) || 0;

  // default page = offset + 1 (so you don't end up on cover)
  let page = offset + 1;

  const items = Array.isArray(book?.items) ? book.items : [];
  const first = items[0] || null;
  const isUnitsBook = first && (first.unitID != null) && Array.isArray(first.items);

  // ✅ No units: chapters directly in book.items
  if (!isUnitsBook) {
    const ch = items.find(x => parseInt(String(x?.chapterID ?? ""), 10) === chapN);
    const p = parseInt(String(ch?.pdfPage ?? ""), 10);
    if (Number.isFinite(p) && p > 0) page = p + offset;
    return page;
  }

  // ✅ Units: chapters in unit.items
  const unit = items.find(u => parseInt(String(u?.unitID ?? ""), 10) === unitN);
  const chapters = Array.isArray(unit?.items) ? unit.items : [];

  const ch = chapters.find(x => parseInt(String(x?.chapterID ?? ""), 10) === chapN);
  const p = parseInt(String(ch?.pdfPage ?? ""), 10);
  if (Number.isFinite(p) && p > 0) page = p + offset;

  return page;
}

/*
function buildPdfUrl(bookCode, chapterID) {
  const bc = String(bookCode || "").trim();
  const rawChap = String(chapterID ?? "").trim();
  const rawUnit = String(unitID ?? "").trim();

  if (!bc || !raw) return "";
  const n = parseInt(raw, 10);
  if (Number.isNaN(n)) return "";
  // If already looks like 101/102 etc (>= 100), keep as-is; else convert 1->101, 2->102, ...
  const fileId = n >= 100 ? n : 100 + n;
  return `data/pdf/${bc}${fileId}.pdf`;
}*/
/*
function parseVideoOrPlaylist(items) {
  if (!Array.isArray(items)) return { mode: "", ids: [] };
  const block = items.find((it) => {
    const t = String(it?.type || "").toLowerCase();
    return t === "video" || t === "playlist";
  });
  if (!block) return { mode: "", ids: [] };

  const mode = String(block.type || "").toLowerCase(); // 'video' | 'playlist'
  const v = block.value;
  const ids = Array.isArray(v) ? v : v ? [v] : [];
  const norm = ids.map(String).map((s) => s.trim()).filter(Boolean);
  return { mode, ids: norm };
}
*/
function parseVideoOrPlaylist(items) {
  if (!Array.isArray(items)) return { mode: "", ids: [], items: [] };

  const block = items.find((it) => {
    const t = String(it?.type || "").toLowerCase();
    return t === "video" || t === "playlist";
  });
  if (!block) return { mode: "", ids: [], items: [] };

  const mode = String(block.type || "").toLowerCase();
  const v = block.value;

  const pickTitle = (obj) => {
    if (!obj || typeof obj !== "object") return "";

    // common keys (including your misspelling)
    const direct =
      obj.title ?? obj.label ?? obj.lable ?? obj.name ?? obj.text ?? obj.caption;

    if (direct != null && String(direct).trim()) return String(direct).trim();

    // fallback: first string field other than id
    for (const [k, val] of Object.entries(obj)) {
      if (k === "id") continue;
      if (typeof val === "string" && val.trim()) return val.trim();
    }
    return "";
  };

  let list = [];

  if (Array.isArray(v)) {
    list = v
      .map((x) => {
        if (typeof x === "string" || typeof x === "number") {
          const id = String(x).trim();
          return id ? { id, title: "" } : null;
        }
        if (x && typeof x === "object") {
          const id = String(x.id ?? "").trim();
          const title = pickTitle(x);
          return id ? { id, title } : null;
        }
        return null;
      })
      .filter(Boolean);
  } else if (v) {
    const id = String(v).trim();
    if (id) list = [{ id, title: "" }];
  }

  // backward compat
  const ids = list.map((it) => it.id).filter(Boolean);

  const finalList = mode === "video" ? list.slice(0, 1) : list;
  const finalIds = mode === "video" ? ids.slice(0, 1) : ids;

  return { mode, ids: finalIds, items: finalList };
}

export async function pdfExists(url) {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

/*
export function buildPdfJsSrc(pdfFile, page = 1, zoom = 75, themeFile = "") {
  if (!pdfFile) return "";

  const viewerUrl = new URL("package/pdfjs/web/viewer.html", window.location.href);

  let file = String(pdfFile).trim();
  if (!file) return "";
  file = file.replace(/^\/+/, "");

  const baseDir = window.location.href.replace(/[^/]*$/, "");
  const pdfUrl = new URL(file, baseDir);

  const p = Math.max(1, parseInt(page, 10) || 1);

  viewerUrl.searchParams.set("file", pdfUrl.href);

  // ✅ NEW: pass theme file (like "theme-file.css")
  if (themeFile) viewerUrl.searchParams.set("theme", themeFile);

  viewerUrl.hash = `page=${p}&zoom=${zoom}`;
  return viewerUrl.href;
}*/

export function buildPdfJsSrc(pdfFile, page = 1, zoom = 75, themeFile = "") {
  if (!pdfFile) return "";

  // ✅ Base directory of the currently-loaded document (e.g. .../SchoolNotes/)
  const baseDir = window.location.href.replace(/[^/]*$/, "");

  // ✅ Viewer path resolved against baseDir (NOT against current route)
  const viewerUrl = new URL("package/pdfjs/web/viewer.html", baseDir);

  // ✅ Normalize PDF url
  let file = String(pdfFile).trim();
  if (!file) return "";

  // If already absolute http(s), keep it
  const isAbsHttp = /^https?:\/\//i.test(file);

  // Otherwise resolve relative to baseDir (so it becomes .../SchoolNotes/data/pdf/...)
  if (!isAbsHttp) file = file.replace(/^\/+/, ""); // remove leading /
  const pdfUrl = isAbsHttp ? new URL(file) : new URL(file, baseDir);

  const p = Math.max(1, parseInt(String(page || 1), 10) || 1);

  viewerUrl.searchParams.set("file", pdfUrl.href);

  // ✅ Theme (optional)
  if (themeFile) viewerUrl.searchParams.set("theme", String(themeFile).trim());

  viewerUrl.hash = `page=${p}&zoom=${zoom}`;
  //console.log(`${viewerUrl.href}`);
  return viewerUrl.href;
}


/**
 * Load app data JSON and store into state. 
 * @returns {Promise<any>} raw JSON
 */
export async function loadAppData() {
  const path = config?.paths?.input;
  if (!path) throw new Error("config.paths.input is missing.");

  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status} ${res.statusText}`);

  const json = await res.json();

  // Store raw data as requested
  appState.data = json;

  // Convenience mirrors (non-breaking)
  if (json?.Classes) appState.allSubjects = json.Classes;
  if (json?.Streams) appState.nepStreams = json.Streams;

  return json;
}

export function buildContentKey({ bookCode, bookID, unitID, chapterID }) {
  return `${bookCode || ""}:${bookID || ""}:${unitID || ""}:${chapterID || ""}`;
}

/**
 * Return a normalized "chapter model" for rendering.
 */
export async function getChapterModel({ bookCode, bookID, unitID, chapterID, chapterItems = [] }) {
  const book = findBookByCode(appState.data, bookCode); // ✅ FIX
  if (!book) {
    console.warn("Book not found:", bookCode);
  }
  
  const model = {
    ids: { bookCode, bookID, unitID, chapterID },
    meta: { subject: "", bookTitle: "", unitTitle: "", chapterTitle: "" },
    types: inferTypesFromItems(chapterItems),
    payload: {
      csv: { tables: [] },
      txt: { blocks: [] },
      tsv: { blocks: [] },
      timeline: { groups: [], events: [] },
      imagegroup: { files: [], urls: [] },
      answers: { kind: "", files: [], urls: [], pdfUrl: "" },

      // ✅ add this
      flowchart: { charts: [], active: 0, height: "650px" },

      overview: { text: "Overview content will appear here." },
      notes: { html: "<p>Notes content will appear here.</p>" },
      video: { items: [] },
      quiz: { items: [] },
      pdf: { url: "" },
      spell: { url: "", words: [] },
    },
  };

  model.payload.csv.tables = await loadCsvTablesFromItems(chapterItems);
  if (model.payload.csv.tables.length && !model.types.includes("csv")) model.types.push("csv");

  model.payload.txt.blocks = await loadTxtBlocksFromItems(chapterItems);
  if (model.payload.txt.blocks.length && !model.types.includes("txt")) model.types.push("txt");

  model.payload.tsv.blocks = await loadTsvBlocksFromItems(chapterItems);
  if (model.payload.tsv.blocks.length && !model.types.includes("tsv")) model.types.push("tsv");

  model.payload.timeline = await loadTimelineFromItems(chapterItems);
  if ((model.payload.timeline?.events?.length || 0) && !model.types.includes("timeline")) model.types.push("timeline");

  model.payload.imagegroup = loadImageGroupFromItems(chapterItems);
  if (model.payload.imagegroup.urls.length && !model.types.includes("imagegroup")) model.types.push("imagegroup");

  model.payload.answers = loadAnswersFromItems(chapterItems);
  if ((model.payload.answers?.kind) && !model.types.includes("answers")) model.types.push("answers");

  model.payload.spell = await loadSpellFromItems(chapterItems);
    if ((model.payload.spell?.words?.length || 0) && !model.types.includes("spell")) model.types.push("spell");


  // ✅ load flowchart from chapterItems (type: "flowchart", value: "az-vm-selection-chart.json")
  const fc = loadFlowchartFromItems(chapterItems);
  if ((fc.charts?.length || 0) > 0) {
    model.payload.flowchart = { ...model.payload.flowchart, ...fc };
    if (!model.types.includes("flowchart")) model.types.push("flowchart");
  }

  // Derive PDF URL from bookCode + chapterID (1->101, 2->102, ...)
  // ✅ Always compute PDF URL
  if (book.pdfMode === "single") {
    model.payload.pdf.url = book.pdfFile;
    model.payload.pdf.page = getSinglePdfPage({ book, unitID, chapterID });
  } else {
    model.payload.pdf.url = buildPdfUrl(bookCode, chapterID, unitID, appState.data);
    model.payload.pdf.page = 1;
  }



  // Normalize video/playlist from chapterItems (only one expected)
  const vp = parseVideoOrPlaylist(chapterItems);
  //onsole.log("video block value[0] =", chapterItems.find(x=>x.type==="playlist"||x.type==="video")?.value?.[0]);
  model.payload.video = { mode: vp.mode, ids: vp.ids, items: vp.items };
  if (vp.mode && !model.types.includes("video")) model.types.push("video");


  return model;
}

// ✅ helper (put near your other *FromItems helpers)
function loadFlowchartFromItems(items = []) {
  const arr = Array.isArray(items) ? items : [];
  const it = arr.find((x) => String(x?.type || "").toLowerCase() === "flowchart");
  if (!it) return { charts: [], active: 0, height: "650px" };

  const height = String(it?.height || "650px");
  const rawValue = it?.value ?? it?.Value;

  // Case A: value = "file.json"
  if (typeof rawValue === "string") {
    const file = rawValue.trim();
    return file ? { charts: [{ file, title: "" }], active: 0, height } : { charts: [], active: 0, height };
  }

  // Case B: value = ["file1.json", "file2.json"]  ✅ YOU HAVE THIS
  if (Array.isArray(rawValue) && rawValue.length && typeof rawValue[0] === "string") {
    const charts = rawValue
      .map((f) => ({ file: String(f || "").trim(), title: "" }))
      .filter((x) => x.file);

    const activeRaw = it?.active ?? it?.Active ?? 0;
    const active = Number.isFinite(+activeRaw) ? Math.max(0, Math.floor(+activeRaw)) : 0;

    return { charts, active: Math.min(active, charts.length - 1), height };
  }

  // Case C: value = [{file,title}, ...]  ✅ YOUR NEW FORMAT
  if (Array.isArray(rawValue)) {
    const charts = rawValue
      .map((x) => ({
        file: String(x?.file || x?.File || "").trim(),
        title: String(x?.title || x?.Title || "").trim(),
      }))
      .filter((x) => x.file);

    const activeRaw = it?.active ?? it?.Active ?? 0;
    const active = Number.isFinite(+activeRaw) ? Math.max(0, Math.floor(+activeRaw)) : 0;

    return { charts, active: Math.min(active, charts.length - 1), height };
  }

  // Case D: value = {file,title}
  if (rawValue && typeof rawValue === "object") {
    const file = String(rawValue?.file || rawValue?.File || "").trim();
    const title = String(rawValue?.title || rawValue?.Title || "").trim();
    return file ? { charts: [{ file, title }], active: 0, height } : { charts: [], active: 0, height };
  }

  return { charts: [], active: 0, height };
}


function loadImageGroupFromItems(items = []) {
  const empty = { files: [], urls: [] };
  if (!Array.isArray(items)) return empty;

  const igItem = items.find((x) => String(x?.type || "").toLowerCase() === "imagegroup");
  if (!igItem) return empty;

  const v = igItem.value;
  const files = Array.isArray(v) ? v : v ? [v] : [];

  const cleanFiles = [];
  const urls = [];

  for (const f of files) {
    const name = String(f || "").trim();
    if (!name) continue;

    const ext = (name.split(".").pop() || "").toLowerCase();
    if (!IMAGE_EXTS.has(ext)) continue;

    cleanFiles.push(name);
    urls.push(`data/image/${encodeURIComponent(name)}`);
  }

  return { files: cleanFiles, urls };
}

function loadAnswersFromItems(items = []) {
  // Expected:
  // { type:"answers", value:["image1.jpg","image2.png"] }  -> images from data/image/*
  // OR { type:"answers", value:["answer1.pdf"] }           -> single PDF from data/pdf/* (zoom 75%)
  const empty = { kind: "", files: [], urls: [], pdfUrl: "" };
  if (!Array.isArray(items)) return empty;

  const ansItem = items.find((x) => String(x?.type || "").toLowerCase() === "answers");
  if (!ansItem) return empty;

  const v = ansItem.value;
  const files = Array.isArray(v) ? v : (v ? [v] : []);
  const clean = files.map(f => String(f || "").trim()).filter(Boolean);

  if (clean.length === 0) return empty;

  // If it looks like a single PDF, treat as PDF answer sheet.
  if (clean.length === 1) {
    const name = clean[0];
    const ext = (name.split(".").pop() || "").toLowerCase();
    if (ext === "pdf") {
      return { kind: "pdf", files: [name], urls: [], pdfUrl: `data/pdf/${encodeURIComponent(name)}` };
    }
  }

  // Otherwise treat as image slideshow (filter to valid image extensions)
  const imgFiles = [];
  const urls = [];

  for (const name of clean) {
    if (!isValidImageFilename(name)) continue;
    imgFiles.push(name);
    urls.push(buildImageUrl(name));
  }

  if (!imgFiles.length) return empty;
  return { kind: "images", files: imgFiles, urls, pdfUrl: "" };
}

async function loadSpellFromItems(chapterItems = []) {
  const item = chapterItems.find(x => String(x?.type || "").toLowerCase() === "spell");
  const value = item?.value;
  if (!value) return { url: "", words: [] };

  // If your spell JSON lives under a folder, change this one line:
  // const url = `data/spell/${value}`;
  const url = `data/json/${value}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return { url, words: [] };
    const data = await res.json();

    // Support:
    // A) ["word1","word2"]
    // B) [{id,title,words:[...]}] (chapter-wise) -> flatten
    let words = [];
    if (Array.isArray(data)) {
      if (data.every(x => typeof x === "string")) {
        words = data;
      } else {
        for (const ch of data) {
          if (Array.isArray(ch?.words)) words.push(...ch.words);
        }
      }
    }

    words = [...new Set(words.map(x => String(x).trim()).filter(Boolean))];
    return { url, words };
  } catch {
    return { url, words: [] };
  }
}


/* ============================================================
CSV
============================================================ */
async function loadCsvTablesFromItems(items = []) {
  // Expected:
  // { type:"csv", value:[ {file:"test1.csv", title:"..."}, ... ] }
  const out = [];
  if (!Array.isArray(items)) return out;

  const csvItem = items.find((x) => String(x?.type || "").toLowerCase() === "csv");
  if (!csvItem) return out;

  const v = csvItem.value;
  if (!Array.isArray(v)) return out;

  for (const it of v) {
    const file = typeof it === "string" ? it : it?.file || "";
    const title = typeof it === "string" ? it : it?.title || it?.file || "";
    const cleanFile = String(file || "").trim();
    if (!cleanFile) continue;

    const url = `data/csv/${encodeURIComponent(cleanFile)}`;

    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const rows = parseCsv(text);
      out.push({ title: String(title || cleanFile).trim(), file: cleanFile, rows });
    } catch (e) {
      out.push({
        title: String(title || cleanFile).trim(),
        file: cleanFile,
        rows: [[`Failed to load ${cleanFile}: ${String(e?.message || e)}`]],
      });
    }
  }

  return out;
}

function parseCsv(text) {
  // Simple CSV parser supporting quoted fields, commas, and newlines.
  const s = String(text ?? "");
  const rows = [];
  let row = [];
  let cur = "";
  let inQ = false;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];

    if (inQ) {
      if (ch === '"') {
        const next = s[i + 1];
        if (next === '"') {
          cur += '"';
          i++;
        } else {
          inQ = false;
        }
      } else {
        cur += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQ = true;
      continue;
    }

    if (ch === ",") {
      row.push(cur);
      cur = "";
      continue;
    }

    if (ch === "\n") {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
      continue;
    }

    if (ch === "\r") continue;

    cur += ch;
  }

  row.push(cur);
  rows.push(row);

  // Trim trailing empty row
  if (rows.length && rows[rows.length - 1].every((c) => String(c || "").trim() === "")) rows.pop();

  return rows;
}

export function buildCsvTable(rows, tableTitle = "") {
  const table = el("table", {
    attrs: {
      "data-ui": "csv-table",
      role: "table",
      "aria-label": tableTitle || "Notes data table",
    },
  });
  if (tableTitle) {
    const cap = el("caption", { text: tableTitle, attrs: { class: "sr-only" } });
    table.appendChild(cap);
  }
  const tb = el("tbody");
  table.appendChild(tb);

  const urlRe = /(https?:\/\/[^\s"'<>()]+)/g;

  const appendCell = (tr, cellText, isHeader = false) => {
    const cell = el(isHeader ? "th" : "td", {
      attrs: isHeader ? { scope: "col" } : {},
    });
    const text = String(cellText ?? "");

    const parts = text.split(urlRe);
    if (parts.length === 1) {
      cell.textContent = text;
    } else {
      for (const p of parts) {
        if (!p) continue;
        if (urlRe.test(p)) {
          const a = el("a", { attrs: { href: p, target: "_blank", rel: "noopener noreferrer" }, text: p });
          cell.appendChild(a);
        } else {
          cell.appendChild(document.createTextNode(p));
        }
      }
    }
    tr.appendChild(cell);
  };

  rows.forEach((r, idx) => {
    const tr = el("tr");
    const cols = Array.isArray(r) ? r : [r];
    const isHeaderRow = idx === 0 && rows.length > 1;
    for (const c of cols) appendCell(tr, c, isHeaderRow);
    tb.appendChild(tr);
  });

  return table;
}

/* ============================================================
TXT
============================================================ */
async function loadTxtBlocksFromItems(items = []) {
  // Expected:
  // { type:"txt", value:[ {file:"test1.txt", title:"..."}, ... ] }
  const out = [];
  if (!Array.isArray(items)) return out;

  const txtItem = items.find((x) => String(x?.type || "").toLowerCase() === "txt");
  if (!txtItem) return out;

  const v = txtItem.value;
  if (!Array.isArray(v)) return out;

  for (const it of v) {
    const file = typeof it === "string" ? it : it?.file || "";
    const title = typeof it === "string" ? it : it?.title || it?.file || "";
    const cleanFile = String(file || "").trim();
    if (!cleanFile) continue;

    const url = `data/txt/${encodeURIComponent(cleanFile)}`;

    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const rows = parseTxtToRows(text);
      out.push({ title: String(title || cleanFile).trim(), file: cleanFile, rows });
    } catch (e) {
      out.push({
        title: String(title || cleanFile).trim(),
        file: cleanFile,
        rows: [[`Failed to load ${cleanFile}: ${String(e?.message || e)}`]],
      });
    }
  }

  return out;
}

function parseTxtToRows(text) {
  // Single-column, each line is a row.
  const s = String(text ?? "");
  const lines = s.split(/\r?\n/);
  return lines.map((ln) => [ln]);
}

export function buildTxtTable(rows) {
  const root = container("div", { attrs: { "data-ui": "txt-content" } });

  const urlRe = /(https?:\/\/[^\s"'<>()]+)/g;
  const emphasisRe = /<"([^"]+)">/g;

  const toLine = (r) => (Array.isArray(r) ? r.join("\t") : String(r ?? ""));
  const norm = (x) => String(x ?? "").replace(/\r/g, "");
  const isBlank = (s) => !String(s ?? "").trim();

  const trimLeftTabs = (x) => norm(x).replace(/^[ \t]+/, "");
  const partsTab = (x) => trimLeftTabs(x).split("\t").map((p) => p.trim());
  const kw = (x) => String(x ?? "").trim().toLowerCase();
  const isKW = (line, word) => kw(partsTab(line)[0]) === word;

  const appendTextWithLinks = (parent, text) => {
    const parts = String(text ?? "").split(urlRe);
    if (parts.length === 1) {
      parent.appendChild(document.createTextNode(String(text ?? "")));
      return;
    }
    for (const p of parts) {
      if (!p) continue;
      if (urlRe.test(p)) {
        parent.appendChild(el("a", { attrs: { href: p, target: "_blank", rel: "noopener noreferrer" }, text: p }));
      } else {
        parent.appendChild(document.createTextNode(p));
      }
    }
  };

  const appendRichText = (parent, text) => {
    const s = String(text ?? "");
    let last = 0;
    emphasisRe.lastIndex = 0;

    let m;
    while ((m = emphasisRe.exec(s))) {
      const before = s.slice(last, m.index);
      if (before) appendTextWithLinks(parent, before);

      const emph = el("span", { attrs: { class: "content-text-emphasis" } });
      appendTextWithLinks(emph, m[1]);
      parent.appendChild(emph);

      last = m.index + m[0].length;
    }

    const after = s.slice(last);
    if (after) appendTextWithLinks(parent, after);
  };

  const makeLineEl = ({ alignRight = false, isHeading = false, indentEm = 0 } = {}) => {
    const attrs = isHeading ? { class: "content-text-heading" } : { "data-ui": "txt-line" };
    const node = el("div", { attrs });
    if (alignRight) node.style.textAlign = "right";
    if (indentEm > 0) node.style.textIndent = `${indentEm}em`;
    return node;
  };

  const buildImgEl = (filename) => {
    const name = String(filename || "").trim();
    const cleanAlt = name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    return el("img", {
      attrs: {
        "data-ui": "txt-image",
        src: `data/image/${name}`.replace(/\\/g, "/"),
        alt: cleanAlt ? `Educational diagram: ${cleanAlt}` : "",
        loading: "lazy",
      },
    });
  };


  // ---- Table parser (supports optional EndTable) ----
  const parseTableBlock = (lines, startIndex) => {
    let i = startIndex + 1;

    const headers = [];
    const bodyRows = [];

    while (i < lines.length && isBlank(lines[i])) i++;

    if (i < lines.length && isKW(lines[i], "columns")) {
      i++;
      while (i < lines.length) {
        if (isKW(lines[i], "endtable")) {
          i++;
          break;
        }

        const p = partsTab(lines[i]);
        const head = kw(p[0]);

        if (!p[0]) {
          i++;
          continue;
        }
        if (head === "row") break;

        if (head === "col") headers.push(p.slice(1).join(" ").trim());
        i++;
      }
    }

    while (i < lines.length) {
      if (isKW(lines[i], "endtable")) {
        i++;
        break;
      }

      const p = partsTab(lines[i]);
      const head = kw(p[0]);

      if (!p[0]) {
        i++;
        continue;
      }
      if (head !== "row") break;

      i++;
      const row = [];

      while (i < lines.length) {
        if (isKW(lines[i], "endtable")) {
          i++;
          break;
        }

        const q = partsTab(lines[i]);
        const h2 = kw(q[0]);

        if (!q[0]) {
          i++;
          continue;
        }

        if (h2 === "row") break;
        if (h2 === "columns") break;
        if (h2 === "col") row.push(q.slice(1).join(" ").trim());

        i++;
      }

      if (headers.length || row.length) bodyRows.push(row);

      // if we consumed EndTable inside the row, we should stop
      if (i > 0 && isKW(lines[i - 1], "endtable")) break;
    }

    const t = el("table", { attrs: { "data-ui": "txt-inlinetable" } });

    if (headers.length) {
      const thead = el("thead");
      const trh = el("tr");
      for (const h of headers) {
        const th = el("th");
        appendRichText(th, h);
        trh.appendChild(th);
      }
      thead.appendChild(trh);
      t.appendChild(thead);
    }

    const tb = el("tbody");
    for (const r of bodyRows) {
      const tr = el("tr");
      const cols = headers.length ? headers.length : r.length;
      for (let c = 0; c < cols; c++) {
        const td = el("td");
        appendRichText(td, r[c] ?? "");
        tr.appendChild(td);
      }
      tb.appendChild(tr);
    }
    t.appendChild(tb);

    return { node: t, nextIndex: i };
  };

  // ---------- Decide parsing mode ----------
  const lines = (Array.isArray(rows) ? rows : []).map(toLine).map(norm);

  // If ANY directive/table syntax exists, ALWAYS do line-by-line parsing (prevents <td>\heading...)
  const hasDirectives =
    lines.some((s) => /^\s*\\(right|heading|img|tab)\b/i.test(s)) ||
    lines.some((s) => String(s).trim() === "Table") ||
    lines.some((s) => /^\s*EndTable\s*$/i.test(s));

  // Legacy 2D array table fallback ONLY when no directives/table blocks exist
  const hasArrayRows = Array.isArray(rows) && rows.some((r) => Array.isArray(r));
  if (!hasDirectives && hasArrayRows) {
    const table = el("table", { attrs: { "data-ui": "txt-table" } });
    const tb = el("tbody");
    table.appendChild(tb);

    const appendCell = (tr, cellText) => {
      const td = el("td");
      appendRichText(td, String(cellText ?? ""));
      tr.appendChild(td);
    };

    for (const r of rows) {
      const tr = el("tr");
      const cols = Array.isArray(r) ? r : [r];
      for (const c of cols) appendCell(tr, c);
      tb.appendChild(tr);
    }

    root.appendChild(table);
    return root;
  }

  // ---------- Line-by-line rendering ----------
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (isBlank(trimmed)) {
      root.appendChild(el("div", { attrs: { "data-ui": "txt-blank" } }));
      continue;
    }

    if (trimmed === "Table") {
      const { node, nextIndex } = parseTableBlock(lines, i);
      root.appendChild(node);
      i = nextIndex - 1;
      continue;
    }

    let alignRight = false;
    let indentEm = 0;
    let line = raw;

    if (/^\s*\\right\b/i.test(line)) {
      alignRight = true;
      line = line.replace(/^\s*\\right\b\s*/i, "");
    }

    // \tab => indent only this line (paragraph-first-line effect)
    if (/^\s*\\tab\b/i.test(line)) {
      indentEm = 2; // you can change default
      line = line.replace(/^\s*\\tab\b\s*/i, "");
    }

    let isHeading = false;
    if (/^\s*\\heading\b/i.test(line)) {
      isHeading = true;
      line = line.replace(/^\s*\\heading\b\s*/i, "");
    }

    const imgM = String(line).trim().match(/^\\img\s*"([^"]+)"\s*$/i);
    if (imgM) {
      const wrap = makeLineEl({ alignRight, isHeading: false });
      wrap.appendChild(buildImgEl(imgM[1]));
      root.appendChild(wrap);
      continue;
    }

    const node = makeLineEl({ alignRight, isHeading, indentEm });
    appendRichText(node, String(line ?? "").trimEnd());
    root.appendChild(node);
  }

  return root;
}


export function wireTxtBlockExpand(panelEl) {
  if (!panelEl) return;

  panelEl.addEventListener("click", (e) => {
    const blk = e.target?.closest?.('[data-ui="txt-block"]');
    if (!blk || !panelEl.contains(blk)) return;

    const isOn = blk.getAttribute("data-expanded") === "true";
    blk.setAttribute("data-expanded", isOn ? "false" : "true");
  });
}

/* ============================================================
TSV data (rendering handled by content_load.js)
============================================================ */
async function loadTsvBlocksFromItems(items = []) {
  // Expected:
  // { type:"tsv", value:[ {file:"test1.tsv", title:"..."}, ... ] }
  const out = [];
  if (!Array.isArray(items)) return out;

  const tsvItem = items.find((x) => String(x?.type || "").toLowerCase() === "tsv");
  if (!tsvItem) return out;

  const v = tsvItem.value;
  if (!Array.isArray(v)) return out;

  for (const it of v) {
    const file = typeof it === "string" ? it : it?.file || "";
    const title = typeof it === "string" ? it : it?.title || it?.file || "";
    const cleanFile = String(file || "").trim();
    if (!cleanFile) continue;

    const url = `data/tsv/${encodeURIComponent(cleanFile)}`;

    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const nodes = parseTsvOutline(text);
      out.push({ title: String(title || cleanFile).trim(), file: cleanFile, nodes });
    } catch (e) {
      out.push({
        title: String(title || cleanFile).trim(),
        file: cleanFile,
        nodes: [{ text: `Failed to load ${cleanFile}: ${String(e?.message || e)}`, children: [] }],
      });
    }
  }

  return out;
}

function parseTsvOutline(text) {
  // Tab-indented outline:
  // leading tabs => depth, remainder => label.
  const s = String(text ?? "");
  const lines = s.split(/\r?\n/);

  const roots = [];
  const stack = [];

  for (const rawLine of lines) {
    if (rawLine == null) continue;

    const m = rawLine.match(/^\t*/);
    const depth = m ? m[0].length : 0;

    const label = rawLine.replace(/^\t+/, "").trim();
    if (!label) continue;

    const node = { text: label, children: [] };

    if (depth <= 0) {
      roots.push(node);
      stack.length = 0;
      stack[0] = node;
      continue;
    }

    let parentDepth = depth - 1;
    while (parentDepth >= 0 && !stack[parentDepth]) parentDepth--;

    if (parentDepth < 0) {
      roots.push(node);
      stack.length = 0;
      stack[0] = node;
      continue;
    }

    stack[parentDepth].children.push(node);

    stack[depth] = node;
    stack.length = depth + 1;
  }

  return roots;
}

/* ============================================================
Timeline
============================================================ */
async function loadTimelineFromItems(items = []) {
  // Expected:
  // { type: "timeline", value: "events.json", order?: "asc"|"desc", title?: "..." }
  const empty = { groups: [], events: [] };
  if (!Array.isArray(items)) return empty;

  const tlItem = items.find((x) => String(x?.type || "").toLowerCase() === "timeline");
  if (!tlItem) return empty;

  const file = String(tlItem.value || "").trim();
  if (!file) return empty;

  // ✅ read config from input.json item (case-insensitive)
  const orderRaw = tlItem.order ?? tlItem.Order ?? "desc";
  const order = String(orderRaw || "").toLowerCase() === "asc" ? "asc" : "desc";

  const titleRaw = tlItem.title ?? tlItem.Title ?? "";
  const title = String(titleRaw || "").trim();

  const url = `data/json/${encodeURIComponent(file)}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    const events = normalizeTimelineEvents(json, { order });
    const groups = groupTimelineEventsByYear(events, { order });

    return { groups, events, file, order, title };
  } catch (e) {
    return {
      groups: [
        {
          year: "Error",
          count: 1,
          events: [
            {
              year: "",
              date: "",
              title: `Failed to load ${file}`,
              description: String(e?.message || e),
              tags: [],
            },
          ],
        },
      ],
      events: [],
      file,
      order,
      title,
    };
  }
}

function normalizeTimelineEvents(json, { order = "desc" } = {}) {
  const arr = Array.isArray(json) ? json : Array.isArray(json?.events) ? json.events : [];
  const out = [];

  for (const it of arr) {
    if (!it) continue;
    const year = it.year ?? it.Year ?? "";
    const date = it.date ?? it.Date ?? "";
    const title = it.title ?? it.Title ?? "";
    const description = it.description ?? it.Description ?? "";
    const tags = Array.isArray(it.tags) ? it.tags.map(String) : Array.isArray(it.Tags) ? it.Tags.map(String) : [];

    if (!String(title || "").trim() && !String(description || "").trim()) continue;

    out.push({
      year,
      date: String(date || "").trim(),
      title: String(title || "").trim(),
      description: String(description || "").trim(),
      tags,
    });
  }

  // Sort: year desc, then date desc (best-effort parsing)
  const dir = order === "asc" ? 1 : -1;

  const toYear = (y) => {
    const n = parseInt(y, 10);
    return Number.isFinite(n) ? n : null;
  };

  // Handles YYYY / YYYY-MM / YYYY-MM-DD safely
  const toTime = (s) => {
    const raw = String(s || "").trim();
    if (!raw) return null;
    if (/^\d{4}$/.test(raw)) return Date.parse(`${raw}-01-01`);
    if (/^\d{4}-\d{2}$/.test(raw)) return Date.parse(`${raw}-01`);
    const t = Date.parse(raw);
    return Number.isFinite(t) ? t : null;
  };

  out.sort((a, b) => {
    const ya = toYear(a.year);
    const yb = toYear(b.year);
    if (ya != null && yb != null && ya !== yb) return (ya - yb) * dir;
    if (ya != null && yb == null) return -1;
    if (ya == null && yb != null) return 1;

    const ta = toTime(a.date);
    const tb = toTime(b.date);
    if (ta != null && tb != null && ta !== tb) return (ta - tb) * dir;
    if (ta != null && tb == null) return -1;
    if (ta == null && tb != null) return 1;

    return String(a.title).localeCompare(String(b.title));
  });


  return out;
}

function groupTimelineEventsByYear(events = [], { order = "desc" } = {}) {
  const map = new Map();

  for (const ev of Array.isArray(events) ? events : []) {
    const yearKey = String(ev?.year ?? "").trim() || "Unknown";
    if (!map.has(yearKey)) map.set(yearKey, []);
    map.get(yearKey).push(ev);
  }

  const keys = Array.from(map.keys());
  const dir = order === "asc" ? 1 : -1;
  keys.sort((a, b) => {
    const ya = parseInt(a, 10);
    const yb = parseInt(b, 10);
    const yNa = Number.isNaN(ya);
    const yNb = Number.isNaN(yb);

    if (!yNa && !yNb && ya !== yb) return (ya - yb) * dir;
    if (!yNa && yNb) return -1;
    if (yNa && !yNb) return 1;

    // fallback for non-year keys
    return String(a).localeCompare(String(b)) * dir;
  });

  return keys.map((year) => {
    const evs = map.get(year) || [];
    return { year, count: evs.length, events: evs };
  });
}

export function buildTimelineView(timeline = { groups: [] }) {
  const groups = Array.isArray(timeline?.groups) ? timeline.groups : [];
  const root = container("div", { attrs: { "data-ui": "timeline-panel" } });
  const t = String(timeline?.title || timeline?.Title || "").trim();
  if (t) {
    root.appendChild(el("div", { attrs: { "data-ui": "timeline-panel-title" }, text: t }));
  }

  for (const g of groups) {
    const yearText = String(g?.year ?? "").trim();
    const count = Number(g?.count ?? (Array.isArray(g?.events) ? g.events.length : 0)) || 0;

    const yearRow = container("div", { attrs: { "data-ui": "timeline-year" } });
    yearRow.appendChild(el("div", { attrs: { "data-ui": "timeline-year-label" }, text: yearText }));
    yearRow.appendChild(el("div", { attrs: { "data-ui": "timeline-year-count" }, text: `${count} event${count === 1 ? "" : "s"}` }));
    root.appendChild(yearRow);

    const list = container("div", { attrs: { "data-ui": "timeline-year-list" } });

    const events = Array.isArray(g?.events) ? g.events : [];
    for (const ev of events) list.appendChild(buildTimelineEventCard(ev));
    root.appendChild(list);
  }

  return root;
}

function buildTimelineEventCard(ev) {
  const card = container("div", { attrs: { "data-ui": "timeline-card" } });

  // left rail (dot + line)
  const rail = container("div", { attrs: { "data-ui": "timeline-rail", "aria-hidden": "true" } });
  rail.appendChild(el("span", { attrs: { "data-ui": "timeline-rail-dot" } }));
  rail.appendChild(el("span", { attrs: { "data-ui": "timeline-rail-line" } }));

  const body = container("div", { attrs: { "data-ui": "timeline-card-body" } });

  const header = container("div", { attrs: { "data-ui": "timeline-card-header" } });
  header.appendChild(el("div", { attrs: { "data-ui": "timeline-title" }, text: String(ev?.title || "").trim() }));
  header.appendChild(el("div", { attrs: { "data-ui": "timeline-date" }, text: String(ev?.date || "").trim() }));
  body.appendChild(header);

  const descText = String(ev?.description || "").trim();
  if (descText) {
    const desc = container("div", { attrs: { "data-ui": "timeline-desc" } });
    const lines = descText.replace(/\r\n/g, "\n").split("\n");

    // Build collapsible "sections" for depth 0 lines
    let currentSection = null; // { wrap, body }
    const makeSection = (title) => {
      const wrap = container("div", {
        attrs: {
          "data-ui": "timeline-desc-section",
          "data-expanded": "false",
          "data-pinned": "false",
        },
      });

      const head = container("div", {
        attrs: {
          "data-ui": "timeline-desc-head",
          "role": "button",
          "tabindex": "0",
          "aria-expanded": "false",
        },
        text: title,
      });

      const body = container("div", { attrs: { "data-ui": "timeline-desc-body" } });

      // hover expand / hover out collapse unless pinned
      let pinned = false;
      const setExpanded = (on) => {
        wrap.setAttribute("data-expanded", on ? "true" : "false");
        head.setAttribute("aria-expanded", on ? "true" : "false");
      };
      const setPinned = (on) => {
        pinned = !!on;
        wrap.setAttribute("data-pinned", pinned ? "true" : "false");
        setExpanded(pinned ? true : false);
      };

      head.addEventListener("pointerenter", () => { if (!pinned) setExpanded(true); });
      wrap.addEventListener("pointerleave", () => { if (!pinned) setExpanded(false); });

      head.addEventListener("click", (e) => {
        const interactive = e.target.closest("a,button,input,textarea,select,label");
        if (interactive) return;
        setPinned(!pinned);
      });

      head.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setPinned(!pinned);
        }
      });

      wrap.appendChild(head);
      wrap.appendChild(body);
      return { wrap, body };
    };

    for (const raw of lines) {
      // blank line -> spacing line in current section body if exists
      if (!raw.trim()) {
        if (currentSection) {
          currentSection.body.appendChild(
            el("div", { attrs: { "data-ui": "timeline-text-line", "data-depth": "0" }, text: " " })
          );
        }
        continue;
      }

      const m = raw.match(/^(\t+)(.*)$/);
      const depth = m ? m[1].length : 0;
      const text = (m ? m[2] : raw).trimEnd();

      if (depth === 0) {
        // Start new top-level section
        currentSection = makeSection(text.trim());
        desc.appendChild(currentSection.wrap);
        continue;
      }

      // Lines under the current section
      if (!currentSection) {
        // If description starts with indented lines, create a default section
        currentSection = makeSection("Details");
        desc.appendChild(currentSection.wrap);
      }

      currentSection.body.appendChild(
        el("div", {
          attrs: { "data-ui": "timeline-text-line", "data-depth": String(depth) },
          text: text || " ",
        })
      );
    }

    body.appendChild(desc);
  }


  const tags = Array.isArray(ev?.tags) ? ev.tags.map(String).filter(Boolean) : [];
  if (tags.length) {
    const chips = container("div", { attrs: { "data-ui": "timeline-tags" } });
    for (const t of tags) chips.appendChild(el("span", { attrs: { "data-ui": "timeline-chip" }, text: t }));
    body.appendChild(chips);
  }

  card.appendChild(rail);
  card.appendChild(body);
  return card;
}


function inferTypesFromItems(items) {
  // Infer content types from chapter items.
  // 'playlist' is treated as 'video' (Video Book tab).
  const s = new Set();

  if (Array.isArray(items)) {
    for (const it of items) {
      const t = String(it?.type || "").toLowerCase();
      if (!t) continue;
      if (t === "playlist") s.add("video");
      else s.add(t);
    }
  }

  // Always include PDF
  s.add("pdf");

  // Provide a sensible default if nothing else exists
  if (s.size === 0) return ["pdf"];

  return Array.from(s);
}


/* ============================================================
ImageGroup helpers (appended; used by content_load.js)
============================================================ */
export function isValidImageFilename(name) {
  const s = String(name || "").trim();
  if (!s) return false;
  const ext = (s.split(".").pop() || "").toLowerCase();
  return IMAGE_EXTS.has(ext);
}

export function buildImageUrl(filename) {
  // Files are stored under data/image/*
  return `data/image/${encodeURIComponent(String(filename || "").trim())}`;
}

export function buildImageSlideshow({ files = [], urls = [], uiPrefix = "imagegroup" } = {}) {
  // UI builder for an image slideshow with left/right glass buttons and dot indicators.
  const safeFiles = Array.isArray(files) ? files : [];
  const safeUrls = Array.isArray(urls) ? urls : [];

  if (!safeUrls.length) {
    return container("div", {
      attrs: { "data-ui": `${uiPrefix}-panel` },
      children: [el("div", { attrs: { "data-ui": "content-empty" }, text: "No images available." })],
    });
  }

  let idx = 0;

  const panel = container("div", { attrs: { "data-ui": `${uiPrefix}-panel` } });

  const stage = container("div", { attrs: { "data-ui": `${uiPrefix}-stage` } });

  const btnPrev = el("button", {
    attrs: { type: "button", "data-ui": `${uiPrefix}-nav`, "data-dir": "prev", "aria-label": "Previous image" },
    text: "‹",
  });

  const btnNext = el("button", {
    attrs: { type: "button", "data-ui": `${uiPrefix}-nav`, "data-dir": "next", "aria-label": "Next image" },
    text: "›",
  });

  const img = el("img", {
    attrs: {
      "data-ui": `${uiPrefix}-img`,
      src: safeUrls[0],
      alt: safeFiles[0] || "Image",
      loading: "lazy",
      decoding: "async",
    },
  });

  stage.appendChild(btnPrev);
  stage.appendChild(img);
  stage.appendChild(btnNext);

  const footer = container("div", { attrs: { "data-ui": `${uiPrefix}-footer` } });
  const dots = container("div", { attrs: { "data-ui": `${uiPrefix}-dots` } });
  const label = el("div", { attrs: { "data-ui": `${uiPrefix}-label` }, text: safeFiles[0] || "" });

  const dotButtons = safeUrls.map((_, i) => {
    const b = el("button", {
      attrs: {
        type: "button",
        "data-ui": `${uiPrefix}-dot`,
        "aria-current": i === 0 ? "true" : "false",
        title: safeFiles[i] || `Image ${i + 1}`,
      },
      text: "",
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
    const n = safeUrls.length;
    if (n <= 0) return;
    idx = ((next % n) + n) % n;

    img.setAttribute("src", safeUrls[idx]);
    img.setAttribute("alt", safeFiles[idx] || "Image");
    label.textContent = safeFiles[idx] || "";

    dotButtons.forEach((b, i) => b.setAttribute("aria-current", i === idx ? "true" : "false"));
  };

  const step = (delta) => setIndex(idx + delta);

  on(btnPrev, "click", () => step(-1));
  on(btnNext, "click", () => step(1));

  // Keyboard support when panel focused
  panel.tabIndex = 0;
  panel.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
    if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
  });

  return panel;
}

export function detailRow(label, valueId, valueText) {
  return container("div", {
    className: "drow",
    children: [
      container("div", { className: "k", text: label }),
      container("div", { className: "v", id: valueId, text: valueText }),
    ],
  });
}

function renderLineWithQuotedItalics(text, opts) {
  const s = String(text ?? "");

  // ✅ IMPORTANT: keep inline image directives intact
  // Your syntax is: \img"test.jpg" or \img'test.jpg'
  if (s.includes('\\img"') || s.includes("\\img'")) {
    return renderLineWithDirectives(s, opts);
  }

  const frag = document.createDocumentFragment();

  const nextQuoteAt = (i) => {
    for (let k = i; k < s.length; k++) {
      const ch = s[k];
      if (ch === '"' || ch === "'") return k;
    }
    return -1;
  };

  let i = 0;

  while (i < s.length) {
    const q1 = nextQuoteAt(i);
    if (q1 === -1) {
      frag.appendChild(renderLineWithDirectives(s.slice(i), opts));
      break;
    }

    if (q1 > i) frag.appendChild(renderLineWithDirectives(s.slice(i, q1), opts));

    const quoteChar = s[q1];
    const q2 = s.indexOf(quoteChar, q1 + 1);
    if (q2 === -1) {
      frag.appendChild(renderLineWithDirectives(s.slice(q1), opts));
      break;
    }

    const inner = s.slice(q1 + 1, q2);
    const ital = el("i");
    ital.appendChild(renderLineWithDirectives(inner, opts));
    frag.appendChild(ital);

    i = q2 + 1;
  }

  return frag;
}

export function buildTsvTree(nodes = [], opts = {}) {
  const { imageBase = "data/images/" } = opts;

  const root = container("div", { attrs: { "data-ui": "tsv-tree" } });

  function renderStructuralTableNode(tableNode, level) {
    const kids = Array.isArray(tableNode?.children) ? tableNode.children : [];
    const columnsNode = kids.find(c => String(c?.text || "") === "Columns");
    const rowNodes = kids.filter(c => String(c?.text || "") === "Row");
    if (!columnsNode || !rowNodes.length) return null;

    const headers = (columnsNode.children || []).map(c =>
      String(c?.text || "").replace(/^Col[\t ]+/i, "")
    );

    const table = el("table", { attrs: { "data-ui": "tsv-table", "data-level": String(level) } });

    const thead = el("thead");
    const trh = el("tr");
    headers.forEach(h => trh.appendChild(el("th", { text: h })));
    thead.appendChild(trh);
    table.appendChild(thead);

    const tbody = el("tbody");
    rowNodes.forEach(r => {
      const tr = el("tr");
      (r.children || []).forEach(cellNode => {
        const cellText = String(cellNode?.text || "").replace(/^Col[\t ]+/i, "");
        const td = el("td");
        td.appendChild(renderLineWithQuotedItalics(cellText, { math: TSV_MATH, imageBase }));
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    return table;
  }

  const renderNodes = (arr, level) => {
    const wrap = container("div", { attrs: { "data-ui": "tsv-children", "data-level": String(level) } });

    // Helper: detect + render a "Table" subtree as an actual HTML table
    const tryRenderStructuralTable = (tableNode) => {
      const kids = Array.isArray(tableNode?.children) ? tableNode.children : [];
      const columnsNode = kids.find((c) => String(c?.text || "").trim() === "Columns");
      const rowNodes = kids.filter((c) => String(c?.text || "").trim() === "Row");

      if (!columnsNode || rowNodes.length === 0) return null;

      const headers = (Array.isArray(columnsNode.children) ? columnsNode.children : []).map((c) => {
        const raw = String(c?.text || "");
        // supports "Col<TAB>Header" OR "Col Header" OR "Col"
        return raw.replace(/^Col[\t ]*/i, "");
      });

      const table = el("table", { attrs: { "data-ui": "tsv-table", "data-level": String(level) } });

      const thead = el("thead");
      const trh = el("tr");
      headers.forEach((h) => trh.appendChild(el("th", { text: h })));
      thead.appendChild(trh);
      table.appendChild(thead);

      const tbody = el("tbody");

      rowNodes.forEach((r) => {
        const tr = el("tr");
        const cells = Array.isArray(r?.children) ? r.children : [];

        cells.forEach((cellNode) => {
          const raw = String(cellNode?.text || "");
          const cellText = raw.replace(/^Col[\t ]*/i, "");

          const td = el("td");
          // allow math/img directives inside cells
          td.appendChild(renderLineWithDirectives(cellText, { math: TSV_MATH, imageBase }));
          tr.appendChild(td);
        });

        tbody.appendChild(tr);
      });

      table.appendChild(tbody);
      return table;
    };

    for (const n of arr) {
      const nodeText = String(n?.text || "").trim();

      // ✅ If this node is a structural table, render as HTML table and skip normal tree rendering
      if (nodeText === "Table") {
        const t = tryRenderStructuralTable(n);
        if (t) {
          wrap.appendChild(t);
          continue;
        }
        // if "Table" node doesn't match expected structure, fall through and render normally
      }

      const hasKids = Array.isArray(n?.children) && n.children.length > 0;

      const row = container("div", { attrs: { "data-ui": "tsv-row", "data-level": String(level) } });

      if (hasKids) {
        row.appendChild(
          el("button", {
            attrs: { type: "button", "data-ui": "tsv-toggle", "aria-expanded": "false", title: "Expand/Collapse" },
            text: "▸",
          })
        );
      } else {
        row.appendChild(el("span", { attrs: { "data-ui": "tsv-spacer" }, text: "" }));
      }

      // ✅ render text with math + \img + /table support
      const textWrap = container("div", { attrs: { "data-ui": "tsv-text" } });
      textWrap.appendChild(renderLineWithQuotedItalics(String(n?.text || ""), { math: TSV_MATH, imageBase }));
      row.appendChild(textWrap);

      wrap.appendChild(row);

      if (hasKids) {
        const kids = renderNodes(n.children, level + 1);
        kids.hidden = true;
        wrap.appendChild(kids);
      }
    }

    return wrap;
  };

  root.appendChild(renderNodes(nodes, 0));

  root.addEventListener("click", (e) => {
    const btn = e.target?.closest?.('[data-ui="tsv-toggle"]');
    if (!btn) return;

    const row = btn.closest('[data-ui="tsv-row"]');
    const next = row?.nextElementSibling;
    if (!next || !next.matches('[data-ui="tsv-children"]')) return;

    const expanded = btn.getAttribute("aria-expanded") === "true";
    const willExpand = !expanded;

    btn.setAttribute("aria-expanded", willExpand ? "true" : "false");
    btn.textContent = willExpand ? "▾" : "▸";
    next.hidden = !willExpand;

    if (willExpand) TSV_MATH.typesetElement(next);
  });

  // Initial collapse all
  root.querySelectorAll('[data-ui="tsv-toggle"]').forEach((b) => {
    b.setAttribute("aria-expanded", "false");
    b.textContent = "▸";
    const row = b.closest('[data-ui="tsv-row"]');
    const next = row?.nextElementSibling;
    if (next && next.matches('[data-ui="tsv-children"]')) next.hidden = true;
  });

  queueMicrotask(() => TSV_MATH.typesetElement(root));

  return root;
}

export function getYoutubeThumb(videoId) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}