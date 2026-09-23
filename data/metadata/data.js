const fs = require("fs");
const path = require("path");
const util = require("util");

function toArray(x) {
  if (Array.isArray(x)) return x;
  if (x === null || x === undefined) return [];
  return [x];
}
function ensureArray(obj, key) {
  if (!obj[key]) obj[key] = [];
  if (!Array.isArray(obj[key])) obj[key] = [];
  return obj[key];
}
function transformChapter(ch) {
  if (!ch || typeof ch !== "object") return ch;

  // Detect a "chapter node" by keys you have today
  const hasOldShape =
    ("chapterID" in ch || "chapterName" in ch) &&
    ("resourceType" in ch || "resourseValue" in ch);

  if (!hasOldShape) return ch;

  const type = ch.resourceType ?? "video";
  const rawVals = toArray(ch.resourseValue);

  // If values are strings -> convert to {VideoId: "..."}
  // If values are already objects -> keep them as-is
  const value = rawVals.map((v) => {
    if (typeof v === "string") return { VideoId: v };
    if (v && typeof v === "object") return v;
    return { VideoId: String(v) };
  });

  const out = {
    chapterID: ch.chapterID,
    chapterName: ch.chapterName,
    items: [{ type, value }],
  };

  return out;
}
function transformDataDeep(node) {
  if (Array.isArray(node)) return node.map(transformDataDeep);

  if (node && typeof node === "object") {
    // First, try transform as a chapter
    const maybeChapter = transformChapter(node);
    if (maybeChapter !== node) return maybeChapter;

    // Otherwise walk keys
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      out[k] = transformDataDeep(v);
    }
    return out;
  }

  return node; // primitives
}
function nextId(list, key) {
  if (!Array.isArray(list) || list.length === 0) return 1;
  let max = 0;
  for (const it of list) {
    const v = asNum(it?.[key]);
    if (v != null && v > max) max = v;
  }
  return max + 1;
}
function findClass(all, classTitle) {
  return (all || []).find((c) => String(c.classTitle) === String(classTitle)) || null;
}
function findSubject(classObj, subjectID) {
  return (classObj?.items || []).find((s) => String(s.subjectID) === String(subjectID)) || null;
}
function findBook(subjectObj, bookID) {
  return (subjectObj?.items || []).find((b) => String(b.bookID) === String(bookID)) || null;
}
function findUnit(bookObj, unitID) {
  return (bookObj?.items || []).find((u) => String(u.unitID) === String(unitID)) || null;
}
function findChapterInList(list, chapterID) {
  return (list || []).find((ch) => String(ch.chapterID) === String(chapterID)) || null;
}
function clearSubjectsWithEmptyBookCode(data) {
  if (!Array.isArray(data)) return data;

  data.forEach(cls => {
    if (!Array.isArray(cls.items)) return;

    cls.items.forEach(subject => {
      if (!Array.isArray(subject.items)) return;

      const hasEmptyBookCode = subject.items.some(
        book => book.bookCode === ""
      );

      if (hasEmptyBookCode) {
        subject.items = [];
      }
    });
  });

  return data;
}
function addSubjectToClass(data, classTitle, newSubject) {
  const classObj = data.find(
    cls => String(cls.classTitle) === String(classTitle)
  );
  if (!classObj) return;

  classObj.items ??= [];

  const exists = classObj.items.some(
    s => String(s.subjectID) === String(newSubject.subjectID)
  );

  if (!exists) {
    classObj.items.push(newSubject);
  }
}
function addBookToSubject(data, classTitle, subjectID, newBook) {
  const classObj = data.find(
    cls => String(cls.classTitle) === String(classTitle)
  );
  if (!classObj) return;

  const subjectObj = classObj.items.find(
    sub => String(sub.subjectID) === String(subjectID)
  );
  if (!subjectObj) return;

  subjectObj.items ??= [];

  const exists = subjectObj.items.some(
    b => String(b.bookID) === String(newBook.bookID)
  );

  if (!exists) {
    subjectObj.items.push(newBook);
  }
}
function addUnitToBook(data, classTitle, subjectID, bookID, newUnit) {
  const classObj = data.find(
    cls => String(cls.classTitle) === String(classTitle)
  );
  if (!classObj) return;

  const subjectObj = classObj.items.find(
    sub => String(sub.subjectID) === String(subjectID)
  );
  if (!subjectObj) return;

  const bookObj = subjectObj.items.find(
    book => String(book.bookID) === String(bookID)
  );
  if (!bookObj) return;

  bookObj.items ??= [];

  const exists = bookObj.items.some(
    u => String(u.unitID) === String(newUnit.unitID)
  );

  if (!exists) {
    bookObj.items.push(newUnit);
  }
}
function addChapterToBook(data, classTitle, subjectID, bookID, newChapter) {
  const classObj = data.find(
    cls => String(cls.classTitle) === String(classTitle)
  );
  if (!classObj) return;

  const subjectObj = classObj.items.find(
    sub => String(sub.subjectID) === String(subjectID)
  );
  if (!subjectObj) return;

  const bookObj = subjectObj.items.find(
    book => String(book.bookID) === String(bookID)
  );
  if (!bookObj) return;

  bookObj.items ??= [];

  const exists = bookObj.items.some(
    ch => String(ch.chapterID) === String(newChapter.chapterID)
  );

  if (!exists) {
    bookObj.items.push(newChapter);
  }
}
function getCurrentTargets() {
  const all = appState.allSubjects;
  const cls = findClass(all, appState.selectedClass);
  if (!cls) throw new Error("Class not found in appState.allSubjects");
  const subj = findSubject(cls, appState.defaultSubjectID);
  if (!subj) throw new Error("Subject not found for selectedClass/defaultSubjectID");
  return { all, cls, subj };
}

// ---------- main ----------
const inputFile = path.resolve("../json/all_classes_updated.json");      // <-- your file
const outputFile = path.join("../json/all_classes.json");

const raw = fs.readFileSync(inputFile, "utf8");
const data = JSON.parse(raw);

const transformed = clearSubjectsWithEmptyBookTitle(data);

// ✅ SHOW FULL DEPTH (no collapsing)
console.log(util.inspect(transformed, { depth: null, colors: true, maxArrayLength: null }));

// Or pretty JSON view:
console.log("\n--- JSON (pretty) ---\n");
console.log(JSON.stringify(transformed, null, 2));

// Optional: write to new file
fs.writeFileSync(outputFile, JSON.stringify(transformed, null, 2), "utf8");
console.log("\nSaved:", outputFile);
