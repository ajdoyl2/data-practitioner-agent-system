import { b as building } from "../../chunks/environment.js";
import { initDB, setParquetURLs, updateSearchPath, query } from "@evidence-dev/universal-sql/client-duckdb";
import { profile } from "@evidence-dev/component-utilities/profile";
import { toasts } from "@evidence-dev/component-utilities/stores";
const loadDB = async () => {
  let renderedFiles = {};
  {
    const { readFile } = await import("fs/promises");
    ({ renderedFiles } = JSON.parse(
      await readFile("./static/data/manifest.json", "utf-8").catch(() => "{}")
    ));
  }
  await profile(initDB);
  if (Object.keys(renderedFiles ?? {}).length === 0) {
    console.warn(`Unable to load manifest, do you need to generate sources?`.trim());
    toasts.add(
      {
        id: "MissingManifest",
        status: "warning",
        title: "Missing Manifest",
        message: "Without a manifest file, no data is available"
      },
      1e4
    );
  } else {
    await profile(setParquetURLs, renderedFiles);
    await profile(updateSearchPath, Object.keys(renderedFiles));
  }
};
const database_initialization = profile(loadDB);
const dummy_pages = /* @__PURE__ */ new Map();
const load = async (event) => {
  const {
    data: { customFormattingSettings, routeHash, paramsHash, isUserPage, evidencemeta },
    url,
    fetch
  } = event;
  let data = {};
  const { inputs = {} } = dummy_pages.get(url.pathname) ?? {};
  const is_dummy_page = dummy_pages.has(url.pathname);
  if (!is_dummy_page) {
    dummy_pages.set(url.pathname, { inputs });
    await fetch(url);
    dummy_pages.delete(url.pathname);
  }
  await database_initialization;
  await initDB();
  return (
    /** @type {App.PageData} */
    {
      __db: {
        query(sql, { query_name, callback = (x) => x } = {}) {
          return callback(
            query(sql, {
              route_hash: routeHash,
              additional_hash: paramsHash,
              query_name,
              prerendering: building
            })
          );
        },
        async load() {
          return database_initialization;
        },
        async updateParquetURLs(manifest) {
          const { renderedFiles } = JSON.parse(manifest);
          await profile(setParquetURLs, renderedFiles);
        }
      },
      inputs: new Proxy(inputs, {
        get(target, prop) {
          if (typeof prop === "symbol")
            return void 0;
          if (prop === "then")
            return void 0;
          if (prop === "loading")
            return void 0;
          if (prop === "error")
            return void 0;
          if (prop === "_evidenceColumnTypes")
            return void 0;
          if (prop === "__isQueryStore")
            return false;
          return target[prop] ?? recursiveFillerObject;
        },
        set(target, prop, value) {
          target[prop] = value;
          return true;
        }
      }),
      data,
      customFormattingSettings,
      isUserPage,
      evidencemeta
    }
  );
};
const recursiveFillerObject = new Proxy(
  {},
  {
    get(target, prop) {
      if (prop === "__unset")
        return true;
      if (typeof prop === "symbol")
        return void 0;
      if (prop === "then")
        return void 0;
      if (prop === "loading")
        return void 0;
      if (prop === "error")
        return void 0;
      if (prop === "_evidenceColumnTypes")
        return void 0;
      if (prop === "toString")
        return () => "null";
      return recursiveFillerObject;
    }
  }
);
export {
  load
};
