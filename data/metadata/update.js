function findById(arr, key, value) {
  return arr.find(o => String(o[key]) === String(value));
}
function ensureArray(obj, key) {
  if (!Array.isArray(obj[key])) obj[key] = [];
  return obj[key];
}
function nextId(arr, key) {
  if (!Array.isArray(arr) || arr.length === 0) return 1;
  return Math.max(...arr.map(o => Number(o[key]) || 0)) + 1;
}
function addSubjectToClass(data, classTitle, subject) {
  const cls = findById(data, "classTitle", classTitle);
  if (!cls) throw new Error("Class not found");

  const subjects = ensureArray(cls, "items");

  subject.subjectID ??= nextId(subjects, "subjectID");
  subject.items ??= [];

  subjects.push(subject);
}
function addBookToSubject(data, classTitle, subjectID, book) {
  const cls = findById(data, "classTitle", classTitle);
  if (!cls) throw new Error("Class not found");

  const subject = findById(cls.items, "subjectID", subjectID);
  if (!subject) throw new Error("Subject not found");

  const books = ensureArray(subject, "items");

  book.bookID ??= nextId(books, "bookID");
  book.items ??= [];

  books.push(book);
}
function addUnitsToBook( data, classTitle, subjectID, bookID, unitNames = []) {
  if (!Array.isArray(unitNames) || unitNames.length === 0) return;

  const cls = data.find(c => String(c.classTitle) === String(classTitle));
  if (!cls) throw new Error("Class not found");

  const subject = cls.items.find(s => String(s.subjectID) === String(subjectID));
  if (!subject) throw new Error("Subject not found");

  const book = subject.items.find(b => String(b.bookID) === String(bookID));
  if (!book) throw new Error("Book not found");

  book.items ??= [];

  let nextUnitID =
    book.items.reduce((m, u) => Math.max(m, Number(u.unitID) || 0), 0) + 1;

  unitNames.forEach(name => {
    book.items.push({
      unitID: nextUnitID++,
      unitName: name,
      items: []
    });
  });
}
function addChaptersToBook(data, classTitle, subjectID, bookID, chapterNames = []) {
  if (!Array.isArray(chapterNames) || chapterNames.length === 0) return;

  const cls = data.find(c => String(c.classTitle) === String(classTitle));
  if (!cls) throw new Error("Class not found");

  const subject = cls.items.find(s => String(s.subjectID) === String(subjectID));
  if (!subject) throw new Error("Subject not found");

  const book = subject.items.find(b => String(b.bookID) === String(bookID));
  if (!book) throw new Error("Book not found");

  book.items ??= [];

  let nextChapterID =
    book.items.reduce((m, c) => Math.max(m, Number(c.chapterID) || 0), 0) + 1;

  chapterNames.forEach(name => {
    book.items.push({
      chapterID: nextChapterID++,
      chapterName: name,
      items: []
    });
  });
}
function addChaptersToUnit(data, classTitle, subjectID, bookID, unitID, chapterNames = []) {
  if (!Array.isArray(chapterNames) || chapterNames.length === 0) return;

  const cls = data.find(c => String(c.classTitle) === String(classTitle));
  if (!cls) throw new Error("Class not found");

  const subject = cls.items.find(s => String(s.subjectID) === String(subjectID));
  if (!subject) throw new Error("Subject not found");

  const book = subject.items.find(b => String(b.bookID) === String(bookID));
  if (!book) throw new Error("Book not found");

  const unit = book.items.find(u => String(u.unitID) === String(unitID));
  if (!unit) throw new Error("Unit not found");

  unit.items ??= [];

  let nextChapterID =
    unit.items.reduce((m, c) => Math.max(m, Number(c.chapterID) || 0), 0) + 1;

  chapterNames.forEach(name => {
    unit.items.push({
      chapterID: nextChapterID++,
      chapterName: name,
      items: []
    });
  });
}
function addResourceToChapter( data, classTitle, subjectID, bookID, chapterID, resource, unitID = null) {
  const cls = findById(data, "classTitle", classTitle);
  const subject = findById(cls.items, "subjectID", subjectID);
  const book = findById(subject.items, "bookID", bookID);
  if (!book) throw new Error("Book not found");

  let chapter;

  if (unitID != null) {
    const unit = findById(book.items, "unitID", unitID);
    if (!unit) throw new Error("Unit not found");
    chapter = findById(unit.items, "chapterID", chapterID);
  } else {
    chapter = findById(book.items, "chapterID", chapterID);
  }

  if (!chapter) throw new Error("Chapter not found");

  const resources = ensureArray(chapter, "items");

  resources.push({
    type: resource.type,
    value: Array.isArray(resource.value) ? resource.value : []
  });
}
const RESOURCE_VIDEO = {
  type: "video",
  value: null
};

const RESOURCE_PLAYLIST = {
  type: "playlist",
  value: null
};

const RESOURCE_TEXT_LIST = {
  type: "text-list",
  value: null
};

const RESOURCE_CSV_TABLE = {
  type: "csv-table",
  value: null
};

const RESOURCE_FLOWCHART = {
  type: "flowchart",
  value: null
};

const RESOURCE_PERIODIC_TABLE = {
  type: "periodictable",
  value: null
};

const RESOURCE_TIMELINE = {
  type: "timeline",
  value: null
};

const fs = require("fs");
const path = require("path");

const dest = path.resolve(__dirname, "../json/all_classes.json");
const source   = path.resolve(__dirname, "../json/all_classes_updated.json");
//console.log(source);
const data = JSON.parse(fs.readFileSync(source, "utf8"));
//console.log(JSON.stringify(data, null, 2));
addUnitsToBook(data,2,3,1,["Fun with Friends","Welcome to My World","Going Places","Life Around Us","Harmony"]);


fs.writeFileSync(dest, JSON.stringify(data, null, 2));
console.log("Saved:", dest);