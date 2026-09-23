/* ============================================================
app_script.js  (ES Module)
- Loads JSON data (config.paths.input)
- Stores raw data into appState.data
- Builds top menu bar: Branding | Tabs | Selections
- Wires dropdown + tab behaviors and persists selections to appState
============================================================ */





import { config } from "./app_config.js";
import { appState } from "./app_state.js";

import { el, container, createTopRow, createMainRow } from "./app_common.js";

import { createBranding } from "./app_branding.js";
import { createTabsArea } from "./app_tabs.js";
import { createDropdown } from "./app_dropdown.js";
import { createSidebar } from "./app_sidebar.js";
import { initAccessibilityToolbar } from "./app_accessibility.js";
import { initFooter } from "./app_gigw_pages.js";

// ===== Default startup selection =====
// DEFAULT_SUBJECT is a subjectID number from input.json (stable identifier)
const DEFAULT_CLASS = 10;     // 1..12
const DEFAULT_SUBJECT = 1; // <-- change to your preferred subjectID

/* --------------------------
    Utilities
-------------------------- */

function snapshotAppState() {
    return {
        defaultClass: appState.defaultClass ?? null,
        defaultSubjectID: appState.defaultSubjectID ?? null,
        selectedClass: appState.selectedClass ?? null,
        selectedStream: appState.selectedStream ?? null,
        selectedSubject: appState.selectedSubject ?? null,
        selectedSubjectID: appState.selectedSubjectID ?? null,
        selectedBookID: appState.selectedBookID ?? null,
        selectedBookCode: appState.selectedBookCode ?? null,
        selectedUnitID: appState.selectedUnitID ?? null,
        selectedChapterID: appState.selectedChapterID ?? null,
    };
}

function logAppState(stage, extra = null) {
    // Console-friendly, stable ordering
    const snap = snapshotAppState();
    if (extra !== null) {
        console.log(`[appState] ${stage}`, snap, extra);
    } else {
        console.log(`[appState] ${stage}`, snap);
    }
}

let __sidebarObserver = null;
let __sidebarLogTimer = null;

function setupSidebarSelectionObserver() {
    // Try common sidebar mounts: data-ui="sidebar" or #sidebar
    const sidebarEl =
        document.querySelector('[data-ui="sidebar"]') ||
        document.getElementById(appState.ui_sidebar || "sidebar");

    if (!sidebarEl) return;

    // Reuse a single observer
    if (__sidebarObserver) return;

    __sidebarObserver = new MutationObserver((mutations) => {
        // Debounce bursts of mutations into one log line
        if (__sidebarLogTimer) clearTimeout(__sidebarLogTimer);
        __sidebarLogTimer = setTimeout(() => {
            //logAppState("after sidebar selection change (observer)");
        }, 0);
    });

    __sidebarObserver.observe(sidebarEl, {
        subtree: true,
        attributes: true,
        attributeFilter: ["aria-current", "class", "data-selected", "data-active"],
        childList: true,
    });
}

// Wrapper: keeps UI/logic intact; adds state logging around sidebar render
function renderSidebar(stage, args) {
    //logAppState(`before sidebar load (${stage})`, args);
    //console.log(`Rendering sidebar (${stage}) with args:`, args);
    const result = createSidebar(args);
    // Ensure observer is attached after sidebar exists
    setupSidebarSelectionObserver();
    //logAppState(`after sidebar load (${stage})`, args);
    return result;
}

function assertElement(el, name) {
    if (!(el instanceof HTMLElement)) {
        throw new Error(`${name} did not return a valid HTMLElement.`);
    }
    return el;
}

function normalizeClassValue(v) {
    // Accept numbers or strings like "Class 1"
    if (typeof v === "number") return v;
    if (typeof v === "string") {
        const m = v.match(/(\d+)/);
        if (m) return Number(m[1]);
    }
    return null;
}

function isSeniorClass(classNum) {
    return classNum === 11 || classNum === 12;
}

/* --------------------------
    Data Loading
-------------------------- */

async function loadInputData() {
    const path = config?.paths?.input;
    if (!path) throw new Error("config.paths.input is missing.");

    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status} ${res.statusText}`);

    const json = await res.json();

    // Store raw data as requested
    appState.data = json;

    // Also keep convenience references (non-breaking even if state evolves later)
    if (json?.Classes) appState.allClasses = json.Classes;
    if (json?.Streams) appState.allStreams = json.Streams;

    return json;
}

/* --------------------------
    Layout Creation
-------------------------- */

function ensureAppShell() {
    const shellId = appState.ui_appshell || "appshell";
    const shell = document.getElementById(shellId);
    if (!shell) throw new Error(`Missing root container #${shellId} in index.html`);
    appState.appshell = shell;
    return shell;
}

