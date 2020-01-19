import ts from "typescript";
import { InjectDIToken, Injector } from "@bonbons/di";
import {
  EntityConstructor,
  IBasicEntityProvider,
  IComponentAttachMap,
  IComponentInputMap,
  IDirectiveInputMap,
  IInnerCompnentChildRef,
  IInnerComponent,
  IInnerDirective,
  IInnerDirectiveChildRef,
  ITypedSyntaxExpressionMap,
  Injectable,
  PropAttach,
  SourceFileContext,
  resolveAttachProperties,
  resolveInputProperties,
} from "../../core";
import { BasicHelper } from "../entity-helper";
import { is } from "../../utils/is";

export function wrapMetaIntoCtor<T extends InjectDIToken<any>>(ctor: T, provider: string): T {
  (<any>ctor)["__provider"] = provider;
  return ctor;
}

export function getMetaFromCtor<T extends InjectDIToken<any>>(ctor: T): string | null {
  return (<any>ctor)["__provider"];
}

@Injectable()
export abstract class BasicEntityProvider implements IBasicEntityProvider {
  constructor(protected readonly injector: Injector, protected readonly helper: BasicHelper) {}

  public async attachInstance(
    context: SourceFileContext<IBasicEntityProvider>,
    ref: IInnerCompnentChildRef | IInnerDirectiveChildRef,
  ): Promise<any> {
    const instance: IInnerComponent | IInnerDirective = this.injector.get(ref.__refConstructor);
    if (ref.__etype === "componentChildRef") {
      await this._attachComponent(<IInnerComponent>instance, (<IInnerCompnentChildRef>ref).__options);
    } else {
      await this._attachDirective(<IInnerDirective>instance, (<IInnerDirectiveChildRef>ref).__options);
    }
    instance.setEntityId(ref.__entityId);
    instance["injector"] = this.injector;
    instance["__context"] = context;
    return instance;
  }

  public resolveExtensionsMetadata(_: InjectDIToken<any>): {} {
    return {};
  }

  public afterImportsCreated(
    context: SourceFileContext<IBasicEntityProvider>,
    imports: ts.ImportDeclaration[],
  ): ts.ImportDeclaration[] {
    return this.combineImports(imports);
  }

  public afterVariablesCreated(
    context: SourceFileContext<IBasicEntityProvider>,
    variables: ts.VariableStatement[],
  ): ts.VariableStatement[] {
    return variables;
  }

  public afterClassesCreated(
    context: SourceFileContext<IBasicEntityProvider>,
    classes: ts.ClassDeclaration[],
  ): ts.ClassDeclaration[] {
    return classes;
  }

  public afterFunctionsCreated(
    context: SourceFileContext<IBasicEntityProvider>,
    funcs: ts.FunctionDeclaration[],
  ): ts.FunctionDeclaration[] {
    return funcs;
  }

  public afterAllCreated(context: SourceFileContext<IBasicEntityProvider>, statements: ts.Statement[]): ts.Statement[] {
    return statements;
  }

  private async _attachComponent(instance: IInnerComponent, { input, attach }: IInnerCompnentChildRef["__options"]) {
    const template = Object.getPrototypeOf(instance).constructor;
    this._setInputs(template, instance, input);
    this._setAttach(template, instance, attach);
    return instance;
  }

  private async _attachDirective(instance: IInnerDirective, { input }: IInnerDirectiveChildRef["__options"]) {
    const template = Object.getPrototypeOf(instance).constructor;
    this._setInputs(template, instance, input);
    return instance;
  }

