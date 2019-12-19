import { Path } from "./path";
import {
  Injectable,
  resolveModule,
  resolvePage,
  resolvePipe,
  EntityConstructor
} from "../decorators";
import { WebpackBuild } from "./webpack-build";
import { IWebpackOptions, WebpackConfig } from "./webpack-config";
import { Injector, InjectDIToken } from "@bonbons/di";
import { WebpackPlugins } from "./webpack-plugins";
import { HtmlBundle } from "./html-bundle";

export interface IMapEntry<T = any> {
  moduleName?: string;
  name: string;
  displayName: string;
  value: T;
  pages: { [name: string]: any };
  pipes: { [name: string]: any };
}

export interface IGlobalMap {
  modules: { [key: string]: IMapEntry };
  pages: { [key: string]: IMapEntry };
  pipes: { [key: string]: IMapEntry };
}

@Injectable()
export class GlobalMap {
  public readonly maps: IGlobalMap = { modules: {}, pipes: {}, pages: {} };

  public useModule(mdname: EntityConstructor<any>) {
    const metadata = resolveModule(mdname);
    const moduleName = metadata.name || "[unnamed]";
    const thisModule: IMapEntry<any> = (this.maps.modules[moduleName] = {
      name: moduleName,
      displayName: metadata.displayName || moduleName,
      value: mdname,
      pages: {},
      pipes: {}
    });
    if (metadata.pages) {
      metadata.pages.forEach(i => {
        const meta = resolvePage(i);
        const pageName = meta.name || "[unnamed]";
        thisModule.pages[pageName] = {
          name: pageName,
          displayName: meta.displayName || pageName,
          moduleName,
          value: i
        };
      });
    }
    if (metadata.pipes) {
      metadata.pipes.forEach(i => {
        const meta = resolvePipe(i);
        const pipeName = meta.name || "[unnamed]";
        thisModule.pipes[pipeName] = {
          name: pipeName,
          displayName: meta.displayName || pipeName,
          moduleName,
          value: i
        };
      });
    }
    return this;
  }

  public getModule(name: string): IMapEntry<any> {
    return this.maps.modules[name];
  }

  public getPage(module: string, name: string): any {
    return this.getModule(module).pages[name];
  }

  public getPipe(module: string, name: string): any {
    return this.getModule(module).pipes[name];
  }
}

export interface IPageCreateOptions {
  page: {
    module: string;
    name: string;
    options?: { [name: string]: any };
    post: Array<{
      module: string;
      name: string;
      args?: { [name: string]: any };
    }>;
  };
}

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
    outDir: string,
    fileName: string,
    configs: IPageCreateOptions
  ): Promise<void>;
  public abstract buildSource(options: IWebpackOptions): Promise<void>;
}
