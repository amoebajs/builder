import ts from "typescript";
import uuid from "uuid/v4";
import { InjectDIToken, Injector } from "@bonbons/di";
import {
  IComponentAttachMap,
  IComponentInputMap,
  IComponentPropMap,
  IDirectiveInputMap,
  IPureObject,
  MapValueType,
} from "./common";
import { BasicError } from "../../errors";
import { ContextItemsGroup, IFinalScopedContext, SourceFileContext } from "./context";
import { IFrameworkDepts } from "../decorators";
import { IInnerCompnentChildRef, IInnerDirectiveChildRef } from "../child-ref";
import { IInnerComponent } from "../component";
import { IInnerDirective } from "../directive";

// export type ImportStatementsUpdater = (statements: ts.ImportDeclaration[]) => void;

export type EntityType = "directive" | "component" | "childref" | "componentChildRef" | "directiveChildRef" | "entity";

export interface IScopeStructure<TYPE extends EntityType, ENTITY> {
  scope: string | symbol;
  parent: string | symbol;
  type: TYPE;
  container: ENTITY;
}

export type IBasicComponentAppendType = "push" | "unshift" | "reset";

export interface IBasicImportEntityCreateOptions {
  moduleName: string;
  templateName: string;
  importId: string;
}

export interface IDirectiveCreateOptions extends IBasicImportEntityCreateOptions {
  type: "directive";
}

export interface IComponentCreateOptions extends IBasicImportEntityCreateOptions {
  type: "component";
}

export interface IEntitiesGroup {
  components: IComponentCreateOptions[];
  directives: IDirectiveCreateOptions[];
}

export interface IDirecChildRefPluginOptions {
  /** entity id */
  refEntityId: string;
  /** entity name will emit into source code */
  entityName: string;
  options: {
    input: IDirectiveInputMap;
  };
}

export interface ICompChildRefPluginOptions {
  /** entity id */
  refEntityId: string;
  /** entity name will emit into source code */
  entityName: string;
  components: ICompChildRefPluginOptions[];
  directives: IDirecChildRefPluginOptions[];
  options: {
    input: IComponentInputMap;
    attach: IComponentAttachMap;
    props: IComponentPropMap;
  };
}

export interface IComponentPluginOptions<T extends InjectDIToken<any>> extends IDirectivePluginOptions<T> {
  provider: keyof IFrameworkDepts;
  components?: IComponentPluginOptions<any>[];
  directives?: IDirectivePluginOptions<any>[];
  children?: ICompChildRefPluginOptions[];
  dependencies?: { [prop: string]: any };
}

export interface IDirectivePluginOptions<T extends InjectDIToken<any>> {
  id: string;
  provider: keyof IFrameworkDepts;
  template: T;
  input?: IDirectiveInputMap;
}

export interface IBasicEntityProvider {
  attachInstance(ref: IInnerCompnentChildRef): Promise<IInnerComponent>;
  attachInstance(ref: IInnerDirectiveChildRef): Promise<IInnerDirective>;
}

export interface IRootPageCreateOptions<T extends InjectDIToken<any>> extends IComponentPluginOptions<T> {
  attach?: IComponentAttachMap;
  passContext: SourceFileContext<IBasicEntityProvider>;
}

export interface IComponentPropertiesOptions {
  input: IDirectiveInputMap;
  attach: IComponentAttachMap;
  props: IComponentPropMap;
}

export interface IRootComponentCreateOptions extends IComponentCreateOptions {
  components?: IComponentCreateOptions[];
  directives?: IDirectiveCreateOptions[];
  children?: ICompChildRefPluginOptions[];
  attach: { [prop: string]: any };
}

export function createEntityId() {
  return (
    "E" +
    uuid()
      .split("-")
      .join("")
  );
}

export interface IEwsEntity {
  readonly entityId: string;
  setEntityId(id: string): this;
}

