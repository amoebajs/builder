import { Path } from "./path";
import { Injectable } from "../core/decorators";
import { WebpackBuild } from "./webpack-build";
import { IWebpackOptions, WebpackConfig } from "./webpack-config";
import { Injector, InjectDIToken } from "@bonbons/di";
import { WebpackPlugins } from "./webpack-plugins";
import { HtmlBundle } from "./html-bundle";
import { GlobalMap } from "./global-map";

export interface IDirectiveDefine {
  module: string;
  name: string;
  id: string;
  options?: { [name: string]: any };
}

export interface IChildDefine {
  ref: string;
  id: string;
  options?: { [name: string]: any };
}

export interface IPageCreateOptions {
  page: {
    module: string;
    name: string;
    id: string;
    options?: { [name: string]: any };
    attach?: { [name: string]: any };
    components?: IDirectiveDefine[];
    directives?: IDirectiveDefine[];
    children?: IChildDefine[];
  };
}

interface IBaseSourceCreateOptions {
  prettier?: boolean;
  configs: IPageCreateOptions;
}

export interface ISourceFileCreateOptions extends IBaseSourceCreateOptions {
  outDir: string;
  fileName: string;
}

export interface ISourceStringCreateOptions extends IBaseSourceCreateOptions {
  onEmit: (output: string) => void;
}

export type ISourceCreateOptions =
  | ISourceStringCreateOptions
  | ISourceFileCreateOptions;

@Injectable()
export abstract class Builder {
  constructor(
    protected readonly injector: Injector,
    protected readonly path: Path,
    protected readonly globalMap: GlobalMap,
    public readonly webpackConfig: WebpackConfig,
    public readonly webpackBuild: WebpackBuild,
    public readonly webpackPlugins: WebpackPlugins,
    public readonly htmlBundle: HtmlBundle
  ) {}

  public get<T>(contract: InjectDIToken<T>): T {
    return this.injector.get(contract);
  }

  public abstract async createSource(
    options: ISourceCreateOptions
  ): Promise<void>;
  public abstract buildSource(options: IWebpackOptions): Promise<void>;
}
