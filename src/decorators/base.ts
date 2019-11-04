import "reflect-metadata";

export const MODULE_DEFINE = "ambjs::module_define";
export const PAGE_DEFINE = "ambjs::page_define";

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
