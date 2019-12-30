import ts from "typescript";
import {
  Builder,
  ISourceCreateOptions,
  ISourceFileCreateOptions,
  ISourceStringCreateOptions,
  IPageCreateOptions
} from "../contracts";
import { emitSourceFileSync, createReactMainFile } from "../utils";
import { NotFoundError } from "../errors";
import { Injectable } from "../core/decorators";
import {
  IInstanceCreateOptions,
  IChildRefPluginOptions
} from "../core/component";

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
export class BuilderProvider extends Builder {
  public async createSource(options: ISourceCreateOptions): Promise<void> {
    const { configs } = options;
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
    if ((<ISourceFileCreateOptions>options).fileName) {
      const opt = <ISourceFileCreateOptions>options;
      await emitSourceFileSync({
        statements: sourceFile.statements,
        prettier: opt.prettier,
        folder: opt.outDir,
        filename: opt.fileName + ".tsx"
      });
      await emitSourceFileSync({
        statements: createReactMainFile(compName, opt.fileName),
        prettier: opt.prettier,
        folder: opt.outDir,
        filename: "main.tsx"
      });
    } else {
      const opt = <ISourceStringCreateOptions>options;
      return new Promise(async (resolve, reject) => {
        emitSourceFileSync({
          statements: sourceFile.statements,
          prettier: opt.prettier,
          emit: content => {
            opt.onEmit(content);
            resolve();
          }
        }).catch(reject);
      });
    }
  }

  public buildSource(
    options: import("../contracts").IWebpackOptions
  ): Promise<void> {
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
    const provider = new (this.globalMap.getProvider(opts.provider))();
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
