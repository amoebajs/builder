import ts from "typescript";
import { InjectDIToken, Injector } from "@bonbons/di";
import { IInnerComponent } from "../../core/component";
import {
  EntityConstructor,
  IConstructor,
  IFrameworkDepts,
  Injectable,
  resolveAttachProperties,
  resolveInputProperties,
} from "../../core/decorators";
import { BasicCompilationEntity, IBasicCompilationContext, IBasicCompilationFinalContext } from "../../core/base";
import { BasicDirective } from "../../core/directive";
import { createExportModifier, exists } from "../../utils";
import { InvalidOperationError } from "../../errors";
import { BasicChildRef } from "../entities";
import { PropAttach } from "../../core/libs/attach.basic";

export interface IChildRefPluginOptions {
  refComponent: string;
  childName: string;
  input: { [prop: string]: any };
}

export interface IComponentPluginOptions<T extends InjectDIToken<any>> extends IDirectivePluginOptions<T> {
  provider: keyof IFrameworkDepts;
  components?: IComponentPluginOptions<any>[];
  directives?: IDirectivePluginOptions<any>[];
  children?: IChildRefPluginOptions[];
  dependencies?: { [prop: string]: any };
}

export interface IDirectivePluginOptions<T extends InjectDIToken<any>> {
  id: string;
  provider: keyof IFrameworkDepts;
  template: T;
  input?: { [prop: string]: any };
}

export interface IRootPageCreateOptions<T extends InjectDIToken<any>> extends IComponentPluginOptions<T> {
  passContext?: IBasicCompilationContext;
  attach?: { [prop: string]: any };
}

export interface IPropertiesOptions {
  input?: { [prop: string]: any };
  attach?: { [prop: string]: any };
}

@Injectable()
export class BasicEntityProvider {
  constructor(protected readonly injector: Injector) {}

  public createInstance<T extends IConstructor<IInnerComponent>>(
    {
      template,
      input = {},
      attach = {},
      components = [],
      directives = [],
      children = [],
      id,
      passContext,
    }: IRootPageCreateOptions<T>,
    provider: BasicEntityProvider,
  ) {
    const context: IBasicCompilationContext = passContext || {
      extendParent: new Map(),
      implementParents: new Map(),
      fields: new Map(),
      properties: new Map(),
      methods: new Map(),
      imports: new Map(),
      classes: new Map(),
    };
    const model = this._initContextInstance(template, { input, attach }, context).setEntityId(id);
    for (const iterator of components) {
      model["__components"].push(
        this.createInstance(
          {
            id: iterator.id,
            provider: iterator.provider,
            template: iterator.template,
            input: iterator.input,
            components: iterator.components,
            directives: iterator.directives,
            passContext: context,
          },
          provider,
        ),
      );
    }
    for (const iterator of children) {
      model["__children"].push(
        this._initContextInstance(BasicChildRef, {}, context)
          .setEntityId(iterator.childName)
          .setRefComponentId(iterator.refComponent)
          .setRefOptions(iterator.input || {}),
      );
    }
    for (const iterator of directives) {
      model["__directives"].push(
        provider.attachDirective(
          model,
          this._initContextInstance<BasicDirective>(iterator.template, { input: iterator.input }, context).setEntityId(
            iterator.id,
          ),
        ),
      );
    }
    return model;
  }

  public async callCompilation(
    provider: keyof IFrameworkDepts,
    model: IInnerComponent,
    name: string,
    unExport = false,
  ) {
    await model.onInit();
    await model.onComponentsPreRender();
    await model.onComponentsRender();
    await model.onComponentsPostRender();
    await model.onChildrenPreRender();
    await model.onChildrenRender();
    await model.onChildrenPostRender();
    await model.onDirectivesPreAttach();
    await model.onDirectivesAttach();
    await model.onDirectivesPostAttach();
    await model.onPreRender();
    await model.onRender();
    await model.onPostRender();
    const context = this.onCompilationCall(model, model["__context"]);
    const imports = this.onImportsUpdate(model, context.imports);
    const classApp = this.createRootComponent(model, context, unExport);
    const statements = this.onStatementsEmitted(model, [...imports, ...context.classes, classApp]);
    const sourceFile = ts.createSourceFile("temp.tsx", "", ts.ScriptTarget.ES2017, undefined, ts.ScriptKind.TSX);
    return ts.updateSourceFileNode(
      sourceFile,
      statements,
      sourceFile.isDeclarationFile,
      sourceFile.referencedFiles,
      sourceFile.typeReferenceDirectives,
      sourceFile.hasNoDefaultLib,
      sourceFile.libReferenceDirectives,
    );
  }

