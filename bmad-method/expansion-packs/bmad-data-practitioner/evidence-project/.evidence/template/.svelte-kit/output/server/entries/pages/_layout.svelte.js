import { c as create_ssr_component, a as createEventDispatcher, e as escape, b as validate_store, d as subscribe, f as each, v as validate_component, o as onDestroy, g as add_attribute, n as null_to_empty, h as compute_rest_props, i as get_current_component, j as noop } from "../../chunks/index3.js";
import { p as page, n as navigating } from "../../chunks/stores.js";
import { d as dev } from "../../chunks/environment2.js";
import { I as Icon, C as ChevronRight, f as forwardEventsBuilder, u as useMenuContext, M as MenuStates, R as Render, a as useOpenClosed, S as State, F as Features, X, b as Menu2, c as Menu, D as Dots, d as Settings, _ as _3dCubeSphere, T as Table, L as Link } from "../../chunks/VennDiagram.svelte_svelte_type_style_lang.js";
import "@evidence-dev/component-utilities/globalContexts";
import "@evidence-dev/component-utilities/buildQuery";
import { toasts, showQueries } from "@evidence-dev/component-utilities/stores";
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
const fonts = "";
const app = "";
const css$3 = {
  code: ".error.s-NeKSDzPoUAYQ{--tw-border-opacity:1;border-color:rgb(254 202 202 / var(--tw-border-opacity));--tw-bg-opacity:1;background-color:rgb(254 242 242 / var(--tw-bg-opacity));--tw-text-opacity:1;color:rgb(153 27 27 / var(--tw-text-opacity))\n}.warning.s-NeKSDzPoUAYQ{--tw-border-opacity:1;border-color:rgb(254 240 138 / var(--tw-border-opacity));--tw-bg-opacity:1;background-color:rgb(254 252 232 / var(--tw-bg-opacity));--tw-text-opacity:1;color:rgb(133 77 14 / var(--tw-text-opacity))\n}.success.s-NeKSDzPoUAYQ{--tw-border-opacity:1;border-color:rgb(187 247 208 / var(--tw-border-opacity));--tw-bg-opacity:1;background-color:rgb(240 253 244 / var(--tw-bg-opacity));--tw-text-opacity:1;color:rgb(22 101 52 / var(--tw-text-opacity))\n}.info.s-NeKSDzPoUAYQ{--tw-border-opacity:1;border-color:rgb(229 231 235 / var(--tw-border-opacity));--tw-bg-opacity:1;background-color:rgb(255 255 255 / var(--tw-bg-opacity));--tw-text-opacity:1;color:rgb(31 41 55 / var(--tw-text-opacity))\n}",
  map: null
};
const Toast = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { id: id2 } = $$props;
  let { status = "info" } = $$props;
  let { title } = $$props;
  let { message } = $$props;
  let { dismissable = true } = $$props;
  createEventDispatcher();
  if ($$props.id === void 0 && $$bindings.id && id2 !== void 0)
    $$bindings.id(id2);
  if ($$props.status === void 0 && $$bindings.status && status !== void 0)
    $$bindings.status(status);
  if ($$props.title === void 0 && $$bindings.title && title !== void 0)
    $$bindings.title(title);
  if ($$props.message === void 0 && $$bindings.message && message !== void 0)
    $$bindings.message(message);
  if ($$props.dismissable === void 0 && $$bindings.dismissable && dismissable !== void 0)
    $$bindings.dismissable(dismissable);
  $$result.css.add(css$3);
  return `<div class="${"print:hidden rounded py-1 px-3 my-4 mx-0 shadow-md text-xs font-mono flex justify-between transition-all duration-300 border " + escape(status ?? "", true) + " s-NeKSDzPoUAYQ"}">${title ? `<span class="${"cursor-pointer font-bold pr-8 flex items-center"}">${escape(title)}</span>` : ``}
	<span class="${"cursor-pointer"}">${escape(message)}</span>
</div>`;
});
const ToastWrapper = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $toasts, $$unsubscribe_toasts;
  validate_store(toasts, "toasts");
  $$unsubscribe_toasts = subscribe(toasts, (value) => $toasts = value);
  $$unsubscribe_toasts();
  return `<div class="${"z-[1] fixed right-0 bottom-0 mx-10 my-6 w-80"}">${each($toasts, (toast) => {
    return `${validate_component(Toast, "Toast").$$render($$result, Object.assign(toast), {}, {})}`;
  })}</div>`;
});
const css$2 = {
  code: "a.s-NODGZ2nfAwBS{display:block;padding-top:0.25rem;padding-bottom:0.25rem;font-size:0.75rem;line-height:1rem;--tw-text-opacity:1;color:rgb(75 85 99 / var(--tw-text-opacity));transition-property:all;transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transition-duration:200ms\n}a.s-NODGZ2nfAwBS:hover{text-decoration-line:underline\n}a.h2.s-NODGZ2nfAwBS{padding-left:0px;--tw-text-opacity:1;color:rgb(107 114 128 / var(--tw-text-opacity))\n}a.h1.s-NODGZ2nfAwBS{margin-top:0.75rem;display:block;--tw-bg-opacity:1;background-color:rgb(255 255 255 / var(--tw-bg-opacity));font-weight:600;--tw-shadow:0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);--tw-shadow-colored:0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);--tw-shadow-color:#fff;--tw-shadow:var(--tw-shadow-colored)\n}",
  map: null
};
const ContentsList = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let headers = [];
  onDestroy(() => {
  });
  $$result.css.add(css$2);
  return `${headers && headers.length > 1 ? `<span class="${"block text-xs sticky top-0 mb-2 text-gray-950 bg-white shadow-white font-medium"}">On this page
	</span>
	${each(headers, (header, i) => {
    return `<a${add_attribute("href", "#" + encodeURIComponent(i + 1), 0)} class="${[
      escape(null_to_empty(header.nodeName.toLowerCase()), true) + " s-NODGZ2nfAwBS",
      i === 0 ? "first" : ""
    ].join(" ").trim()}">${escape(header.innerText)}
		</a>`;
  })}` : ``}`;
});
const QueryStatus = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $$unsubscribe_page;
  validate_store(page, "page");
  $$unsubscribe_page = subscribe(page, (value) => value);
  $$unsubscribe_page();
  return ``;
});
const TableOfContents = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $navigating, $$unsubscribe_navigating;
  let $page, $$unsubscribe_page;
  validate_store(navigating, "navigating");
  $$unsubscribe_navigating = subscribe(navigating, (value) => $navigating = value);
  validate_store(page, "page");
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  $$unsubscribe_navigating();
  $$unsubscribe_page();
  return `<aside class="${"hidden lg:block w-48"}">${!$navigating && $page.data.isUserPage ? `<div class="${"fixed w-48 top-20 bottom-20 pl-4 px-3 overflow-auto pretty-scrollbar"}">${validate_component(ContentsList, "ContentsList").$$render($$result, {}, {}, {})}</div>` : ``}</aside>`;
});
const BreadCrumbs = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let pathArray;
  let crumbs;
  let $page, $$unsubscribe_page;
  validate_store(page, "page");
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  let { fileTree: fileTree2 } = $$props;
  const checkUrl = function(href, fileTree3) {
    let found = false;
    function checkChildren(node) {
      if (node.href === href || href.startsWith(node.href) && node.isTemplated) {
        found = true;
      } else if (node.children) {
        node.children.forEach((child) => {
          checkChildren(child);
        });
      }
    }
    checkChildren(fileTree3);
    return found;
  };
  const buildCrumbs = function(pathArray2) {
    let crumbs2 = [{ href: "/", title: "Home" }];
    pathArray2.forEach((path, i) => {
      if (path != "") {
        let crumb = {
          href: "/" + pathArray2.slice(0, i + 1).join("/"),
          title: decodeURIComponent(path.replace(/_/g, " ").replace(/-/g, " "))
        };
        crumbs2.push(crumb);
      }
    });
    if (crumbs2.length > 3) {
      let upOne = crumbs2.slice(-3)[0].href;
      crumbs2.splice(1, crumbs2.length - 3, { href: upOne, title: "..." });
    }
    crumbs2.forEach((path) => {
      if (!checkUrl(path.href, fileTree2)) {
        path.href = null;
      }
    });
    return crumbs2;
  };
  if ($$props.fileTree === void 0 && $$bindings.fileTree && fileTree2 !== void 0)
    $$bindings.fileTree(fileTree2);
  pathArray = $page.url.pathname.split("/").slice(1);
  crumbs = buildCrumbs(pathArray);
  $$unsubscribe_page();
  return `<div class="${"flex items-start mt-8 sm:mt-12 whitespace-nowrap overflow-auto"}"><div class="${"inline-flex items-center text-sm capitalize gap-1 text-gray-500 mb-2 sm:mb-4"}">${each(crumbs, (crumb, i) => {
    return `${i > 0 ? `${validate_component(Icon, "Icon").$$render(
      $$result,
      {
        src: ChevronRight,
        size: "12px",
        theme: "solid"
      },
      {},
      {}
    )}
				${crumb.href ? `<a${add_attribute("href", crumb.href, 0)} class="${"hover:underline"}">${escape(crumb.title)}</a>` : `<span class="${"cursor-default"}">${escape(crumb.title)}</span>`}` : `<a${add_attribute("href", crumb.href, 0)} class="${"hover:underline"}">${escape(crumb.title)}
				</a>`}`;
  })}</div></div>`;
});
let id = 0;
function generateId() {
  return ++id;
}
function useId() {
  return generateId();
}
function resolveButtonType(props, ref) {
  if (props.type)
    return props.type;
  let tag = props.as ?? "button";
  if (typeof tag === "string" && tag.toLowerCase() === "button")
    return "button";
  if (ref && ref instanceof HTMLButtonElement)
    return "button";
  return void 0;
}
const MenuButton = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let buttonStore;
  let itemsStore;
  let propsWeControl;
  let slotProps;
  let $$restProps = compute_rest_props($$props, ["as", "use", "disabled"]);
  let $api, $$unsubscribe_api;
  let $itemsStore, $$unsubscribe_itemsStore = noop, $$subscribe_itemsStore = () => ($$unsubscribe_itemsStore(), $$unsubscribe_itemsStore = subscribe(itemsStore, ($$value) => $itemsStore = $$value), itemsStore);
  let $buttonStore, $$unsubscribe_buttonStore = noop, $$subscribe_buttonStore = () => ($$unsubscribe_buttonStore(), $$unsubscribe_buttonStore = subscribe(buttonStore, ($$value) => $buttonStore = $$value), buttonStore);
  let { as = "button" } = $$props;
  let { use = [] } = $$props;
  let { disabled = false } = $$props;
  const forwardEvents = forwardEventsBuilder(get_current_component());
  const api = useMenuContext("MenuButton");
  validate_store(api, "api");
  $$unsubscribe_api = subscribe(api, (value) => $api = value);
  const id2 = `headlessui-menu-button-${useId()}`;
  if ($$props.as === void 0 && $$bindings.as && as !== void 0)
    $$bindings.as(as);
  if ($$props.use === void 0 && $$bindings.use && use !== void 0)
    $$bindings.use(use);
  if ($$props.disabled === void 0 && $$bindings.disabled && disabled !== void 0)
    $$bindings.disabled(disabled);
  let $$settled;
  let $$rendered;
  do {
    $$settled = true;
    $$subscribe_buttonStore(buttonStore = $api.buttonStore);
    $$subscribe_itemsStore(itemsStore = $api.itemsStore);
    propsWeControl = {
      id: id2,
      type: resolveButtonType({ type: $$props.type, as }, $buttonStore),
      disabled: disabled ? true : void 0,
      "aria-haspopup": true,
      "aria-controls": $itemsStore?.id,
      "aria-expanded": disabled ? void 0 : $api.menuState === MenuStates.Open
    };
    slotProps = { open: $api.menuState === MenuStates.Open };
    $$rendered = `${validate_component(Render, "Render").$$render(
      $$result,
      Object.assign({ ...$$restProps, ...propsWeControl }, { as }, { slotProps }, { use: [...use, forwardEvents] }, { name: "MenuButton" }, { el: $buttonStore }),
      {
        el: ($$value) => {
          $buttonStore = $$value;
          $$settled = false;
        }
      },
      {
        default: () => {
          return `${slots.default ? slots.default({ ...slotProps }) : ``}`;
        }
      }
    )}`;
  } while (!$$settled);
  $$unsubscribe_api();
  $$unsubscribe_itemsStore();
  $$unsubscribe_buttonStore();
  return $$rendered;
});
function treeWalker({ container, accept, walk, enabled }) {
  let root = container;
  if (!root)
    return;
  if (enabled !== void 0 && !enabled)
    return;
  let acceptNode = Object.assign((node) => accept(node), {
    acceptNode: accept
  });
  let walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT,
    acceptNode,
    // @ts-ignore-error Typescript bug thinks this can only have 3 args
    false
  );
  while (walker.nextNode())
    walk(walker.currentNode);
}
const MenuItems = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let buttonStore;
  let itemsStore;
  let visible;
  let propsWeControl;
  let slotProps;
  let $$restProps = compute_rest_props($$props, ["as", "use"]);
  let $api, $$unsubscribe_api;
  let $buttonStore, $$unsubscribe_buttonStore = noop, $$subscribe_buttonStore = () => ($$unsubscribe_buttonStore(), $$unsubscribe_buttonStore = subscribe(buttonStore, ($$value) => $buttonStore = $$value), buttonStore);
  let $itemsStore, $$unsubscribe_itemsStore = noop, $$subscribe_itemsStore = () => ($$unsubscribe_itemsStore(), $$unsubscribe_itemsStore = subscribe(itemsStore, ($$value) => $itemsStore = $$value), itemsStore);
  let $openClosedState, $$unsubscribe_openClosedState;
  let { as = "div" } = $$props;
  let { use = [] } = $$props;
  const forwardEvents = forwardEventsBuilder(get_current_component());
  const api = useMenuContext("MenuItems");
  validate_store(api, "api");
  $$unsubscribe_api = subscribe(api, (value) => $api = value);
  const id2 = `headlessui-menu-items-${useId()}`;
  let openClosedState = useOpenClosed();
  validate_store(openClosedState, "openClosedState");
  $$unsubscribe_openClosedState = subscribe(openClosedState, (value) => $openClosedState = value);
  if ($$props.as === void 0 && $$bindings.as && as !== void 0)
    $$bindings.as(as);
  if ($$props.use === void 0 && $$bindings.use && use !== void 0)
    $$bindings.use(use);
  let $$settled;
  let $$rendered;
  do {
    $$settled = true;
    $$subscribe_buttonStore(buttonStore = $api.buttonStore);
    $$subscribe_itemsStore(itemsStore = $api.itemsStore);
    visible = openClosedState !== void 0 ? $openClosedState === State.Open : $api.menuState === MenuStates.Open;
    {
      treeWalker({
        container: $itemsStore,
        enabled: $api.menuState === MenuStates.Open,
        accept(node) {
          if (node.getAttribute("role") === "menuitem")
            return NodeFilter.FILTER_REJECT;
          if (node.hasAttribute("role"))
            return NodeFilter.FILTER_SKIP;
          return NodeFilter.FILTER_ACCEPT;
        },
        walk(node) {
          node.setAttribute("role", "none");
        }
      });
    }
    propsWeControl = {
      "aria-activedescendant": $api.activeItemIndex === null ? void 0 : $api.items[$api.activeItemIndex]?.id,
      "aria-labelledby": $buttonStore?.id,
      id: id2,
      role: "menu",
      tabIndex: 0
    };
    slotProps = { open: $api.menuState === MenuStates.Open };
    $$rendered = `${validate_component(Render, "Render").$$render(
      $$result,
      Object.assign(
        { ...$$restProps, ...propsWeControl },
        { as },
        { slotProps },
        { use: [...use, forwardEvents] },
        { name: "MenuItems" },
        { visible },
        {
          features: Features.RenderStrategy | Features.Static
        },
        { el: $itemsStore }
      ),
      {
        el: ($$value) => {
          $itemsStore = $$value;
          $$settled = false;
        }
      },
      {
        default: () => {
          return `${slots.default ? slots.default({ ...slotProps }) : ``}`;
        }
      }
    )}`;
  } while (!$$settled);
  $$unsubscribe_api();
  $$unsubscribe_buttonStore();
  $$unsubscribe_itemsStore();
  $$unsubscribe_openClosedState();
  return $$rendered;
});
const MenuItem = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let active;
  let buttonStore;
  let propsWeControl;
  let slotProps;
  let $$restProps = compute_rest_props($$props, ["as", "use", "disabled"]);
  let $api, $$unsubscribe_api;
  let $$unsubscribe_buttonStore = noop, $$subscribe_buttonStore = () => ($$unsubscribe_buttonStore(), $$unsubscribe_buttonStore = subscribe(buttonStore, ($$value) => $$value), buttonStore);
  let { as = "a" } = $$props;
  let { use = [] } = $$props;
  let { disabled = false } = $$props;
  const forwardEvents = forwardEventsBuilder(get_current_component(), [
    {
      name: "click",
      shouldExclude: () => disabled
    }
  ]);
  const api = useMenuContext("MenuItem");
  validate_store(api, "api");
  $$unsubscribe_api = subscribe(api, (value) => $api = value);
  const id2 = `headlessui-menu-item-${useId()}`;
  let elementRef;
  onDestroy(() => {
    $api.unregisterItem(id2);
  });
  if ($$props.as === void 0 && $$bindings.as && as !== void 0)
    $$bindings.as(as);
  if ($$props.use === void 0 && $$bindings.use && use !== void 0)
    $$bindings.use(use);
  if ($$props.disabled === void 0 && $$bindings.disabled && disabled !== void 0)
    $$bindings.disabled(disabled);
  let $$settled;
  let $$rendered;
  do {
    $$settled = true;
    active = $api.activeItemIndex !== null ? $api.items[$api.activeItemIndex].id === id2 : false;
    $$subscribe_buttonStore(buttonStore = $api.buttonStore);
    elementRef?.textContent?.toLowerCase().trim() || "";
    propsWeControl = {
      id: id2,
      role: "menuitem",
      tabIndex: disabled === true ? void 0 : -1,
      "aria-disabled": disabled === true ? true : void 0
    };
    slotProps = { active, disabled };
    $$rendered = `${validate_component(Render, "Render").$$render(
      $$result,
      Object.assign({ ...$$restProps, ...propsWeControl }, { use: [...use, forwardEvents] }, { as }, { slotProps }, { name: "MenuItem" }, { el: elementRef }),
      {
        el: ($$value) => {
          elementRef = $$value;
          $$settled = false;
        }
      },
      {
        default: () => {
          return `${slots.default ? slots.default({ ...slotProps }) : ``}`;
        }
      }
    )}`;
  } while (!$$settled);
  $$unsubscribe_api();
  $$unsubscribe_buttonStore();
  return $$rendered;
});
const logo = "/_app/immutable/assets/wordmark-gray-800.3686622c.png";
const Logo = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<img${add_attribute("src", logo, 0)} alt="${"evidence"}" class="${"h-5 aspect-auto"}" href="${"/"}">`;
});
const css$1 = {
  code: ".active.s-yQgMqWykCNDs{--tw-bg-opacity:1;background-color:rgb(243 244 246 / var(--tw-bg-opacity))\n}",
  map: null
};
const Header = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $showQueries, $$unsubscribe_showQueries;
  validate_store(showQueries, "showQueries");
  $$unsubscribe_showQueries = subscribe(showQueries, (value) => $showQueries = value);
  let { mobileSidebarOpen } = $$props;
  new Event("export-beforeprint");
  new Event("export-afterprint");
  if ($$props.mobileSidebarOpen === void 0 && $$bindings.mobileSidebarOpen && mobileSidebarOpen !== void 0)
    $$bindings.mobileSidebarOpen(mobileSidebarOpen);
  $$result.css.add(css$1);
  $$unsubscribe_showQueries();
  return `<header class="${"fixed w-full top-0 z-40 flex h-12 shrink-0 justify-start items-center gap-x-4 border-b border-gray-200 bg-white/90 backdrop-blur print:hidden"}"><div class="${"max-w-7xl mx-auto px-6 sm:px-8 md:px-12 flex flex-1 justify-self-start justify-between items-center"}"><a href="${"/"}" class="${"hidden md:block"}">${validate_component(Logo, "Logo").$$render($$result, {}, {}, {})}</a>

		<button type="${"button"}" class="${"text-gray-900 hover:bg-gray-50 rounded-lg p-1 md:hidden transition-all duration-500"}">${mobileSidebarOpen ? `<span class="${"sr-only"}">Close sidebar</span>
				${validate_component(Icon, "Icon").$$render($$result, { class: "w-5 h-5", src: X }, {}, {})}` : `<span class="${"sr-only"}">Open sidebar</span>
				${validate_component(Icon, "Icon").$$render($$result, { class: "w-5 h-5", src: Menu2 }, {}, {})}`}</button>
		<div class="${"flex gap-6 text-sm items-center"}"><div class="${"relative"}">${validate_component(Menu, "Menu").$$render($$result, { class: "outline-none" }, {}, {
    default: () => {
      return `${validate_component(MenuButton, "MenuButton").$$render(
        $$result,
        {
          class: "outline-none rounded-md focus:bg-gray-50 hover:bg-gray-100 px-1 py-1"
        },
        {},
        {
          default: () => {
            return `${validate_component(Icon, "Icon").$$render($$result, { src: Dots, class: "w-6 h-6" }, {}, {})}`;
          }
        }
      )}
					${validate_component(MenuItems, "MenuItems").$$render(
        $$result,
        {
          class: "absolute top-12 right-0 z-50 flex max-w-min outline-none"
        },
        {},
        {
          default: () => {
            return `<div class="${"shrink w-44 border border-gray-300 rounded-lg bg-white px-1 py-1 text-sm leading-6 text-gray-950 shadow-xl"}">${validate_component(MenuItem, "MenuItem").$$render($$result, {}, {}, {
              default: ({ active }) => {
                return `<div class="${[
                  "w-full text-left py-1 px-2 hover:bg-gray-100 rounded-[0.25rem] cursor-pointer s-yQgMqWykCNDs",
                  active ? "active" : ""
                ].join(" ").trim()}">Print PDF
								</div>`;
              }
            })}

							${validate_component(MenuItem, "MenuItem").$$render($$result, {}, {}, {
              default: ({ active }) => {
                return `<div class="${[
                  "w-full text-left py-1 px-2 hover:bg-gray-100 rounded-[0.25rem] cursor-pointer s-yQgMqWykCNDs",
                  active ? "active" : ""
                ].join(" ").trim()}">${escape($showQueries ? "Hide " : "Show ")} Queries
								</div>`;
              }
            })}
							${`<hr class="${"my-1"}">
								${validate_component(MenuItem, "MenuItem").$$render($$result, {}, {}, {
              default: ({ active }) => {
                return `<a href="${"/settings"}" class="${[
                  "w-full block text-left py-1 px-2 hover:bg-gray-100 rounded-[0.25rem] s-yQgMqWykCNDs",
                  active ? "active" : ""
                ].join(" ").trim()}"><div class="${"flex items-center justify-between"}"><span>Settings </span>
											${validate_component(Icon, "Icon").$$render(
                  $$result,
                  {
                    src: Settings,
                    class: "text-gray-300 w-4 h-4"
                  },
                  {},
                  {}
                )}</div></a>`;
              }
            })}
								${validate_component(MenuItem, "MenuItem").$$render($$result, {}, {}, {
              default: ({ active }) => {
                return `<a href="${"/settings/#deploy"}" target="${"_self"}" class="${[
                  "w-full block text-left py-1 px-2 hover:bg-gray-100 rounded-[0.25rem] s-yQgMqWykCNDs",
                  active ? "active" : ""
                ].join(" ").trim()}"><div class="${"flex items-center justify-between"}"><span>Deploy </span>
											${validate_component(Icon, "Icon").$$render(
                  $$result,
                  {
                    src: _3dCubeSphere,
                    class: "text-gray-300 h-4 w-4"
                  },
                  {},
                  {}
                )}</div></a>`;
              }
            })}
								
								${validate_component(MenuItem, "MenuItem").$$render($$result, {}, {}, {
              default: ({ active }) => {
                return `<a href="${"/explore/schema"}" target="${"_self"}" class="${[
                  "w-full block text-left py-1 px-2 hover:bg-gray-100 rounded-[0.25rem] s-yQgMqWykCNDs",
                  active ? "active" : ""
                ].join(" ").trim()}"><div class="${"flex items-center justify-between"}"><span>Schema Explorer </span>
											${validate_component(Icon, "Icon").$$render(
                  $$result,
                  {
                    src: Table,
                    class: "text-gray-300 h-4 w-4"
                  },
                  {},
                  {}
                )}</div></a>`;
              }
            })}

								${validate_component(MenuItem, "MenuItem").$$render($$result, {}, {}, {
              default: ({ active }) => {
                return `<a href="${"https://docs.evidence.dev"}" target="${"_blank"}" rel="${"noreferrer"}" class="${[
                  "w-full block text-left py-1 px-2 hover:bg-gray-100 rounded-[0.25rem] s-yQgMqWykCNDs",
                  active ? "active" : ""
                ].join(" ").trim()}"><div class="${"flex items-center justify-between"}"><span>Documentation </span>
											${validate_component(Icon, "Icon").$$render(
                  $$result,
                  {
                    src: Link,
                    class: "text-gray-300 h-4 w-4"
                  },
                  {},
                  {}
                )}</div></a>`;
              }
            })}`}</div>`;
          }
        }
      )}`;
    }
  })}</div></div></div>
