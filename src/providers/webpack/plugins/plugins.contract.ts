import { Plugin } from "webpack";
import { Injectable } from "../../../core/decorators";

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

export interface IWebpackTemplateOptions {
  title: string;
  path: string;
  charset: string;
  styles: IWebpackTemplateStyleOptions[];
  scripts: IWebpackTemplateScriptOptions[];
}

@Injectable()
export abstract class WebpackPlugins {
  public abstract createProgressPlugin(): Plugin;
  public abstract createTsImportPlugin(rules: any[]): any;
  public abstract createTemplatePlugin(options?: Partial<IWebpackTemplateOptions>): Plugin;
}
