# Vue Extensible Mail

This is based on the work done by [Vue Email and Team](https://github.com/vue-email).

The Vue Email is a great project, but it does not allow including custom Vue Components which is an important feature

## Getting Started

Run `bun add vue-extensible-mail`.

## How to Use

```ts
import Header from "./templates/components/Header";
import HtmlWrapper from "./templates/components/HtmlWrapper";

const emailClient = createEmailClient({
  path: "./templates",
  components: {
    Header,
    HtmlWrapper,
  },
});

const html = emailClient.renderEmail(
  "Welcome.vue", // This is an Email Template .vue file
  {} // Props If any required by the template
);
```

The Header and HTML Wrapper are custom components which you can create and reuse them.

The `path` is the folder containing all templates.

```ts
// This is a Sample Custom component
import { defineComponent, h } from "vue";

export default defineComponent({
  name: "HtmlWrapper",
  setup(_, { slots }) {
    return () => {
      return h(
        "html",
        {
          dir: "ltr",
          lang: "en",
        },
        [
          h("head", {}, [
            h("meta", { charset: "utf-8" }),
            h("meta", { name: "x-apple-disable-message-reformatting" }),
            h("meta", {
              content: "text/html; charset=UTF-8",
              "http-equiv": "Content-Type",
            }),
            h("meta", { name: "viewport", content: "width=device-width" }),
            h(
              "style",
              {},
              `
                body {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    font-family: Arial, sans-serif;
                }
                `
            ),
          ]),
          h("body", {}, slots.default && slots.default()),
        ]
      );
    };
  },
});
```

## License

MIT
