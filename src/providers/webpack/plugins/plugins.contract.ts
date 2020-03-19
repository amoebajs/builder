import { Plugin } from "webpack";
import { Injectable } from "../../../core";

export interface IWebpackTemplateScriptOptions {
  type: "inline-javascript" | "src-javascript";
  defer?: string | boolean;
  async?: string | boolean;
  value: string;
}

export interface IWebpackTemplateStyleOptions {
  type: "rel-stylesheet" | "inline-style";
  value: string;
}

export interface IWebpackTemplatePluginOptions {
  title: string;
  path: string;
  charset: string;
  styles: IWebpackTemplateStyleOptions[];
  scripts: IWebpackTemplateScriptOptions[];
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
