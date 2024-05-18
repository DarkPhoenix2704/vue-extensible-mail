import { defineComponent, h } from "vue";

export default defineComponent({
  name: "Row",
  setup(_, { slots }) {
    return () => {
      return h(
        "table",
        {
          align: "center",
          width: "100%",
          role: "presentation",
          cellSpacing: "0",
          cellPadding: "0",
          border: "0",
        },
        [
          h("tbody", { style: "width: 100%" }, [
            h("tr", { style: "width: 100%" }, slots.default?.()),
          ]),
        ]
      );
    };
  },
});
