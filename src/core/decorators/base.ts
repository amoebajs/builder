import "reflect-metadata";
import { InjectDIToken, InjectScope, getDependencies } from "@bonbons/di";
import { IDescriptionMeta, IWeakDescriptionMeta } from "../../core/base";

export const PROVIDER_SCOPE = "ambjs::provider-scope";
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

export const defaultFrameworkDepts: IFrameworkDepts = {
  react: {
    react: "^16.12.0",
    "react-dom": "^16.12.0",
  },
};

export function resolveDepts(target: InjectDIToken<any>): InjectDIToken<any>[] {
  return getDependencies(target) || [];
}

export function defineScope(target: EntityConstructor<any>, scope: InjectScope) {
  return Reflect.defineMetadata(PROVIDER_SCOPE, scope, target);
}

export function resolveScope(target: EntityConstructor<any>, defaults: InjectScope = InjectScope.Singleton) {
  return <InjectScope>Reflect.getMetadata(PROVIDER_SCOPE, target) || defaults;
}

export function defineModule(target: EntityConstructor<any>, metadata: IModuleContract) {
  return Reflect.defineMetadata(MODULE_DEFINE, metadata, target);
}

export function resolveModule(target: EntityConstructor<any>, defaults: Partial<IModuleContract> = {}) {
  return <IModuleContract>Reflect.getMetadata(MODULE_DEFINE, target) || defaults;
}

export function resolveParams<T extends IBasicI18NContract>(params?: string | Partial<IBasicI18NContract>): Partial<T> {
  let decoParams: Partial<T> = {};
  if (typeof params === "string") decoParams.name = params;
  else if (typeof params === "object") decoParams = <any>{ ...params };
  return decoParams;
}

export function setDisplayI18NMeta(
  target: IDescriptionMeta | IWeakDescriptionMeta | undefined | null,
  key: string,
  mode: "displayValue" | "value" = "displayValue",
) {
  if (target && target.i18n[key] === void 0 && (<IDescriptionMeta>target)[mode] !== null) {
    target.i18n[key] = (<IDescriptionMeta>target)[mode];
  }
  return target;
}
