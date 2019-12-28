import {
  IConstructor,
  EntityConstructor,
  IBasicI18NContract,
  UnnamedPartial,
  resolveParams,
  default_framework_depts
} from "./base";

export const DIRECTIVE_DEFINE = "ambjs::pipe_define";

export function defineDirective(
  target: EntityConstructor<any>,
  metadata: IDirectiveContract
) {
  return Reflect.defineMetadata(DIRECTIVE_DEFINE, metadata, target);
}

export function resolveDirective(
  target: EntityConstructor<any>,
  defaults: Partial<IDirectiveContract> = {}
) {
  return (
    <IDirectiveContract>Reflect.getMetadata(DIRECTIVE_DEFINE, target) ||
    defaults
  );
}

export interface IDirectiveContract extends IBasicI18NContract {
  name: string | null;
  displayName: string | null;
  provider: "react";
  dependencies: { [name: string]: string };
}

const defaults: IDirectiveContract = {
  name: null,
  displayName: null,
  provider: "react",
  dependencies: {},
  description: null,
  i18nDescription: null,
  i18nName: null
};

export function Directive(name: string): ClassDecorator;
export function Directive(
  params: UnnamedPartial<IDirectiveContract>
): ClassDecorator;
export function Directive(define: any) {
  const deco_params = resolveParams<IDirectiveContract>(define);
  return function custom_directive(target: IConstructor<any>) {
    const options: IDirectiveContract = {
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
    defineDirective(target, options);
    return <any>target;
  };
}
