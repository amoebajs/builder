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
} from "#core";
import { is } from "#utils/is";
import { BasicHelper } from "../entity-helper";

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
    instance.setParentId(ref.__parent);
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
        if (!((<any>instance)[attach.realName] instanceof PropAttach)) {
          (<any>instance)[attach.realName] = new PropAttach();
        }
        const propAttach: PropAttach = (<any>instance)[attach.realName];
        const syntaxStruct = options[key];
        // 暂时只支持childRefs模式
        if (is.nullOrUndefined(syntaxStruct) || syntaxStruct.type !== "childRefs") continue;
        for (const iterator of options[key].expression) {
          propAttach["_options"].set(iterator.id, iterator.value);
        }
      }
    }
  }

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
        combinedImportDeclarations.push(helper.createNamespaceImport(moduleName, namespaceImport).emit());
      }
      for (const defaultImport of imports.default) {
        combinedImportDeclarations.push(
          helper.createImport(moduleName, defaultImport, imports.named.length ? imports.named : undefined).emit(),
        );
        // 具名导入跟随默认导入创建完成后删除，避免接下来重复创建
        imports.named = [];
      }
      if (imports.named.length) {
        // 如果没有默认导入，此处创建具名导入
        combinedImportDeclarations.push(helper.createImport(moduleName, undefined, imports.named).emit());
      }
      if (!imports.named.length && !imports.default.length && !imports.namespace.length) {
        combinedImportDeclarations.push(helper.createImport(moduleName).emit());
      }
    }
    return combinedImportDeclarations;
  }
}
