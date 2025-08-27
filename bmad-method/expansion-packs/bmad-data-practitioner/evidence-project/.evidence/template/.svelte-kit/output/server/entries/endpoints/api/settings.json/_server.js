import fs from "fs";
import $4S4dR$path1__default from "path";
import gitRemoteOriginUrl from "git-remote-origin-url";
import { d as dev } from "../../../../chunks/environment2.js";
import { logEvent } from "@evidence-dev/telemetry";
import { j as json } from "../../../../chunks/index.js";
const prerender = false;
function getLocalGitRepo() {
  if (fs.existsSync($4S4dR$path1__default.join($4S4dR$path1__default.resolve("../../"), ".git"))) {
    return $4S4dR$path1__default.resolve("../../");
  }
}
async function GET() {
  {
    let settings = {};
    let gitIgnore;
    if (fs.existsSync("evidence.settings.json")) {
      settings = JSON.parse(fs.readFileSync("evidence.settings.json", "utf8"));
    }
    if (fs.existsSync("../../.gitignore")) {
      gitIgnore = fs.readFileSync("../../.gitignore", "utf8");
    }
    try {
      settings.localGitRepo = getLocalGitRepo();
      settings.gitRepo = await gitRemoteOriginUrl();
    } catch {
    }
    return json({ settings, gitIgnore });
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
