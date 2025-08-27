import { c as create_ssr_component, o as onDestroy, v as validate_component, g as add_attribute, e as escape, n as null_to_empty, f as each, b as validate_store, d as subscribe, s as setContext, l as add_styles, p as merge_ssr_styles, q as globals } from "../../../../chunks/index3.js";
import { I as Icon, g as ChevronUp, h as ChevronDown, i as Search, j as ChevronsLeft, k as ChevronLeft, C as ChevronRight, l as ChevronsRight } from "../../../../chunks/VennDiagram.svelte_svelte_type_style_lang.js";
import "@evidence-dev/component-utilities/globalContexts";
import "@evidence-dev/component-utilities/buildQuery";
import "@evidence-dev/component-utilities/stores";
import "@evidence-dev/component-utilities/icons";
import "devalue";
import "yaml";
import "@astronautlabs/jsonpath";
import "@evidence-dev/query-store";
import { ExportToCsv } from "export-to-csv";
import getColumnSummary from "@evidence-dev/component-utilities/getColumnSummary";
import { formatValue, getFormatObjectFromString } from "@evidence-dev/component-utilities/formatting";
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
import { convertColumnToDate } from "@evidence-dev/component-utilities/dateParsing";
import "@evidence-dev/component-utilities/formatTitle";
import checkInputs from "@evidence-dev/component-utilities/checkInputs";
import "@evidence-dev/component-utilities/colours";
import "@evidence-dev/component-utilities/getSeriesConfig";
import "@evidence-dev/component-utilities/replaceNulls";
import "@evidence-dev/component-utilities/getCompletedData";
import "@evidence-dev/component-utilities/getStackedData";
import "@evidence-dev/component-utilities/generateBoxPlotData";
import "@evidence-dev/component-utilities/getColumnExtents";
import { w as writable } from "../../../../chunks/index2.js";
import { b as building } from "../../../../chunks/environment.js";
import Fuse from "fuse.js";
import "@evidence-dev/component-utilities/echartsMap";
import "echarts-stat";
const Skeleton = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<div class="${"animate-pulse h-full w-full my-2"}"><span class="${"sr-only"}">Loading...</span>
	<div class="${"h-full w-full bg-gray-200 rounded-md dark:bg-gray-400"}"></div></div>`;
});
const QueryLoad = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { data } = $$props;
  let unsub = () => {
  };
  let _data;
  onDestroy(unsub);
  if ($$props.data === void 0 && $$bindings.data && data !== void 0)
    $$bindings.data(data);
  {
    if (data?.__isQueryStore) {
      data.fetch();
      unsub();
      unsub = data.subscribe((v) => {
        _data = v;
      });
    }
  }
  return `${!data || !data?.__isQueryStore ? `
	${slots.default ? slots.default({ loaded: data }) : ``}` : `${!_data || !_data?.loaded && !_data.error ? `
	${slots.skeleton ? slots.skeleton({ loaded: data }) : `
		<div class="${"w-full h-64"}">${validate_component(Skeleton, "Skeleton").$$render($$result, {}, {}, {})}</div>
	`}` : `${_data.error ? `${slots.error ? slots.error({ loaded: data }) : ``}` : `${slots.default ? slots.default({ loaded: _data }) : ``}`}`}`}`;
});
const css$3 = {
  code: "button.s-AtM3RvOQBcTb svg{stroke:var(--grey-400);margin-top:auto;margin-bottom:auto;transition:stroke 200ms}button.s-AtM3RvOQBcTb{display:flex;cursor:pointer;font-family:var(--ui-font-family);font-size:1em;color:var(--grey-400);justify-items:flex-end;align-items:baseline;background-color:transparent;border:none;padding:0;margin:0 5px;gap:3px;transition:color 200ms;-moz-user-select:none;-webkit-user-select:none;-o-user-select:none;user-select:none}button.s-AtM3RvOQBcTb:hover{color:var(--blue-600);transition:color 200ms}button.s-AtM3RvOQBcTb:hover svg{stroke:var(--blue-600);transition:stroke 200ms}@media(max-width: 600px){button.s-AtM3RvOQBcTb{display:none}}@media print{button.s-AtM3RvOQBcTb{display:none}}",
  map: null
};
const DownloadData = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { data } = $$props;
  let { queryID } = $$props;
  let { text = "Download" } = $$props;
  let { display } = $$props;
  let { downloadData = (data2) => {
    const options = {
      fieldSeparator: ",",
      quoteStrings: '"',
      decimalSeparator: ".",
      showLabels: true,
      showTitle: false,
      filename: queryID ?? "evidence_download",
      useTextFile: false,
      useBom: true,
      useKeysAsHeaders: true
    };
    const data_copy = JSON.parse(JSON.stringify(Array.from(data2)));
    const csvExporter = new ExportToCsv(options);
    csvExporter.generateCsv(data_copy);
  } } = $$props;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0)
    $$bindings.data(data);
  if ($$props.queryID === void 0 && $$bindings.queryID && queryID !== void 0)
    $$bindings.queryID(queryID);
  if ($$props.text === void 0 && $$bindings.text && text !== void 0)
    $$bindings.text(text);
  if ($$props.display === void 0 && $$bindings.display && display !== void 0)
    $$bindings.display(display);
  if ($$props.downloadData === void 0 && $$bindings.downloadData && downloadData !== void 0)
    $$bindings.downloadData(downloadData);
  $$result.css.add(css$3);
  return `${display ? `<div><button type="${"button"}"${add_attribute("aria-label", text, 0)} class="${escape(null_to_empty($$props.class), true) + " s-AtM3RvOQBcTb"}"><span>${escape(text)}</span>
			${slots.default ? slots.default({}) : `
				<svg width="${"12"}" height="${"12"}" viewBox="${"0 0 24 24"}" fill="${"none"}" stroke-width="${"2"}" stroke-linecap="${"round"}" stroke-linejoin="${"round"}"><path d="${"M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 9l-5 5-5-5M12 12.8V2.5"}"></path></svg>
			`}</button></div>` : ``}`;
});
const SortIcon = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { ascending } = $$props;
  if ($$props.ascending === void 0 && $$bindings.ascending && ascending !== void 0)
    $$bindings.ascending(ascending);
  return `${ascending ? `${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      src: ChevronUp,
      class: "w-3 h-3 inline mb-0.5"
    },
    {},
    {}
  )}` : `${validate_component(Icon, "Icon").$$render(
    $$result,
    {
      src: ChevronDown,
      class: "w-3 h-3 inline mb-0.5"
    },
    {},
    {}
  )}`}`;
});
const propKey = Symbol();
const css$2 = {
  code: ".credentials-link.s-bDSO5QIBxjkD{color:var(--blue-500);text-decoration:none}.credentials-link.s-bDSO5QIBxjkD:hover{color:var(--blue-700)}",
  map: null
};
const DevMissingCredentialsError = "SQL Error: Missing datasource connection.";
const ErrorChart = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { error } = $$props;
  let { chartType } = $$props;
  if ($$props.error === void 0 && $$bindings.error && error !== void 0)
    $$bindings.error(error);
  if ($$props.chartType === void 0 && $$bindings.chartType && chartType !== void 0)
    $$bindings.chartType(chartType);
  $$result.css.add(css$2);
  return `<div width="${"100%"}" class="${"grid grid-rows-auto box-content grid-cols-1 justify-center bg-red-50 text-grey-700 font-ui font-normal rounded border border-red-200 min-h-[150px] py-5 px-8 my-5 print:break-inside-avoid"}"><div class="${"m-auto w-full"}"><div class="${"font-bold text-center text-lg"}">${escape(chartType)}</div>
		<div class="${[
    "text-center [word-wrap:break-work] text-xs",
    chartType.includes("Value") ? "w-[7.8em]" : ""
  ].join(" ").trim()}">${escape(error)}
			${error === DevMissingCredentialsError ? `<br><a class="${"credentials-link s-bDSO5QIBxjkD"}" href="${"/settings"}">Add credentials →</a>` : `${``}`}</div></div>
