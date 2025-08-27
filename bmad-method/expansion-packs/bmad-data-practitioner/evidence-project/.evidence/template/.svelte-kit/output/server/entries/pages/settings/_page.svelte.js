import { c as create_ssr_component } from "../../../chunks/index3.js";
import "../../../chunks/VennDiagram.svelte_svelte_type_style_lang.js";
import "@evidence-dev/component-utilities/globalContexts";
import "@evidence-dev/component-utilities/buildQuery";
import "@evidence-dev/component-utilities/stores";
import "@evidence-dev/component-utilities/icons";
import "devalue";
import "yaml";
import "@astronautlabs/jsonpath";
import "@evidence-dev/query-store";
import "export-to-csv";
import "@evidence-dev/component-utilities/getColumnSummary";
import "@evidence-dev/component-utilities/formatting";
import "echarts";
import "prismjs";
import "tua-body-scroll-lock";
import "@evidence-dev/component-utilities/builtInFormats";
import "ssf";
import "@evidence-dev/component-utilities/echarts";
import "@evidence-dev/component-utilities/echartsCanvasDownload";
import "@evidence-dev/component-utilities/echartsCopy";
import "@evidence-dev/component-utilities/getDistinctValues";
import "@evidence-dev/component-utilities/getDistinctCount";
import "@evidence-dev/component-utilities/getStackPercentages";
import "@evidence-dev/component-utilities/getSortedData";
import "@evidence-dev/component-utilities/getYAxisIndex";
import "@evidence-dev/component-utilities/dateParsing";
import "@evidence-dev/component-utilities/formatTitle";
import "@evidence-dev/component-utilities/checkInputs";
import "@evidence-dev/component-utilities/colours";
import "@evidence-dev/component-utilities/getSeriesConfig";
import "@evidence-dev/component-utilities/replaceNulls";
import "@evidence-dev/component-utilities/getCompletedData";
import "@evidence-dev/component-utilities/getStackedData";
import "@evidence-dev/component-utilities/generateBoxPlotData";
import "@evidence-dev/component-utilities/getColumnExtents";
import "@evidence-dev/component-utilities/echartsMap";
import "echarts-stat";
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { data } = $$props;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0)
    $$bindings.data(data);
  return `${`<p>Settings are only available in development mode.</p>`}`;
});
export {
  Page as default
};
