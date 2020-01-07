import ts from "typescript";
import uuid from "uuid/v4";
import { IPureObject, MapValueType } from "./common";
import { BasicError } from "../../errors";

export type ImportStatementsUpdater = (statements: ts.ImportDeclaration[]) => void;

export interface IBasicCompilationFinalContext {
  // all level
  imports: ts.ImportDeclaration[];

  // class level
  extendParent: ts.HeritageClause | null;
  implementParents: ts.HeritageClause[];
  fields: ts.PropertyDeclaration[];
  properties: ts.PropertyDeclaration[];
  methods: ts.MethodDeclaration[];

  // page level and function level
  classes: ts.ClassDeclaration[];
  functions: ts.FunctionDeclaration[];

  // function level
  statements: ts.Statement[];
}

type EntityType = "directive" | "component" | "childref" | "entity";

export interface IScopeStructure<TYPE extends EntityType, ENTITY> {
  scope: string | symbol;
  type: TYPE;
  container: ENTITY;
}

type ScopeMap<T> = {
  [key in keyof T]: Map<string | symbol, IScopeStructure<EntityType, T[key]>>;
};

export type IBasicCompilationContext = Map<
  string | symbol,
  IScopeStructure<EntityType, Partial<IBasicCompilationFinalContext>>
>;

export type IBasicComponentAppendType = "push" | "unshift" | "reset";

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
  readonly __etype: E;
  readonly __context: IBasicCompilationContext;
  __addChildElements<A extends any>(
    target: keyof IBasicCompilationContext,
    args: A[],
    type: IBasicComponentAppendType,
  ): void;
  __getChildElements<K extends keyof IBasicCompilationContext>(target: K): MapValueType<IBasicCompilationContext[K]>;
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
  private __scope = createEntityId();
  private __etype: EntityType = "entity";
  private __state: T = <T>{};
  private __context!: IBasicCompilationContext;

  public get entityId() {
    return this["__scope"];
  }

  public setEntityId(id: string): this {
    if (!id || !/^[a-zA-Z]{1,1}[0-9a-zA-Z]{7,48}$/.test(id)) throw new BasicError("entity id is invalid.");
    this["__scope"] = id;
    return this;
  }

  protected async onInit(): Promise<void> {
    return Promise.resolve();
  }

  //#region  pretected methods

  protected setState<K extends keyof T>(key: K, value: T[K]): void {
    this.__state[key] = value;
  }

  protected getState<K extends keyof T>(key: K, defaultValue: T[K] | null = null): T[K] {
    return this.__state[key] || (defaultValue as any);
  }

  protected addImports(args: ts.ImportDeclaration[], type: IBasicComponentAppendType = "push") {
    return this.__addChildElements("imports", args, type);
  }

  protected getImports() {
    return this.__getChildElements("imports") || [];
  }

  protected addMethods(args: ts.MethodDeclaration[], type: IBasicComponentAppendType = "push") {
    return this.__addChildElements("methods", args, type);
  }

  protected getMethods() {
    return this.__getChildElements("methods") || [];
  }

  protected addProperties(args: ts.PropertyDeclaration[], type: IBasicComponentAppendType = "push") {
    return this.__addChildElements("properties", args, type);
  }

  protected getProperties() {
    return this.__getChildElements("properties") || [];
  }

  protected addFields(args: ts.PropertyDeclaration[], type: IBasicComponentAppendType = "push") {
    return this.__addChildElements("fields", args, type);
  }

  protected getFields() {
    return this.__getChildElements("fields") || [];
  }

  protected addImplementParents(args: ts.HeritageClause[], type: IBasicComponentAppendType = "push") {
    return this.__addChildElements("implementParents", args, type);
  }

  protected getImplementParents() {
    return this.__getChildElements("implementParents") || [];
  }

  protected setExtendParent(arg: ts.HeritageClause | null) {
    return this.__addChildElements("extendParent", [arg], "reset");
  }

  protected getExtendParent() {
    return this.__getChildElements("extendParent") || null;
  }

  protected addStatements(arg: ts.Statement[], type: IBasicComponentAppendType = "push") {
    return this.__addChildElements("statements", arg, type);
  }

  protected getStatements() {
    return this.__getChildElements("statements");
  }

  //#endregion

  private __addChildElements<A extends any>(
    target: keyof IBasicCompilationFinalContext,
    args: A[],
    type: IBasicComponentAppendType,
  ) {
    let context = this.__context.get(this.__scope);
    if (!context) {
      this.__context.set(
        this.__scope,
        (context = {
          scope: this.__scope,
          type: this.__etype,
          container: {},
        }),
      );
    }
    if (target === "extendParent") {
      context.container[<"extendParent">target] = args[0];
      return;
    }
    if (type === "reset") {
      context.container[target] = <any>args;
    } else {
      const oldValues = context.container[target] || [];
      const newValues = [...oldValues];
      newValues[type](...args);
      context.container[target] = <any>newValues;
    }
  }

  private __getChildElements<K extends keyof IBasicCompilationFinalContext>(
    target: K,
  ): IBasicCompilationFinalContext[K] {
    return this.__context.get(this.__scope)?.container[target] as any;
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
