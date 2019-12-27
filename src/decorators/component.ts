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
  provider: keyof IFrameworkDepts;
  dependencies: { [name: string]: string };
}

export interface IFrameworkDepts {
  react: { [name: string]: string };
}

const default_framework_depts: IFrameworkDepts = {
  react: {
    react: "^16.12.0",
    "react-dom": "^16.12.0"
  }
};

const defaults: IComponentContract = {
  name: null,
  displayName: null,
  provider: "react",
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
    const fwk_depts = default_framework_depts[options.provider];
    if (fwk_depts) {
      options.dependencies = {
        ...fwk_depts,
        ...options.dependencies
      };
    }
    defineComponent(target, options);
    return <any>target;
  };
}
