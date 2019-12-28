import ts from "typescript";
import {
  Builder,
  ISourceCreateOptions,
  ISourceFileCreateOptions,
  ISourceStringCreateOptions
} from "../contracts";
import {
  createReactSourceFile,
  emitSourceFileSync,
  createReactMainFile,
  createSelectPage
} from "../utils";
import { NotFoundError, InvalidOperationError } from "../errors";
import { Injectable } from "../decorators";
import {
  IInstanceCreateOptions,
  createTemplateInstance,
  callCompilation
} from "../core/component";

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
  protected createModuleStatements({
    module: MODULE,
    name: PAGE,
    component: NAME,
    post: POST,
    options: OPTS
  }: IModuleCreateOptions<{ module: string; name: string; args?: any }>) {
    const page = this.globalMap.getPage(MODULE, PAGE);
    if (!page) {
      throw new NotFoundError("page template not found");
    }
    const imports: ts.ImportDeclaration[] = [];
    function onUpdate(statements: ts.ImportDeclaration[]) {
      updateImportDeclarations(imports, statements);
    }
    const processors = (POST || []).map(({ module: md, name, args }) => [
      this.globalMap.getPipe(md, name).value,
      args
    ]);
    const root = createSelectPage(
      NAME,
      page.value,
      OPTS || {},
      processors,
      onUpdate,
      true
    );
    return [...imports, root];
  }

  protected resolveType(
    moduleName: string,
    templateName: string,
    type: "component" | "directive"
  ) {
    const target = this.globalMap[type === "component" ? "getPage" : "getPipe"](
      moduleName,
      templateName
    );
    if (!target) {
      throw new NotFoundError(
        `${type} [${moduleName}.${templateName}] not found`
      );
    }
    return target;
  }

  protected resolveCreateOptions(
    type: "component" | "directive",
    options: IComponentCreateOptions | IDirectiveCreateOptions
  ): IInstanceCreateOptions<any> {
    const entity = this.resolveType(
      options.moduleName,
      options.templateName,
      type
    );
    const comps: any[] = [];
    const direcs: any[] = [];
    if (type === "component") {
      comps.push(
        ...((<IComponentCreateOptions>options).components || []).map(i =>
          this.resolveCreateOptions("component", i)
        )
      );
      direcs.push(
        ...((<IComponentCreateOptions>options).directives || []).map(i =>
          this.resolveCreateOptions("directive", i)
        )
      );
    }
    return {
      template: entity.value,
      options: options.options,
      components: comps,
      directives: direcs
    };
  }

  protected async createComponentSource(options: IComponentCreateOptions) {
    const opts = this.resolveCreateOptions("component", options);
    const instance = createTemplateInstance(opts);
    return callCompilation(instance);
  }

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
          await this.createComponentSource({
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
      return new Promise((resolve, reject) => {
        emitSourceFileSync({
          prettier: opt.prettier,
          emit: content => {
            opt.onEmit(content);
            resolve();
          },
          statements: createReactSourceFile(
            this.createModuleStatements({
              module: configs.page.module,
              name: configs.page.name,
              component: compName,
              options: configs.page.options || {},
              post: configs.page.post || []
            })
          )
        }).catch(reject);
      });
    }
  }

  public buildSource(
    options: import("../contracts").IWebpackOptions
  ): Promise<void> {
    return this.webpackBuild.buildSource(options);
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
