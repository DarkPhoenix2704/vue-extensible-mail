import { createApp, type Component } from "vue";
import { renderToString } from "vue/server-renderer";
import {
  compileScript,
  compileStyle,
  compileTemplate,
  parse,
} from "@vue/compiler-sfc";
import type { SFCScriptBlock, SFCStyleCompileResults } from "vue/compiler-sfc";
import { importModule } from "import-string";
import type { Props, SourceOptions, VueRuntimeCompilerOptions } from "./types";
import { pascalCase } from "scule";
import { readdirSync, readFileSync, statSync } from "fs";
import { join, extname } from "path";

import defaultComponents from './components'

const userComponents = {} as Record<string, Component>;

function getAllVueComponents(
  emailsPath: string,
  basePath = ""
): { name: string; source: string }[] {
  const result: { name: string; source: string }[] = [];

  const files = readdirSync(emailsPath);

  files.forEach((file) => {
    const filePath = join(emailsPath, file);
    const relativePath = join(basePath, file);

    if (statSync(filePath).isDirectory()) {
      result.push(...getAllVueComponents(filePath, relativePath));
    } else if (extname(file) === ".vue") {
      result.push({
        name: relativePath.replace(/\\/g, ":"),
        source: readFileSync(filePath, "utf8"),
      });
    }
  });
  return result;
}

export function createEmailClient({
  path,
  components = {},
}: {
  path: string;
  components: Record<string, Component>;
}) {
  Object.assign(userComponents, components);
  const templates = getAllVueComponents(path);

  return {
    renderEmail: (
      name: string,
      props: Props,
      compilerOptions?: VueRuntimeCompilerOptions
    ) => renderEmail(name, props, templates, compilerOptions),
    addComponent: (name: string, component: Component) => {
      userComponents[name] = component;
    },
  };
}

async function renderEmail(
  name: string,
  props: Props,
  templates: {
    name: string;
    source: string;
  }[],
  compilerOptions?: VueRuntimeCompilerOptions
) {
  const template = templates.find((t) => t.name === name);

  if (!template) throw new Error(`Template ${name} not found`);

  return templateRender(
    name,
    {
      source: template.source,
      components: templates,
    },
    props,
    compilerOptions
  );
}

function correctName(name: string) {
  return pascalCase(name.replaceAll(":", "-").replace(".vue", ""));
}

async function loadComponent(name: string, source: string) {
  try {
    name = correctName(name);
    const compiledComponent = compile(name, source);
    const componentCode: Component = (await importModule(compiledComponent))
      .default;

    return componentCode;
  } catch (error) {
    console.error("Error loading component", error);
  }

  return null;
}

export async function templateRender(
  name: string,
  code: SourceOptions,
  props?: Props,
  compilerOptions?: VueRuntimeCompilerOptions
): Promise<string> {
  try {
    name = correctName(name);
    const component = await loadComponent(name, code.source);

    if (!component) throw new Error(`Component ${name} not found`);

    const app = createApp(component, props);

    Object.entries(userComponents).forEach(([name, component]) => {
      app.component(name, component);
    });

    if (compilerOptions) app.config.compilerOptions = compilerOptions;

    app.config.performance = true;

    if (code.components && code.components.length > 0) {
      for (const emailComponent of code.components) {
        const componentName = correctName(emailComponent.name);
        const componentCode = await loadComponent(
          componentName,
          emailComponent.source
        );
        if (componentCode) {
          app.component(componentName, {
            ...defaultComponents,
            ...componentCode,
            ...userComponents,
          });
        }
      }
    }

    const markup = await renderToString(app);
    return markup;
  } catch (error) {
    throw new Error(`Error rendering template ${name}: ${error}`);
  }
}

function compile(filename: string, source: string) {
  let styles: SFCStyleCompileResults | null = null;
  let script: SFCScriptBlock | null = null;
  const scriptIdentifier = "_sfc_main";

  const { descriptor, errors } = parse(source, {
    filename,
  });

  if (errors.length) throw new Error(errors.join("\n"));

  if (descriptor.script || descriptor.scriptSetup) {
    script = compileScript(descriptor, {
      id: descriptor.filename,
      genDefaultAs: scriptIdentifier,
    });
  }

  if (descriptor.styles && descriptor.styles.length) {
    styles = compileStyle({
      id: descriptor.filename,
      filename,
      source: descriptor.styles[0].content,
      scoped: descriptor.styles.some((s) => s.scoped),
    });
  }

  const template = compileTemplate({
    filename,
    id: descriptor.filename,
    source: descriptor.template!.content,
    compilerOptions: script
      ? {
          bindingMetadata: script.bindings,
        }
      : {},
  });

  const output = `
  ${template.code}\n
  ${script ? script.content : ""}
  ${styles ? `const styles = \`${styles.code}\`` : ""}
  ${
    script
      ? `${scriptIdentifier}.render = render`
      : `const ${scriptIdentifier} = { render }`
  }
  ${styles ? `${scriptIdentifier}.style = styles` : ""}
  ${scriptIdentifier}.__file = ${JSON.stringify(descriptor.filename)}
  ${script ? `export default ${scriptIdentifier}` : `export default { render }`}
  `;

  return output;
}
