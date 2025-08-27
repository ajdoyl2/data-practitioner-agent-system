import { getQueries } from "@evidence-dev/db-orchestrator";
import md5 from "blueimp-md5";
import { GET } from "../endpoints/api/customFormattingSettings.json/_server.js";
import fs from "fs-extra";
import { $ as $3fd82c6737eb24ad$exports } from "../../chunks/index4.js";
const updateDirectoriesandStatus = function(queries, routeHash) {
  let queryDir = `./.evidence-queries/extracted/${routeHash}`;
  fs.ensureDirSync(queryDir);
  if (queries.length === 0) {
    fs.emptyDirSync(queryDir);
  } else {
    fs.writeJSONSync(`${queryDir}/queries.json`, queries);
  }
  return queries.map((query) => {
    return { id: query.id, status: "dynamic query" };
  });
};
const getStatusAndExtractQueries = function(route) {
  let routeHash = md5(route);
  let fileRoute = `./src/pages/${route}/+page.md`;
  let content = fs.readFileSync(fileRoute, "utf-8");
  let partialInjectedContent = $3fd82c6737eb24ad$exports.injectPartials(content);
  let queries = $3fd82c6737eb24ad$exports.extractQueries(partialInjectedContent);
  let queryStatus = updateDirectoriesandStatus(queries, routeHash);
  return queryStatus;
};
const prerender = true;
const trailingSlash = "always";
const system_routes = ["/settings", "/explore"];
async function load({ route, params }) {
  const isUserPage = route.id && system_routes.every((system_route) => !route.id.startsWith(system_route));
  const routeHash = md5(route.id);
  const paramsHash = md5(
    Object.entries(params).sort().map(([key, value]) => `${key}${value}`).join("")
  );
  if (isUserPage) {
    await getStatusAndExtractQueries(route.id);
  }
  const customFormattingSettingsRes = await GET();
  const { customFormattingSettings } = await customFormattingSettingsRes.json();
  return {
    routeHash,
    paramsHash,
    customFormattingSettings,
    isUserPage,
    evidencemeta: getQueries(routeHash)
  };
}
export {
  load,
  prerender,
  trailingSlash
};
