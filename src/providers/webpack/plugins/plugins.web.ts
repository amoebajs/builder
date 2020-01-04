import { Plugin } from "webpack";
import { Injectable } from "../../../core/decorators";
import { WebpackPlugins } from "./plugins.contract";

@Injectable()
export class WebpackPluginsWebProvider implements WebpackPlugins {
  public createProgressPlugin(): Plugin {
    throw new Error("not implemented.");
  }
}
