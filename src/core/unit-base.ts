export interface IUnitBase {
  name: IDescriptionMeta;
  description: IDescriptionMeta | null;
}

export interface IDescriptionMeta {
  value: string;
  displayValue: string | null;
  i18n: {
    [key: string]: string | null;
  };
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

export interface IPropertyBase extends IUnitBase {
  realName: string;
  group: IDescriptionMeta | null;
  type: PropertyType | null;
}
