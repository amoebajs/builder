import ts from "typescript";
import { InjectDIToken, Injector } from "@bonbons/di";
import { BasicError } from "../../errors";
import { createEntityId } from "../../utils";
import {
  IComponentAttachMap,
  IComponentInputMap,
  IComponentPropMap,
  IDirectiveInputMap,
  IPureObject,
  MapValueType,
} from "./common";
import { ContextItemsGroup, IFinalScopedContext, IScopeStructure, SourceFileContext } from "./context";
import { IInnerCompnentChildRef, IInnerCompositionChildRef, IInnerDirectiveChildRef } from "../child-ref";
import { IInnerComponent } from "../component";
import { IInnerDirective } from "../directive";
import { IInnerComposition } from "../composition";
import {
  AnonymousStatementGenerator,
  ClassGenerator,
  FunctionGenerator,
  ImportGenerator,
  VariableGenerator,
} from "../typescript";

export type EntityType =
  | "directive"
  | "component"
  | "composition"
  | "childref"
  | "componentChildRef"
  | "directiveChildRef"
  | "compositionChildRef"
  | "entity";

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

export interface ICompositionCreateOptions extends IBasicImportEntityCreateOptions {
  type: "composition";
}

export interface IEntitiesGroup {
  components: IComponentCreateOptions[];
  directives: IDirectiveCreateOptions[];
  compositions: ICompositionCreateOptions[];
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
  components: IDynamicRefPluginOptions[];
  directives: IDirecChildRefPluginOptions[];
  options: {
    input: IComponentInputMap;
    attach: IComponentAttachMap;
    props: IComponentPropMap;
  };
}

export interface ICompositeChildRefPluginOptions {
  /** entity id */
  refEntityId: string;
  /** entity name will emit into source code */
  entityName: string;
  components: IDynamicRefPluginOptions[];
  options: {
    input: IComponentInputMap;
  };
}

export type IDynamicRefPluginOptions = ICompChildRefPluginOptions | ICompositeChildRefPluginOptions;

export interface IBasicEntityProvider {
  attachInstance(
    context: SourceFileContext<IBasicEntityProvider>,
    ref: IInnerCompnentChildRef,
  ): Promise<IInnerComponent>;
  attachInstance(
    context: SourceFileContext<IBasicEntityProvider>,
    ref: IInnerDirectiveChildRef,
  ): Promise<IInnerDirective>;
  attachInstance(
    context: SourceFileContext<IBasicEntityProvider>,
    ref: IInnerCompositionChildRef,
  ): Promise<IInnerComposition>;
  resolveExtensionsMetadata(template: InjectDIToken<any>): {};
  beforeImportsCreated(context: SourceFileContext<IBasicEntityProvider>, imports: ImportGenerator[]): ImportGenerator[];
  beforeVariablesCreated(
    context: SourceFileContext<IBasicEntityProvider>,
    variables: VariableGenerator[],
  ): VariableGenerator[];
  beforeClassesCreated(context: SourceFileContext<IBasicEntityProvider>, classes: ClassGenerator[]): ClassGenerator[];
  beforeFunctionsCreated(
    context: SourceFileContext<IBasicEntityProvider>,
    funcs: FunctionGenerator[],
  ): FunctionGenerator[];
  beforeStatementsCreated(
    context: SourceFileContext<IBasicEntityProvider>,
    funcs: AnonymousStatementGenerator[],
  ): AnonymousStatementGenerator[];
  afterImportsCreated(
    context: SourceFileContext<IBasicEntityProvider>,
    imports: ts.ImportDeclaration[],
  ): ts.ImportDeclaration[];
  afterVariablesCreated(
    context: SourceFileContext<IBasicEntityProvider>,
    variables: ts.VariableStatement[],
  ): ts.VariableStatement[];
  afterClassesCreated(
    context: SourceFileContext<IBasicEntityProvider>,
    classes: ts.ClassDeclaration[],
  ): ts.ClassDeclaration[];
  afterFunctionsCreated(
    context: SourceFileContext<IBasicEntityProvider>,
    funcs: ts.FunctionDeclaration[],
  ): ts.FunctionDeclaration[];
  afterStatementsCreated(context: SourceFileContext<IBasicEntityProvider>, statements: ts.Statement[]): ts.Statement[];
}

export interface IEwsEntity {
  readonly entityId: string;
  setScopeId(id: string): this;
  setParentId(id: string): this;
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
  __context: SourceFileContext<any>;
  injector: Injector;
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
  protected injector!: Injector;

  public get entityId() {
    return this.__scope;
  }

  public setScopeId(id: string): this {
    if (!id || !/^[a-zA-Z]{1,1}[0-9a-zA-Z_]{2,256}$/.test(id)) throw new BasicError("entity id is invalid.");
    this.__scope = id;
    return this;
  }

  public setParentId(id: string): this {
    this.__parent = id;
    return this;
  }

  protected async onInit(): Promise<void> {
    this.__context.scopedContext.set(this.__scope, {
      scope: this.__scope,
      type: this.__etype,
      parent: this.__parent,
      container: {},
    });
  }

  //#region  pretected methods

  protected setState<K extends keyof T>(key: K, value: T[K]): void {
    this.__state[key] = value;
  }

  protected createNode<K extends keyof typeof ContextItemsGroup>(type: K): InstanceType<typeof ContextItemsGroup[K]> {
    return this.injector.get(<any>ContextItemsGroup[type]);
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

  //#endregion

  private __addChildElements<A extends any>(
    target: keyof IFinalScopedContext,
    args: A[],
    type: IBasicComponentAppendType,
  ) {
    const context = this.__context.scopedContext.get(this.__scope)!;
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