export interface IEwsEntityGetters {
  getImports(): IScopeStructure<EntityType, ts.ImportDeclaration[]>;
  getMethods(): IScopeStructure<EntityType, ts.MethodDeclaration[]>;
  getProperties(): IScopeStructure<EntityType, ts.PropertyDeclaration[]>;
  getFields(): IScopeStructure<EntityType, ts.PropertyDeclaration[]>;
  getImplementParents(): IScopeStructure<EntityType, ts.HeritageClause[]>;
  getExtendParent(): IScopeStructure<EntityType, ts.HeritageClause | null>;
}

export interface IEwsEntitySetters {
  addImports(args: ts.ImportDeclaration[], type?: IBasicComponentAppendType): void;
  addMethods(args: ts.MethodDeclaration[], type?: IBasicComponentAppendType): void;
  addProperties(args: ts.PropertyDeclaration[], type?: IBasicComponentAppendType): void;
  addFields(args: ts.PropertyDeclaration[], type?: IBasicComponentAppendType): void;
  addImplementParents(args: ts.HeritageClause[], type?: IBasicComponentAppendType): void;
  setExtendParent(arg: ts.HeritageClause | null): void;
}

export interface IEwsEntityState<T extends IPureObject = IPureObject> {
  setState<K extends keyof T>(key: K, value: T[K]): void;
  getState<K extends keyof T>(key: K, defaultValue?: T[K] | null): T[K];
}

export interface IEwsEntityPrivates<E extends EntityType = EntityType> {
  readonly __scope: string;
  readonly __parent: string;
  readonly __etype: E;
  readonly __context: SourceFileContext<any>;
  readonly __injector: Injector;
  __addChildElements<A extends any>(
    target: keyof IFinalScopedContext,
    args: A[],
    type: IBasicComponentAppendType,
  ): void;
  __getChildElements<K extends keyof IFinalScopedContext>(target: K): MapValueType<IFinalScopedContext[K]>;
}

export interface IEwsEntityProtectedHooks {
  onInit(): Promise<void>;
}

export interface IInnerEwsEntity<T extends IPureObject = IPureObject>
  extends IEwsEntity,
    IEwsEntityState<T>,
    IEwsEntitySetters,
    IEwsEntityGetters,
    IEwsEntityProtectedHooks,
    IEwsEntityPrivates {}

export class BasicCompilationEntity<T extends IPureObject = IPureObject> {
  protected __scope = createEntityId();
  protected __parent!: string;
  protected __etype: EntityType = "entity";
  protected __state: T = <T>{};
  protected __context!: SourceFileContext<any>;
  protected __injector!: Injector;

  public get entityId() {
    return this["__scope"];
  }

  public setEntityId(id: string): this {
    if (!id || !/^[a-zA-Z]{1,1}[0-9a-zA-Z]{7,48}$/.test(id)) throw new BasicError("entity id is invalid.");
    this["__scope"] = id;
    return this;
  }

  public setParentId(id: string): this {
    this["__parent"] = id;
    return this;
  }

  protected async onInit(): Promise<void> {
    return Promise.resolve();
  }

  //#region  pretected methods

  protected setState<K extends keyof T>(key: K, value: T[K]): void {
    this.__state[key] = value;
  }

  protected createNode<K extends keyof typeof ContextItemsGroup>(type: K): InstanceType<typeof ContextItemsGroup[K]> {
    return this.__injector.get(<any>ContextItemsGroup[type]);
  }

  protected getState<K extends keyof T>(key: K, defaultValue: T[K] | null = null): T[K] {
    return this.__state[key] || (defaultValue as any);
  }

  protected addImports(args: IFinalScopedContext["imports"], type: IBasicComponentAppendType = "push") {
    return this.__addChildElements("imports", args, type);
  }

  protected getImports() {
    return this.__getChildElements("imports") || [];
  }

  protected addVariables(args: IFinalScopedContext["variables"], type: IBasicComponentAppendType = "push") {
    return this.__addChildElements("variables", args, type);
  }

  protected getVariables() {
    return this.__getChildElements("variables") || [];
  }

  protected addClasses(args: IFinalScopedContext["classes"], type: IBasicComponentAppendType = "push") {
    return this.__addChildElements("classes", args, type);
  }

