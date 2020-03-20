import "reflect-metadata";
import { InjectDIToken, getDependencies } from "@bonbons/di";
import { IDescriptionMeta, IWeakDescriptionMeta } from "../base";

export const ENTITY_TYPE_DEFINE = "ambjs::entity_type";

export interface IConstructor<T> {
  new (...args: any[]): T;
}

export type EntityConstructor<T> = InjectDIToken<T>;

export type UnnamedPartial<T> = Partial<T> & { name: string };

export interface IBasicI18NContract {
  name: string | null;
  displayName: string | null;
  description: string | null;
  i18nName: { [prop: string]: string } | null;
  i18nDescription: { [prop: string]: string } | null;
}

export interface IFrameworkDepts {
  react: Record<string, string>;
}

export type IFrameworkStructure<T> = {
  [key in keyof IFrameworkDepts]: T;
};

export const defaultFrameworkDepts: IFrameworkDepts = {
  react: {
    "@types/react": "^16.12.0",
    react: "^16.12.0",
    reactDom: "^16.12.0",
  },
};

export function defineEntityMetaType(target: EntityConstructor<any>, metadata: string) {
  return Reflect.defineMetadata(ENTITY_TYPE_DEFINE, metadata, target);
}

export function resolveEntityMetaType(target: EntityConstructor<any>) {
  return <string>Reflect.getMetadata(ENTITY_TYPE_DEFINE, target);
}

export function resolveDepts(target: InjectDIToken<any>): InjectDIToken<any>[] {
  return getDependencies(target) || [];
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
