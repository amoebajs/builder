import ts from "typescript";
import { InjectDIToken, Injector } from "@bonbons/di";
import { BasicComponent, IInnerComponent } from "../../core/component";
import {
  EntityConstructor,
  IConstructor,
  IFrameworkDepts,
  Injectable,
  resolveInputProperties
} from "../../core/decorators";
import {
  BasicCompilationEntity,
  IBasicCompilationContext,
  IBasicCompilationFinalContext
} from "../../core/base";
import { BasicDirective } from "../../core/directive";
import { createExportModifier, exists } from "../../utils";
import { InvalidOperationError } from "../../errors";
import { BasicChildRef } from "../entities";

export interface IChildRefPluginOptions {
  refComponent: string;
  childName: string;
  options: { [prop: string]: any };
}

export interface IComponentPluginOptions<T extends InjectDIToken<any>>
  extends IDirectivePluginOptions<T> {
  provider: keyof IFrameworkDepts;
  components?: IComponentPluginOptions<any>[];
  directives?: IDirectivePluginOptions<any>[];
  children?: IChildRefPluginOptions[];
}

export interface IDirectivePluginOptions<T extends InjectDIToken<any>> {
  id: string;
  provider: keyof IFrameworkDepts;
  template: T;
  options?: { [prop: string]: any };
}

export interface IInstanceCreateOptions<T extends InjectDIToken<any>>
  extends IComponentPluginOptions<T> {
  passContext?: IBasicCompilationContext;
}

@Injectable()
export class BasicEntityProvider {
  constructor(protected readonly injector: Injector) {}

  public createInstance<T extends IConstructor<IInnerComponent>>(
    {
      template,
      options = {},
      components = [],
      directives = [],
      children = [],
      id,
      passContext
    }: IInstanceCreateOptions<T>,
    provider: BasicEntityProvider
  ) {
    const context: IBasicCompilationContext = passContext || {
      extendParent: new Map(),
      implementParents: new Map(),
      fields: new Map(),
      properties: new Map(),
      methods: new Map(),
      imports: new Map(),
      classes: new Map()
    };
    const model = this._initPropsContextInstance(
      template,
      options,
      context
    ).setEntityId(id);
    for (const iterator of components) {
      model["__components"].push(
        this.createInstance(
          {
            id: iterator.id,
            provider: iterator.provider,
            template: iterator.template,
            options: iterator.options,
            components: iterator.components,
            directives: iterator.directives,
            passContext: context
          },
          provider
        )
      );
    }
    for (const iterator of children) {
      model["__children"].push(
        this._initPropsContextInstance(BasicChildRef, {}, context)
          .setEntityId(iterator.childName)
          .setRefComponentId(iterator.refComponent)
          .setRefOptions(iterator.options || {})
      );
    }
    for (const iterator of directives) {
      model["__directives"].push(
        provider.attachDirective(
          model,
          this._initPropsContextInstance<BasicDirective>(
            iterator.template,
            iterator.options || {},
            context
          ).setEntityId(iterator.id)
        )
      );
    }
    return model;
  }

  public async callCompilation(
    provider: keyof IFrameworkDepts,
    model: BasicComponent,
    name: string,
    unExport = false
  ) {
    await model["onInit"]();
    await model["onComponentsEmitted"]();
    await model["onPreRender"]();
    await model["onRender"]();
    await model["onPostRender"]();
    const context = this.onCompilationCall(model, model["__context"]);
    const imports = this.onImportsUpdate(model, context.imports);
    const classApp = this.createRootComponent(model, context, unExport);
    const statements = this.onStatementsEmitted(model, [
      ...imports,
      ...context.classes,
      classApp
    ]);
    const sourceFile = ts.createSourceFile(
      "temp.tsx",
      "",
      ts.ScriptTarget.ES2017,
      undefined,
      ts.ScriptKind.TSX
    );
    return ts.updateSourceFileNode(
      sourceFile,
      statements,
      sourceFile.isDeclarationFile,
      sourceFile.referencedFiles,
      sourceFile.typeReferenceDirectives,
      sourceFile.hasNoDefaultLib,
      sourceFile.libReferenceDirectives
    );
  }

  /** @override */
  public resolveExtensionsMetadata(
    _: EntityConstructor<any>
  ): { [name: string]: any } {
    return {};
  }

  /** @override */
  public attachDirective<T extends BasicDirective, P extends BasicComponent>(
    parent: P,
    target: T
  ) {
    return target;
  }

  /** @override */
  protected onPropertiesInit<T extends any>(_: T) {}

  /** @override */
  protected onCompilationCall(
    model: BasicComponent,
    _context: IBasicCompilationContext
  ) {
    const context: IBasicCompilationFinalContext = {
      extendParent: null,
      implementParents: [],
      fields: [],
      properties: [],
      methods: [],
      imports: [],
      classes: []
    };
    const classPreList: Array<[
      string | symbol,
      Partial<IBasicCompilationFinalContext>
    ]> = [];
    for (const key in _context) {
      if (_context.hasOwnProperty(key)) {
        const currentKey: keyof IBasicCompilationFinalContext = <any>key;
        const item = _context[currentKey];
        const scopesArr = Array.from(
          <IterableIterator<string | symbol>>item.keys()
        );
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
        ...ctx
      })
    );
    return context;
  }

  /** @override */
  protected onImportsUpdate(
    model: BasicComponent,
    imports: ts.ImportDeclaration[],
    init: ts.ImportDeclaration[] = []
  ) {
    imports.forEach(importDec => updateImportDeclarations(init, [importDec]));
    return init;
  }

  /** @override */
  protected onStatementsEmitted(
    model: BasicComponent,
    statements: ts.Statement[]
  ): ts.Statement[] {
    return statements;
  }

  /** @override */
  protected createRootComponent(
    model: BasicComponent,
    context: IBasicCompilationFinalContext,
    isExport = true
  ): ts.ClassDeclaration {
    return createClass(!isExport, model.entityId, context);
  }

  private _initPropsContextInstance<T extends BasicCompilationEntity>(
    template: InjectDIToken<T>,
    options: { [prop: string]: any },
    context: IBasicCompilationContext
  ): T {
    const instance = this.injector.get(template);
    const model = this._inputProperties(instance, options);
    Object.defineProperty(model, "__context", {
      enumerable: true,
      configurable: false,
      get() {
        return context;
      }
    });
    return model;
  }

  private _inputProperties<T extends any>(model: T, options: any): T {
    const props = resolveInputProperties(
      Object.getPrototypeOf(model).constructor
    );
    for (const key in props) {
      if (props.hasOwnProperty(key)) {
        const prop = props[key];
        const group = prop.group;
        if (
          group &&
          options.hasOwnProperty(group) &&
          options[group].hasOwnProperty(prop.name.value!)
        ) {
          (<any>model)[prop.realName] = options[group][prop.name.value!];
        } else if (options.hasOwnProperty(prop.name.value!)) {
          (<any>model)[prop.realName] = options[prop.name.value!];
        }
      }
    }
    this.onPropertiesInit(model);
    return model;
  }
}

function createClass(
  unExport: boolean,
  name: string,
  context: IBasicCompilationFinalContext
) {
  return ts.createClassDeclaration(
    [],
    createExportModifier(!unExport),
    ts.createIdentifier(name),
    [],
    exists([context.extendParent!, ...context.implementParents]),
    exists([...context.fields, ...context.properties, ...context.methods])
  );
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
