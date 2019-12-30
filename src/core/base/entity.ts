import ts from "typescript";
import uuid from "uuid/v4";
import { MapValueType, IPureObject } from "./common";
import { PropertyRef } from "./directive";
import { BasicError } from "../../errors";

export type ImportStatementsUpdater = (
  statements: ts.ImportDeclaration[]
) => void;

export interface IBasicCompilationFinalContext {
  imports: ts.ImportDeclaration[];
  extendParent: ts.HeritageClause | null;
  implementParents: ts.HeritageClause[];
  fields: ts.PropertyDeclaration[];
  properties: ts.PropertyDeclaration[];
  methods: ts.MethodDeclaration[];
  classes: ts.ClassDeclaration[];
}

type EntityType = "directive" | "component" | "childref" | "entity";

export interface IScopeStructure<TYPE extends EntityType, ENTITY> {
  scope: string | symbol;
  type: TYPE;
  items: ENTITY;
}

type ScopeMap<T> = {
  [key in keyof T]: Map<string | symbol, IScopeStructure<EntityType, T[key]>>;
};

export type IBasicCompilationContext = ScopeMap<IBasicCompilationFinalContext>;

export type IBasicComponentAppendType = "push" | "unshift" | "reset";

export function createEntityId() {
  return (
    "E" +
    uuid()
      .split("-")
      .join("")
  );
}

export class BasicCompilationEntity<T extends IPureObject = IPureObject> {
  private __scope = createEntityId();
  private __etype: EntityType = "entity";
  private __state: T = <T>{};
  private __context!: IBasicCompilationContext;

  public get entityId() {
    return this["__scope"];
  }

  public setEntityId(id: string): this {
    if (!id || !/^[a-zA-Z]{1,1}[0-9a-zA-Z]{7,48}$/.test(id))
      throw new BasicError("entity id is invalid.");
    this["__scope"] = id;
    return this;
  }

  //#region  pretected methods

  protected setState<K extends keyof T>(key: K, value: T[K]): void {
    this.__state[key] = value;
  }

  protected getState<K extends keyof T>(
    key: K,
    defaultValue: T[K] | null = null
  ): T[K] {
    return this.__state[key] || (defaultValue as any);
  }

  protected addImports(
    args: ts.ImportDeclaration[],
    type: IBasicComponentAppendType = "push"
  ) {
    return this.__addChildElements("imports", args, type);
  }

  protected getImports() {
    return this.__getChildElements("imports") || [];
  }

  protected addMethods(
    args: ts.MethodDeclaration[],
    type: IBasicComponentAppendType = "push"
  ) {
    return this.__addChildElements("methods", args, type);
  }

  protected getMethods() {
    return this.__getChildElements("methods") || [];
  }

  protected addProperties(
    args: ts.PropertyDeclaration[],
    type: IBasicComponentAppendType = "push"
  ) {
    return this.__addChildElements("properties", args, type);
  }

  protected getProperties() {
    return this.__getChildElements("properties") || [];
  }

  protected addFields(
    args: ts.PropertyDeclaration[],
    type: IBasicComponentAppendType = "push"
  ) {
    return this.__addChildElements("fields", args, type);
  }

  protected getFields() {
    return this.__getChildElements("fields") || [];
  }

  protected addImplementParents(
    args: ts.HeritageClause[],
    type: IBasicComponentAppendType = "push"
  ) {
    return this.__addChildElements("implementParents", args, type);
  }

  protected getImplementParents() {
    return this.__getChildElements("implementParents") || [];
  }

  protected setExtendParent(arg: ts.HeritageClause) {
    return this.__addChildElements("extendParent", [arg], "reset");
  }

  protected getExtendParent() {
    return this.__getChildElements("extendParent") || null;
  }

  protected getRef(name: string): PropertyRef | null {
    return (<any>this)[name];
  }

  protected resolveRef(name: string): ts.Expression | null {
    const ref = this.getRef(name);
    if (!ref) return null;
    if (ref.type === "literal") {
      return resolveSyntaxInsert(ref.syntaxType, ref.expression);
    }
    return null;
  }

  protected createImport(
    modulePath: string,
    names: Array<string | [string, string]> | string = []
  ) {
    const ref = ts.createStringLiteral(modulePath);
    if (typeof names === "string") {
      return ts.createImportDeclaration(
        [],
        [],
        ts.createImportClause(ts.createIdentifier(names), undefined),
        ref
      );
    } else if (names.length === 0) {
      return ts.createImportDeclaration([], [], undefined, ref);
    } else {
      return ts.createImportDeclaration(
        [],
        [],
        ts.createImportClause(
          undefined,
          ts.createNamedImports(
            names.map(s =>
              ts.createImportSpecifier(
                Array.isArray(s) ? ts.createIdentifier(s[0]) : undefined,
                ts.createIdentifier(Array.isArray(s) ? s[1] : s)
              )
            )
          )
        ),
        ref
      );
    }
  }

  //#endregion

  private __addChildElements<A extends any>(
    target: keyof IBasicCompilationContext,
    args: A[],
    type: IBasicComponentAppendType
  ) {
    const host: Map<string | symbol, IScopeStructure<EntityType, any>> = this
      .__context[target];
    let container = host.get(this.__scope);
    if (!container) {
      host.set(
        this.__scope,
        (container = {
          scope: this.__scope,
          type: this.__etype,
          items: []
        })
      );
    }
    if (target === "extendParent") {
      container.items = args[0];
      host.set(this.__scope, container);
      return;
    }
    if (type === "reset") {
      container.items = args;
      host.set(this.__scope, container);
    } else {
      const oldValues = container.items || [];
      const newValues = [...oldValues];
      newValues[type](...args);
      container.items = newValues;
      host.set(this.__scope, container);
    }
  }

  private __getChildElements<K extends keyof IBasicCompilationContext>(
    target: K
  ): MapValueType<IBasicCompilationContext[K]> {
    return this.__context[target].get(this.__scope)?.items as any;
  }
}

export function resolveSyntaxInsert(
  type: "string",
  expression: string
): ts.StringLiteral;
export function resolveSyntaxInsert(
  type: "number",
  expression: number
): ts.NumericLiteral;
export function resolveSyntaxInsert(
  type: "boolean",
  expression: boolean
): ts.BooleanLiteral;
export function resolveSyntaxInsert(
  type: string,
  expression: any,
  otherHandler?: (type: string, exp: any) => ts.Expression | null
): ts.BooleanLiteral;
export function resolveSyntaxInsert(
  type: string,
  expression: any,
  otherHandler?: (type: string, exp: any) => ts.Expression | null
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
