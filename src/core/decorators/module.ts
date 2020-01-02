import {
  EntityConstructor,
  IModuleContract,
  defaultFrameworkDepts,
  defineModule
} from "./base";

const defaults: IModuleContract = {
  name: null,
  displayName: null,
  provider: "react",
  components: [],
  directives: [],
  dependencies: {}
};

export function Module(define: Partial<IModuleContract> = {}) {
  return function moduleFactory(target: EntityConstructor<any>) {
    const options = { ...defaults, ...define };
    const fwkDepts = defaultFrameworkDepts[options.provider];
    if (fwkDepts) {
      options.dependencies = {
        ...fwkDepts,
        ...options.dependencies
      };
    }
    defineModule(target, options);
    return <any>target;
  };
}
