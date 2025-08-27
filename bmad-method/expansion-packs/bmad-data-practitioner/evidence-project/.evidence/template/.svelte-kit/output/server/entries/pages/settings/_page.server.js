import { d as dev } from "../../../chunks/environment2.js";
import { f as fail } from "../../../chunks/index.js";
import { logQueryEvent } from "@evidence-dev/telemetry";
const load = async () => {
  {
    const { getDatasourceOptions, getDatasourcePlugins } = await import("@evidence-dev/plugin-connector");
    const datasourceSettings = await getDatasourceOptions();
    const datasourcePlugins = await getDatasourcePlugins();
    const serializedPlugins = Object.fromEntries(
      Object.entries(datasourcePlugins).map(([k, v]) => [
        k,
        {
          ...v,
          factory: void 0,
          testConnection: void 0,
          processSource: void 0
        }
      ])
    );
    return {
      datasourceSettings: datasourceSettings.map((sp) => ({ ...sp, queries: [] })),
      // stripping out queries prevents large files (e.g. duckdb databases) from being sent to the frontend.
      plugins: serializedPlugins
    };
  }
};
const actions = {
  updateSource: async (e) => {
    const formData = Object.fromEntries(await e.request.formData());
    const source = formData.source ? JSON.parse(formData.source) : null;
    if (!source) {
      return fail(400, { message: "Missing required field 'source'" });
    }
    const { updateDatasourceOptions, getDatasourcePlugins, DatasourceSpecFileSchema } = await import("@evidence-dev/plugin-connector");
    const r = DatasourceSpecFileSchema.safeParse(source);
    if (!r.success) {
      return fail(400, r.error.format());
    }
    const datasourcePlugins = await getDatasourcePlugins();
    try {
      return {
        updatedSource: await updateDatasourceOptions(source, datasourcePlugins).then((r2) => ({
          ...r2,
          queries: []
        }))
        // stripping out queries prevents large files (e.g. duckdb databases) from being sent to the frontend.
      };
    } catch (e2) {
      return fail(500, e2.message);
    }
  },
  testSource: async (e) => {
    const formData = Object.fromEntries(await e.request.formData());
    if (!formData?.source) {
      return fail(400, { message: "Missing required field 'source'" });
    }
    const source = JSON.parse(formData.source);
    const {
      getDatasourcePlugins,
      updateDatasourceOptions,
      DatasourceSpecFileSchema,
      DatasourceSpecSchema,
      cleanZodErrors
    } = await import("@evidence-dev/plugin-connector");
    const specFile = DatasourceSpecFileSchema.safeParse(source);
    if (!specFile.success) {
      return fail(400, specFile.error.format());
    }
    const fullSpec = DatasourceSpecSchema.safeParse({
      queries: [],
      // We aren't really worried about queries here
      ...source
    });
    const datasourcePlugins = await getDatasourcePlugins();
    let specData;
    if (!fullSpec.success) {
      const formatted = fullSpec.error.format();
      if (formatted.sourceDirectory?._errors[0] === "Required") {
        console.log(`Created ${specFile.data.name} automatically while testing the connection`);
        specData = await updateDatasourceOptions(source, datasourcePlugins);
      } else {
        console.log(cleanZodErrors(formatted));
        return fail(400, { message: "Connection did not match required format" });
      }
    } else {
      specData = fullSpec.data;
    }
    const databaseType = specData.type;
    const sourceName = specData.name;
    const plugin = datasourcePlugins[databaseType];
    const valid = await plugin.testConnection(specData.options, specData.sourceDirectory);
    if (!plugin) {
      logQueryEvent("db-plugin-unvailable", databaseType, void 0, dev);
      return fail(400, { message: `Plugin for datasource "${databaseType}" not found.` });
    }
    plugin.name = specData.name;
    if (valid !== true) {
      logQueryEvent("db-connection-error", databaseType, sourceName, dev);
      return fail(200, { message: valid.reason });
    } else {
      logQueryEvent("db-connection-success", databaseType, sourceName, dev);
      return {
        success: true
      };
    }
  }
};
export {
  actions,
  load
};
