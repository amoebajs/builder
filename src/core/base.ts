import ts from "typescript";

export interface IPureObject {
  [prop: string]: any;
}

export type MapValueType<T> = T extends Map<any, infer V> ? V : never;

export interface IUnitBase {
  name: IDescriptionMeta;
  description: IWeakDescriptionMeta | null;
}

export interface IWeakDescriptionMeta {
  value: string;
  i18n: {
    [key: string]: string | null;
  };
}

export interface IDescriptionMeta extends IWeakDescriptionMeta {
  displayValue: string | null;
}

export type PropertyType =
  | "object"
  | "string"
  | "number"
  | "boolean"
  | (string | number)[]
  | number[]
  | string[]
  | null;

export interface IPropertyGroupBase extends IUnitBase {}

export interface IPropertyBase extends IUnitBase {
  realName: string;
  group: string | null;
  type: PropertyType | null;
}

export interface IBasicCompilationContext {
  extendParent: Map<string | symbol, ts.HeritageClause>;
  implementParents: Map<string | symbol, ts.HeritageClause[]>;
  fields: Map<string | symbol, ts.PropertyDeclaration[]>;
  properties: Map<string | symbol, ts.PropertyDeclaration[]>;
  methods: Map<string | symbol, ts.MethodDeclaration[]>;
}

export type IBasicComponentAppendType = "push" | "unshift" | "reset";

export class BasicCompilationEntity<T extends IPureObject = IPureObject> {
  private __scope = Symbol(new Date().getTime());
  private __state: T = <T>{};
  private __context!: IBasicCompilationContext;

  public get entityId() {
    return this["__scope"];
  }

  //#region  pretected methods

  protected setState<K extends keyof T>(key: K, value: T[K]): void {
    this.__state[key] = value;
  }

  protected getState<K extends keyof T>(
    key: K,
    defaultValue: T[K] | null = null
  ): T[K] | null {
    return this.__state[key] || defaultValue;
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
    return this.__addChildElements("implementParents", [arg], "reset");
  }

  protected getExtendParent() {
    return this.__getChildElements("extendParent") || null;
  }

  //#endregion

  private __addChildElements<A extends any>(
    target: keyof IBasicCompilationContext,
    args: A[],
    type: IBasicComponentAppendType
  ) {
    const host: Map<string | symbol, any> = this.__context[target];
    if (target === "extendParent") {
      host.set(this.__scope, args[0]);
      return;
    }
    if (type === "reset") {
      host.set(this.__scope, args);
    } else {
      const oldValues = <unknown[]>host.get(this.__scope) || [];
      host.set(this.__scope, [...oldValues][type](...args));
    }
  }

  private __getChildElements<K extends keyof IBasicCompilationContext>(
    target: K
  ): MapValueType<IBasicCompilationContext[K]> {
    return this.__context[target].get(this.__scope) as any;
  }
}
