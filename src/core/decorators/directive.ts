import { EntityConstructor, IBasicI18NContract, IConstructor, UnnamedPartial, resolveParams } from "./base";

export const DIRECTIVE_DEFINE = "ambjs::pipe_define";

export function defineDirective(target: EntityConstructor<any>, metadata: IDirectiveContract) {
  return Reflect.defineMetadata(DIRECTIVE_DEFINE, metadata, target);
}

export function resolveDirective(target: EntityConstructor<any>, defaults: Partial<IDirectiveContract> = {}) {
  return <IDirectiveContract>Reflect.getMetadata(DIRECTIVE_DEFINE, target) || defaults;
}

export interface IDirectiveContract extends IBasicI18NContract {
  name: string | null;
  displayName: string | null;
  dependencies: Record<string, string>;
}

const defaults: IDirectiveContract = {
  name: null,
  displayName: null,
  dependencies: {},
  description: null,
  i18nDescription: null,
  i18nName: null,
};

export function Directive(name: string): ClassDecorator;
export function Directive(params: UnnamedPartial<IDirectiveContract>): ClassDecorator;
export function Directive(define: any) {
  const decoParams = resolveParams<IDirectiveContract>(define);
  return function customDirective(target: IConstructor<any>) {
    const options: IDirectiveContract = {
      ...defaults,
      ...decoParams,
      dependencies: {
        ...defaults.dependencies,
        ...decoParams.dependencies,
      },
    };
    defineDirective(target, options);
    return <any>target;
  };
}
