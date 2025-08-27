import { j as getContext, s as setContext, y as listen, z as bubble, A as prevent_default, B as stop_propagation, c as create_ssr_component, g as compute_rest_props, h as get_current_component, u as spread, w as escape_object, f as add_attribute, C as is_void, v as validate_component, m as missing_component, b as subscribe, l as set_store_value, r as globals } from "./index3.js";
import { w as writable } from "./index2.js";
const Alert_svelte_svelte_type_style_lang = "";
const Button_svelte_svelte_type_style_lang = "";
const Toast_svelte_svelte_type_style_lang = "";
const Hint_svelte_svelte_type_style_lang = "";
const SourceConfigFormField_svelte_svelte_type_style_lang = "";
const SourceConfig_svelte_svelte_type_style_lang = "";
const ContentsList_svelte_svelte_type_style_lang = "";
const BigLink_svelte_svelte_type_style_lang = "";
const ChevronToggle_svelte_svelte_type_style_lang = "";
const CodeBlock_svelte_svelte_type_style_lang = "";
const Details_svelte_svelte_type_style_lang = "";
const DownloadData_svelte_svelte_type_style_lang = "";
const EmailSignup_svelte_svelte_type_style_lang = "";
var State;
(function(State2) {
  State2[State2["Open"] = 0] = "Open";
  State2[State2["Closed"] = 1] = "Closed";
})(State || (State = {}));
const OPEN_CLOSED_CONTEXT_NAME = "headlessui-open-closed-context";
function useOpenClosed() {
  return getContext(OPEN_CLOSED_CONTEXT_NAME);
}
function useOpenClosedProvider(value) {
  setContext(OPEN_CLOSED_CONTEXT_NAME, value);
}
function match(value, lookup, ...args) {
  if (value in lookup) {
    let returnValue = lookup[value];
    return typeof returnValue === "function" ? returnValue(...args) : returnValue;
  }
  let error = new Error(`Tried to handle "${value}" but there is no handler defined. Only defined handlers are: ${Object.keys(lookup).map((key) => `"${key}"`).join(", ")}.`);
  if (Error.captureStackTrace)
    Error.captureStackTrace(error, match);
  throw error;
}
var Keys;
(function(Keys2) {
  Keys2["Space"] = " ";
  Keys2["Enter"] = "Enter";
  Keys2["Escape"] = "Escape";
  Keys2["Backspace"] = "Backspace";
  Keys2["ArrowLeft"] = "ArrowLeft";
  Keys2["ArrowUp"] = "ArrowUp";
  Keys2["ArrowRight"] = "ArrowRight";
  Keys2["ArrowDown"] = "ArrowDown";
  Keys2["Home"] = "Home";
  Keys2["End"] = "End";
  Keys2["PageUp"] = "PageUp";
  Keys2["PageDown"] = "PageDown";
  Keys2["Tab"] = "Tab";
})(Keys || (Keys = {}));
var Focus$1;
(function(Focus2) {
  Focus2[Focus2["First"] = 1] = "First";
  Focus2[Focus2["Previous"] = 2] = "Previous";
  Focus2[Focus2["Next"] = 4] = "Next";
  Focus2[Focus2["Last"] = 8] = "Last";
  Focus2[Focus2["WrapAround"] = 16] = "WrapAround";
  Focus2[Focus2["NoScroll"] = 32] = "NoScroll";
})(Focus$1 || (Focus$1 = {}));
var FocusResult;
(function(FocusResult2) {
  FocusResult2[FocusResult2["Error"] = 0] = "Error";
  FocusResult2[FocusResult2["Overflow"] = 1] = "Overflow";
  FocusResult2[FocusResult2["Success"] = 2] = "Success";
  FocusResult2[FocusResult2["Underflow"] = 3] = "Underflow";
})(FocusResult || (FocusResult = {}));
var Direction;
(function(Direction2) {
  Direction2[Direction2["Previous"] = -1] = "Previous";
  Direction2[Direction2["Next"] = 1] = "Next";
})(Direction || (Direction = {}));
var FocusableMode;
(function(FocusableMode2) {
  FocusableMode2[FocusableMode2["Strict"] = 0] = "Strict";
  FocusableMode2[FocusableMode2["Loose"] = 1] = "Loose";
})(FocusableMode || (FocusableMode = {}));
var StackMessage;
(function(StackMessage2) {
  StackMessage2[StackMessage2["Add"] = 0] = "Add";
  StackMessage2[StackMessage2["Remove"] = 1] = "Remove";
})(StackMessage || (StackMessage = {}));
const MODIFIER_DIVIDER = "!";
const modifierRegex = new RegExp(`^[^${MODIFIER_DIVIDER}]+(?:${MODIFIER_DIVIDER}(?:preventDefault|stopPropagation|passive|nonpassive|capture|once|self))+$`);
function forwardEventsBuilder(component, except = []) {
  let $on;
  let events = [];
  component.$on = (fullEventType, callback) => {
    let eventType = fullEventType;
    let destructor = () => {
    };
    for (let exception of except) {
      if (typeof exception === "string" && exception === eventType) {
        const callbacks = component.$$.callbacks[eventType] || (component.$$.callbacks[eventType] = []);
        callbacks.push(callback);
        return () => {
          const index = callbacks.indexOf(callback);
          if (index !== -1)
            callbacks.splice(index, 1);
        };
      }
      if (typeof exception === "object" && exception["name"] === eventType) {
        let oldCallback = callback;
        callback = (...props) => {
          if (!(typeof exception === "object" && exception["shouldExclude"]())) {
            oldCallback(...props);
          }
        };
      }
    }
    if ($on) {
      destructor = $on(eventType, callback);
    } else {
      events.push([eventType, callback]);
    }
    return () => {
      destructor();
    };
  };
  function forward(e) {
    bubble(component, e);
  }
  return (node) => {
    const destructors = [];
    const forwardDestructors = {};
    $on = (fullEventType, callback) => {
      let eventType = fullEventType;
      let handler = callback;
      let options = false;
      const modifierMatch = eventType.match(modifierRegex);
      if (modifierMatch) {
        const parts = eventType.split(MODIFIER_DIVIDER);
        eventType = parts[0];
        const eventOptions = Object.fromEntries(parts.slice(1).map((mod) => [mod, true]));
        if (eventOptions.passive) {
          options = options || {};
          options.passive = true;
        }
        if (eventOptions.nonpassive) {
          options = options || {};
          options.passive = false;
        }
        if (eventOptions.capture) {
          options = options || {};
          options.capture = true;
        }
        if (eventOptions.once) {
          options = options || {};
          options.once = true;
        }
        if (eventOptions.preventDefault) {
          handler = prevent_default(handler);
        }
        if (eventOptions.stopPropagation) {
          handler = stop_propagation(handler);
        }
      }
      const off = listen(node, eventType, handler, options);
      const destructor = () => {
        off();
        const idx = destructors.indexOf(destructor);
        if (idx > -1) {
          destructors.splice(idx, 1);
        }
      };
      destructors.push(destructor);
      if (!(eventType in forwardDestructors)) {
        forwardDestructors[eventType] = listen(node, eventType, forward);
      }
      return destructor;
    };
    for (let i = 0; i < events.length; i++) {
      $on(events[i][0], events[i][1]);
    }
    return {
      destroy: () => {
        for (let i = 0; i < destructors.length; i++) {
          destructors[i]();
        }
        for (let entry of Object.entries(forwardDestructors)) {
          entry[1]();
        }
      }
    };
  };
}
const components = [
  "a",
  "address",
  "article",
  "aside",
  "b",
  "bdi",
  "bdo",
  "blockquote",
  "button",
  "cite",
  "code",
  "data",
  "datalist",
  "dd",
  "dl",
  "dt",
  "div",
  "em",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "i",
  "input",
  "label",
  "li",
  "main",
  "nav",
  "ol",
  "p",
  "section",
  "span",
  "strong",
  "ul"
];
function isValidElement(element) {
  return !(typeof element === "string" && !components.includes(element));
}
var Features;
(function(Features2) {
  Features2[Features2["None"] = 0] = "None";
  Features2[Features2["RenderStrategy"] = 1] = "RenderStrategy";
  Features2[Features2["Static"] = 2] = "Static";
})(Features || (Features = {}));
var RenderStrategy;
(function(RenderStrategy2) {
  RenderStrategy2[RenderStrategy2["Unmount"] = 0] = "Unmount";
  RenderStrategy2[RenderStrategy2["Hidden"] = 1] = "Hidden";
})(RenderStrategy || (RenderStrategy = {}));
const Render = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let computedClass;
  let computedStyle;
  let show;
  let hidden;
  let propsWeControl;
  let $$restProps = compute_rest_props($$props, [
    "name",
    "as",
    "slotProps",
    "el",
    "use",
    "visible",
    "features",
    "unmount",
    "static",
    "class",
    "style"
  ]);
  const forwardEvents = forwardEventsBuilder(get_current_component());
  let { name } = $$props;
  let { as } = $$props;
  let { slotProps } = $$props;
  let { el = null } = $$props;
  let { use = [] } = $$props;
  let { visible = true } = $$props;
  let { features = Features.None } = $$props;
  let { unmount = true } = $$props;
  let { static: static_ = false } = $$props;
  let { class: classProp = void 0 } = $$props;
  let { style = void 0 } = $$props;
  if (!as) {
    throw new Error(`<${name}> did not provide an \`as\` value to <Render>`);
  }
  if (!isValidElement(as)) {
    throw new Error(`<${name}> has an invalid or unsupported \`as\` prop: ${as}`);
  }
  if ($$props.name === void 0 && $$bindings.name && name !== void 0)
    $$bindings.name(name);
  if ($$props.as === void 0 && $$bindings.as && as !== void 0)
    $$bindings.as(as);
  if ($$props.slotProps === void 0 && $$bindings.slotProps && slotProps !== void 0)
    $$bindings.slotProps(slotProps);
  if ($$props.el === void 0 && $$bindings.el && el !== void 0)
    $$bindings.el(el);
  if ($$props.use === void 0 && $$bindings.use && use !== void 0)
    $$bindings.use(use);
  if ($$props.visible === void 0 && $$bindings.visible && visible !== void 0)
    $$bindings.visible(visible);
  if ($$props.features === void 0 && $$bindings.features && features !== void 0)
    $$bindings.features(features);
  if ($$props.unmount === void 0 && $$bindings.unmount && unmount !== void 0)
    $$bindings.unmount(unmount);
  if ($$props.static === void 0 && $$bindings.static && static_ !== void 0)
    $$bindings.static(static_);
  if ($$props.class === void 0 && $$bindings.class && classProp !== void 0)
    $$bindings.class(classProp);
  if ($$props.style === void 0 && $$bindings.style && style !== void 0)
    $$bindings.style(style);
  let $$settled;
  let $$rendered;
  do {
    $$settled = true;
    computedClass = typeof classProp === "function" ? classProp(slotProps) : classProp;
    computedStyle = typeof style === "function" ? style(slotProps) : style;
    show = visible || features & Features.Static && static_ || !(features & Features.RenderStrategy && unmount);
    hidden = !visible && !(features & Features.Static && static_) && features & Features.RenderStrategy && !unmount;
    propsWeControl = {
      class: computedClass,
      style: `${computedStyle ?? ""}${hidden ? " display: none" : ""}` || void 0
    };
    {
      if (propsWeControl.style === void 0) {
        delete propsWeControl.style;
      }
    }
    $$rendered = `${show ? `${typeof as === "string" ? `${((tag) => {
      return tag ? `<${as}${spread(
        [
          escape_object($$restProps),
          escape_object(propsWeControl),
          { hidden: hidden || void 0 || null }
        ],
        {}
      )}${add_attribute("this", el, 0)}>${is_void(tag) ? "" : `${slots.default ? slots.default({}) : ``}`}${is_void(tag) ? "" : `</${tag}>`}` : "";
    })(as)}` : `${validate_component(as || missing_component, "svelte:component").$$render(
      $$result,
      Object.assign({ use: [...use, forwardEvents] }, $$restProps, propsWeControl, { hidden: hidden || void 0 }, { el }),
      {
        el: ($$value) => {
          el = $$value;
          $$settled = false;
        }
      },
      {
        default: () => {
          return `${slots.default ? slots.default({}) : ``}`;
        }
      }
    )}`}` : ``}`;
  } while (!$$settled);
  return $$rendered;
});
var DialogStates;
(function(DialogStates2) {
  DialogStates2[DialogStates2["Open"] = 0] = "Open";
  DialogStates2[DialogStates2["Closed"] = 1] = "Closed";
})(DialogStates || (DialogStates = {}));
var DisclosureStates;
(function(DisclosureStates2) {
  DisclosureStates2[DisclosureStates2["Open"] = 0] = "Open";
  DisclosureStates2[DisclosureStates2["Closed"] = 1] = "Closed";
})(DisclosureStates || (DisclosureStates = {}));
function assertNever(x) {
  throw new Error("Unexpected object: " + x);
}
var Focus;
(function(Focus2) {
  Focus2[Focus2["First"] = 0] = "First";
  Focus2[Focus2["Previous"] = 1] = "Previous";
  Focus2[Focus2["Next"] = 2] = "Next";
  Focus2[Focus2["Last"] = 3] = "Last";
  Focus2[Focus2["Specific"] = 4] = "Specific";
  Focus2[Focus2["Nothing"] = 5] = "Nothing";
})(Focus || (Focus = {}));
function calculateActiveIndex(action, resolvers) {
  let items = resolvers.resolveItems();
  if (items.length <= 0)
    return null;
  let currentActiveIndex = resolvers.resolveActiveIndex();
  let activeIndex = currentActiveIndex ?? -1;
  let nextActiveIndex = (() => {
    switch (action.focus) {
      case Focus.First:
        return items.findIndex((item) => !resolvers.resolveDisabled(item));
      case Focus.Previous: {
        let idx = items.slice().reverse().findIndex((item, idx2, all) => {
          if (activeIndex !== -1 && all.length - idx2 - 1 >= activeIndex)
            return false;
          return !resolvers.resolveDisabled(item);
        });
        if (idx === -1)
          return idx;
        return items.length - 1 - idx;
      }
      case Focus.Next:
        return items.findIndex((item, idx) => {
          if (idx <= activeIndex)
            return false;
          return !resolvers.resolveDisabled(item);
        });
      case Focus.Last: {
        let idx = items.slice().reverse().findIndex((item) => !resolvers.resolveDisabled(item));
        if (idx === -1)
          return idx;
        return items.length - 1 - idx;
      }
      case Focus.Specific:
        return items.findIndex((item) => resolvers.resolveId(item) === action.id);
      case Focus.Nothing:
        return null;
      default:
        assertNever(action);
    }
  })();
  return nextActiveIndex === -1 ? currentActiveIndex : nextActiveIndex;
}
var ListboxStates;
(function(ListboxStates2) {
  ListboxStates2[ListboxStates2["Open"] = 0] = "Open";
  ListboxStates2[ListboxStates2["Closed"] = 1] = "Closed";
})(ListboxStates || (ListboxStates = {}));
const { Object: Object_1 } = globals;
var MenuStates;
(function(MenuStates2) {
  MenuStates2[MenuStates2["Open"] = 0] = "Open";
  MenuStates2[MenuStates2["Closed"] = 1] = "Closed";
})(MenuStates || (MenuStates = {}));
const MENU_CONTEXT_NAME = "headlessui-menu-context";
function useMenuContext(componentName) {
  let context = getContext(MENU_CONTEXT_NAME);
  if (context === void 0) {
    throw new Error(`<${componentName} /> is missing a parent <Menu /> component.`);
  }
  return context;
}
const Menu = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let slotProps;
  let $$restProps = compute_rest_props($$props, ["use", "as"]);
  let $openClosedState, $$unsubscribe_openClosedState;
  let $$unsubscribe_buttonStore;
  let $$unsubscribe_api;
  let $itemsStore, $$unsubscribe_itemsStore;
  let { use = [] } = $$props;
  let { as = "div" } = $$props;
  const forwardEvents = forwardEventsBuilder(get_current_component());
  let menuState = MenuStates.Closed;
  let buttonStore = writable(null);
  $$unsubscribe_buttonStore = subscribe(buttonStore, (value) => value);
  let itemsStore = writable(null);
  $$unsubscribe_itemsStore = subscribe(itemsStore, (value) => $itemsStore = value);
  let items = [];
  let searchQuery = "";
  let activeItemIndex = null;
  let api = writable({
    menuState,
    buttonStore,
    itemsStore,
    items,
    searchQuery,
    activeItemIndex,
    closeMenu: () => {
      menuState = MenuStates.Closed;
      activeItemIndex = null;
    },
    openMenu: () => menuState = MenuStates.Open,
    goToItem(focus, id) {
      let nextActiveItemIndex = calculateActiveIndex(
        focus === Focus.Specific ? { focus: Focus.Specific, id } : { focus },
        {
          resolveItems: () => items,
          resolveActiveIndex: () => activeItemIndex,
          resolveId: (item) => item.id,
          resolveDisabled: (item) => item.data.disabled
        }
      );
      if (searchQuery === "" && activeItemIndex === nextActiveItemIndex)
        return;
      searchQuery = "";
      activeItemIndex = nextActiveItemIndex;
    },
    search(value) {
      searchQuery += value.toLowerCase();
      let reorderedItems = activeItemIndex !== null ? items.slice(activeItemIndex + 1).concat(items.slice(0, activeItemIndex + 1)) : items;
      let matchingItem = reorderedItems.find((item) => item.data.textValue.startsWith(searchQuery) && !item.data.disabled);
      let matchIdx = matchingItem ? items.indexOf(matchingItem) : -1;
      if (matchIdx === -1 || matchIdx === activeItemIndex)
        return;
      activeItemIndex = matchIdx;
    },
    clearSearch() {
      searchQuery = "";
    },
    registerItem(id, data) {
      if (!$itemsStore) {
        items = [...items, { id, data }];
        return;
      }
      let currentActiveItem = activeItemIndex !== null ? items[activeItemIndex] : null;
      let orderMap = Array.from($itemsStore.querySelectorAll('[id^="headlessui-menu-item-"]')).reduce((lookup, element, index) => Object.assign(lookup, { [element.id]: index }), {});
      let nextItems = [...items, { id, data }];
      nextItems.sort((a, z) => orderMap[a.id] - orderMap[z.id]);
      items = nextItems;
      activeItemIndex = (() => {
        if (currentActiveItem === null)
          return null;
        return items.indexOf(currentActiveItem);
      })();
    },
    unregisterItem(id) {
      let nextItems = items.slice();
      let currentActiveItem = activeItemIndex !== null ? nextItems[activeItemIndex] : null;
      let idx = nextItems.findIndex((a) => a.id === id);
      if (idx !== -1)
        nextItems.splice(idx, 1);
      items = nextItems;
      activeItemIndex = (() => {
        if (idx === activeItemIndex)
          return null;
        if (currentActiveItem === null)
          return null;
        return nextItems.indexOf(currentActiveItem);
      })();
    }
  });
  $$unsubscribe_api = subscribe(api, (value) => value);
  setContext(MENU_CONTEXT_NAME, api);
  let openClosedState = writable(State.Closed);
  $$unsubscribe_openClosedState = subscribe(openClosedState, (value) => $openClosedState = value);
  useOpenClosedProvider(openClosedState);
  if ($$props.use === void 0 && $$bindings.use && use !== void 0)
    $$bindings.use(use);
  if ($$props.as === void 0 && $$bindings.as && as !== void 0)
    $$bindings.as(as);
  {
    api.update((obj) => {
      return {
        ...obj,
        menuState,
        buttonStore,
        itemsStore,
        items,
        searchQuery,
        activeItemIndex
      };
    });
  }
  set_store_value(
    openClosedState,
    $openClosedState = match(menuState, {
      [MenuStates.Open]: State.Open,
      [MenuStates.Closed]: State.Closed
    }),
    $openClosedState
  );
  slotProps = { open: menuState === MenuStates.Open };
  $$unsubscribe_openClosedState();
  $$unsubscribe_buttonStore();
  $$unsubscribe_api();
  $$unsubscribe_itemsStore();
  return `
${validate_component(Render, "Render").$$render($$result, Object_1.assign($$restProps, { use: [...use, forwardEvents] }, { as }, { slotProps }, { name: "Menu" }), {}, {
    default: () => {
      return `${slots.default ? slots.default({ ...slotProps }) : ``}`;
    }
  })}`;
});
var PopoverStates;
(function(PopoverStates2) {
  PopoverStates2[PopoverStates2["Open"] = 0] = "Open";
  PopoverStates2[PopoverStates2["Closed"] = 1] = "Closed";
})(PopoverStates || (PopoverStates = {}));
var Reason;
(function(Reason2) {
  Reason2["Finished"] = "finished";
  Reason2["Cancelled"] = "cancelled";
})(Reason || (Reason = {}));
var TreeStates;
(function(TreeStates2) {
  TreeStates2["Visible"] = "visible";
  TreeStates2["Hidden"] = "hidden";
})(TreeStates || (TreeStates = {}));
const Header_svelte_svelte_type_style_lang = "";
const LoadingIndicator_svelte_svelte_type_style_lang = "";
const QueryDataTable_svelte_svelte_type_style_lang = "";
const prismtheme = "";
const Prismjs_svelte_svelte_type_style_lang = "";
const CompilerToggle_svelte_svelte_type_style_lang = "";
const QueryViewer_svelte_svelte_type_style_lang = "";
const Sidebar_svelte_svelte_type_style_lang = "";
const EvidenceDeploy_svelte_svelte_type_style_lang = "";
const VariableCopy_svelte_svelte_type_style_lang = "";
const NetlifyDeploy_svelte_svelte_type_style_lang = "";
const VercelDeploy_svelte_svelte_type_style_lang = "";
const OtherDeploy_svelte_svelte_type_style_lang = "";
const EnvironmentVarListing_svelte_svelte_type_style_lang = "";
const DeploySettingsPanel_svelte_svelte_type_style_lang = "";
const BuiltInFormatGrid_svelte_svelte_type_style_lang = "";
const CollapsibleTableSection_svelte_svelte_type_style_lang = "";
const CurrencyFormatGrid_svelte_svelte_type_style_lang = "";
const CustomFormatGrid_svelte_svelte_type_style_lang = "";
const CustomFormatsSection_svelte_svelte_type_style_lang = "";
const FormattingSettingsPanel_svelte_svelte_type_style_lang = "";
const TelemetrySettingsPanel_svelte_svelte_type_style_lang = "";
const VersionControlPanel_svelte_svelte_type_style_lang = "";
const ECharts_svelte_svelte_type_style_lang = "";
const ErrorChart_svelte_svelte_type_style_lang = "";
const _Value_svelte_svelte_type_style_lang = "";
const _BigValue_svelte_svelte_type_style_lang = "";
const SearchBar_svelte_svelte_type_style_lang = "";
const _DataTable_svelte_svelte_type_style_lang = "";
const _EChartsMap_svelte_svelte_type_style_lang = "";
const VennDiagram_svelte_svelte_type_style_lang = "";
export {
  Features as F,
  MenuStates as M,
  Render as R,
  State as S,
  useOpenClosed as a,
  Menu as b,
  forwardEventsBuilder as f,
  useMenuContext as u
};
