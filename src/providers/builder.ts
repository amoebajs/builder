import ts from "typescript";
import {
  Builder,
  ISourceCreateOptions,
  ISourceFileCreateOptions,
  ISourceStringCreateOptions
} from "../contracts";
import { emitSourceFileSync, createReactMainFile } from "../utils";
import { NotFoundError, InvalidOperationError } from "../errors";
import { Injectable } from "../decorators";
import { IInstanceCreateOptions } from "../core/component";

export interface IModuleCreateOptions<T> {
  module: string;
  name: string;
  component: string;
  options?: any;
  post?: Array<T>;
}

export interface IDirectiveCreateOptions {
  moduleName: string;
  templateName: string;
  componentName: string;
  options?: any;
}

export interface IComponentCreateOptions extends IDirectiveCreateOptions {
  components?: Array<IComponentCreateOptions>;
  directives?: Array<IDirectiveCreateOptions>;
}

@Injectable()
export class BuilderProvider extends Builder {
  public async createSource(options: ISourceCreateOptions): Promise<void> {
    const compName = "App";
    if ((<ISourceFileCreateOptions>options).fileName) {
      const opt = <ISourceFileCreateOptions>options;
      const { configs } = opt;
      await emitSourceFileSync({
        prettier: opt.prettier,
        folder: opt.outDir,
        filename: opt.fileName + ".tsx",
        statements: (
          await this._createComponentSource({
            moduleName: configs.page.module,
            templateName: configs.page.name,
            componentName: compName,
            options: configs.page.options || {}
          })
        ).statements
      });
      await emitSourceFileSync({
        folder: opt.outDir,
        filename: "main.tsx",
        statements: createReactMainFile(compName, opt.fileName)
      });
    } else {
      const opt = <ISourceStringCreateOptions>options;
      const { configs } = opt;
      return new Promise(async (resolve, reject) => {
        emitSourceFileSync({
          prettier: opt.prettier,
          emit: content => {
            opt.onEmit(content);
            resolve();
          },
          statements: (
            await this._createComponentSource({
              moduleName: configs.page.module,
              templateName: configs.page.name,
              componentName: compName,
              options: configs.page.options || {}
            })
          ).statements
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
    type: "component" | "directive"
  ) {
    const target = this.globalMap[
      type === "component" ? "getComponent" : "getDirective"
    ](moduleName, templateName);
    if (!target) {
      throw new NotFoundError(
        `${type} [${moduleName}.${templateName}] not found`
      );
    }
    return target;
  }

  private _resolveCreateOptions(
    type: "component" | "directive",
    options: IComponentCreateOptions | IDirectiveCreateOptions
  ): IInstanceCreateOptions<any> {
    const entity = this._resolveType(
      options.moduleName,
      options.templateName,
      type
    );
    const comps: any[] = [];
    const direcs: any[] = [];
    if (type === "component") {
      comps.push(
        ...((<IComponentCreateOptions>options).components || []).map(i =>
          this._resolveCreateOptions("component", i)
        )
      );
      direcs.push(
        ...((<IComponentCreateOptions>options).directives || []).map(i =>
          this._resolveCreateOptions("directive", i)
        )
      );
    }
    return {
      provider: <any>entity.provider!,
      template: entity.value,
      options: options.options,
      components: comps,
      directives: direcs
    };
  }

  private async _createComponentSource(options: IComponentCreateOptions) {
    const opts = this._resolveCreateOptions("component", options);
    const provider = new (this.globalMap.getProvider(opts.provider))();
    const instance = provider.createInstance(opts);
    return provider.callCompilation(
      opts.provider,
      instance,
      options.componentName
    );
  }
}

function updateImportDeclarations(
  imports: ts.ImportDeclaration[],
  statements: ts.ImportDeclaration[]
) {
  for (const statement of statements) {
    if (ts.isImportDeclaration(statement)) {
      const { importClause, moduleSpecifier } = statement;
      if (!importClause) continue;
      if (!ts.isStringLiteral(moduleSpecifier)) continue;
      const existIndex = imports.findIndex(
        i =>
          i.importClause &&
          i.moduleSpecifier &&
          ts.isStringLiteral(i.moduleSpecifier) &&
          i.moduleSpecifier.text === moduleSpecifier.text
      );
      if (existIndex < 0) {
        imports.push(statement);
      } else {
        const sourceItem = imports[existIndex];
        const { importClause: clause01 } = sourceItem;
        const { importClause: clause02 } = statement;
        if (clause01!.namedBindings) {
          if (ts.isNamedImports(clause01!.namedBindings)) {
            if (
              clause02!.namedBindings &&
              ts.isNamedImports(clause02!.namedBindings!)
            ) {
              const named01 = clause01!.namedBindings as ts.NamedImports;
              const named02 = clause02!.namedBindings as ts.NamedImports;
              const addto: ts.ImportSpecifier[] = [];
              for (const element of named02.elements) {
                const target = named01.elements.find(
                  i => i.name.text === element.name.text
                );
                if (!target) {
                  addto.push(element);
                }
              }
              named01.elements = ts.createNodeArray(
                [...named01.elements].concat(addto)
              );
            } else {
              imports.push(statement);
            }
          } else if (ts.isNamespaceImport(clause01!.namedBindings!)) {
            if (
              clause02!.namedBindings &&
              ts.isNamespaceImport(clause02!.namedBindings!) &&
              clause02!.namedBindings!.name.text !==
                clause02!.namedBindings!.name.text
            ) {
              throw new InvalidOperationError(
                "import update failed: duplicate namespace import exist"
              );
            } else {
              imports.push(statement);
            }
          }
        } else {
          // source is default import
          if (
            !clause02!.namedBindings &&
            clause02!.name!.text !== clause02!.name!.text
          ) {
            throw new InvalidOperationError(
              `import update failed: duplicate default import exist - [${
                clause02!.name!.text
              }]`
            );
          } else {
            imports.push(statement);
          }
        }
      }
    }
  }
}