  /** @override */
  public resolveExtensionsMetadata(_: EntityConstructor<any>): { [name: string]: any } {
    return {};
  }

  /** @override */
  public attachDirective<T extends BasicDirective, P extends IInnerComponent>(parent: P, target: T) {
    return target;
  }

  /** @override */
  protected onInputPropertiesInit<T extends any>(_: T, options: IPropertiesOptions) {
    if (options.input) {
      this._inputProperties(_, options.input);
    }
    if (options.attach) {
      this._attachProperties(_, options.attach);
    }
  }

  /** @override */
  protected onCompilationCall(model: IInnerComponent, _context: IBasicCompilationContext) {
    const context: IBasicCompilationFinalContext = {
      extendParent: null,
      implementParents: [],
      fields: [],
      properties: [],
      methods: [],
      imports: [],
      classes: [],
    };
    const classPreList: Array<[string | symbol, Partial<IBasicCompilationFinalContext>]> = [];
    // for (const [key, scopes] of Object.entries(_context)) {
    //   for (const [scopeName, scope] of scopes.entries()) {
    //     // 组件作用域在当前SourceFile中
    //     if (scope.type === "component" && scopeName !== model["entityId"]) {
    //       if (key === "imports") {
    //         context[key].push(...(<ts.ImportDeclaration[]>scope.items));
    //       } else {
    //         const target = classPreList.find(([id]) => id === scopeName);
    //         if (!target) {
    //           classPreList.push([scopeName, { [key]: scope.items }]);
    //         } else {
    //           if (key === "extendParent") {
    //           } else if (!target[1][key]) {
    //             target[1][currentKey] = <any>value.items;
    //           } else {
    //             target[1][currentKey]!.push(...(<any>value.items));
    //           }
    //         }
    //       }
    //     }
    //   }
    // }
    for (const key in _context) {
      if (_context.hasOwnProperty(key)) {
        const currentKey: keyof IBasicCompilationFinalContext = <any>key;
        const item = _context[currentKey];
        const scopesArr = Array.from(<IterableIterator<string | symbol>>item.keys());
        for (const scope of scopesArr) {
          const value = item.get(scope)!;
          // 组件作用域在当前SourceFile中
          if (value.type === "component" && scope !== model["entityId"]) {
            if (currentKey === "imports") {
              (<any>context)[key].push(...(<any[]>value.items));
            } else {
              const target = classPreList.find(([id, _]) => id === scope);
              if (!target) {
                classPreList.push([scope, { [currentKey]: <any>value.items }]);
              } else {
                if (currentKey === "extendParent") {
                } else if (!target[1][currentKey]) {
                  target[1][currentKey] = <any>value.items;
                } else {
                  target[1][currentKey]!.push(...(<any>value.items));
                }
              }
            }
          }
          // 指令作用域在当前Class中
          if (value.type === "directive" || scope == model["entityId"]) {
            if (currentKey === "extendParent") {
              context[currentKey] = <any>value.items;
            } else {
              (<any>context)[key].push(...(<any[]>value.items));
            }
          }
        }
      }
    }
    context.classes = classPreList.map(([scope, ctx]) =>
      createClass(true, scope.toString(), {
        extendParent: null,
        implementParents: [],
        fields: [],
        properties: [],
        methods: [],
        imports: [],
        classes: [],
        ...ctx,
      }),
    );
    return context;
  }

  /** @override */
  protected onImportsUpdate(
    model: IInnerComponent,
    imports: ts.ImportDeclaration[],
    init: ts.ImportDeclaration[] = [],
  ) {
    imports.forEach(importDec => updateImportDeclarations(init, [importDec]));
    return init;
  }

  /** @override */
  protected onStatementsEmitted(model: IInnerComponent, statements: ts.Statement[]): ts.Statement[] {
    return statements;
  }

