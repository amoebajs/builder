import { Path } from "./path";
import {
  Injectable,
  resolveModule,
  resolvePipe,
  EntityConstructor,
  resolveInputProperties,
  resolvePropertyGroups,
  resolveOutputProperties,
  resolveAttachProperties
} from "../decorators";
import { WebpackBuild } from "./webpack-build";
import { IWebpackOptions, WebpackConfig } from "./webpack-config";
import { Injector, InjectDIToken } from "@bonbons/di";
import { WebpackPlugins } from "./webpack-plugins";
import { HtmlBundle } from "./html-bundle";
import { resolveComponent } from "../decorators/component";

export interface IMapEntry<T = any> {
  moduleName?: string;
  name: string;
  displayName: string;
  value: T;
  provider?: string;
  metadata: {
    inputs: { [name: string]: any };
    outputs: { [name: string]: any };
    attaches: { [name: string]: any };
    groups: { [name: string]: any };
  };
}

export interface IModuleEntry<T = any> extends IMapEntry<T> {
  components: { [name: string]: IMapEntry<any> };
  directives: { [name: string]: IMapEntry<any> };
}

export interface IGlobalMap {
  modules: { [key: string]: IModuleEntry<any> };
}

@Injectable()
export class GlobalMap {
  public readonly maps: IGlobalMap = { modules: {} };

  public useModule(mdname: EntityConstructor<any>) {
    const metadata = resolveModule(mdname);
    const moduleName = metadata.name || "[unnamed]";
    const thisModule: IModuleEntry<any> = (this.maps.modules[moduleName] = {
      name: moduleName,
      displayName: metadata.displayName || moduleName,
      value: mdname,
      components: {},
      directives: {},
      metadata: getMetadata(mdname)
    });
    if (metadata.components) {
      metadata.components.forEach(i => {
        const meta = resolveComponent(i);
        const pageName = meta.name || "[unnamed]";
        thisModule.components[pageName] = {
          name: pageName,
          displayName: meta.displayName || pageName,
          moduleName,
          value: i,
          provider: meta.provider,
          metadata: getMetadata(i)
        };
      });
    }
    if (metadata.directives) {
      metadata.directives.forEach(i => {
        const meta = resolvePipe(i);
        const pipeName = meta.name || "[unnamed]";
        thisModule.directives[pipeName] = {
          name: pipeName,
          displayName: meta.displayName || pipeName,
          moduleName,
          value: i,
          metadata: getMetadata(i)
        };
      });
    }
    return this;
  }

  public getModule(name: string): IModuleEntry<any> {
    return this.maps.modules[name];
  }

  public getComponent(module: string, name: string): IMapEntry<any> {
    return this.getModule(module).components[name];
  }

  public getDirective(module: string, name: string): IMapEntry<any> {
    return this.getModule(module).directives[name];
  }
}

function getMetadata(mdname: EntityConstructor<any>) {
  return {
    groups: resolvePropertyGroups(mdname),
    inputs: resolveInputProperties(mdname),
    outputs: resolveOutputProperties(mdname),
    attaches: resolveAttachProperties(mdname)
  };
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
