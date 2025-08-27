import { c as create_ssr_component, s as setContext, j as getContext, b as subscribe, f as add_attribute, e as escape, v as validate_component, k as compute_slots } from "../../chunks/index3.js";
import { p as page } from "../../chunks/stores.js";
import { w as writable } from "../../chunks/index2.js";
import { I as Icon, a as ChevronUp, b as ChevronDown, c as Clipboard } from "../../chunks/Icon.js";
import "../../chunks/VennDiagram.svelte_svelte_type_style_lang.js";
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
const Accordion = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  const activeItem = writable(-1);
  function setActiveItem(index) {
    activeItem.update((current) => current === index ? -1 : index);
  }
  setContext("accordion", { setActiveItem, activeItem });
  return `<div class="${"my-6 divide-y border border-neutral-200 rounded"}"><div class="${"overflow-hidden divide-y rounded"}">${slots.default ? slots.default({}) : ``}</div></div>`;
});
const AccordionItem = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let visible;
  let contentHeight;
  let $$slots = compute_slots(slots);
  let $activeItem, $$unsubscribe_activeItem;
  let { title = "" } = $$props;
  let { small = false } = $$props;
  const { setActiveItem, activeItem } = getContext("accordion");
  $$unsubscribe_activeItem = subscribe(activeItem, (value) => $activeItem = value);
  let index;
  let node;
  let contentContainer;
  if ($$props.title === void 0 && $$bindings.title && title !== void 0)
    $$bindings.title(title);
  if ($$props.small === void 0 && $$bindings.small && small !== void 0)
    $$bindings.small(small);
  visible = index === $activeItem;
  contentHeight = "0";
  $$unsubscribe_activeItem();
  return `<div class="${"accordion-item"}"${add_attribute("this", node, 0)}><button class="${[
    "flex justify-between items-center w-full box-border px-4 bg-white border-none cursor-pointer transition ease-in-out duration-300 hover:bg-gray-100 focus:outline-none",
    (!small ? "text-lg" : "") + " " + (!small ? "py-3" : "") + " " + (small ? "py-1" : "")
  ].join(" ").trim()}" type="${"button"}">${$$slots.title ? `${slots.title ? slots.title({}) : ``}` : `<h3>${escape(title)}</h3>`}
		${visible ? `${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      src: ChevronUp,
      class: "text-gray-600 w-6 h-6"
    },
    {},
    {}
  )}` : `${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      src: ChevronDown,
      class: "text-gray-600 w-6 h-6"
    },
    {},
    {}
  )}`}</button>
	<div class="${"text-base overflow-auto transition-all duration-300 ease-in-out"}" style="${"height: " + escape(visible ? contentHeight : "0", true) + "px"}">
		<div class="${"p-5"}"${add_attribute("this", contentContainer, 0)}>${slots.default ? slots.default({}) : ``}</div></div></div>`;
});
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
