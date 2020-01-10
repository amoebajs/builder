import ts, { Identifier, isMethodDeclaration } from "typescript";
import { InjectDIToken, Injector } from "@bonbons/di";
import { IInnerComponent, callComponentLifecycle } from "../../core/component";
import {
  EntityConstructor,
  IConstructor,
  IFrameworkDepts,
  Injectable,
  resolveAttachProperties,
  resolveInputProperties,
} from "../../core/decorators";
import {
  BasicCompilationEntity,
  IBasicCompilationContext,
  IBasicCompilationFinalContext,
  IChildPropMap,
  IComponentAttachMap,
  IDirectiveInputMap,
  ITypedSyntaxExpressionMap,
} from "../../core/base";
import { BasicDirective } from "../../core/directive";
import { InvalidOperationError } from "../../errors";
import { BasicChildRef } from "../entities";
import { PropAttach } from "../../core/libs/attach.basic";
import { BasicHelper } from "../entity-helper";
import { is } from "../../utils/is";

export interface IChildRefPluginOptions {
  refComponent: string;
  childName: string;
  props: IChildPropMap;
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
  input?: IDirectiveInputMap;
}

export interface IRootPageCreateOptions<T extends InjectDIToken<any>> extends IComponentPluginOptions<T> {
  passContext?: IBasicCompilationContext;
  attach?: IComponentAttachMap;
}

export interface IPropertiesOptions {
  input?: IDirectiveInputMap;
  attach?: IComponentAttachMap;
}

