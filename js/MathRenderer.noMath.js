/*
===========================================================
MathRenderer.js — ONE FILE (ALL SYMBOLS SO FAR)
===========================================================

HOW TO USE
- Inline math:   $ ... $
- Full line:     @math ...
This renderer converts your easy-typing shortcuts into TeX/Unicode that MathJax renders.

===========================================================
CHEAT SHEET — TYPE THIS  →  GET THIS
===========================================================

--- Common operators & relations ---
+-                  →  ±
>=                  →  ≥
<=                  →  ≤
!=                  →  ≠
infinity            →  ∞
therefore           →  ∴
since / because     →  ∵
deg (e.g. 180deg)   →  180°
*                   →  ×  (multiply sign)
->                  →  →
<->                 →  ⇌
=>                  →  ⇒

--- Sets & number systems ---
in                  →  ∈
notin               →  ∉
subset              →  ⊂
subseteq            →  ⊆
superset            →  ⊃
superseteq          →  ⊇
cup                 →  ∪
cap                 →  ∩
R, Z, Q, N, C        →  ℝ ℤ ℚ ℕ ℂ

--- Logic ---
forall              →  ∀
exists              →  ∃

--- Vectors ---
vec(A)              →  \vec{A}
vec(AB)             →  \vec{AB}
ihat / jhat / khat  →  \hat{i} / \hat{j} / \hat{k}

--- Greek / physics (word typing) ---
pi                  →  π
theta               →  θ
lambda              →  λ
nu / frequency      →  ν
omega               →  ω
Delta               →  Δ
rho                 →  ρ
epsilon0            →  ε₀   (also works: epsilon_0)
mu0                 →  μ₀   (also works: mu_0)

--- Geometry ---
angle(ABC)          →  ∠ABC
triangleABC         →  △ABC
righttriABC         →  ⊿ABC
arc(AB)             →  arc over AB (raised)
perp                →  ⟂
parallel            →  ∥
notparallel         →  ∦
cong                →  ≅
notcong             →  ≇
sim                 →  ∼
notsim              →  ≁
rightangle          →  ⟂   (same as perp)

--- Repeating decimal bar ---
bar(x)              →  x̅   (examples: bar(3), bar(0.3))

--- Polynomial notation ---
poly(x)             →  f(x)

--- Chemistry (subscripts + catalysts) ---
H2O, CO2, NH3        →  H_2O, CO_2, NH_3 (auto subscripts)
2H2 + O2 -> 2H2O      →  coefficients spaced + subscripts
<->[Fe]               →  \overset{\text{Fe}}{\leftrightarrow}
->[Fe]                →  \overset{\text{Fe}}{\rightarrow}

--- Class 12 Electronics / Units ---
ohm                 →  Ω
kohm / kOhm         →  kΩ
mohm / mOhm         →  mΩ
volt                →  V
amp / ampere        →  A
ma / mA             →  mA
ua / uA             →  µA
watt / W            →  W
mw / mW             →  mW
farad               →  F
uf / uF             →  µF
nf / nF             →  nF
pf / pF             →  pF
henry               →  H
mh / mH             →  mH
uh / uH             →  µH
hz / Hz             →  Hz
khz / kHz           →  kHz
mhz / MHz           →  MHz
coulomb             →  C

impedance           →  Z
reactance           →  X
admittance          →  Y
imaginary           →  j
mho                →  ℧
siemens            →  S

===========================================================
NOTES
- If you write real TeX like \frac{a}{b} or \overset{...}{...}, it will pass through.
- Arc uses TeX overset with \frown and is raised (book-style).
===========================================================
*/
const TABLE_PREFIX = "/table/";
const IMG_RE = /\\img"([^"]+)"/g;
const IMG_OVERRIDES_WHOLE_LINE = true;
const DEFAULT_IMAGE_BASE = "data/images/";

// ---- image resolver (from earlier fix) ----
function resolveImageSrc(rawSrc, imageBase = DEFAULT_IMAGE_BASE) {
  const src = (rawSrc || "").trim();

  // Leave untouched: URLs, data URIs, absolute paths
  if (
    /^https?:\/\//i.test(src) ||
    /^data:/i.test(src) ||
    src.startsWith("/")
  ) {
    return src;
  }

  // Respect explicit relative paths
  if (src.startsWith("./") || src.startsWith("../")) return src;

  const base = imageBase.endsWith("/") ? imageBase : imageBase + "/";

  // ✅ If user already provided base prefix, don't add it again
  if (src.startsWith(base) || src.startsWith("data/images/")) {
    return src;
  }

  return base + src;
}


