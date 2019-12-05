import "reflect-metadata";
import { InjectDIToken } from "@bonbons/di";

export const DEPTS_METADATA = "design:paramtypes";
export const MODULE_DEFINE = "ambjs::module_define";
export const PAGE_DEFINE = "ambjs::page_define";
export const PIPE_DEFINE = "ambjs::pipe_define";
export const PROP_INPUT_DEFINE = "ambjs::property_input_define";

export interface IConstructor<T> {
  new (...args: any[]): T;
}

export type EntityConstructor<T> = InjectDIToken<T>;

export interface IModuleContract {
  name: string | null;
  displayName: string | null;
  pages: EntityConstructor<any>[];
  pipes: EntityConstructor<any>[];
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

export function resolveDepts(target: InjectDIToken<any>): InjectDIToken<any>[] {
  return Reflect.getMetadata(DEPTS_METADATA, target) || [];
}

export interface IInnerPropertyContract extends IPropertyContract {
  realName: string;
}

export function defineModule(
  target: EntityConstructor<any>,
  metadata: IModuleContract
) {
  return Reflect.defineMetadata(MODULE_DEFINE, metadata, target);
}

export function resolveModule(
  target: EntityConstructor<any>,
  defaults: Partial<IModuleContract> = {}
) {
  return (
    <IModuleContract>Reflect.getMetadata(MODULE_DEFINE, target) || defaults
  );
}

export function definePage(
  target: EntityConstructor<any>,
  metadata: IPageContract
) {
  return Reflect.defineMetadata(PAGE_DEFINE, metadata, target);
}

export function resolvePage(
  target: EntityConstructor<any>,
  defaults: Partial<IPageContract> = {}
) {
  return <IPageContract>Reflect.getMetadata(PAGE_DEFINE, target) || defaults;
}

export function definePipe(
  target: EntityConstructor<any>,
  metadata: IPipeContract
) {
  return Reflect.defineMetadata(PIPE_DEFINE, metadata, target);
}

export function resolvePipe(
  target: EntityConstructor<any>,
  defaults: Partial<IPipeContract> = {}
) {
  return <IPipeContract>Reflect.getMetadata(PIPE_DEFINE, target) || defaults;
}

export function defineProperty(
  target: EntityConstructor<any>,
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
  target: EntityConstructor<any>,
  name: string,
  defaults: Partial<IPropertyContract> = {}
) {
  return resolveProperties(target)[name] || defaults;
}

export function resolveProperties(target: EntityConstructor<any>) {
  return (
    <{ [prop: string]: IInnerPropertyContract }>(
      Reflect.getMetadata(PROP_INPUT_DEFINE, target)
    ) || {}
  );
}