  protected getClasses() {
    return this.__getChildElements("classes") || [];
  }

  protected addFunctions(args: IFinalScopedContext["functions"], type: IBasicComponentAppendType = "push") {
    return this.__addChildElements("functions", args, type);
  }

  protected getFunctions() {
    return this.__getChildElements("functions") || [];
  }

  // protected addMethods(args: ts.MethodDeclaration[], type: IBasicComponentAppendType = "push") {
  //   return this.__addChildElements("methods", args, type);
  // }

  // protected getMethods() {
  //   return this.__getChildElements("methods") || [];
  // }

  // protected addProperties(args: ts.PropertyDeclaration[], type: IBasicComponentAppendType = "push") {
  //   return this.__addChildElements("properties", args, type);
  // }

  // protected getProperties() {
  //   return this.__getChildElements("properties") || [];
  // }

  // protected addFields(args: ts.PropertyDeclaration[], type: IBasicComponentAppendType = "push") {
  //   return this.__addChildElements("fields", args, type);
  // }

  // protected getFields() {
  //   return this.__getChildElements("fields") || [];
  // }

  // protected addImplementParents(args: ts.HeritageClause[], type: IBasicComponentAppendType = "push") {
  //   return this.__addChildElements("implementParents", args, type);
  // }

  // protected getImplementParents() {
  //   return this.__getChildElements("implementParents") || [];
  // }

  // protected setExtendParent(arg: ts.HeritageClause | null) {
  //   return this.__addChildElements("extendParent", [arg], "reset");
  // }

  // protected getExtendParent() {
  //   return this.__getChildElements("extendParent") || null;
  // }

  // protected addStatements(arg: ts.Statement[], type: IBasicComponentAppendType = "push") {
  //   return this.__addChildElements("statements", arg, type);
  // }

  // protected getStatements() {
  //   return this.__getChildElements("statements");
  // }

  // protected addParameters(arg: ts.ParameterDeclaration[], type: IBasicComponentAppendType = "push") {
  //   return this.__addChildElements("parameters", arg, type);
  // }

  // protected getParameters() {
  //   return this.__getChildElements("parameters");
  // }

  //#endregion

  private __addChildElements<A extends any>(
    target: keyof IFinalScopedContext,
    args: A[],
    type: IBasicComponentAppendType,
  ) {
    let context = this.__context.scopedContext.get(this.__scope);
    if (!context) {
      this.__context.scopedContext.set(
        this.__scope,
        (context = {
          scope: this.__scope,
          type: this.__etype,
          parent: this.__parent,
          container: {},
        }),
      );
    }
    // if (target === "extendParent") {
    //   context.container[<"extendParent">target] = args[0];
    //   return;
    // }
    if (type === "reset") {
      context.container[target] = <any>args;
    } else {
      const oldValues = context.container[target] || [];
      const newValues = [...oldValues];
      newValues[type](...args);
      context.container[target] = <any>newValues;
    }
  }

  private __getChildElements<K extends keyof IFinalScopedContext>(target: K): IFinalScopedContext[K] {
    return this.__context.scopedContext.get(this.__scope)?.container[target] as any;
  }
}

export function resolveSyntaxInsert(type: "string", expression: string): ts.StringLiteral;
export function resolveSyntaxInsert(type: "number", expression: number): ts.NumericLiteral;
export function resolveSyntaxInsert(type: "boolean", expression: boolean): ts.BooleanLiteral;
export function resolveSyntaxInsert(
  type: string,
  expression: any,
  otherHandler?: (type: string, exp: any) => ts.Expression | null,
): ts.BooleanLiteral;
export function resolveSyntaxInsert(
  type: string,
  expression: any,
  otherHandler?: (type: string, exp: any) => ts.Expression | null,
): ts.Expression | null {
  switch (type) {
    case "number":
      return ts.createNumericLiteral(expression.toString());
    case "string":
      return ts.createStringLiteral(expression.toString());
    case "boolean":
      return String(expression) === "true" ? ts.createTrue() : ts.createFalse();
    default:
      return !otherHandler ? null : otherHandler(type, expression);
  }
}
