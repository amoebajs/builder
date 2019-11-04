import "reflect-metadata";

export const MODULE_DEFINE = "ambjs::module_define";
export const PAGE_DEFINE = "ambjs::page_define";
export const PROP_INPUT_DEFINE = "ambjs::property_input_define";

export interface IConstructor<T> {
  new (...args: any[]): T;
}

export type AbstractConstructor<T> = Function & { prototype: T }

export type Constructor<T> = IConstructor<T> | AbstractConstructor<T>;

export interface IModuleContract {
  name: string | null;
  displayName: string | null;
  pages: Constructor<any>[];
}

export interface IPageContract {
  name: string | null;
  displayName: string | null;
  useProvider: "react";
  abstract: boolean;
}

export interface IPropertyContract {
  name: string | null;
  displayName: string | null;
  type: any | null;
}

export interface IInnerPropertyContract extends IPropertyContract {
  realName: string;
}


export function defineModule(target: Constructor<any>, metadata: IModuleContract) {
  return Reflect.defineMetadata(MODULE_DEFINE, metadata, target);
}

export function resolveModule(target: Constructor<any>, defaults: Partial<IModuleContract> = {}) {
  return <IModuleContract>Reflect.getMetadata(MODULE_DEFINE,target) ?? defaults;
}

export function definePage(target: Constructor<any>, metadata: IPageContract) {
  return Reflect.defineMetadata(PAGE_DEFINE, metadata, target);
}

export function resolvePage(target: Constructor<any>, defaults: Partial<IPageContract> = {}) {
  return <IPageContract>Reflect.getMetadata(PAGE_DEFINE,target) ?? defaults;
}

export function defineProperty(target: Constructor<any>, metadata: IInnerPropertyContract) {
  const typeRef = Reflect.getMetadata("design:type", target.prototype, metadata.realName);
  const data: IInnerPropertyContract = { ...metadata };
  if(typeRef && !data.type) data.type = typeRef;
  if(!data.name) data.name = data.realName;
  // console.log(data)
  const props = resolveProperties(target);
  props[data.name] = data;
  return Reflect.defineMetadata(PROP_INPUT_DEFINE, props, target);
}

export function resolveProperty(target: Constructor<any>, name: string, defaults: Partial<IPropertyContract> = {}) {
  return resolveProperties(target)[name] ?? defaults;
}

export function resolveProperties(target: Constructor<any>) {
  return <{[prop: string]: IInnerPropertyContract}>Reflect.getMetadata(PROP_INPUT_DEFINE,target) ?? {};
}

