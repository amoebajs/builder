import ts from "typescript";
import { InjectDIToken, Injector } from "@bonbons/di";
import {
  AnonymousStatementGenerator,
  ClassGenerator,
  EntityConstructor,
  EntityVariableRef,
  FunctionGenerator,
  IBasicEntityProvider,
  IComponentAttachMap,
  IComponentInputMap,
  IDirectiveInputMap,
  IInnerCompnentChildRef,
  IInnerComponent,
  IInnerComposition,
  IInnerCompositionChildRef,
  IInnerDirective,
  IInnerDirectiveChildRef,
  ITypedSyntaxExpressionMap,
  ImportGenerator,
  Injectable,
  PropAttach,
  SourceFileContext,
  VariableGenerator,
  VariableRef,
  resolveAttachProperties,
  resolveEntityRefs,
  resolveInputProperties,
} from "../../core";
import { is } from "../../utils";
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
    ref: IInnerCompnentChildRef | IInnerDirectiveChildRef | IInnerCompositionChildRef,
  ): Promise<any> {
    const instance: IInnerComponent | IInnerDirective | IInnerComposition = this.injector.get(ref.__refConstructor);
    switch (ref.__etype) {
      case "componentChildRef":
        await this.attachComponent(<IInnerComponent>instance, (<IInnerCompnentChildRef>ref).__options);
        break;
      case "compositionChildRef":
        await this.attachComposition(<IInnerComposition>instance, (<IInnerCompositionChildRef>ref).__options);
        break;
      case "directiveChildRef":
        await this.attachDirective(<IInnerDirective>instance, (<IInnerDirectiveChildRef>ref).__options);
        break;
      default:
        // DO NOTHING
        break;
    }
    instance.setScopeId(ref.__entityId);
    instance.setParentId(ref.__parent);
    instance["injector"] = this.injector;
    instance["__context"] = context;
    return instance;
  }

  public resolveExtensionsMetadata(_: InjectDIToken<any>): {} {
    return {};
  }

  public beforeImportsCreated(
    context: SourceFileContext<IBasicEntityProvider>,
    imports: ImportGenerator[],
  ): ImportGenerator[] {
    return this._combineImports(imports);
  }

  public beforeVariablesCreated(
    context: SourceFileContext<IBasicEntityProvider>,
    variables: VariableGenerator[],
  ): VariableGenerator[] {
    return variables;
  }

  public beforeClassesCreated(
    context: SourceFileContext<IBasicEntityProvider>,
    classes: ClassGenerator[],
  ): ClassGenerator[] {
    return classes;
  }

  public beforeFunctionsCreated(
    context: SourceFileContext<IBasicEntityProvider>,
    funcs: FunctionGenerator[],
  ): FunctionGenerator[] {
    return funcs;
  }

  public beforeStatementsCreated(
    context: SourceFileContext<IBasicEntityProvider>,
    statements: AnonymousStatementGenerator[],
  ): AnonymousStatementGenerator[] {
    return statements;
  }

  public afterImportsCreated(
    context: SourceFileContext<IBasicEntityProvider>,
    imports: ts.ImportDeclaration[],
  ): ts.ImportDeclaration[] {
    return imports;
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

  public afterStatementsCreated(
    context: SourceFileContext<IBasicEntityProvider>,
    statements: ts.Statement[],
  ): ts.Statement[] {
    return statements;
  }

  protected async attachComponent(instance: IInnerComponent, { input, attach }: IInnerCompnentChildRef["__options"]) {
    const template = Object.getPrototypeOf(instance).constructor;
    this._setInputs(template, instance, input);
    this._setAttach(template, instance, attach);
    this._setVariableRefs(template, instance);
    return instance;
  }

  protected async attachDirective(instance: IInnerDirective, { input }: IInnerDirectiveChildRef["__options"]) {
    const template = Object.getPrototypeOf(instance).constructor;
    this._setInputs(template, instance, input);
    this._setVariableRefs(template, instance);
    return instance;
  }

  protected async attachComposition(instance: IInnerComposition, { input }: IInnerCompositionChildRef["__options"]) {
    const template = Object.getPrototypeOf(instance).constructor;
    this._setInputs(template, instance, input);
    return instance;
  }

  private _setInputs(
    template: EntityConstructor<any>,
    instance: IInnerComponent | IInnerDirective | IInnerComposition,
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
        if (value.type === "entityRef") {
          const refVar = ((<any>instance)[input.realName] = new EntityVariableRef());
          const { ref: hostname, type: reftype, expression: subname } = value.expression;
          refVar["_name"] = subname;
          refVar["_type"] = reftype;
          refVar["_hostId"] = hostname;
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

  private _setVariableRefs(template: EntityConstructor<any>, instance: IInnerComponent | IInnerDirective) {
    const references = resolveEntityRefs(template).references;
    for (const key in references) {
      if (references.hasOwnProperty(key)) {
        const alias = references[key];
        if (!((<any>instance)[key] instanceof VariableRef)) {
          (<any>instance)[key] = new VariableRef();
        }
        const varRef: VariableRef = (<any>instance)[key];
        varRef["_host"] = <any>instance;
        varRef["_name"] = alias;
        varRef["_realName"] = key;
      }
    }
  }

  private _combineImports(raw: ImportGenerator[]): ImportGenerator[] {
    const defaults: ImportGenerator[] = [];
    const nameds: ImportGenerator[] = [];
    const namespaces: ImportGenerator[] = [];
    const nos: ImportGenerator[] = [];
    for (const item of raw) {
      let operated = false;
      if (!is.nullOrUndefined(item["defaultName"])) {
        operated = true;
        if (!defaults.find(i => i["defaultName"] === item["defaultName"] && i["modulePath"] === item["modulePath"])) {
          defaults.push(new ImportGenerator().setDefaultName(item["defaultName"]).setModulePath(item["modulePath"]));
        }
      }
      if (item["namedBinds"] && Object.keys(item["namedBinds"]).length > 0) {
        operated = true;
        const found = nameds.find(i => i["modulePath"] === item["modulePath"]);
        const entries = Object.entries(item["namedBinds"]);
        for (const [variable, sources] of entries) {
          if (found) {
            if (is.nullOrUndefined(found["namedBinds"][variable])) {
              found["namedBinds"][variable] = sources;
            } else {
              found["namedBinds"][variable] = found["namedBinds"][variable].concat(
                sources.filter(i => !found["namedBinds"][variable].includes(i)),
              );
            }
          } else {
            nameds.push(
              ...sources.map(source =>
                new ImportGenerator().addNamedBinding(variable, source).setModulePath(item["modulePath"]),
              ),
            );
          }
        }
      }
      if (!is.nullOrUndefined(item["namespaceName"])) {
        operated = true;
        if (
          !namespaces.find(i => i["namespaceName"] === item["namespaceName"] && i["modulePath"] === item["modulePath"])
        ) {
          defaults.push(
            new ImportGenerator().setNamespaceName(item["namespaceName"]).setModulePath(item["modulePath"]),
          );
        }
      }
      if (!operated) {
        if (!nos.find(i => i["modulePath"] === item["modulePath"])) {
          nos.push(new ImportGenerator().setModulePath(item["modulePath"]));
        }
      }
    }
    return [...namespaces, ...defaults, ...nameds, ...nos];
  }
}
