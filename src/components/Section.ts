import { defineComponent, h } from "vue";

export default defineComponent({
  name: "SSection",
  props: {
    style: {
      type: Object,
      default: () => ({}),
    },
  },
  setup(_, { slots }) {
    return () => {
      return h(
        "table",
        {
          align: "center",
          width: "100%",
          border: "0",
          cellPadding: "0",
          cellSpacing: "0",
          role: "presentation",
          ..._.style,
        },
        [h("tbody", [h("tr", [h("td", slots.default?.())])])]
      );
    };
  },
});