  private _setInputs(
    template: EntityConstructor<any>,
    instance: IInnerComponent | IInnerDirective,
    options: IComponentInputMap | IDirectiveInputMap,
  ) {
    const inputs = resolveInputProperties(template);
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
          (<any>instance)[input.realName] = value.expression;
        }
        if (value.type === "directiveRef") {
          // TODO
        }
        // TODO 后续支持其他属性类型
      }
    }
  }

  private _setAttach(template: EntityConstructor<any>, instance: IInnerComponent, options: IComponentAttachMap) {
    const attaches = resolveAttachProperties(template);
    for (const key in attaches) {
      if (attaches.hasOwnProperty(key)) {
        const attach = attaches[key];
        // invalid value or null value
        if (!((<any>instance)[attach.name.value] instanceof PropAttach)) {
          (<any>instance)[attach.name.value] = new PropAttach();
        }
        const propAttach: PropAttach = (<any>instance)[attach.name.value];
        const syntaxStruct = options[key];
        // 暂时只支持childRefs模式
        if (is.nullOrUndefined(syntaxStruct) || syntaxStruct.type !== "childRefs") continue;
        for (const iterator of options[key].expression) {
          propAttach["_options"].set(iterator.id, iterator.value);
        }
      }
    }
  }

  // public createInstance<T extends IInnerComponent>({
  //   template,
  //   input = {},
  //   attach = {},
  //   components = [],
  //   directives = [],
  //   children = [],
  //   id,
  //   passContext: context,
  // }: IRootPageCreateOptions<IConstructor<T>>) {
  //   const model: T = this._initContextInstance(template, { input, attach }, context).setEntityId(id);
  //   for (const iterator of components) {
  //     model["__components"].push(this._createComponnentFn(iterator, context));
  //   }
  //   for (const iterator of children) {
  //     model["__children"].push(<any>this._createChildRefFn(context, iterator));
  //   }
  //   for (const iterator of directives) {
  //     model["__directives"].push(<any>this._createDirectiveFn(context, model, iterator));
  //   }
  //   return model;
  // }

  // private _createComponnentFn(
  //   iterator: IComponentPluginOptions<any>,
  //   context: SourceFileContext<BasicEntityProvider>,
  // ): IInnerComponent {
  //   return this.createInstance<IInnerComponent>({
  //     id: iterator.id,
  //     provider: iterator.provider,
  //     template: iterator.template,
  //     input: iterator.input,
  //     components: iterator.components,
  //     directives: iterator.directives,
  //     passContext: context,
  //   });
  // }

  // private _createChildRefFn(
  //   context: SourceFileContext<BasicEntityProvider>,
  //   iterator: ICompChildRefPluginOptions,
  // ): BasicChildRef<any> {
  //   return this._initContextInstance(BasicChildRef, {}, context)
  //     .setEntityId(iterator.childName)
  //     .setRefComponentId(iterator.refEntity)
  //     .setRefOptions(iterator.props || {});
  // }

  // private _createDirectiveFn(
  //   context: SourceFileContext<BasicEntityProvider>,
  //   model: any,
  //   { id, template, input = {} }: IComponentPluginOptions<any>,
  // ): BasicDirective<any> {
  //   return context.provider.attachDirective(
  //     model,
  //     this._initContextInstance<BasicDirective>(template, { input }, context).setEntityId(id),
  //   );
  // }

  // public async callCompilation(
  //   provider: keyof IFrameworkDepts,
  //   model: IInnerComponent,
  //   name: string,
  //   unExport = false,
  // ) {
  //   await callComponentLifecycle(model);
  //   const context = this.onCompilationCall(model, model["__context"]);
  //   const imports = this.onImportsUpdate(model, context.imports);
  //   const classApp = this.createRootComponent(model, context, unExport);
  //   const statements = this.onStatementsEmitted(model, [
  //     ...imports,
  //     ...context.classes,
  //     ...context.functions,
  //     classApp,
  //   ]);
  //   const sourceFile = ts.createSourceFile("temp.tsx", "", ts.ScriptTarget.ES2017, undefined, ts.ScriptKind.TSX);
  //   return ts.updateSourceFileNode(
  //     sourceFile,
  //     statements,
  //     sourceFile.isDeclarationFile,
  //     sourceFile.referencedFiles,
  //     sourceFile.typeReferenceDirectives,
  //     sourceFile.hasNoDefaultLib,
  //     sourceFile.libReferenceDirectives,
  //   );
  // }

  // /** @override */
  // public resolveExtensionsMetadata(_: EntityConstructor<any>): { [name: string]: any } {
  //   return {};
  // }

  // /** @override */
  // public attachDirective<T extends BasicDirective, P extends IInnerComponent>(parent: P, target: T) {
  //   return target;
  // }

  // /** @override */
  // protected onInputPropertiesInit<T extends IInnerEwsEntity>(_: T, options: IPropertiesOptions) {
  //   if (options.input) {
  //     this._inputProperties(_, options.input);
  //   }
  //   if (options.attach) {
  //     this._attachProperties(_, options.attach);
  //   }
  // }

  // /** @override */
  // protected onCompilationCall(model: IInnerComponent, _context: SourceFileContext<BasicEntityProvider>) {
  //   const context: IFinalScopedContext = {
  //     extendParent: null,
  //     implementParents: [],
  //     fields: [],
  //     properties: [],
  //     methods: [],
  //     imports: [],
  //     classes: [],
  //     functions: [],
  //     parameters: [],
  //     statements: [],
  //   };
  //   const classPreList: Array<[string | symbol, Partial<IFinalScopedContext>]> = [];
  //   const functionPreList: Array<[string | symbol, Partial<IFinalScopedContext>]> = [];
  //   const _contexts = _context.scopedContext.entries();
  //   for (const [scope, group] of _contexts) {
  //     if (group.type === "component" && scope !== model["entityId"]) {
  //       const { imports = [], ...others } = group.container;
  //       context.imports.push(...imports);

  //       const classTemplate = this.emitClassComponentContext(others);
  //       classTemplate && classPreList.push([scope, classTemplate]);

  //       const functionTemplate = this.emitFunctionComponentContext(others);
  //       functionTemplate && functionPreList.push([scope, functionTemplate]);
  //     } else if (group.type === "directive" || scope == model["entityId"]) {
  //       const { extendParent, ...others } = group.container;
  //       if (extendParent !== void 0) {
  //         context.extendParent = extendParent;
  //       }
  //       for (const [key, elements] of Object.entries(others)) {
  //         (<any>context)[key]!.push(...(<ts.Node[]>elements));
  //       }
  //     }
  //   }
  //   context.classes = classPreList
  //     .filter(i => !!i)
  //     .map(([scope, ctx]) =>
  //       this.helper.createClassByContext(true, scope.toString(), {
  //         extendParent: null,
  //         implementParents: [],
  //         fields: [],
  //         properties: [],
  //         methods: [],
  //         imports: [],
  //         classes: [],
  //         functions: [],
  //         parameters: [],
  //         statements: [],
  //         ...ctx,
  //       }),
  //     );
  //   context.functions = functionPreList.map(([scope, ctx]) =>
  //     this.helper.createFunctionByContext(true, scope.toString(), {
  //       extendParent: null,
  //       implementParents: [],
  //       fields: [],
  //       properties: [],
  //       methods: [],
  //       imports: [],
  //       classes: [],
  //       functions: [],
  //       statements: [],
  //       parameters: [],
  //       ...ctx,
  //     }),
  //   );
  //   return context;
  // }

  // protected emitClassComponentContext(_context: Partial<IFinalScopedContext>): Partial<IFinalScopedContext> | null {
  //   return null;
  // }

  // protected emitFunctionComponentContext(_context: Partial<IFinalScopedContext>): Partial<IFinalScopedContext> | null {
  //   return null;
  // }

  // /** @override */
  // protected onImportsUpdate(model: IInnerComponent, imports: ts.ImportDeclaration[]) {
  //   return this.combineImports(imports);
  // }

  private combineImports(raw: ts.ImportDeclaration[]) {
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

  // /** @override */
  // protected onStatementsEmitted(model: IInnerComponent, statements: ts.Statement[]): ts.Statement[] {
  //   return statements;
  // }

  // /** @override */
  // protected abstract createRootComponent(
  //   model: IInnerComponent,
  //   context: IFinalScopedContext,
  //   isExport?: boolean,
  // ): ts.Statement;

  // private _initContextInstance<T extends IInnerEwsEntity>(
  //   instance: T,
  //   options: IComponentPropertiesOptions,
  //   context: SourceFileContext<BasicEntityProvider>,
  // ): T {
  //   const model = instance;
  //   this.onInputPropertiesInit(<any>model, options);
  //   this._compositions(<any>model, context);
  //   Object.defineProperty(model, "__context", {
  //     enumerable: true,
  //     configurable: false,
  //     get() {
  //       return context;
  //     },
  //   });
  //   return model;
  // }

  // private _inputProperties<T extends IInnerEwsEntity>(model: T, options: IDirectiveInputMap) {
  //   const inputs = resolveInputProperties(Object.getPrototypeOf(model).constructor);
  //   for (const key in inputs) {
  //     if (inputs.hasOwnProperty(key)) {
  //       const input = inputs[key];
  //       const group = input.group;
  //       let value: IDirectiveInputMap[typeof key] | null = null;
  //       if (group && options.hasOwnProperty(group) && options[group].hasOwnProperty(input.name.value!)) {
  //         const groupMap = <ITypedSyntaxExpressionMap<any, any>>options[group];
  //         value = groupMap[input.name.value!];
  //       } else if (options.hasOwnProperty(input.name.value!)) {
  //         value = (<ITypedSyntaxExpressionMap<any, any>>options)[input.name.value!];
  //       }
  //       if (is.nullOrUndefined(value)) continue;
  //       if (value.type === "literal") {
  //         (<any>model)[input.realName] = value.expression;
  //       }
  //       if (value.type === "directiveRef") {
  //         // TODO
  //       }
  //       // TODO 后续支持其他属性类型
  //     }
  //   }
  // }

  // private _attachProperties<T extends IInnerEwsEntity>(model: T, options: IComponentAttachMap) {
  //   const attaches = resolveAttachProperties(Object.getPrototypeOf(model).constructor);
  //   for (const key in attaches) {
  //     if (attaches.hasOwnProperty(key)) {
  //       const attach = attaches[key];
  //       // invalid value or null value
  //       if (!((<any>model)[attach.name.value] instanceof PropAttach)) {
  //         (<any>model)[attach.name.value] = new PropAttach();
  //       }
  //       const propAttach: PropAttach = (<any>model)[attach.name.value];
  //       const syntaxStruct = options[key];
  //       // 暂时只支持childRefs模式
  //       if (is.nullOrUndefined(syntaxStruct) || syntaxStruct.type !== "childRefs") continue;
  //       for (const iterator of options[key].expression) {
  //         propAttach["_options"].set(iterator.id, iterator.value);
  //       }
  //     }
  //   }
  // }

  // private _compositions<T extends IInnerComponent>(model: T, context: SourceFileContext<BasicEntityProvider>) {
  //   const compositions = resolveCompositions(Object.getPrototypeOf(model).constructor);
  //   for (const key in compositions) {
  //     if (compositions.hasOwnProperty(key)) {
  //       const composite = compositions[key];
  //       if (!((<any>model)[composite.name] instanceof BasicComposition)) {
  //         (<any>model)[composite.name] = new (composite.delegate || Composition)();
  //       }
  //       const compositeTarget: BasicComposition = (<any>model)[composite.name];
  //       // const compositeType = Object.getPrototypeOf(compositeTarget).constructor;
  //       const innerHandle = <IInnerComposite>(<unknown>compositeTarget);
  //       innerHandle.setEntity(composite.entity!);
  //       innerHandle.setCreateFn(this._createDirectiveFn.bind(this, context));
  //       innerHandle.setProvider(getMetaFromCtor(Object.getPrototypeOf(context.provider).constructor)!);
  //       model["__compositions"].push(innerHandle);
  //     }
  //   }
  // }
}
