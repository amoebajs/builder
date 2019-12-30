import "reflect-metadata";
import { InjectDIToken, getDependencies } from "@bonbons/di";
import { IWeakDescriptionMeta, IDescriptionMeta } from "../../core/base";

export const MODULE_DEFINE = "ambjs::module_define";

export interface IConstructor<T> {
  new (...args: any[]): T;
}

export type EntityConstructor<T> = InjectDIToken<T>;

export type UnnamedPartial<T> = Partial<T> & { name: string };

export interface IModuleContract {
  name: string | null;
  displayName: string | null;
  provider: keyof IFrameworkDepts;
  components: EntityConstructor<any>[];
  directives: EntityConstructor<any>[];
  dependencies: { [name: string]: string | string[] };
}

export interface IBasicI18NContract {
  name: string | null;
  displayName: string | null;
  description: string | null;
  i18nName: { [prop: string]: string } | null;
  i18nDescription: { [prop: string]: string } | null;
}

export interface IFrameworkDepts {
  react: { [name: string]: string };
}

export type IFrameworkStructure<T> = {
  [key in keyof IFrameworkDepts]: T;
};

export const default_framework_depts: IFrameworkDepts = {
  react: {
    react: "^16.12.0",
    "react-dom": "^16.12.0"
  }
};

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

export function resolveParams<T extends IBasicI18NContract>(
  params: string | { [prop: string]: any }
): Partial<T> {
  let deco_params: Partial<T> = {};
  if (typeof params === "string") deco_params.name = params;
  else if (typeof params === "object") deco_params = <any>{ ...params };
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
