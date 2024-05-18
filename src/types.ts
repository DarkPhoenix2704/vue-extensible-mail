import type { RuntimeCompilerOptions } from "vue";

export interface Props extends Record<string, any> {}

export interface VueRuntimeCompilerOptions extends RuntimeCompilerOptions {}

export interface SourceOptions {
  /**
   * The source code of the component.
   */
  source: string;
  /**
   * The components used in the component.
   */
  components: {
    name: string;
    source: string;
  }[];
}
