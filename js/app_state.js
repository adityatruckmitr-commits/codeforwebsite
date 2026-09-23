/* ============================================================
Global App State
Shared across script.js, dropdown.js, tabs.js, etc.
============================================================ */

export const appState = {
    /* ======================
        RAW DATA (JSON driven)
        ====================== */
    themefile: "13-holi-rang.css",
    /* ======================
        RAW DATA (JSON driven)
        ====================== */

    allClasses: null,     // full subj  ects JSON (by class)
    allStreams: null,      // NEP streams list
    data: null,
    /* ======================
        USER SELECTION STATE
        ====================== */
    defaultClass: null,
    defaultSubjectID: null,
    selectedClass: null,
    selectedStream: null,
    selectedSubject: null,
    selectedSubjectID: null,
    selectedBookID: 1,
    selectedBookCode: null,
    selectedUnitID: null,
    selectedChapterID: 3,

    /* ======================
        UI / COMPONENT STATE
        ====================== */
  
    ui_appshell: "appshell",
    ui_toprow: "toprow",
    ui_topmenu: "topmenu",
    ui_sidebar: "menubar",
    ui_contentarea: "content",
    ui_activeTab: null,
    ui_dropdowns: {
        class: "dd-selectclass",
        stream: "dd-selectstream"
    },         // store dropdown instances if needed

    /* ======================
        HELPERS
        ====================== */

    resetSelections() {
        this.selectedClass = null;
        this.selectedStream = null;
        this.selectedSubject = null;
    },
    fetch_subject (data) {
        if (!Array.isArray(data)) {
            console.warn("setSubjects: invalid data", data);
            return;
        }
        this.allClasses = data;
    },
    fetch_nepStream (data) {
        if (!Array.isArray(data)) {
            console.warn("setnepStream: invalid data", data);
            return;
        }
        this.allStreams = data;
    }
};