</div>`;
});
const css$1 = {
  code: ".search-container.s-c7n_00y0bqOF{width:30%;display:block;align-items:center;border:1px solid var(--grey-300);border-radius:4px;height:22px;position:relative;margin:25px 3px 10px 3px;box-sizing:content-box}.search-icon.s-c7n_00y0bqOF{height:16px;width:16px;padding-left:3px;margin:0;position:absolute;top:50%;transform:translateY(-50%);-ms-transform:translateY(-50%);color:var(--grey-400);box-sizing:content-box}.search-bar.s-c7n_00y0bqOF{margin:0;position:absolute;top:50%;transform:translateY(-50%);-ms-transform:translateY(-50%);border:none;padding-left:23px;color:var(--grey-600);font-size:9pt;width:calc(100% - 30px);font-family:Arial;line-height:normal}input.search-bar.s-c7n_00y0bqOF::-moz-placeholder{color:var(--grey-700)}input.search-bar.s-c7n_00y0bqOF::placeholder{color:var(--grey-700)}.s-c7n_00y0bqOF:focus{outline:none}@media(max-width: 600px){.search-container.s-c7n_00y0bqOF{width:98%;height:28px}.search-bar.s-c7n_00y0bqOF{font-size:16px;width:calc(100% - 40px)}}@media print{.search-container.s-c7n_00y0bqOF{visibility:hidden}}",
  map: null
};
const SearchBar = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { placeholder = "Search" } = $$props;
  let { value } = $$props;
  let { searchFunction } = $$props;
  if ($$props.placeholder === void 0 && $$bindings.placeholder && placeholder !== void 0)
    $$bindings.placeholder(placeholder);
  if ($$props.value === void 0 && $$bindings.value && value !== void 0)
    $$bindings.value(value);
  if ($$props.searchFunction === void 0 && $$bindings.searchFunction && searchFunction !== void 0)
    $$bindings.searchFunction(searchFunction);
  $$result.css.add(css$1);
  return `<div class="${"search-container s-c7n_00y0bqOF"}"><input class="${"search-bar s-c7n_00y0bqOF"}" type="${"text"}"${add_attribute("placeholder", placeholder, 0)}${add_attribute("value", value, 0)}>
	<div class="${"search-icon s-c7n_00y0bqOF"}">${validate_component(Icon, "Icon").$$render($$result, { src: Search, class: "pl-0.5" }, {}, {})}</div>
