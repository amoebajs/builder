import ts from "typescript";
import prettier from "prettier";
import { Injector, InjectDIToken } from "@bonbons/di";
import { Path } from "./path";
import { HtmlBundle } from "./html-bundle";
import { GlobalMap } from "./global-map";
import {
  IChildRefPluginOptions,
  IInstanceCreateOptions
} from "./entity-parser";
import { NotFoundError } from "../errors";
import { Injectable } from "../core/decorators";
import { emitSourceFileSync, createReactMainFile } from "../utils";
import {
  WebpackConfig,
  WebpackBuild,
  WebpackPlugins,
  IWebpackOptions
} from "./webpack";

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

export interface ISourceCreateOptions {
  prettier?: boolean;
  configs: IPageCreateOptions;
}

export interface IDirectiveCreateOptions {
  moduleName: string;
  templateName: string;
  componentName: string;
  options: { [prop: string]: any };
}

export interface IChildCreateOptions extends IChildRefPluginOptions {}

export interface IRootComponentCreateOptions extends IDirectiveCreateOptions {
  components?: IDirectiveCreateOptions[];
  directives?: IDirectiveCreateOptions[];
  children?: IChildCreateOptions[];
}

@Injectable()
export class Builder {
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

  public async createSource(options: ISourceCreateOptions): Promise<string> {
    const { configs, prettier: usePrettier = true } = options;
    const compName = configs.page.id || "App";
    const sourceFile = await this._createComponentSource({
      moduleName: configs.page.module,
      templateName: configs.page.name,
      componentName: compName,
      options: configs.page.options || {},
      components: mapComp(configs),
      directives: mapDire(configs),
      children: mapChild(configs)
    });
    const printer = ts.createPrinter();
    let sourceString = printer.printFile(sourceFile);
    if (!usePrettier) {
      return sourceString;
    }
    return prettier.format(sourceString, {
      printWidth: 120,
      parser: "typescript"
    });
  }

  public buildSource(options: IWebpackOptions): Promise<void> {
    return this.webpackBuild.buildSource(options);
  }

  private _resolveType(
    moduleName: string,
    templateName: string,
    type: "component" | "directive" | "root"
  ) {
    const target = this.globalMap[
      type === "component" || type === "root" ? "getComponent" : "getDirective"
    ](moduleName, templateName);
    if (!target) {
      throw new NotFoundError(
        `${type} [${moduleName}.${templateName}] not found`
      );
    }
    return target;
  }

  private _resolveCreateOptions(
    type: "component" | "directive" | "root",
    options: IRootComponentCreateOptions | IDirectiveCreateOptions
  ): IInstanceCreateOptions<any> {
    const entity = this._resolveType(
      options.moduleName,
      options.templateName,
      type
    );
    const comps: any[] = [];
    const direcs: any[] = [];
    const childs: any[] = [];
    if (type === "root") {
      comps.push(
        ...((<IRootComponentCreateOptions>options).components || []).map(i =>
          this._resolveCreateOptions("component", i)
        )
      );
      direcs.push(
        ...((<IRootComponentCreateOptions>options).directives || []).map(i =>
          this._resolveCreateOptions("directive", i)
        )
      );
      childs.push(...((<IRootComponentCreateOptions>options).children || []));
    }
    return {
      id: options.componentName,
      provider: <any>entity.provider!,
      template: entity.value,
      options: options.options,
      components: comps,
      directives: direcs,
      children: childs
    };
  }

  private async _createComponentSource(options: IRootComponentCreateOptions) {
    const opts = this._resolveCreateOptions("root", options);
    const PROVIDER = this.globalMap.getProvider(opts.provider);
    const provider = this.get(PROVIDER);
    const instance = provider.createInstance(opts, provider);
    return provider.callCompilation(
      opts.provider,
      instance,
      options.componentName
    );
  }
}

function mapChild(configs: IPageCreateOptions): IChildCreateOptions[] {
  return (configs.page.children || []).map(i => ({
    childName: i.id,
    refComponent: i.ref,
    options: i.options || {}
  }));
}

function mapComp(configs: IPageCreateOptions): IDirectiveCreateOptions[] {
  return (configs.page.components || []).map(i => ({
    moduleName: i.module,
    templateName: i.name,
    componentName: i.id,
    options: i.options || {}
  }));
}

function mapDire(configs: IPageCreateOptions): IDirectiveCreateOptions[] {
  return (configs.page.directives || []).map(i => ({
    moduleName: i.module,
    templateName: i.name,
    componentName: i.id,
    options: i.options || {}
  }));
}