@Injectable()
export abstract class BasicEntityProvider {
  constructor(protected readonly injector: Injector, protected readonly helper: BasicHelper) {}

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
    const context: IBasicCompilationContext = passContext || new Map();
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
          .setRefOptions(iterator.props || {}),
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
    await callComponentLifecycle(model);
    const context = this.onCompilationCall(model, model["__context"]);
    const imports = this.onImportsUpdate(model, context.imports);
    const classApp = this.createRootComponent(model, context, unExport);
    const statements = this.onStatementsEmitted(model, [
      ...imports,
      ...context.classes,
      ...context.functions,
      classApp,
    ]);
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
      functions: [],
      parameters: [],
      statements: [],
    };
    const classPreList: Array<[string | symbol, Partial<IBasicCompilationFinalContext>]> = [];
    const functionPreList: Array<[string | symbol, Partial<IBasicCompilationFinalContext>]> = [];
    const _contexts = _context.entries();
    for (const [scope, group] of _contexts) {
      if (group.type === "component" && scope !== model["entityId"]) {
        const { imports = [], ...others } = group.container;
        context.imports.push(...imports);

        const classTemplate = this.emitClassComponentContext(others);
        classTemplate && classPreList.push([scope, classTemplate]);

        const functionTemplate = this.emitFunctionComponentContext(others);
        functionTemplate && functionPreList.push([scope, functionTemplate]);
      } else if (group.type === "directive" || scope == model["entityId"]) {
        const { extendParent, ...others } = group.container;
        if (extendParent !== void 0) {
          context.extendParent = extendParent;
        }
        for (const [key, elements] of Object.entries(others)) {
          (<any>context)[key]!.push(...(<ts.Node[]>elements));
        }
      }
    }
    context.classes = classPreList
      .filter(i => !!i)
      .map(([scope, ctx]) =>
        this.helper.createClassByContext(true, scope.toString(), {
          extendParent: null,
          implementParents: [],
          fields: [],
          properties: [],
          methods: [],
          imports: [],
          classes: [],
          functions: [],
          parameters: [],
          statements: [],
          ...ctx,
        }),
      );
    context.functions = functionPreList.map(([scope, ctx]) =>
      this.helper.createFunctionByContext(true, scope.toString(), {
        extendParent: null,
        implementParents: [],
        fields: [],
        properties: [],
        methods: [],
        imports: [],
        classes: [],
        functions: [],
        statements: [],
        parameters: [],
        ...ctx,
      }),
    );
    return context;
  }

  protected emitClassComponentContext(
    _context: Partial<IBasicCompilationFinalContext>,
  ): Partial<IBasicCompilationFinalContext> | null {
    return null;
  }

  protected emitFunctionComponentContext(
    _context: Partial<IBasicCompilationFinalContext>,
  ): Partial<IBasicCompilationFinalContext> | null {
    return null;
  }

  /** @override */
  protected onImportsUpdate(model: IInnerComponent, imports: ts.ImportDeclaration[]) {
    return this.combineImports(imports);
  }

  protected combineImports(raw: ts.ImportDeclaration[]) {
    const { helper } = this;
    const record: Record<
      string,
      {
        default: string[];
        named: string[][];
        namespace: string[];
      }
    > = {};
    for (const { moduleSpecifier: moduleName, importClause } of raw) {
      const defaultImport = importClause?.name;
      const namedImports = importClause?.namedBindings || ts.createNamedImports([]);
      const imported = record[(<ts.StringLiteral>moduleName).text];
      if (imported) {
        if (defaultImport && !imported.default.includes(defaultImport.text)) {
          imported.default.push(defaultImport.text);
        }
        if (ts.isNamedImports(namedImports)) {
          imported.named.push(
            ...namedImports.elements
              .filter(specifier =>
                imported.named.every(
                  ([importedPropertyName, importedName]) =>
                    importedPropertyName !== specifier.propertyName?.text && importedName !== specifier.name.text,
                ),
              )
              .map(specifier => [specifier.propertyName?.text || "", specifier.name.text]),
          );
        } else if (ts.isNamespaceImport(namedImports) && !imported.namespace.includes(namedImports.name.text)) {
          imported.namespace.push(namedImports.name.text);
        }
      } else {
        record[(<ts.StringLiteral>moduleName).text] = {
          default: defaultImport ? [defaultImport.text] : [],
          named: ts.isNamedImports(namedImports)
            ? namedImports.elements.map(specifier => [specifier.propertyName?.text || "", specifier.name.text])
            : [],
          namespace: ts.isNamespaceImport(namedImports) ? [namedImports.name.text] : [],
        };
      }
    }
    const combinedImportDeclarations: ts.ImportDeclaration[] = [];
    for (const [moduleName, imports] of Object.entries(record)) {
      for (const namespaceImport of imports.namespace) {
        combinedImportDeclarations.push(helper.createNamespaceImport(moduleName, namespaceImport));
      }
      for (const defaultImport of imports.default) {
        combinedImportDeclarations.push(
          helper.createImport(moduleName, defaultImport, imports.named.length ? imports.named : undefined),
        );
        // 具名导入跟随默认导入创建完成后删除，避免接下来重复创建
        imports.named = [];
      }
      if (imports.named.length) {
        // 如果没有默认导入，此处创建具名导入
        combinedImportDeclarations.push(helper.createImport(moduleName, undefined, imports.named));
      }
      if (!imports.named.length && !imports.default.length && !imports.namespace.length) {
        combinedImportDeclarations.push(helper.createImport(moduleName));
      }
    }
    return combinedImportDeclarations;
  }

  /** @override */
  protected onStatementsEmitted(model: IInnerComponent, statements: ts.Statement[]): ts.Statement[] {
    return statements;
  }

  /** @override */
  protected abstract createRootComponent(
    model: IInnerComponent,
    context: IBasicCompilationFinalContext,
    isExport?: boolean,
  ): ts.Statement;

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

  private _inputProperties<T extends any>(model: T, options: IDirectiveInputMap) {
    const inputs = resolveInputProperties(Object.getPrototypeOf(model).constructor);
    for (const key in inputs) {
      if (inputs.hasOwnProperty(key)) {
        const input = inputs[key];
        const group = input.group;
        let value: IDirectiveInputMap[typeof key] | null = null;
        if (group && options.hasOwnProperty(group) && options[group].hasOwnProperty(input.name.value!)) {
          const groupMap = <ITypedSyntaxExpressionMap<any, any>>options[group];
          value = groupMap[input.name.value!];
        } else if (options.hasOwnProperty(input.name.value!)) {
          value = (<ITypedSyntaxExpressionMap<any, any>>options)[input.name.value!];
        }
        if (is.nullOrUndefined(value)) continue;
        if (value.type === "literal") {
          (<any>model)[input.realName] = value.expression;
        }
        if (value.type === "directiveRef") {
          // TODO
        }
        // TODO 后续支持其他属性类型
      }
    }
  }

  private _attachProperties<T extends any>(model: T, options: IComponentAttachMap) {
    const attaches = resolveAttachProperties(Object.getPrototypeOf(model).constructor);
    for (const key in attaches) {
      if (attaches.hasOwnProperty(key)) {
        const attach = attaches[key];
        // invalid value or null value
        if (!(model[attach.name.value] instanceof PropAttach)) model[attach.name.value] = new PropAttach();
        const propAttach: PropAttach = model[attach.name.value];
        const syntaxStruct = options[key];
        // 暂时只支持childRefs模式
        if (is.nullOrUndefined(syntaxStruct) || syntaxStruct.type !== "childRefs") continue;
        for (const iterator of options[key].expression) {
          propAttach["_options"].set(iterator.id, iterator.value);
        }
      }
    }
  }
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

function isImportAlias(propertyName: ts.Identifier | undefined, name: ts.Identifier) {
  return propertyName?.text !== name.text;
}
