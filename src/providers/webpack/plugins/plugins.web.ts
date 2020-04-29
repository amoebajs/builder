import { Plugin } from "webpack";
import { Injectable } from "../../../core";
import { WebpackPlugins } from "./plugins.contract";

/* eslint-disable @typescript-eslint/no-unused-vars */

@Injectable()
export class WebpackPluginsWebProvider implements WebpackPlugins {
  public createTsImportPlugin(rules: any[]) {
    throw new Error("Method not implemented.");
  }

  public createTemplatePlugin(options?: Partial<import("./plugins.contract").IWebpackTemplatePluginOptions>): Plugin {
    throw new Error("Method not implemented.");
  }

  public createProgressPlugin(options?: Partial<import("./plugins.contract").IWebpackProgressPluginOptions>): Plugin {
    throw new Error("Method not implemented.");
  }

  public createImportPlugin(options?: Partial<import("./plugins.contract").IWebpackImportPluginOptions>): Plugin {
    throw new Error("Method not implemented.");
  }
}