</header>`;
});
const LoadingSkeleton = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<div role="${"status"}" class="${"animate-pulse"}"><span class="${"sr-only"}">Loading...</span>
	<div class="${"h-8 bg-gray-50 rounded-full dark:bg-gray-400 w-48 mb-8"}"></div>
	<div class="${"flex gap-3"}"><div class="${"h-32 bg-gray-200 rounded-md dark:bg-gray-400 w-[22%] mb-3"}"></div>
		<div class="${"h-32 bg-gray-200 rounded-md dark:bg-gray-400 w-[22%] mb-3"}"></div>
		<div class="${"h-32 bg-gray-200 rounded-md dark:bg-gray-400 w-[22%] mb-3"}"></div>
		<div class="${"h-32 bg-gray-200 rounded-md dark:bg-gray-400 w-[22%] mb-3"}"></div></div>
	<div class="${"h-2 bg-gray-200 rounded-full dark:bg-gray-400 max-w-[70%] mb-3"}"></div>
	<div class="${"h-2 bg-gray-200 rounded-full dark:bg-gray-400 mb-3"}"></div>
	<div class="${"h-2 bg-gray-200 rounded-full dark:bg-gray-400 max-w-[65%] mb-3"}"></div>
	<div class="${"h-56 bg-gray-200 rounded-md dark:bg-gray-400 max-w-[100%] mb-3"}"></div>
	<div class="${"h-2 bg-gray-200 rounded-full dark:bg-gray-400 max-w-[80%] mb-3"}"></div>
	<div class="${"h-2 bg-gray-200 rounded-full dark:bg-gray-400 max-w-[90%] mb-3"}"></div>
	<div class="${"h-2 bg-gray-200 rounded-full dark:bg-gray-400 max-w-[70%] mb-3"}"></div>
	<div class="${"h-2 bg-gray-200 rounded-full dark:bg-gray-400 mb-3"}"></div>
	<div class="${"h-2 bg-gray-200 rounded-full dark:bg-gray-400 max-w-[80%] mb-3"}"></div>
	<div class="${"h-2 bg-gray-200 rounded-full dark:bg-gray-400 max-w-[100%] mb-3"}"></div>
	<div class="${"h-56 bg-gray-200 rounded-md dark:bg-gray-400 max-w-[100%] mb-3"}"></div>
	<div class="${"h-2 bg-gray-200 rounded-full dark:bg-gray-400 max-w-[70%] mb-3"}"></div>
	<div class="${"h-2 bg-gray-200 rounded-full dark:bg-gray-400 mb-3"}"></div>
	<div class="${"h-2 bg-gray-200 rounded-full dark:bg-gray-400 max-w-[75%] mb-3"}"></div>
	<div class="${"h-2 bg-gray-200 rounded-full dark:bg-gray-400 max-w-[90%] mb-3"}"></div>
	<div class="${"h-2 bg-gray-200 rounded-full dark:bg-gray-400 max-w-[80%] mb-3"}"></div>
	<div class="${"h-56 bg-gray-200 rounded-md dark:bg-gray-400 max-w-[100%] mb-3"}"></div></div>`;
});
const css = {
  code: ".selected.s-2ztAOH3lUdGF{--tw-text-opacity:1;color:rgb(37 99 235 / var(--tw-text-opacity))\n}.selected.s-2ztAOH3lUdGF:hover{--tw-text-opacity:1;color:rgb(37 99 235 / var(--tw-text-opacity))\n}",
  map: null
};
const Sidebar = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $page, $$unsubscribe_page;
  validate_store(page, "page");
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  let { fileTree: fileTree2 } = $$props;
  let firstLevelFiles = fileTree2?.children;
  let { mobileSidebarOpen = false } = $$props;
  if ($$props.fileTree === void 0 && $$bindings.fileTree && fileTree2 !== void 0)
    $$bindings.fileTree(fileTree2);
  if ($$props.mobileSidebarOpen === void 0 && $$bindings.mobileSidebarOpen && mobileSidebarOpen !== void 0)
    $$bindings.mobileSidebarOpen(mobileSidebarOpen);
  $$result.css.add(css);
  $$unsubscribe_page();
  return `${mobileSidebarOpen ? `<div class="${"fixed inset-0 bg-white/80 z-50 backdrop-blur-sm"}"></div>
	<div class="${"bg-white border-r border-gray-300 shadow-lg fixed inset-0 z-50 flex sm:w-72 h-screen w-screen flex-col overflow-hidden select-none"}"><div class="${"pb-4 text-gray-700"}"><div class="${"py-3 px-8 mb-3 flex items-start justify-between"}"><a href="${"/"}" class="${"block mt-1"}">${validate_component(Logo, "Logo").$$render($$result, {}, {}, {})}</a>
				<span><button type="${"button"}" class="${"text-gray-900 hover:bg-gray-50 rounded-lg p-1 transition-all duration-500"}"><span class="${"sr-only"}">Close sidebar</span>

						<svg xmlns="${"http://www.w3.org/2000/svg"}" viewBox="${"0 0 20 20"}" fill="${"currentColor"}" class="${"w-5 h-5"}"><path d="${"M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"}"></path></svg></button></span></div>
			<div class="${"flex-grow px-8 sm:pb-0 pb-4 h-[calc(100vh-8rem)] overflow-auto text-base sm:text-sm pretty-scrollbar"}" id="${"mobileScrollable"}"><div class="${"flex flex-col pb-6"}"><a class="${"sticky top-0 bg-white shadow shadow-white text-gray-950 font-semibold pb-1 mb-1 group inline-block capitalize transition-colors duration-100"}" href="${"/"}">Home
					</a>
					${each(firstLevelFiles, (file) => {
    return `${file.children.length === 0 && file.href ? `<a class="${[
      "hover:text-gray-950 group inline-block py-1 capitalize transition-colors duration-100 s-2ztAOH3lUdGF",
      $page.url.pathname.toUpperCase() === file.href.toUpperCase() + "/" ? "selected" : ""
    ].join(" ").trim()}"${add_attribute("href", file.href, 0)}>${escape(file.label)}
							</a>` : ``}`;
  })}</div>
				${each(firstLevelFiles, (file) => {
    return `${file.children.length > 0 ? `<div class="${"flex flex-col pb-6"}">${file.href ? `<a class="${"sticky top-0 bg-white shadow shadow-white text-gray-950 font-semibold pb-1 mb-1 group inline-block capitalize transition-colors duration-100"}"${add_attribute("href", file.href, 0)}>${escape(file.label)}
								</a>` : `<span class="${"sticky top-0 bg-white shadow shadow-white text-gray-950 font-semibold pb-1 mb-1 group inline-block capitalize transition-colors duration-100"}"${add_attribute("href", file.href, 0)}>${escape(file.label)}
								</span>`}
							${each(file.children, (file2) => {
      return `${file2.href ? `<a class="${[
        "hover:text-gray-950 group inline-block py-1 capitalize transition-colors duration-100 s-2ztAOH3lUdGF",
        $page.url.pathname.toUpperCase() === file2.href.toUpperCase() + "/" ? "selected" : ""
      ].join(" ").trim()}"${add_attribute("href", file2.href, 0)}>${escape(file2.label)}
									</a>` : ``}`;
    })}
						</div>` : ``}`;
  })}</div></div></div>` : ``}


<aside class="${"w-48 hidden md:flex flex-none"}">${!mobileSidebarOpen ? `<div class="${"hidden: md:block fixed w-48 top-20 bottom-8 overflow-y-auto flex-1 text-sm text-gray-500 pretty-scrollbar"}"><div class="${"flex flex-col pb-6"}"><a class="${"sticky top-0 bg-white shadow shadow-white text-gray-950 font-semibold pb-1 mb-1 group inline-block capitalize hover:underline"}" href="${"/"}">Home
				</a>
				${each(firstLevelFiles, (file) => {
    return `${file.children.length === 0 && file.href ? `<a class="${[
      "hover:text-gray-950 group inline-block py-1 capitalize transition-all duration-100 s-2ztAOH3lUdGF",
      $page.url.pathname.toUpperCase() === file.href.toUpperCase() + "/" ? "selected" : ""
    ].join(" ").trim()}"${add_attribute("href", file.href, 0)}>${escape(file.label)}
						</a>` : ``}`;
  })}</div>
			${each(firstLevelFiles, (file) => {
    return `${file.children.length > 0 ? `<div class="${"flex flex-col pb-6"}">${file.href ? `<a class="${"sticky top-0 bg-white shadow shadow-white text-gray-950 font-semibold pb-1 mb-1 group block capitalize hover:underline"}"${add_attribute("href", file.href, 0)}>${escape(file.label)}
							</a>` : `<span class="${"sticky top-0 bg-white shadow shadow-white text-gray-950 font-semibold pb-1 mb-1 group inline-block capitalize"}"${add_attribute("href", file.href, 0)}>${escape(file.label)}
							</span>`}
						${each(file.children, (file2) => {
      return `${file2.href ? `<a class="${[
        "hover:text-gray-950 group inline-block py-1 capitalize transition-all duration-100 truncate s-2ztAOH3lUdGF",
        $page.url.pathname.toUpperCase() === file2.href.toUpperCase() + "/" ? "selected" : ""
      ].join(" ").trim()}"${add_attribute("href", file2.href, 0)}>${escape(file2.label)}
								</a>` : ``}`;
    })}
					</div>` : ``}`;
  })}</div>` : ``}
</aside>`;
});
const pages = /* @__PURE__ */ Object.assign({ "/src/pages/analysis/+page.md": () => import("./analysis/_page.md.js"), "/src/pages/reports/+page.md": () => import("./reports/_page.md.js") });
let pagePaths = Object.keys(pages).map((path) => path.replace("/src/pages/", ""));
let fileTree = {
  label: "Home",
  href: "/",
  children: {},
  isTemplated: false
};
pagePaths.forEach(function(path) {
  path.split("/").reduce(
    function(r, e) {
      if (e === "+page.md") {
        let href = path.includes("[") ? void 0 : encodeURI("/" + path.replace("/+page.md", ""));
        return r["href"] = href;
      } else {
        let label = e.includes("[") ? void 0 : e.replace(/_/g, " ").replace(/-/g, " ");
        r.isTemplated = e.includes("[");
        return r?.children[e] || (r.children[e] = {
          label,
          children: {},
          href: void 0,
          isTemplated: false
        });
      }
    },
    fileTree
  );
});
function deleteEmptyNodes(node) {
  if (node.children) {
    Object.keys(node.children).forEach(function(key) {
      deleteEmptyNodes(node.children[key]);
      if (!node.children[key].label && !node.children[key].href) {
        delete node.children[key];
      }
    });
  }
}
deleteEmptyNodes(fileTree);
function convertChildrenToArray(node) {
  if (node.children) {
    node.children = Object.keys(node.children).map(function(key) {
      return node.children[key];
    });
    node.children.forEach(function(child) {
      convertChildrenToArray(child);
    });
  }
}
convertChildrenToArray(fileTree);
const Layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $navigating, $$unsubscribe_navigating;
  let $page, $$unsubscribe_page;
  validate_store(navigating, "navigating");
  $$unsubscribe_navigating = subscribe(navigating, (value) => $navigating = value);
  validate_store(page, "page");
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  const prefetchStrategy = "tap";
  let mobileSidebarOpen = false;
  let $$settled;
  let $$rendered;
  do {
    $$settled = true;
    {
      if ($navigating) {
        mobileSidebarOpen = false;
      }
    }
    $$rendered = `






${validate_component(ToastWrapper, "ToastWrapper").$$render($$result, {}, {}, {})}

<div${add_attribute("data-sveltekit-preload-data", prefetchStrategy, 0)} class="${"antialiased text-gray-900"}">${validate_component(Header, "Header").$$render(
      $$result,
      { mobileSidebarOpen },
      {
        mobileSidebarOpen: ($$value) => {
          mobileSidebarOpen = $$value;
          $$settled = false;
        }
      },
      {}
    )}
	<div class="${"max-w-7xl print:w-[650px] mx-auto print:md:px-0 print:px-0 px-6 sm:px-8 md:px-12 flex justify-start"}"><div class="${"print:hidden"}">${validate_component(Sidebar, "Sidebar").$$render(
      $$result,
      { fileTree, mobileSidebarOpen },
      {
        mobileSidebarOpen: ($$value) => {
          mobileSidebarOpen = $$value;
          $$settled = false;
        }
      },
      {}
    )}</div>
		<main class="${"flex-1 overflow-x-hidden md:px-8 print:px-0 print:md:px-0 py-8"}"><div class="${"print:hidden"}">${$page.route.id !== "/settings" ? `${validate_component(BreadCrumbs, "BreadCrumbs").$$render($$result, { fileTree }, {}, {})}` : ``}</div>
			${!$navigating ? `<article class="${"select-text markdown"}">${slots.default ? slots.default({}) : ``}</article>` : `${validate_component(LoadingSkeleton, "LoadingSkeleton").$$render($$result, {}, {}, {})}`}</main>
		<div class="${"print:hidden"}">${validate_component(TableOfContents, "TableOfContents").$$render($$result, {}, {}, {})}</div></div></div>
${!$navigating && dev && !$page.url.pathname.startsWith("/settings") ? `${validate_component(QueryStatus, "QueryStatus").$$render($$result, {}, {}, {})}` : ``}`;
  } while (!$$settled);
  $$unsubscribe_navigating();
  $$unsubscribe_page();
  return $$rendered;
});
export {
  Layout as default
};
