import "reflect-metadata";

export const MODULE_DEFINE = "ambjs::module_define";
export const PAGE_DEFINE = "ambjs::page_define";
export const PIPE_DEFINE = "ambjs::pipe_define";
export const PROP_INPUT_DEFINE = "ambjs::property_input_define";

export interface IConstructor<T> {
  new (...args: any[]): T;
}

export type AbstractConstructor<T> = Function & { prototype: T };

export type Constructor<T> = IConstructor<T> | AbstractConstructor<T>;

export interface IModuleContract {
  name: string | null;
  displayName: string | null;
  pages: Constructor<any>[];
  pipes: Constructor<any>[];
}

export interface IPageContract {
  name: string | null;
  displayName: string | null;
  useProvider: "react";
  abstract: boolean;
}

export interface IPipeContract {
  name: string | null;
  displayName: string | null;
  useProvider: "react";
}

export interface IPropertyContract {
  name: string | null;
  displayName: string | null;
  group: string | null;
  displayGroupName: string | null;
  type:
    | "object"
    | "string"
    | "number"
    | "boolean"
    | (string | number)[]
    | number[]
    | string[]
    | null;
  description: string | null;
}

export interface IInnerPropertyContract extends IPropertyContract {
  realName: string;
}

export function defineModule(
  target: Constructor<any>,
  metadata: IModuleContract
) {
  return Reflect.defineMetadata(MODULE_DEFINE, metadata, target);
}

export function resolveModule(
  target: Constructor<any>,
  defaults: Partial<IModuleContract> = {}
) {
  return (
    <IModuleContract>Reflect.getMetadata(MODULE_DEFINE, target) || defaults
  );
}

export function definePage(target: Constructor<any>, metadata: IPageContract) {
  return Reflect.defineMetadata(PAGE_DEFINE, metadata, target);
}

export function resolvePage(
  target: Constructor<any>,
  defaults: Partial<IPageContract> = {}
) {
  return <IPageContract>Reflect.getMetadata(PAGE_DEFINE, target) || defaults;
}

export function definePipe(target: Constructor<any>, metadata: IPipeContract) {
  return Reflect.defineMetadata(PIPE_DEFINE, metadata, target);
}

export function resolvePipe(
  target: Constructor<any>,
  defaults: Partial<IPipeContract> = {}
) {
  return <IPipeContract>Reflect.getMetadata(PIPE_DEFINE, target) || defaults;
}

export function defineProperty(
  target: Constructor<any>,
  metadata: IInnerPropertyContract
) {
  const data: IInnerPropertyContract = { ...metadata };
  if (!data.name) data.name = data.realName;
  if (!data.type) {
    const typeRef = Reflect.getMetadata(
      "design:type",
      target.prototype,
      metadata.realName
    );
    data.type =
      typeRef === Number
        ? "number"
        : typeRef === String
        ? "string"
        : typeRef === Boolean
        ? "boolean"
        : "object";
  }
  const props = resolveProperties(target);
  props[data.group ? `${data.group}.${data.name}` : data.name] = data;
  return Reflect.defineMetadata(PROP_INPUT_DEFINE, props, target);
}

export function resolveProperty(
  target: Constructor<any>,
  name: string,
  defaults: Partial<IPropertyContract> = {}
) {
  return resolveProperties(target)[name] || defaults;
}

export function resolveProperties(target: Constructor<any>) {
  return (
    <{ [prop: string]: IInnerPropertyContract }>(
      Reflect.getMetadata(PROP_INPUT_DEFINE, target)
    ) || {}
  );
}
