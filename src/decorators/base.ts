import "reflect-metadata";
import { InjectDIToken, getDependencies } from "@bonbons/di";
import { IWeakDescriptionMeta, IDescriptionMeta } from "../core/base";

export const MODULE_DEFINE = "ambjs::module_define";
export const PAGE_DEFINE = "ambjs::page_define";
export const PIPE_DEFINE = "ambjs::pipe_define";

export interface IConstructor<T> {
  new (...args: any[]): T;
}

export type EntityConstructor<T> = InjectDIToken<T>;

export type UnnamedPartial<T> = Partial<T> & { name: string };

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

export interface IBasicI18NContract {
  name: string | null;
  displayName: string | null;
  description: string | null;
  i18nName: { [prop: string]: string } | null;
  i18nDescription: { [prop: string]: string } | null;
}

export function resolveDepts(target: InjectDIToken<any>): InjectDIToken<any>[] {
  return getDependencies(target) || [];
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

export function resolveParams<T extends IBasicI18NContract>(
  params: string | { [prop: string]: any }
): Partial<T> {
  let deco_params: Partial<T> = {};
  if (typeof params === "string") deco_params.name = params;
  if (typeof params === "object") deco_params = <any>{ ...params };
  return deco_params;
}

export function setDisplayI18NMeta(
  target: IDescriptionMeta | IWeakDescriptionMeta | undefined | null,
  key: string,
  mode: "displayValue" | "value" = "displayValue"
) {
  if (
    target &&
    target.i18n[key] === void 0 &&
    (<IDescriptionMeta>target)[mode] !== null
  ) {
    target.i18n[key] = (<IDescriptionMeta>target)[mode];
  }
  return target;
}
