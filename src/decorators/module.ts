import {
  EntityConstructor,
  IModuleContract,
  defineModule,
  default_framework_depts
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
  return function module_factory(target: EntityConstructor<any>) {
    const options = { ...defaults, ...define };
    const fwk_depts = default_framework_depts[options.provider];
    if (fwk_depts) {
      options.dependencies = {
        ...fwk_depts,
        ...options.dependencies
      };
    }
    defineModule(target, options);
    return <any>target;
  };
}
