import ts from "typescript";
import kebabCase from "lodash/kebabCase";
import { InjectDIToken, Injector } from "@bonbons/di";
import { IFrameworkDepts, Injectable } from "../core";
import { Path } from "./path/path.contract";
import { HtmlBundle } from "./html-bundle";
import { GlobalMap } from "./global-map";
import { BasicEntityProvider } from "./entity-parser";
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

export interface IPageDefine extends IComponentChildDefine {
  slot?: string;
}

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
  dependencies: Record<string, string>;
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
      .build();
    await context.createRoot(mapComponentChild([configs.page])[0]);
    await context.callCompilation();
    const sourceFile = await context.createSourceFile();
    const printer = ts.createPrinter();
    const sourceString = printer.printFile(sourceFile);
    const result = buildResult(sourceString, context.dependencies);
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
}

function buildResult(source: string, depts: Record<string, string>): ISourceCreateResult {
  const dependencies: Record<string, string> = {};
  for (const key in depts) {
    if (depts.hasOwnProperty(key)) {
      const version = depts[key];
      dependencies[kebabCase(key)] = version;
    }
  }
  return {
    sourceCode: source,
    dependencies,
  };
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
