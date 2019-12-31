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