function makeInlineImg(src) {
  const img = document.createElement("img");
  img.src = src;
  const rawName = String(src || "").split("/").pop() || "";
  const cleanName = rawName.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").trim();
  img.alt = cleanName ? `Illustration: ${cleanName}` : "Educational diagram";
  img.height = 100;
  img.loading = "lazy";
  img.decoding = "async";
  img.style.verticalAlign = "middle";
  return img;
}

function renderLineWithImgSupport(text, math, imageBase) {
  if (!math) {
    console.error("renderLineWithImgSupport called WITHOUT math. text =", text);
    throw new Error("renderLineWithImgSupport: missing math");
  }
  if (!text.includes('\\img"')) return math.renderInlineToFragment(text);

  const frag = document.createDocumentFragment();
  if (IMG_OVERRIDES_WHOLE_LINE) {
    let m; IMG_RE.lastIndex = 0;
    while ((m = IMG_RE.exec(text)) !== null) {
      frag.appendChild(makeInlineImg(resolveImageSrc(m[1], imageBase)));
      frag.appendChild(document.createTextNode(" "));
    }
    return frag;
  }

  let last = 0, m; IMG_RE.lastIndex = 0;
  while ((m = IMG_RE.exec(text)) !== null) {
    const start = m.index, end = IMG_RE.lastIndex;
    const before = text.slice(last, start);
    if (before) frag.appendChild(math.renderInlineToFragment(before));
    frag.appendChild(makeInlineImg(resolveImageSrc(m[1], imageBase)));
    last = end;
  }
  const after = text.slice(last);
  if (after) frag.appendChild(math.renderInlineToFragment(after));
  return frag;
}

