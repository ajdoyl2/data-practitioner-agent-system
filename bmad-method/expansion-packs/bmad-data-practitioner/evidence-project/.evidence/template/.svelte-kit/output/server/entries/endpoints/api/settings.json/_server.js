import fs from "fs";
import "path";
import "git-remote-origin-url";
import { d as dev } from "../../../../chunks/environment2.js";
import { logEvent } from "@evidence-dev/telemetry";
import { j as json } from "../../../../chunks/index.js";
const prerender = false;
async function GET() {
  {
    return new Response(void 0, { status: 404 });
  }
}
function removeFromGitignore(extensions, hasGitIgnore, gitIgnore) {
  if (hasGitIgnore) {
    extensions.forEach((ext) => {
      let regex = new RegExp(`
${ext}(?=
|$)`, "g");
      gitIgnore = gitIgnore.replace(regex, "");
    });
    fs.writeFileSync("../../.gitignore", gitIgnore);
  }
}
function addToGitignore(extensions, gitIgnore) {
  extensions.forEach((ext) => {
    let regex = new RegExp(`
${ext}(?=
|$)`, "g");
    if (!gitIgnore.match(regex)) {
      gitIgnore = gitIgnore + ("\n" + ext);
    }
  });
  fs.writeFileSync("../../.gitignore", gitIgnore);
}
async function POST({ request }) {
  const { settings } = await request.json();
  let originalSettings = {};
  if (fs.existsSync("evidence.settings.json")) {
    originalSettings = JSON.parse(fs.readFileSync("evidence.settings.json", "utf8"));
  }
  if (originalSettings.send_anonymous_usage_stats != "no" && settings.send_anonymous_usage_stats === "no") {
    logEvent("usageStatsDisabled", dev, originalSettings);
  }
  fs.writeFileSync("evidence.settings.json", JSON.stringify(settings));
  let gitIgnore;
  let hasGitIgnore = fs.existsSync("../../.gitignore");
  gitIgnore = hasGitIgnore ? fs.readFileSync("../../.gitignore", "utf8") : "";
  let extensions;
  if (settings.database === "sqlite") {
    extensions = [".db", ".sqlite", ".sqlite3"];
    if (settings.credentials.gitignoreSqlite === false) {
      removeFromGitignore(extensions, hasGitIgnore, gitIgnore);
    } else if (settings.credentials.gitignoreSqlite === true) {
      addToGitignore(extensions, gitIgnore);
    }
  } else if (settings.database === "duckdb") {
    extensions = [".duckdb", ".db"];
    if (settings.credentials.gitignoreDuckdb === false) {
      removeFromGitignore(extensions, hasGitIgnore, gitIgnore);
    } else if (settings.credentials.gitignoreDuckdb === true) {
      addToGitignore(extensions, gitIgnore);
    }
  } else if (settings.database === "csv") {
    extensions = [".csv"];
    if (settings.credentials.gitignoreCsv === false) {
      removeFromGitignore(extensions, hasGitIgnore, gitIgnore);
    } else if (settings.credentials.gitignoreCsv === true) {
      addToGitignore(extensions, gitIgnore);
    }
  }
  return json(settings);
}
export {
  GET,
  POST,
  prerender
};
