const fs = require("fs");
const path = require("path");

const source = path.resolve(__dirname, "../json/all_classes.json");
const dest   = path.resolve(__dirname, "../json/all_classes_updated.json");
const data = JSON.parse(fs.readFileSync(source, "utf8"));
fs.writeFileSync(dest, JSON.stringify(data, null, 2));
console.log("Saved:", dest);