import ts from "typescript";
import { InjectDIToken, Injector } from "@bonbons/di";
import { Path } from "./path/path.contract";
import { HtmlBundle } from "./html-bundle";
import { GlobalMap, IMapEntry } from "./global-map";
import { IChildRefPluginOptions, IInstanceCreateOptions } from "./entity-parser";
import { NotFoundError } from "../errors";
import { Injectable } from "../core/decorators";
import { IWebpackOptions, WebpackBuild, WebpackConfig, WebpackPlugins } from "./webpack";
import { Prettier } from "./prettier/prettier.contract";

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

export type IChildCreateOptions = IChildRefPluginOptions;

export interface IRootComponentCreateOptions extends IDirectiveCreateOptions {
  components?: IDirectiveCreateOptions[];
  directives?: IDirectiveCreateOptions[];
  children?: IChildCreateOptions[];
}

export interface ISourceCreateResult {
  sourceCode: string;
  depsJSON: string;
}

export interface ICompileResult {
  sourceFile: ts.SourceFile;
  dependencies: { [name: string]: string };
}

@Injectable()
export class Builder {
  constructor(
    protected readonly injector: Injector,
    protected readonly path: Path,
    protected readonly prettier: Prettier,
    protected readonly globalMap: GlobalMap,
    protected readonly webpackBuild: WebpackBuild,
    public webpackConfig: WebpackConfig,
    public webpackPlugins: WebpackPlugins,
    public readonly htmlBundle: HtmlBundle,
  ) {}

  public get<T>(contract: InjectDIToken<T>): T {
    return this.injector.get(contract);
  }

  public async createSource(options: ISourceCreateOptions): Promise<ISourceCreateResult> {
    const { configs, prettier: usePrettier = true } = options;
    const compName = configs.page.id || "App";
    const { sourceFile, dependencies } = await this._createComponentSource({
      moduleName: configs.page.module,
      templateName: configs.page.name,
      componentName: compName,
      options: configs.page.options || {},
      components: mapComp(configs),
      directives: mapDire(configs),
      children: mapChild(configs),
    });
    const printer = ts.createPrinter();
    const sourceString = printer.printFile(sourceFile);
    const result: ISourceCreateResult = {
      sourceCode: "",
      depsJSON: JSON.stringify(dependencies, null, "  "),
    };
    if (!usePrettier) {
      result.sourceCode = sourceString;
      return result;
    }
    result.sourceCode = this.prettier.format(sourceString, {
      printWidth: 120,
      parser: "typescript",
    });
    return result;
  }

  public buildSource(options: IWebpackOptions): Promise<void> {
    return this.webpackBuild.buildSource(options);
  }

  private _resolveType(moduleName: string, templateName: string, type: "component" | "directive" | "root") {
    const target = this.globalMap[type === "component" || type === "root" ? "getComponent" : "getDirective"](
      moduleName,
      templateName,
    );
    if (!target) {
      throw new NotFoundError(`${type} [${moduleName}.${templateName}] not found`);
    }
    return target;
  }

  private _resolveCreateOptions(
    type: "component" | "directive" | "root",
    options: IRootComponentCreateOptions | IDirectiveCreateOptions,
  ): IInstanceCreateOptions<any> {
    const entity = this._resolveType(options.moduleName, options.templateName, type);
    const comps: IInstanceCreateOptions<any>[] = [];
    const direcs: IInstanceCreateOptions<any>[] = [];
    const childs: IChildRefPluginOptions[] = [];
    let depts = { ...entity.metadata.entity.dependencies };
    if (type === "root") {
      comps.push(
        ...((<IRootComponentCreateOptions>options).components || []).map(i =>
          this._resolveCreateOptions("component", i),
        ),
      );
      direcs.push(
        ...((<IRootComponentCreateOptions>options).directives || []).map(i =>
          this._resolveCreateOptions("directive", i),
        ),
      );
      childs.push(...((<IRootComponentCreateOptions>options).children || []));
      depts = this._resolveRootDepts(comps, direcs, depts, entity);
    }
    return {
      id: options.componentName,
      provider: <any>entity.provider!,
      template: entity.value,
      options: options.options,
      components: comps,
      directives: direcs,
      children: childs,
      dependencies: depts,
    };
  }

  private _resolveRootDepts(
    comps: IInstanceCreateOptions<any>[],
    direcs: IInstanceCreateOptions<any>[],
    depts: { [x: string]: string | string[] },
    entity: IMapEntry<any>,
  ) {
    const arrs = [...comps, ...direcs];
    for (const iterator of arrs) {
      depts = {
        ...depts,
        ...iterator.dependencies,
      };
    }
    const moduleName = entity.moduleName!;
    const moduleDepts = this.globalMap.getModule(moduleName).metadata.entity.dependencies;
    depts = {
      ...depts,
      ...moduleDepts,
    };
    return depts;
  }

  private async _createComponentSource(options: IRootComponentCreateOptions): Promise<ICompileResult> {
    const opts = this._resolveCreateOptions("root", options);
    const PROVIDER = this.globalMap.getProvider(opts.provider);
    const provider = this.get(PROVIDER);
    const instance = provider.createInstance(opts, provider);
    const sourceFile = await provider.callCompilation(opts.provider, instance, options.componentName);
    return {
      sourceFile,
      dependencies: opts.dependencies || {},
    };
  }
}

function mapChild(configs: IPageCreateOptions): IChildCreateOptions[] {
  return (configs.page.children || []).map(i => ({
    childName: i.id,
    refComponent: i.ref,
    options: i.options || {},
  }));
}

function mapComp(configs: IPageCreateOptions): IDirectiveCreateOptions[] {
  return (configs.page.components || []).map(i => ({
    moduleName: i.module,
    templateName: i.name,
    componentName: i.id,
    options: i.options || {},
  }));
}

function mapDire(configs: IPageCreateOptions): IDirectiveCreateOptions[] {
  return (configs.page.directives || []).map(i => ({
    moduleName: i.module,
    templateName: i.name,
    componentName: i.id,
    options: i.options || {},
  }));
}