function buildTopRow(shell) {
    const { topRow, topMenu } = createTopRow({
        topRowId: appState.ui_toprow || "toprow",
        topMenuId: appState.ui_topmenu || "topmenu",
    });
    shell.appendChild(topRow);
    return { toprow: topRow, topmenu: topMenu };
}

function buildMainArea(shell) {
    // Main row container (content + sidebar). Sidebar will mount itself inside #mainrow.
    const { mainRow, content } = createMainRow({
        mainRowId: appState.ui_mainrow || "mainrow",
        contentId: appState.ui_main || "main",
    });


    shell.appendChild(mainRow);
    return { mainrow: mainRow, content };
}

/* --------------------------
    Orchestration
-------------------------- */

function deriveClassOptions(inputJson) {
    const classes = Array.isArray(inputJson?.Classes) ? inputJson.Classes : [];
    return classes
        .map((c) => {
            const num = normalizeClassValue(c?.classTitle);
            if (num == null) return null;
            return { label: `Class ${num}`, value: num };
        })
        .filter(Boolean)
        .sort((a, b) => a.value - b.value);
}

function deriveStreamOptions(inputJson) {
    // Streams in input.json are an object of stream-name => list-of-subjects.
    // Dropdown shows the stream names (keys).
    const streams = inputJson?.Streams;
    if (!streams || typeof streams !== "object") return [];
    return Object.keys(streams).map((k) => ({ label: k, value: k }));
}

function deriveTabsForClass(inputJson, classNum) {
    // For classes 1-10: tabs come from that class's "items" subjectTitle/subjectID
    if (classNum == null) return [];

    const classes = Array.isArray(inputJson?.Classes) ? inputJson.Classes : [];
    const classObj = classes.find((c) => normalizeClassValue(c?.classTitle) === classNum);
    const subjects = Array.isArray(classObj?.items) ? classObj.items : [];

    return subjects
        .map((s) => {
            const id = s?.subjectID ?? null;
            const title = s?.subjectTitle ?? "";
            if (!title) return null;
            return { label: title, value: id ?? title, subjectID: id, subjectTitle: title };
        })
        .filter(Boolean);
}

function setupOutsideClickToClose({ classDD, streamDD }) {
    document.addEventListener("click", (e) => {
        const t = e.target;

        const inClass = classDD?.root?.contains?.(t);
        const inStream = streamDD?.root?.contains?.(t);

        // If click is outside both dropdowns => close both
        if (!inClass && !inStream) {
            classDD?.close?.();
            streamDD?.close?.();
        }
    });
}

function closeOtherDropdownOnToggle({ opened, other }) {
    // When one is opened (via click), close the other
    if (opened?.isOpen?.()) other?.close?.();
}

