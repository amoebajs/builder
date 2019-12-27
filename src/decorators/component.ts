import {
  EntityConstructor,
  IBasicI18NContract,
  UnnamedPartial,
  resolveParams
} from "./base";

export const COMPONENT_DEFINE = "ambjs::component_define";

export function defineComponent(
  target: EntityConstructor<any>,
  metadata: IComponentContract
) {
  return Reflect.defineMetadata(COMPONENT_DEFINE, metadata, target);
}

export function resolveComponent(
  target: EntityConstructor<any>,
  defaults: Partial<IComponentContract> = {}
) {
  return (
    <IComponentContract>Reflect.getMetadata(COMPONENT_DEFINE, target) ||
    defaults
  );
}

export interface IComponentContract extends IBasicI18NContract {
  name: string | null;
  displayName: string | null;
  provider: "react";
  abstract: boolean;
}

const defaults: IComponentContract = {
  name: null,
  displayName: null,
  provider: "react",
  abstract: false,
  description: null,
  i18nDescription: null,
  i18nName: null
};

export function Component(name: string): ClassDecorator;
export function Component(
  params: UnnamedPartial<IComponentContract>
): ClassDecorator;
export function Component(define: any) {
  const deco_params = resolveParams<IComponentContract>(define);
  return function comp_factory(target: EntityConstructor<any>) {
    defineComponent(target, { ...defaults, ...deco_params });
    return <any>target;
  };
}
