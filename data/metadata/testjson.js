const fs = require("fs");
const path = require("path");

const source = path.resolve(__dirname, "../json/all_classes.json");
const data = JSON.parse(fs.readFileSync(source, "utf8"));

const classObj = data.find(
    (c) => String(c.classTitle) === String(1)
);
console.log("Class: ",classObj.classTitle);
const subjectObj = classObj.items.find(
    (s) => String(s.subjectID) === String(3)
);
console.log("Subject: ",subjectObj.subjectTitle);

const bookObj = subjectObj.items.find(
    (b) => String(b.bookID) === String(1)
);
console.log("Book: ",bookObj.bookTitle);

bookObj.items.forEach(element => {
    console.log(element.unitName);
});