  /** @override */
  protected createRootComponent(
    model: IInnerComponent,
    context: IBasicCompilationFinalContext,
    isExport = true,
  ): ts.ClassDeclaration {
    return createClass(!isExport, model.entityId, context);
  }

  private _initContextInstance<T extends BasicCompilationEntity>(
    template: InjectDIToken<T>,
    options: IPropertiesOptions,
    context: IBasicCompilationContext,
  ): T {
    const model = this.injector.get(template);
    this.onInputPropertiesInit(model, options);
    Object.defineProperty(model, "__context", {
      enumerable: true,
      configurable: false,
      get() {
        return context;
      },
    });
    return model;
  }

  private _inputProperties<T extends any>(model: T, options: any) {
    const inputs = resolveInputProperties(Object.getPrototypeOf(model).constructor);
    for (const key in inputs) {
      if (inputs.hasOwnProperty(key)) {
        const input = inputs[key];
        const group = input.group;
        if (group && options.hasOwnProperty(group) && options[group].hasOwnProperty(input.name.value!)) {
          (<any>model)[input.realName] = options[group][input.name.value!];
        } else if (options.hasOwnProperty(input.name.value!)) {
          (<any>model)[input.realName] = options[input.name.value!];
        }
      }
    }
  }

  private _attachProperties<T extends any>(model: T, options: any) {
    const attaches = resolveAttachProperties(Object.getPrototypeOf(model).constructor);
    for (const key in attaches) {
      if (attaches.hasOwnProperty(key)) {
        const attach = attaches[key];
        // invalid value or null value
        if (!(model[attach.name.value] instanceof PropAttach)) model[attach.name.value] = new PropAttach();
        model[attach.name.value]["__options"] = options[key] || {};
      }
    }
  }
}

function createClass(unExport: boolean, name: string, context: IBasicCompilationFinalContext) {
  return ts.createClassDeclaration(
    [],
    createExportModifier(!unExport),
    ts.createIdentifier(name),
    [],
    exists([context.extendParent!, ...context.implementParents]),
    exists([...context.fields, ...context.properties, ...context.methods]),
  );
}

function updateImportDeclarations(imports: ts.ImportDeclaration[], statements: ts.ImportDeclaration[]) {
  for (const statement of statements) {
    if (ts.isImportDeclaration(statement)) {
      const { importClause, moduleSpecifier } = statement;
      if (!ts.isStringLiteral(moduleSpecifier)) continue;
      const existIndex = imports.findIndex(
        i =>
          i.importClause &&
          i.moduleSpecifier &&
          ts.isStringLiteral(i.moduleSpecifier) &&
          i.moduleSpecifier.text === moduleSpecifier.text,
      );
      if (existIndex < 0) {
        imports.push(statement);
      } else {
        if (!importClause) continue;
        const sourceItem = imports[existIndex];
        const { importClause: clause01 } = sourceItem;
        const { importClause: clause02 } = statement;
        if (clause01!.namedBindings) {
          if (ts.isNamedImports(clause01!.namedBindings)) {
            if (clause02!.namedBindings && ts.isNamedImports(clause02!.namedBindings!)) {
              const named01 = clause01!.namedBindings as ts.NamedImports;
              const named02 = clause02!.namedBindings as ts.NamedImports;
              const addto: ts.ImportSpecifier[] = [];
              for (const element of named02.elements) {
                const target = named01.elements.find(i => i.name.text === element.name.text);
                if (!target) {
                  addto.push(element);
                }
              }
              named01.elements = ts.createNodeArray([...named01.elements].concat(addto));
            } else {
              imports.push(statement);
            }
          } else if (ts.isNamespaceImport(clause01!.namedBindings!)) {
            if (
              clause02!.namedBindings &&
              ts.isNamespaceImport(clause02!.namedBindings!) &&
              clause02!.namedBindings!.name.text !== clause02!.namedBindings!.name.text
            ) {
              throw new InvalidOperationError("import update failed: duplicate namespace import exist");
            } else {
              imports.push(statement);
            }
          }
        } else {
          // source is default import
          if (!clause02!.namedBindings && clause02!.name!.text !== clause02!.name!.text) {
            throw new InvalidOperationError(
              `import update failed: duplicate default import exist - [${clause02!.name!.text}]`,
            );
          } else {
            imports.push(statement);
          }
        }
      }
    }
  }
}
