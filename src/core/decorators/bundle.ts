import { EntityConstructor, IBasicI18NContract, UnnamedPartial, resolveParams } from "./base";

export const BUNDLE_DEFINE = "ambjs::bundle_define";

export function defineBundle(target: EntityConstructor<any>, metadata: IBundleContract) {
  return Reflect.defineMetadata(BUNDLE_DEFINE, metadata, target);
}

export function resolveBundle(target: EntityConstructor<any>, defaults: Partial<IBundleContract> = {}) {
  return <IBundleContract>Reflect.getMetadata(BUNDLE_DEFINE, target) || defaults;
}

export interface IBundleContract extends IBasicI18NContract {
  name: string | null;
  displayName: string | null;
  dependencies: { [name: string]: string | string[] };
}

const defaults: IBundleContract = {
  name: null,
  displayName: null,
  dependencies: {},
  description: null,
  i18nDescription: null,
  i18nName: null,
};

export function Bundle(name: string): ClassDecorator;
export function Bundle(params: UnnamedPartial<IBundleContract>): ClassDecorator;
export function Bundle(define: any) {
  const decoParams = resolveParams<IBundleContract>(define);
  return function bundleFactory(target: EntityConstructor<any>) {
    const options: IBundleContract = {
      ...defaults,
      ...decoParams,
      dependencies: {
        ...defaults.dependencies,
        ...decoParams.dependencies,
      },
    };
    defineBundle(target, options);
    return <any>target;
  };
}
