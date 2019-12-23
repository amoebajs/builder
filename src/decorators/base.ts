import "reflect-metadata";
import { InjectDIToken, getDependencies } from "@bonbons/di";
import { IPropertyBase, IDescriptionMeta } from "../core/unit-base";

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

export interface IPropertyOptions {
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
  i18nName: { [prop: string]: string } | null;
  i18nGroup: { [prop: string]: string } | null;
  i18nDescription: { [prop: string]: string } | null;
}

export function resolveDepts(target: InjectDIToken<any>): InjectDIToken<any>[] {
  return getDependencies(target) || [];
}

export interface IInnerPropertyContract extends IPropertyContract {
  /** real field key in class scope */
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
  const propName = !metadata.name ? metadata.realName : metadata.name;
  const nameMeta = {
    value: propName,
    displayValue: metadata.displayName || null,
    i18n: metadata.i18nName ?? {}
  };
  const groupMeta = !!metadata.group
    ? {
        value: metadata.group,
        displayValue: metadata.displayGroupName || null,
        i18n: metadata.i18nGroup ?? {}
      }
    : null;
  const descMeta = !!metadata.description
    ? {
        value: metadata.description,
        displayValue: metadata.description,
        i18n: metadata.i18nDescription ?? {}
      }
    : null;
  const typeMeta = getTypeOfMeta(
    Reflect.getMetadata("design:type", target.prototype, metadata.realName)
  );
  const data: IPropertyBase = {
    realName: metadata.realName,
    name: nameMeta,
    group: groupMeta,
    description: descMeta,
    type: typeMeta
  };
  setDescriptionMetaDisplayKey(data.name, "zh-CN");
  setDescriptionMetaDisplayKey(data.group, "zh-CN");
  setDescriptionMetaDisplayKey(data.description, "zh-CN");
  return Reflect.defineMetadata(
    PROP_INPUT_DEFINE,
    { ...resolveProperties(target), [getGroupNameMeta(data)]: data },
    target
  );
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
    <{ [prop: string]: IPropertyBase }>(
      Reflect.getMetadata(PROP_INPUT_DEFINE, target)
    ) || {}
  );
}

export function setDescriptionMetaDisplayKey(
  target: IDescriptionMeta | undefined | null,
  key: string
) {
  if (target && target.i18n[key] === void 0 && target.displayValue !== null) {
    target.i18n[key] = target.displayValue;
  }
  return target;
}

export function getGroupNameMeta(data: IPropertyBase) {
  return data.group
    ? `${data.group.value}.${data.name.value}`
    : data.name.value;
}

export function getTypeOfMeta(typeRef: any) {
  return typeRef === Number
    ? "number"
    : typeRef === String
    ? "string"
    : typeRef === Boolean
    ? "boolean"
    : "object";
}
