import { EntityConstructor, defaultFrameworkDepts, IFrameworkDepts, defineEntityMetaType } from "./base";

export const MODULE_DEFINE = "ambjs::module_define";

export interface IModuleContract {
  name: string | null;
  displayName: string | null;
  provider: keyof IFrameworkDepts;
  components: EntityConstructor<any>[];
  directives: EntityConstructor<any>[];
  compositions: EntityConstructor<any>[];
  dependencies: Record<string, string>;
}

const defaults: IModuleContract = {
  name: null,
  displayName: null,
  provider: "react",
  components: [],
  directives: [],
  compositions: [],
  dependencies: {},
};

export function defineModule(target: EntityConstructor<any>, metadata: IModuleContract) {
  return Reflect.defineMetadata(MODULE_DEFINE, metadata, target);
}

export function resolveModule(target: EntityConstructor<any>, defaults: Partial<IModuleContract> = {}) {
  return <IModuleContract>Reflect.getMetadata(MODULE_DEFINE, target) || defaults;
}

export function Module(define: Partial<IModuleContract> = {}) {
  return function moduleFactory(target: EntityConstructor<any>) {
    const options = { ...defaults, ...define };
    const fwkDepts = defaultFrameworkDepts[options.provider];
    if (fwkDepts) {
      options.dependencies = {
        ...fwkDepts,
        ...options.dependencies,
      };
    }
    defineEntityMetaType(target, "module");
    defineModule(target, options);
    return <any>target;
  };
}
