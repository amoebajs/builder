import { Plugin } from "webpack";
import { Injectable } from "#core/decorators";
import { WebpackPlugins } from "./plugins.contract";

/* eslint-disable @typescript-eslint/no-unused-vars */

@Injectable()
export class WebpackPluginsWebProvider implements WebpackPlugins {
  public createTsImportPlugin(rules: any[]) {
    throw new Error("Method not implemented.");
  }

  public createTemplatePlugin(options?: Partial<import("./plugins.contract").IWebpackTemplateOptions>): Plugin {
    throw new Error("Method not implemented.");
  }

  public createProgressPlugin(): Plugin {
    throw new Error("Method not implemented.");
  }
}
