import ts from "typescript";
import { InjectDIToken, Injector } from "@bonbons/di";
import { Path } from "./path/path.contract";
import { HtmlBundle } from "./html-bundle";
import { GlobalMap } from "./global-map";
import { BasicEntityProvider } from "./entity-parser";
import { NotFoundError } from "../errors";
import { IFrameworkDepts, Injectable } from "../core/decorators";
import { IWebpackOptions, WebpackBuild, WebpackConfig, WebpackPlugins } from "./webpack";
import { Prettier } from "./prettier/prettier.contract";
import {
  ICompChildRefPluginOptions,
  IComponentCreateOptions,
  IDirecChildRefPluginOptions,
  IDirectiveCreateOptions,
  SourceFileContext,
} from "../core";

export interface IDirectiveDefine {
  module: string;
  name: string;
  id: string;
}

export interface IComponentDefine extends IDirectiveDefine {}

export interface IDirectiveChildDefine {
  ref: string;
  id: string;
  input?: { [name: string]: any };
}

export interface IComponentChildDefine extends IDirectiveChildDefine {
  children?: IComponentChildDefine[];
  directives?: IComponentChildDefine[];
  attach?: { [name: string]: any };
  props?: { [name: string]: any };
}

export interface IPageDefine extends IComponentChildDefine {}

export interface IPageCreateOptions {
  provider: keyof IFrameworkDepts;
  components?: IComponentDefine[];
  directives?: IDirectiveDefine[];
  page: IPageDefine;
}

export interface ISourceCreateTranspileOptions {
  enabled: boolean;
  beforeTransformer: any[];
  afterTransformer: any[];
  jsx: "react" | "preserve" | false;
  module: "commonjs" | "es2015";
  target: "es5" | "es2015" | "es2016";
}

export interface ISourceCreateOptions {
  prettier?: boolean;
  transpile?: Partial<ISourceCreateTranspileOptions>;
  configs: IPageCreateOptions;
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
    public readonly webpackConfig: WebpackConfig,
    public readonly webpackPlugins: WebpackPlugins,
    public readonly htmlBundle: HtmlBundle,
  ) {}

  public get<T>(contract: InjectDIToken<T>): T {
    return this.injector.get(contract);
  }

  public async createSource(options: ISourceCreateOptions): Promise<ISourceCreateResult> {
    const { configs, prettier: usePrettier = true, transpile = { enabled: false } } = options;
    const parser = !transpile.enabled ? "typescript" : "babel";
    const provider = configs.provider;
    const context = this.injector
      .get<SourceFileContext<BasicEntityProvider>>(SourceFileContext)
      .setProvider(provider)
      .importComponents(mapComp(configs.components))
      .importDirectives(mapDire(configs.directives))
      .createRoot(mapComponentChild([configs.page])[0])
      .create();
    const dependencies = context.dependencies;
    const root = context.root;
    const printer = ts.createPrinter();
    const sourceString = printer.printFile(sourceFile);
    const result: ISourceCreateResult = {
      sourceCode: sourceString,
      depsJSON: JSON.stringify(dependencies, null, "  "),
    };
    if (parser !== "typescript") {
      transpileModule(<any>transpile, result);
    }
    if (usePrettier) {
      result.sourceCode = this.prettier.format(result.sourceCode, {
        printWidth: 120,
        parser: parser,
      });
    }
    return result;
  }

  public buildSource(options: IWebpackOptions): Promise<void> {
    return this.webpackBuild.buildSource(options);
  }

  // private _resolveType(moduleName: string, templateName: string, type: "component" | "directive" | "root") {
  //   const target = this.globalMap[type === "component" || type === "root" ? "getComponent" : "getDirective"](
  //     moduleName,
  //     templateName,
  //   );
  //   if (!target) {
  //     throw new NotFoundError(`${type} [${moduleName}.${templateName}] not found`);
  //   }
  //   return target;
  // }

  // private _resolveCreateOptions(type: "component", options: IComponentCreateOptions): IComponentPluginOptions<any>;
  // private _resolveCreateOptions(type: "directive", options: IDirectiveCreateOptions): IDirectivePluginOptions<any>;
  // private _resolveCreateOptions(type: "root", options: IRootComponentCreateOptions): IRootPageCreateOptions<any>;
  // private _resolveCreateOptions(
  //   type: "component" | "directive" | "root",
  //   options: IRootComponentCreateOptions | IDirectiveCreateOptions | IComponentCreateOptions,
  // ): IComponentPluginOptions<any> | IDirectivePluginOptions<any> | IRootPageCreateOptions<any> {
  //   const entity = this._resolveType(options.moduleName, options.templateName, type);
  //   const comps: IComponentPluginOptions<any>[] = [];
  //   const direcs: IDirectivePluginOptions<any>[] = [];
  //   const childs: ICompChildRefPluginOptions[] = [];
  //   let depts = { ...entity.metadata.entity.dependencies };
  //   let attaches = {};
  //   if (type === "root") {
  //     const opts = <IRootComponentCreateOptions>options;
  //     comps.push(...(opts.components || []).map(i => this._resolveCreateOptions("component", i)));
  //     direcs.push(...(opts.directives || []).map(i => this._resolveCreateOptions("directive", i)));
  //     childs.push(...(opts.children || []));
  //     depts = this._resolveRootDepts(comps, direcs, depts, entity);
  //     attaches = opts.attach || {};
  //   }
  //   return {
  //     id: options.importId,
  //     provider: <any>entity.provider!,
  //     template: entity.value,
  //     input: options.input,
  //     attach: attaches,
  //     components: comps,
  //     directives: direcs,
  //     children: childs,
  //     dependencies: depts,
  //   };
  // }

  // private _resolveRootDepts(
  //   comps: IRootPageCreateOptions<any>[],
  //   direcs: IRootPageCreateOptions<any>[],
  //   depts: { [x: string]: string | string[] },
  //   entity: IMapEntry<any>,
  // ) {
  //   const arrs = [...comps, ...direcs];
  //   for (const iterator of arrs) {
  //     depts = {
  //       ...depts,
  //       ...iterator.dependencies,
  //     };
  //   }
  //   const moduleName = entity.moduleName!;
  //   const moduleDepts = this.globalMap.getModule(moduleName).metadata.entity.dependencies;
  //   depts = {
  //     ...depts,
  //     ...moduleDepts,
  //   };
  //   return depts;
  // }

  // private async _createComponentSource(options: IRootComponentCreateOptions): Promise<ICompileResult> {
  //   const opts = this._resolveCreateOptions("root", options);
  //   const context = this.injector.get<SourceFileContext<BasicEntityProvider>>(SourceFileContext);
  //   context.setProvider(opts.provider);
  //   const instance = context.provider.createInstance({ ...opts, passContext: context });
  //   const sourceFile = await context.provider.callCompilation(opts.provider, instance, options.importId);
  //   return {
  //     sourceFile,
  //     dependencies: opts.dependencies || {},
  //   };
  // }
}

