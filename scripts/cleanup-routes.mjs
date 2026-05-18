import { readFileSync, writeFileSync } from "node:fs";

const f = "E:/code/javascript/project/PlanningGo/src/server/routes.ts";
const c = readFileSync(f, "utf8");
const lines = c.split("\n");
const result = [];
let skip = false;
let braceDepth = 0;

for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  
  // Detect start of duplicate routes to skip
  const isDuplicate =
    l.includes('app.get("/api/memories"') ||
    l.includes('app.post("/api/memories"') ||
    l.includes('app.delete("/api/memories/:id"') ||
    l.includes('app.get("/api/developer/') ||
    l.includes('app.post("/api/developer/') ||
    l.includes('app.get("/api/privacy/export"') ||
    l.includes('app.delete("/api/privacy/memories"');
  
  if (isDuplicate) {
    skip = true;
    braceDepth = 0;
    // Count braces on this line
    for (const ch of l) {
      if (ch === "{") braceDepth++;
      if (ch === "}") braceDepth--;
    }
    if (braceDepth <= 0 && l.includes(");")) {
      skip = false;
    }
    continue;
  }
  
  if (skip) {
    for (const ch of l) {
      if (ch === "{") braceDepth++;
      if (ch === "}") braceDepth--;
    }
    if (braceDepth <= 0) {
      skip = false;
    }
    continue;
  }
  
  result.push(l);
}

writeFileSync(f, result.join("\n"), "utf8");
console.log("Done. Lines:", result.length);