// ---- /table/ parser ----
function buildTableFromDirective(line, { math, imageBase } = {}) {
  if (!math) {
    console.error("buildTableFromDirective called WITHOUT math. line =", line);
    throw new Error("buildTableFromDirective: missing math");
  }
  const table = document.createElement("table");
  table.className = "inline-table";

  // Normalize row breaks: "\t" (two chars) OR actual tab
  const normalized = line
    .replace(/\\t/g, "/row/")   // backslash + t
    .replace(/\t/g, "/row/");  // actual tab char

  // Split on "/" and remove empty parts
  const parts = normalized.split("/").filter(Boolean);

  // Expect first token = "table"
  if (parts[0] !== "table") return null;

  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");

  const headers = [];
  const rows = [];
  let currentRow = [];

  // Helper: parse th{...} or td{...}
  const cellRe = /^(th|td)\{([\s\S]*)\}$/;

  for (let i = 1; i < parts.length; i++) {
    const token = parts[i];

    if (token === "row") {
      if (currentRow.length) rows.push(currentRow);
      currentRow = [];
      continue;
    }

    const m = token.match(cellRe);
    if (!m) continue;

    const kind = m[1];         // th or td
    const text = m[2] ?? "";   // inside braces

    if (kind === "th" && rows.length === 0 && currentRow.length === 0) {
      headers.push(text);
    } else {
      currentRow.push(text);
    }
  }
  if (currentRow.length) rows.push(currentRow);

  // Build header row if any
  if (headers.length) {
    const tr = document.createElement("tr");
    for (const h of headers) {
      const th = document.createElement("th");
      th.setAttribute("scope", "col");
      th.appendChild(renderLineWithImgSupport(h, math, imageBase));
      tr.appendChild(th);
    }
    thead.appendChild(tr);
    table.appendChild(thead);
  }

  // Build body
  for (const r of rows) {
    const tr = document.createElement("tr");
    for (const c of r) {
      const td = document.createElement("td");
      td.appendChild(renderLineWithImgSupport(c, math, imageBase));
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);

  return table;
}

// ---- master line renderer: table > img > normal text ----
export function renderLineWithDirectives(text, { math, imageBase = DEFAULT_IMAGE_BASE } = {}) {
  if (!math) {
    console.error("renderLineWithDirectives called WITHOUT math. text =", text);
    throw new Error("renderLineWithDirectives: missing { math }");
  }

  if (text.startsWith("/table/")) {
    const t = buildTableFromDirective(text, { math, imageBase });
    if (t) return t;
  }
  return renderLineWithImgSupport(text, math, imageBase);
}


export function createInlineMathRenderer() {

  // --- helpers ---
  const greekWordMap = new Map([
    ["pi","π"], ["theta","θ"], ["lambda","λ"], ["nu","ν"], ["omega","ω"],
    ["Delta","Δ"], ["rho","ρ"]
  ]);

  function normalize(input) {
    let s = String(input ?? "");

    // ---------- Chemistry catalysts on arrows ----------
    s = s.replace(/<->\s*\[([^\]]+)\]/g, (_, cat) => `\\overset{\\text{${cat}}}{\\leftrightarrow}`);
    s = s.replace(/->\s*\[([^\]]+)\]/g,  (_, cat) => `\\overset{\\text{${cat}}}{\\rightarrow}`);

    // ---------- Arrow shortcuts ----------
    s = s.replace(/<->/g, "⇌");
    s = s.replace(/->/g, "→");
    s = s.replace(/=>/g, "⇒");

    // ---------- Common operators ----------
    s = s.replace(/\+\-/g, "±");
    s = s.replace(/>=/g, "≥").replace(/<=/g, "≤").replace(/!=/g, "≠");
    s = s.replace(/\*/g, "×");
    s = s.replace(/deg\b/g, "°");

    // ---------- Logic ----------
    s = s.replace(/\bforall\b/gi, "∀");
    s = s.replace(/\bexists\b/gi, "∃");

    // ---------- Sets ----------
    s = s.replace(/\bsubseteq\b/gi, "⊆").replace(/\bsuperseteq\b/gi, "⊇");
    s = s.replace(/\bsubset\b/gi, "⊂").replace(/\bsuperset\b/gi, "⊃");
    s = s.replace(/\bcup\b/gi, "∪").replace(/\bcap\b/gi, "∩");
    s = s.replace(/\bin\b/gi, "∈");

    // ---------- Number sets ----------
    s = s.replace(/\bR\b/g, "ℝ").replace(/\bZ\b/g, "ℤ").replace(/\bQ\b/g, "ℚ")
         .replace(/\bN\b/g, "ℕ").replace(/\bC\b/g, "ℂ");

    // ---------- Vectors ----------
    s = s.replace(/vec\(([^)]+)\)/g, "\\vec{$1}");
    s = s.replace(/\bihat\b/gi, "\\hat{i}")
         .replace(/\bjhat\b/gi, "\\hat{j}")
         .replace(/\bkhat\b/gi, "\\hat{k}");

    // ---------- Geometry ----------
    s = s.replace(/angle\(([A-Za-z]{1,4})\)/g, "∠$1");

    // ---------- Repeating decimal ----------
    s = s.replace(/bar\(([^)]+)\)/g, "$1\u0305");

    // ---------- Polynomial ----------
    s = s.replace(/poly\(([^)]+)\)/g, "f($1)");

    // ---------- Greek words (SAFE) ----------
    // Do NOT convert inside TeX commands like \pi, \theta, etc.
    for (const [w, sym] of greekWordMap.entries()) {
      const re = new RegExp(`(^|[^\\\\])\\b${w}\\b`, "g");
      s = s.replace(re, `$1${sym}`);
    }

    // Also safe frequency -> ν
    s = s.replace(/(^|[^\\])\bfrequency\b/gi, "$1ν");

    // ---------- epsilon0, mu0 ----------
    s = s.replace(/\bepsilon(\d+)\b/gi, "epsilon_$1");
    s = s.replace(/\bmu(\d+)\b/gi, "mu_$1");
    s = s.replace(/\bepsilon_0\b/gi, "ε₀");
    s = s.replace(/\bmu_0\b/gi, "μ₀");

    // ---------- Chemistry subscripts ----------
    s = s.replace(/(\d)([A-Z])/g, "$1 $2");
    s = s.replace(/([A-Z][a-z]?)(\d+)/g, "$1_$2");

    // ---------- Electronics ----------
    s = s.replace(/\bohm\b/gi, "Ω");
    s = s.replace(/\bvolt\b/gi, "V");
    s = s.replace(/\bamp\b/gi, "A");
    s = s.replace(/\bhz\b/gi, "Hz");

    return s;
  }

  function renderInlineToFragment(line) {
    const frag = document.createDocumentFragment();
    const raw = line ?? "";

    if (/^\s*@math\s+/i.test(raw)) {
      const expr = raw.replace(/^\s*@math\s+/i, "");
      const span = document.createElement("span");
      span.textContent = `\\(${normalize(expr)}\\)`;
      frag.appendChild(span);
      return frag;
    }

    const parts = raw.split(/(\$[^$]+\$)/g).filter(Boolean);
    for (const part of parts) {
      const m = part.match(/^\$([^$]+)\$$/);
      if (!m) {
        frag.appendChild(document.createTextNode(part));
      } else {
        const span = document.createElement("span");
        span.textContent = `\\(${normalize(m[1])}\\)`;
        frag.appendChild(span);
      }
    }
    return frag;
  }

  async function typesetElement(el) {
    const MJ = window.MathJax;
    if (!MJ) return;
    if (MJ.startup?.promise) await MJ.startup.promise;
    if (MJ.typesetPromise) await MJ.typesetPromise([el]);
  }

  return { renderInlineToFragment, typesetElement };
}