</div>`;
});
const InvisibleLinks = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { data } = $$props;
  let { link } = $$props;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0)
    $$bindings.data(data);
  if ($$props.link === void 0 && $$bindings.link && link !== void 0)
    $$bindings.link(link);
  return `
${building ? `${each(Array.from(new Set(data.map((row) => row[link]))), (href) => {
    return `<a${add_attribute("href", href, 0)} class="${"hidden"}" aria-hidden="${"true"}">${escape("")}</a>`;
  })}` : ``}`;
});
const css = {
  code: ".table-container.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B{font-size:9.5pt;width:97%}.container.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B{width:100%;overflow-x:auto;scrollbar-width:thin;scrollbar-color:var(--scrollbar-color) var(--scrollbar-track-color);background-color:white}:root{--scrollbar-track-color:transparent;--scrollbar-color:rgba(0, 0, 0, 0.2);--scrollbar-active-color:rgba(0, 0, 0, 0.4);--scrollbar-size:0.75rem;--scrollbar-minlength:1.5rem}.container.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B::-webkit-scrollbar{height:var(--scrollbar-size);width:var(--scrollbar-size)}.container.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B::-webkit-scrollbar-track{background-color:var(--scrollbar-track-color)}.container.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B::-webkit-scrollbar-thumb{background-color:var(--scrollbar-color);border-radius:7px;background-clip:padding-box}.container.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B::-webkit-scrollbar-thumb:hover{background-color:var(--scrollbar-active-color)}.container.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B::-webkit-scrollbar-thumb:vertical{min-height:var(--scrollbar-minlength);border:3px solid transparent}.container.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B::-webkit-scrollbar-thumb:horizontal{min-width:var(--scrollbar-minlength);border:3px solid transparent}table.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B{display:table;width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}th.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B,td.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B{padding:2px 8px;white-space:nowrap;overflow:hidden}th.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B{border-bottom:1px solid var(--grey-600)}.row-lines.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B{border-bottom:thin solid var(--grey-200)}.shaded-row.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B{background-color:var(--grey-100)}.string.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B{text-align:left}.date.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B{text-align:left}.number.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B{text-align:right}.boolean.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B{text-align:left}.sort-icon.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B{width:12px;height:12px;vertical-align:middle}.icon-container.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B{display:inline-flex;align-items:center}.page-changer.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B{padding:0;color:var(--grey-400);height:1.1em;width:1.1em}.index.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B{color:var(--grey-300);text-align:left;max-width:-moz-min-content;max-width:min-content}.pagination.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B{font-size:12px;display:flex;align-items:center;justify-content:space-between;height:2em;font-family:var(--ui-font-family);color:var(--grey-500);-webkit-user-select:none;-moz-user-select:none;user-select:none;text-align:right;margin-top:0.5em;margin-bottom:1.8em;font-variant-numeric:tabular-nums}.page-labels.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B{display:flex;justify-content:flex-start;align-items:center;gap:3px}.selected.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B{background:var(--grey-200);border-radius:4px}.page-changer.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B{font-size:20px;background:none;border:none;cursor:pointer;transition:color 200ms}.page-changer.hovering.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B{color:var(--blue-600);transition:color 200ms}.page-changer.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B:disabled{cursor:auto;color:var(--grey-300);-webkit-user-select:none;-moz-user-select:none;user-select:none;transition:color 200ms}.page-icon.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B{height:1em;width:1em}.page-input.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B{width:23px;text-align:center;padding:0;margin:0;border:1px solid transparent;border-radius:4px;font-size:12px;color:var(--grey-500)}.table-footer.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B{display:flex;justify-content:flex-end;align-items:center;margin:10px 0px;font-size:12px;height:9px}.page-input.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B::-webkit-outer-spin-button,.page-input.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}.page-input[type='number'].s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B{-moz-appearance:textfield;-webkit-appearance:textfield;appearance:textfield}.page-input.hovering.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B{border:1px solid var(--grey-200)}.page-input.error.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B{border:1px solid var(--red-600)}.page-input.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B::-moz-placeholder{color:var(--grey-500)}.page-input.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B::placeholder{color:var(--grey-500)}button.s-6Ur4xdtfKK2B:enabled>.page-icon.s-6Ur4xdtfKK2B:hover{color:var(--blue-800)}.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B:focus{outline:none}.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B::-moz-placeholder{color:var(--grey-400);opacity:1}.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B::placeholder{color:var(--grey-400);opacity:1}.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B:-ms-input-placeholder{color:var(--grey-400)}.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B::-ms-input-placeholder{color:var(--grey-400)}th.type-indicator.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B{color:var(--grey-400);font-weight:normal;font-style:italic}.row-link.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B{cursor:pointer}.row-link.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B:hover{--tw-bg-opacity:1;background-color:rgb(239 246 255 / var(--tw-bg-opacity))}.noresults.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B{display:none;color:var(--grey-400);text-align:center;margin-top:5px}.shownoresults.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B{display:block}.print-page-count.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B{display:none}@media(max-width: 600px){.page-changer.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B{height:1.2em;width:1.2em}.page-icon.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B{height:1.2em;width:1.2em}.page-count.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B{font-size:1.1em}.page-input.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B{font-size:1.1em}}@media print{.avoidbreaks.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B{-moz-column-break-inside:avoid;break-inside:avoid}.pagination.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B{-moz-column-break-inside:avoid;break-inside:avoid}.page-changer.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B{display:none}.page-count.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B{display:none}.print-page-count.s-6Ur4xdtfKK2B.s-6Ur4xdtfKK2B{display:inline}}",
  map: null
};
function dataSubset(data, selectedCols) {
  return data.map((obj) => {
    var toReturn = {};
    selectedCols.forEach((key) => toReturn[key] = obj[key]);
    return toReturn;
  });
}
const DataTable = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let fuse;
  let runSearch;
  let $props, $$unsubscribe_props;
  let props = writable({});
  validate_store(props, "props");
  $$unsubscribe_props = subscribe(props, (value) => $props = value);
  setContext(propKey, props);
  let { data } = $$props;
  let { rows = 10 } = $$props;
  let paginated;
  let { rowNumbers = false } = $$props;
  let hovering = false;
  let marginTop = "1.5em";
  let marginBottom = "1em";
  let paddingBottom = "0em";
  let { search = false } = $$props;
  let { sortable = true } = $$props;
  let { downloadable = true } = $$props;
  let { link = void 0 } = $$props;
  let { showLinkCol = false } = $$props;
  let error = void 0;
  props.update((d) => {
    return { ...d, data, columns: [] };
  });
  let { rowShading = false } = $$props;
  let { rowLines = true } = $$props;
  let { headerColor } = $$props;
  let { headerFontColor = "var(--grey-900)" } = $$props;
  let { formatColumnTitles = true } = $$props;
  let columnSummary;
  let index = 0;
  let inputPage = null;
  let searchValue = "";
  let filteredData;
  let showNoResults = false;
  let sortBy = { col: null, ascending: null };
  let totalRows;
  let displayedData = filteredData;
  let pageCount;
  let currentPage = 1;
  let displayedPageLength = 0;
  function safeExtractColumn(column) {
    const foundCols = columnSummary.filter((d) => d.id === column.id);
    if (foundCols === void 0 || foundCols.length !== 1) {
      error = column.id === void 0 ? new Error(`please add an "id" property to all the <Column ... />`) : new Error(`column with id: "${column.id}" not found`);
      {
        throw error;
      }
    }
    return foundCols[0];
  }
  let tableData;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0)
    $$bindings.data(data);
  if ($$props.rows === void 0 && $$bindings.rows && rows !== void 0)
    $$bindings.rows(rows);
  if ($$props.rowNumbers === void 0 && $$bindings.rowNumbers && rowNumbers !== void 0)
    $$bindings.rowNumbers(rowNumbers);
  if ($$props.search === void 0 && $$bindings.search && search !== void 0)
    $$bindings.search(search);
  if ($$props.sortable === void 0 && $$bindings.sortable && sortable !== void 0)
    $$bindings.sortable(sortable);
  if ($$props.downloadable === void 0 && $$bindings.downloadable && downloadable !== void 0)
    $$bindings.downloadable(downloadable);
  if ($$props.link === void 0 && $$bindings.link && link !== void 0)
    $$bindings.link(link);
  if ($$props.showLinkCol === void 0 && $$bindings.showLinkCol && showLinkCol !== void 0)
    $$bindings.showLinkCol(showLinkCol);
  if ($$props.rowShading === void 0 && $$bindings.rowShading && rowShading !== void 0)
    $$bindings.rowShading(rowShading);
  if ($$props.rowLines === void 0 && $$bindings.rowLines && rowLines !== void 0)
    $$bindings.rowLines(rowLines);
  if ($$props.headerColor === void 0 && $$bindings.headerColor && headerColor !== void 0)
    $$bindings.headerColor(headerColor);
  if ($$props.headerFontColor === void 0 && $$bindings.headerFontColor && headerFontColor !== void 0)
    $$bindings.headerFontColor(headerFontColor);
  if ($$props.formatColumnTitles === void 0 && $$bindings.formatColumnTitles && formatColumnTitles !== void 0)
    $$bindings.formatColumnTitles(formatColumnTitles);
  $$result.css.add(css);
  let $$settled;
  let $$rendered;
  do {
    $$settled = true;
    rows = Number.parseInt(rows);
    showLinkCol = showLinkCol === "true" || showLinkCol === true;
    {
      try {
        error = void 0;
        checkInputs(data);
        columnSummary = getColumnSummary(data, "array");
        let dateCols = columnSummary.filter((d) => d.type === "date");
        dateCols = dateCols.map((d) => d.id);
        if (dateCols.length > 0) {
          for (let i = 0; i < dateCols.length; i++) {
            data = convertColumnToDate(data, dateCols[i]);
          }
        }
        for (let i = 0; i < columnSummary.length; i++) {
          columnSummary[i].show = showLinkCol === false && columnSummary[i].id === link ? false : true;
        }
      } catch (e) {
        error = e.message;
        {
          throw error;
        }
      }
    }
    {
      paginated = data.length > rows;
    }
    rowNumbers = rowNumbers === "true" || rowNumbers === true;
    search = search === "true" || search === true;
    sortable = sortable === "true" || sortable === true;
    downloadable = downloadable === "true" || downloadable === true;
    rowShading = rowShading === "true" || rowShading === true;
    rowLines = rowLines === "true" || rowLines === true;
    formatColumnTitles = formatColumnTitles === "true" || formatColumnTitles === true;
    filteredData = data;
    fuse = new Fuse(
      data,
      {
        getFn: (row, [path]) => {
          const summary = columnSummary?.find((d) => d.id === path) ?? {};
          return summary.type === "date" && row[summary.id] != null && row[summary.id] instanceof Date && !isNaN(row[summary.id].getTime()) ? row[summary.id].toISOString() : row[summary.id]?.toString() ?? "";
        },
        keys: columnSummary?.map((d) => d.id) ?? [],
        threshold: 0.4
      }
    );
    runSearch = (searchValue2) => {
      if (searchValue2 !== "") {
        index = 0;
        inputPage = null;
        filteredData = fuse.search(searchValue2).map((x) => x.item);
        showNoResults = filteredData.length === 0;
      } else {
        filteredData = data;
        showNoResults = false;
        index = 0;
        inputPage = null;
      }
    };
    {
      sortBy = { col: null, ascending: null };
    }
    totalRows = filteredData.length;
    currentPage = Math.ceil((index + rows) / rows);
    {
      if (paginated) {
        pageCount = Math.ceil(filteredData.length / rows);
        displayedData = filteredData.slice(index, index + rows);
        displayedPageLength = displayedData.length;
      } else {
        currentPage = 1;
        displayedData = filteredData;
      }
    }
    tableData = $props.columns.length > 0 ? dataSubset(data, $props.columns.map((d) => d.id)) : data;
    $$rendered = `${error === void 0 ? `${slots.default ? slots.default({}) : ``}

	${link ? `${validate_component(InvisibleLinks, "InvisibleLinks").$$render($$result, { data, link }, {}, {})}` : ``}
	${each($props.columns.filter((column) => column.contentType === "link"), (column) => {
      return `${validate_component(InvisibleLinks, "InvisibleLinks").$$render($$result, { data, link: column.id }, {}, {})}`;
    })}

	<div class="${"table-container s-6Ur4xdtfKK2B"}"${add_styles({
      "margin-top": marginTop,
      "margin-bottom": marginBottom,
      "padding-bottom": paddingBottom
    })}>${search ? `${validate_component(SearchBar, "SearchBar").$$render(
      $$result,
      {
        searchFunction: runSearch,
        value: searchValue
      },
      {
        value: ($$value) => {
          searchValue = $$value;
          $$settled = false;
        }
      },
      {}
    )}` : ``}
		<div class="${"container s-6Ur4xdtfKK2B"}"><table class="${"s-6Ur4xdtfKK2B"}"><thead class="${"s-6Ur4xdtfKK2B"}"><tr class="${"s-6Ur4xdtfKK2B"}">${rowNumbers ? `<th class="${"index w-[2%] s-6Ur4xdtfKK2B"}"${add_styles({ "background-color": headerColor })}></th>` : ``}
						${$props.columns.length > 0 ? `${each($props.columns, (column) => {
      return `<th class="${escape(null_to_empty(safeExtractColumn(column).type), true) + " s-6Ur4xdtfKK2B"}"${add_styles({
        "text-align": column.align,
        "color": headerFontColor,
        "background-color": headerColor,
        "cursor": sortable ? "pointer" : "auto"
      })}>${escape(column.title ? column.title : formatColumnTitles ? safeExtractColumn(column).title : safeExtractColumn(column).id)}
									${sortBy.col === column.id ? `${validate_component(SortIcon, "SortIcon").$$render($$result, { ascending: sortBy.ascending }, {}, {})}` : ``}
								</th>`;
    })}` : `${each(columnSummary.filter((d) => d.show === true), (column) => {
      return `<th class="${escape(null_to_empty(column.type), true) + " s-6Ur4xdtfKK2B"}"${add_styles({
        "color": headerFontColor,
        "background-color": headerColor,
        "cursor": sortable ? "pointer" : "auto"
      })}><span class="${"col-header s-6Ur4xdtfKK2B"}">${escape(formatColumnTitles ? column.title : column.id)}</span>
									${sortBy.col === column.id ? `${validate_component(SortIcon, "SortIcon").$$render($$result, { ascending: sortBy.ascending }, {}, {})}` : ``}
								</th>`;
    })}`}</tr></thead>

				${each(displayedData, (row, i) => {
      return `<tr class="${[
        "s-6Ur4xdtfKK2B",
        (rowShading && i % 2 === 0 ? "shaded-row" : "") + " " + (link != void 0 ? "row-link" : "")
      ].join(" ").trim()}">${rowNumbers ? `<td class="${["index w-[2%] s-6Ur4xdtfKK2B", rowLines ? "row-lines" : ""].join(" ").trim()}">${i === 0 ? `${escape((index + i + 1).toLocaleString())}` : `${escape((index + i + 1).toLocaleString())}`}
							</td>` : ``}

						${$props.columns.length > 0 ? `${each($props.columns, (column) => {
        let column_min = column.colorMin ?? safeExtractColumn(column).columnUnitSummary.min, column_max = column.colorMax ?? safeExtractColumn(column).columnUnitSummary.max, is_nonzero = column_max - column_min !== 0 && !isNaN(column_max) && !isNaN(column_min);
        return `
								
								
								<td class="${[
          escape(null_to_empty(safeExtractColumn(column).type), true) + " s-6Ur4xdtfKK2B",
          rowLines ? "row-lines" : ""
        ].join(" ").trim()}"${add_styles(merge_ssr_styles(
          escape(
            column.contentType === "colorscale" && is_nonzero ? ` background-color: ${column.useColor} ${(row[column.id] - column_min) / (column_max - column_min)})` : "",
            true
          ),
          {
            "text-align": column.align,
            "height": column.height,
            "width": column.width,
            "white-space": column.wrap ? "normal" : "nowrap"
          }
        ))}>${column.contentType === "image" && row[column.id] !== void 0 ? `<img${add_attribute("src", row[column.id], 0)}${add_attribute(
          "alt",
          column.alt ? row[column.alt] : row[column.id].replace(/^(.*[/])/g, "").replace(/[.][^.]+$/g, ""),
          0
        )} class="${"mx-auto my-2 max-w-[unset] rounded-[unset] s-6Ur4xdtfKK2B"}"${add_styles({
          "height": column.height,
          "width": column.width
        })}>` : `${column.contentType === "link" && row[column.id] !== void 0 ? `
										${column.linkLabel != void 0 && row[column.linkLabel] == void 0 && column.linkLabel in row ? `-` : `<a${add_attribute("href", row[column.id], 0)}${add_attribute("target", column.openInNewTab ? "_blank" : "", 0)} class="${"text-blue-600 hover:text-blue-700 transition-colors duration-200 s-6Ur4xdtfKK2B"}">${column.linkLabel != void 0 ? `
													${row[column.linkLabel] != void 0 ? (() => {
          let labelSummary = safeExtractColumn({ id: column.linkLabel });
          return `
														${escape(formatValue(
            row[column.linkLabel],
            column.fmt ? getFormatObjectFromString(column.fmt, labelSummary.format.valueType) : labelSummary.format,
            labelSummary.columnUnitSummary
          ))}
														`;
        })() : `${escape(column.linkLabel)}`}` : (() => {
          let columnSummary2 = safeExtractColumn(column);
          return `
													
													${escape(formatValue(
            row[column.id],
            column.fmt ? getFormatObjectFromString(column.fmt, columnSummary2.format.valueType) : columnSummary2.format,
            columnSummary2.columnUnitSummary
          ))}`;
        })()}
											</a>`}` : `${column.contentType === "delta" && row[column.id] !== void 0 ? `<div class="${"m-0 text-xs font-medium font-ui s-6Ur4xdtfKK2B"}" style="${"color: " + escape(
          row[column.id] >= 0 && !column.downIsGood || row[column.id] < 0 && column.downIsGood ? "var(--green-700)" : "var(--red-700)",
          true
        )}"><div class="${"s-6Ur4xdtfKK2B"}"${add_styles({ "text-align": column.align ?? "right" })}>${column.showValue ? `<span class="${"s-6Ur4xdtfKK2B"}">${escape(formatValue(
          row[column.id],
          column.fmt ? getFormatObjectFromString(column.fmt, safeExtractColumn(column).format.valueType) : safeExtractColumn(column).format,
          safeExtractColumn(column).columnUnitSummary
        ))}</span>
													${column.deltaSymbol ? `<span class="${"font-[system-ui] s-6Ur4xdtfKK2B"}"><!-- HTML_TAG_START -->${row[column.id] >= 0 ? "&#9650;" : "&#9660;"}<!-- HTML_TAG_END --></span>` : ``}` : ``}</div>
										</div>` : `${escape(formatValue(
          row[column.id],
          column.fmt ? getFormatObjectFromString(column.fmt, safeExtractColumn(column).format.valueType) : safeExtractColumn(column).format,
          safeExtractColumn(column).columnUnitSummary
        ))}`}`}`}
								</td>`;
      })}` : `${each(columnSummary.filter((d) => d.show === true), (column) => {
        return `<td class="${[
          escape(null_to_empty(column.type), true) + " s-6Ur4xdtfKK2B",
          rowLines ? "row-lines" : ""
        ].join(" ").trim()}">${escape(formatValue(row[column.id], column.format, column.columnUnitSummary))}</td>`;
      })}`}
					</tr>`;
    })}</table></div>

		${paginated && pageCount > 1 ? `<div class="${"pagination s-6Ur4xdtfKK2B"}"><div class="${"page-labels s-6Ur4xdtfKK2B"}"><button aria-label="${"first-page"}" class="${["page-changer s-6Ur4xdtfKK2B", ""].join(" ").trim()}" ${currentPage === 1 ? "disabled" : ""}><div class="${"page-icon flex items-center s-6Ur4xdtfKK2B"}">${validate_component(Icon, "Icon").$$render($$result, { src: ChevronsLeft }, {}, {})}</div></button>
					<button aria-label="${"previous-page"}" class="${["page-changer s-6Ur4xdtfKK2B", ""].join(" ").trim()}" ${currentPage === 1 ? "disabled" : ""}><div class="${"page-icon h-[0.83em] flex items-center s-6Ur4xdtfKK2B"}">${validate_component(Icon, "Icon").$$render($$result, { src: ChevronLeft, class: "h-[0.83em]" }, {}, {})}</div></button>
					<span class="${"page-count s-6Ur4xdtfKK2B"}">Page <input class="${[
      "page-input s-6Ur4xdtfKK2B",
      " " + (inputPage > pageCount ? "error" : "")
    ].join(" ").trim()}" type="${"number"}"${add_attribute("placeholder", currentPage, 0)}${add_attribute("value", inputPage, 0)}>
						/
						<span class="${"page-count ml-1 s-6Ur4xdtfKK2B"}">${escape(pageCount.toLocaleString())}</span></span>
					<span class="${"print-page-count s-6Ur4xdtfKK2B"}">${escape(displayedPageLength.toLocaleString())} of ${escape(totalRows.toLocaleString())} records</span>
					<button aria-label="${"next-page"}" class="${["page-changer s-6Ur4xdtfKK2B", ""].join(" ").trim()}" ${currentPage === pageCount ? "disabled" : ""}><div class="${"page-icon h-[0.83em] flex items-center s-6Ur4xdtfKK2B"}">${validate_component(Icon, "Icon").$$render($$result, { src: ChevronRight, class: "h-[0.83em]" }, {}, {})}</div></button>
					<button aria-label="${"last-page"}" class="${["page-changer s-6Ur4xdtfKK2B", ""].join(" ").trim()}" ${currentPage === pageCount ? "disabled" : ""}><div class="${"page-icon flex items-center s-6Ur4xdtfKK2B"}">${validate_component(Icon, "Icon").$$render($$result, { src: ChevronsRight }, {}, {})}</div></button></div>
				${downloadable ? `${validate_component(DownloadData, "DownloadData").$$render(
      $$result,
      {
        class: "download-button",
        data: tableData,
        display: hovering
      },
      {},
      {}
    )}` : ``}</div>` : `<div class="${"table-footer s-6Ur4xdtfKK2B"}">${downloadable ? `${validate_component(DownloadData, "DownloadData").$$render(
      $$result,
      {
        class: "download-button",
        data: tableData,
        display: hovering
      },
      {},
      {}
    )}` : ``}</div>`}

		<div class="${["noresults s-6Ur4xdtfKK2B", showNoResults ? "shownoresults" : ""].join(" ").trim()}">No Results</div></div>` : `${validate_component(ErrorChart, "ErrorChart").$$render($$result, { error, chartType: "Data Table" }, {}, {})}`}`;
  } while (!$$settled);
  $$unsubscribe_props();
  return $$rendered;
});
const { Object: Object_1 } = globals;
const DataTable_1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let spreadProps;
  let { data } = $$props;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0)
    $$bindings.data(data);
  spreadProps = Object.fromEntries(Object.entries($$props).filter(([, v]) => v !== void 0));
  return `
${validate_component(QueryLoad, "QueryLoad").$$render($$result, { data }, {}, {
    default: ({ loaded }) => {
      return `${validate_component(DataTable, "DataTable").$$render(
        $$result,
        Object_1.assign(spreadProps, {
          data: loaded?.__isQueryStore ? Array.from(loaded) : loaded
        }),
        {},
        {
          default: () => {
            return `${slots.default ? slots.default({}) : ``}`;
          }
        }
      )}`;
    }
  })}`;
});
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { data } = $$props;
  let results = [];
  let input;
  if ($$props.data === void 0 && $$bindings.data && data !== void 0)
    $$bindings.data(data);
  return `<div class="${"container mx-auto relative font-mono bg-black rounded-xl"}"><h3 class="${"mx-4 py-4 m-0 text-white select-none font-mono"}">Query Console</h3>
	<hr class="${"m-0 w-full border-white/30"}">
	<textarea class="${"mt-4 px-4 pb-1 min-h-[100px] outline-none focus:outline-0 resize-none w-full bg-black text-white text-sm"}"${add_attribute("this", input, 0)}>${""}</textarea>
	<div class="${"block ml-auto pr-4 py-4"}"><button class="${[
    "block ml-auto bg-green-600 hover:bg-green-700 active:bg-green-800 transition-colors px-4 py-2 text-sm text-white rounded-xl select-none",
    ""
  ].join(" ").trim()}" ${""}>Run Query
		</button></div></div>

${validate_component(DataTable_1, "DataTable").$$render($$result, { data: results, rowShading: true }, {}, {})}`;
});
export {
  Page as default
};
