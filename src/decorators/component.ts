import {
  EntityConstructor,
  IBasicI18NContract,
  UnnamedPartial,
  resolveParams,
  IFrameworkDepts,
  default_framework_depts
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
  dependencies: { [name: string]: string | string[] };
}

const defaults: IComponentContract = {
  name: null,
  displayName: null,
  dependencies: {},
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
    const options: IComponentContract = {
      ...defaults,
      ...deco_params,
      dependencies: {
        ...defaults.dependencies,
        ...deco_params.dependencies
      }
    };
    defineComponent(target, options);
    return <any>target;
  };
}
