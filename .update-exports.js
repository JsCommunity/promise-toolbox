#!/usr/bin/env node

const fs = require("fs");

const PACKAGE_JSON = __dirname + "/package.json";
const PUBLIC_MODULE_RE = /^(?![._])(.+)(?!\.spec)\.js$/;

const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON));
const modules = {};
for (const entry of fs.readdirSync(__dirname)) {
  const matches = PUBLIC_MODULE_RE.exec(entry);
  if (matches !== null) {
    const basename = matches[1];
    if (basename !== "umd") {
      modules[basename === "index" ? "." : "./" + basename] = "./" + entry;
    }
  }
}
pkg.exports = modules;
fs.writeFileSync(PACKAGE_JSON, JSON.stringify(pkg, null, 2) + "\n");