function initAppUI(inputJson) {
    const shell = ensureAppShell();
    const { toprow, topmenu } = buildTopRow(shell);
    initAccessibilityToolbar();
    buildMainArea(shell);
    // Apply DEFAULT_SUBJECT exactly once (after we set tabs for DEFAULT_CLASS)
    let didApplyDefaultSubject = false;

    // Logging flags to distinguish initial loads vs user-triggered changes
    let __initialClassSelection = true;
    let __initialStreamSelection = true;

    // ---- Canonical startup state (per app_state.js) ----
    appState.defaultClass = DEFAULT_CLASS;
    appState.defaultSubjectID = DEFAULT_SUBJECT;

    // Initial selections start at defaults; later UI interactions will update them.
    appState.selectedClass = DEFAULT_CLASS;
    appState.selectedSubjectID = DEFAULT_SUBJECT;

    // Derive default subject name for the default class (best-effort)
    try {
        const tabsForDefaultClass = deriveTabsForClass(inputJson, DEFAULT_CLASS);
        const match = tabsForDefaultClass.find(t => String(t?.subjectID) === String(DEFAULT_SUBJECT));
        if (match) appState.selectedSubject = match.label ?? match.subjectTitle ?? null;
    } catch (e) { /* no-op */ }

    // --- Branding (left)
    const branding = createBranding({
        siteName: "Easy Learning",
        moto: "NEP 2020 Compliant",
    });
    assertElement(branding, "createBranding");

    // --- Tabs (center)
    const tabsArea = createTabsArea({
        onTabSelected: (tab) => {
            //logAppState("after tabs change (before persist)", { tab });
            // Persist selected tab
            const tabValue = tab?.value ?? null;
            const tabTitle = tab?.label ?? tab?.subjectTitle ?? null;
            appState.ui_activeTab = tabValue;
            appState.selectedSubjectID = tab?.subjectID ?? tabValue;
            appState.selectedSubject = tabTitle;
            //logAppState("after tabs change (persisted)", { tabValue: appState.ui_activeTab, selectedSubjectID: appState.selectedSubjectID, selectedSubject: appState.selectedSubject });

            // Font mode: Hindi/Sanskrit => use --font-hindi in sidebar + content
            const shell = document.getElementById(appState.ui_appshell || "appshell");

            // safest: detect by subject title (works even if subjectIDs change)
            const title = String(tabTitle || "").toLowerCase();
            const isIndic =
            title.includes("hindi") ||
            title.includes("sanskrit") ||
            title.includes("संस्कृत") ||
            title.includes("हिंदी");

            shell?.setAttribute("data-lang", isIndic ? "hindi" : "latin");
            
            // Placeholder sidebar call (wrapped for logging)
            renderSidebar("after tabs change", {
                selectedClass: appState.selectedClass,
                selectedStream: appState.selectedStream,
                selectedTab: appState.ui_activeTab
            });
            queueMicrotask(() => {
                const sidebar = document.getElementById("sidebar");
                if (!sidebar) return;

                // prefer the currently selected one (aria-current=true)
                const selected = sidebar.querySelector('[data-ui="chapter-row"][aria-current="true"]');

                // fallback: first chapter in the list
                const first = sidebar.querySelector('[data-ui="chapter-row"]');

                (selected || first)?.click();
            });

        }
    });

    // tabsArea can be either an HTMLElement or an object with { root, setTabs, clearTabs, selectFirst }
    const tabsRoot = tabsArea instanceof HTMLElement ? tabsArea : tabsArea?.root;
    assertElement(tabsRoot, "createTabsArea");

    // --- Selection area (right)
    const classOptions = deriveClassOptions(inputJson);
    const streamOptions = deriveStreamOptions(inputJson);

    const classDD = createDropdown({
        id: appState.ui_dropdowns?.class || "dd-selectclass",
        label: "Class",
        options: classOptions,
        // We'll set defaults explicitly below.
        autoSelectFirst: false,
        onOpen: () => closeOtherDropdownOnToggle({ opened: classDD, other: streamDD }),
        onChange: (opt) => {
            const classNum = normalizeClassValue(opt?.value);
            appState.selectedClass = classNum;
            //logAppState(__initialClassSelection ? "after class load (dropdown default)" : "after class change", { classNum });

            // Show/hide stream dropdown
            if (isSeniorClass(classNum)) {
                appState.streamEnabled = true;
                streamDD?.show?.();
            } else {
                appState.streamEnabled = false;
                appState.selectedStream = null;
                streamDD?.close?.();
                streamDD?.hide?.();
            }

            // Tabs behaviour
            if (classNum != null && classNum >= 1 && classNum <= 10) {
                const tabs = deriveTabsForClass(inputJson, classNum);
                if (tabsArea?.setTabs) tabsArea.setTabs(tabs);
                else if (tabsRoot?.setTabs) tabsRoot.setTabs(tabs);

                //logAppState(__initialClassSelection ? "after tabs load (from class)" : "after tabs load (class change)", { tabsCount: tabs?.length ?? 0 });


                // Select default subject once for DEFAULT_CLASS; otherwise select first.
                if (!didApplyDefaultSubject && classNum === DEFAULT_CLASS) {
                    const ds = DEFAULT_SUBJECT;
                    const dsStr = String(DEFAULT_SUBJECT);
                    const dsNum = Number(DEFAULT_SUBJECT);
                    const selected =
                        (typeof tabsArea?.selectByValue === "function" &&
                            (tabsArea.selectByValue(ds) || tabsArea.selectByValue(dsStr) || tabsArea.selectByValue(dsNum))) ||
                        (typeof tabsArea?.selectTab === "function" &&
                            (tabsArea.selectTab(ds) || tabsArea.selectTab(dsStr) || tabsArea.selectTab(dsNum)));
                    if (!selected && typeof tabsArea?.selectFirst === "function") tabsArea.selectFirst();
                    didApplyDefaultSubject = true;
                } else {
                    if (typeof tabsArea?.selectFirst === "function") tabsArea.selectFirst();
                    else if (tabs?.length && typeof tabsArea?.selectTab === "function") tabsArea.selectTab(tabs[0]?.value);
                }
            } else if (isSeniorClass(classNum)) {
                // Currently no tabs for 11-12
                if (tabsArea?.clearTabs) tabsArea.clearTabs();
                appState.ui_activeTab = null;
                appState.selectedSubjectID = null;
                appState.selectedSubject = null;

                renderSidebar("after class change (senior/no tabs)", {
                    selectedClass: appState.selectedClass,
                    selectedStream: appState.selectedStream,
                    selectedTab: appState.ui_activeTab
                });
            }

            // After first class selection, treat subsequent as user changes
            __initialClassSelection = false;
        }
    });

    const streamDD = createDropdown({
        id: appState.ui_dropdowns?.stream || "dd-selectstream",
        label: "Stream",
        options: streamOptions,
        autoSelectFirst: true,
        hidden: true, // start hidden; will show for 11/12
        onOpen: () => closeOtherDropdownOnToggle({ opened: streamDD, other: classDD }),
        onChange: (opt) => {
            appState.selectedStream = opt?.value ?? null;
            //logAppState(__initialStreamSelection ? "after stream load (dropdown default)" : "after stream change", { stream: appState.selectedStream });

            // For now, tabs for 11/12 are not created; just update sidebar placeholder (wrapped for logging)
            renderSidebar("after stream change", {
                selectedClass: appState.selectedClass,
                selectedStream: appState.selectedStream,
                selectedTab: appState.ui_activeTab
            });

            __initialStreamSelection = false;
        }
    });

    // Selection area container
    const selectionArea = container("div", { id: "selection-area", attrs: { "data-ui": "selection-area" } });
    selectionArea.appendChild(assertElement(classDD?.root || classDD, "createDropdown(Class)"));
    selectionArea.appendChild(assertElement(streamDD?.root || streamDD, "createDropdown(Stream)"));

    // Compose top menu
    topmenu.appendChild(branding);
    topmenu.appendChild(tabsRoot);
    topmenu.appendChild(selectionArea);

    // Outside click closes both dropdowns
    setupOutsideClickToClose({ classDD, streamDD });

    //logAppState("after tabs load (tabs area created)");

    // Apply deterministic defaults (no "first item" lottery)
    // Class: DEFAULT_CLASS
    if (typeof classDD?.selectByValue === "function") {
        classDD.selectByValue(DEFAULT_CLASS);
    } else if (typeof classDD?.selectOption === "function") {
        classDD.selectOption(DEFAULT_CLASS);
    } else if (typeof classDD?.selectFirst === "function") {
        // Fallback for older dropdown implementation
        classDD.selectFirst();
    }
    //logAppState("after class load (select applied)");

    // Stream: keep existing behavior (auto select first) but only if stream dropdown is visible
    if (typeof streamDD?.selectFirst === "function") streamDD.selectFirst();
    //logAppState("after stream load (selectFirst called)");

    // Ensure stream visibility reflects initial class selection
    const initialClass = normalizeClassValue(appState.selectedClass ?? classOptions?.[0]?.value);
    if (initialClass != null) {
        appState.selectedClass = initialClass;
        if (isSeniorClass(initialClass)) {
            appState.streamEnabled = true;
            streamDD?.show?.();
        } else {
            appState.streamEnabled = false;
            streamDD?.hide?.();
        }
    }

    // Mount GIGW 3.0 Footer (Phase 22)
    initFooter();
}

/* --------------------------
    Init
-------------------------- */

(async function main() {
    try {
        //logAppState("initial (before data load)");
        const inputJson = await loadInputData();
        initAppUI(inputJson);
    } catch (err) {
        console.error(err);
        // Minimal fail-safe message
        const shell = document.getElementById(appState.ui_appshell || "appshell");
        if (shell) {
            const msg = el("div");
            msg.setAttribute("role", "alert");
            msg.textContent = "App failed to initialize. Check console for details.";
            shell.appendChild(msg);
        }
    }
})();
