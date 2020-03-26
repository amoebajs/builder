import { Plugin } from "webpack";
import { Injectable } from "../../../core";

export interface IWebpackTemplateAddOnOptions {
  tagName: string;
  attributes?: string[];
  properties?: Record<string, any>;
}

export interface IWebpackTemplatePluginOptions {
  path: string;
  addons: Array<IWebpackTemplateAddOnOptions>;
}

export interface IWebpackProgressPluginOptions {
  type: "emit" | "trigger";
  trigger(data: string): void;
}

@Injectable()
export abstract class WebpackPlugins {
  public abstract createProgressPlugin(options?: Partial<IWebpackProgressPluginOptions>): Plugin;
  public abstract createTemplatePlugin(options?: Partial<IWebpackTemplatePluginOptions>): Plugin;
}
