import { Plugin } from "webpack";
import { Injectable } from "../../../core";

export interface IWebpackTemplateAddOnOptions {
  attributes?: string[];
  properties?: Record<string, any>;
}

export interface IWebpackTemplatePluginOptions {
  path: string;
  title: string;
  addons: Record<string, IWebpackTemplateAddOnOptions[]>;
}

export interface IWebpackImportPluginOptions {}

export interface IWebpackProgressPluginOptions {
  type: "emit" | "trigger";
  trigger(data: string): void;
}

@Injectable()
export abstract class WebpackPlugins {
  public abstract createProgressPlugin(options?: Partial<IWebpackProgressPluginOptions>): Plugin;
  public abstract createTemplatePlugin(options?: Partial<IWebpackTemplatePluginOptions>): Plugin;
  public abstract createImportPlugin(options?: Partial<IWebpackImportPluginOptions>): Plugin;
}
