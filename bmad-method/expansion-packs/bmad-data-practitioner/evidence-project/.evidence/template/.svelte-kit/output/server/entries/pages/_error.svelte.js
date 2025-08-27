import { c as create_ssr_component, v as validate_component, b as validate_store, d as subscribe, e as escape } from "../../chunks/index3.js";
import { p as page } from "../../chunks/stores.js";
import { A as Accordion, a as AccordionItem } from "../../chunks/AccordionItem.js";
import { I as Icon, e as Clipboard } from "../../chunks/VennDiagram.svelte_svelte_type_style_lang.js";
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
const CopyButton = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { textToCopy = "" } = $$props;
  if ($$props.textToCopy === void 0 && $$bindings.textToCopy && textToCopy !== void 0)
    $$bindings.textToCopy(textToCopy);
  return `<div class="${"relative"}">${``}
	<button class="${"bg-white/80 border border-gray-950 rounded p-2 hover:bg-gray-200/80 active:bg-gray-400/80"}" title="${"Copy to Clipboard"}">${validate_component(Icon, "Icon").$$render($$result, { src: Clipboard, class: "w-4 h-4" }, {}, {})}</button></div>`;
});
const Error = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let expanded;
  let $page, $$unsubscribe_page;
  validate_store(page, "page");
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  const expand = (error) => {
    let output = "";
    if (error.stack) {
      output += error.stack;
    }
    if (error.cause) {
      output += "\n\nCaused By:\n	";
      output += expand(error.cause).split("\n").join("\n	");
    }
    return output;
  };
  expanded = expand($page.error);
  $$unsubscribe_page();
  return `${$page.status === 404 ? `<h1 class="${"mt-0 mb-8 py-0"}">Page Not Found</h1>
	<p><span class="${"font-mono text-base"}">${escape($page.status)}</span>: The page
		<span class="${"font-mono text-base bg-gray-200"}">${escape($page.url.pathname)}</span> can&#39;t be found in the project.
	</p>` : `${$page.status === 500 ? `<h1 class="${"mt-0 mb-8 py-0"}">Application Error</h1>

	${$page.error.message ? `<p class="${"font-mono text-sm bg-gray-200 px-2 py-2"}"><span class="${"font-mono text-base"}">${escape($page.status)}</span>:${escape($page.error.message)}</p>` : ``}
	${$page.error.stack || $page.error.cause ? `${validate_component(Accordion, "Accordion").$$render($$result, {}, {}, {
    default: () => {
      return `${validate_component(AccordionItem, "AccordionItem").$$render($$result, { title: "Error Details" }, {}, {
        default: () => {
          return `<div class="${"relative"}"><span class="${"absolute top-2 right-2"}">${validate_component(CopyButton, "CopyButton").$$render($$result, { textToCopy: expanded }, {}, {})}</span>
					<pre class="${"font-mono text-sm bg-gray-200 px-2 py-2 overflow-auto"}">${escape(expanded)}</pre></div>`;
        }
      })}`;
    }
  })}` : ``}` : `<h1>Unknown Error Encountered</h1>
	<span class="${"font-mono text-base"}">HTTP ${escape($page.status)}</span>`}`}`;
});
export {
  Error as default
};
