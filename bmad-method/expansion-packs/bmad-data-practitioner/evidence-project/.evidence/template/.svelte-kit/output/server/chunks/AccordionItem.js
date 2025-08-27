import { c as create_ssr_component, s as setContext, t as getContext, b as validate_store, d as subscribe, g as add_attribute, e as escape, v as validate_component, y as compute_slots } from "./index3.js";
import { w as writable } from "./index2.js";
import { I as Icon, g as ChevronUp, h as ChevronDown } from "./VennDiagram.svelte_svelte_type_style_lang.js";
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
  validate_store(activeItem, "activeItem");
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
export {
  Accordion as A,
  AccordionItem as a
};