function transpileModule(transpile: Partial<ISourceCreateTranspileOptions>, result: ISourceCreateResult) {
  const {
    target = "es2015",
    module: mode = "es2015",
    jsx = false,
    beforeTransformer = [],
    afterTransformer = [],
  } = transpile;
  result.sourceCode = ts.transpileModule(result.sourceCode, {
    transformers: {
      before: beforeTransformer,
      after: afterTransformer,
    },
    compilerOptions: {
      jsx: jsx === "react" ? ts.JsxEmit.React : jsx === "preserve" ? ts.JsxEmit.Preserve : undefined,
      target:
        target === "es5" ? ts.ScriptTarget.ES5 : target === "es2015" ? ts.ScriptTarget.ES2015 : ts.ScriptTarget.ES2016,
      module: mode === "commonjs" ? ts.ModuleKind.CommonJS : ts.ModuleKind.ES2015,
    },
  }).outputText;
}

function mapDirectiveChild(directives: IDirectiveChildDefine[] = []) {
  return directives.map<IDirecChildRefPluginOptions>(i => ({
    refEntityId: i.ref,
    entityName: i.id,
    options: {
      input: i.input || {},
    },
  }));
}

function mapComponentChild(children: IComponentChildDefine[] = []): ICompChildRefPluginOptions[] {
  return children.map<ICompChildRefPluginOptions>(i => ({
    refEntityId: i.ref,
    entityName: i.id,
    components: mapComponentChild(i.children),
    directives: mapDirectiveChild(i.directives),
    options: {
      attach: i.attach || {},
      input: i.input || {},
      props: i.props || {},
    },
  }));
}

function mapComp(components: IComponentDefine[] = []) {
  return components.map<IComponentCreateOptions>(i => ({
    moduleName: i.module,
    templateName: i.name,
    importId: i.id,
    type: "component",
  }));
}

function mapDire(directives: IDirectiveDefine[] = []) {
  return directives.map<IDirectiveCreateOptions>(i => ({
    moduleName: i.module,
    templateName: i.name,
    importId: i.id,
    type: "directive",
  }));
}
