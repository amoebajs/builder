import { EntityConstructor, IModuleContract, defineModule } from "./base";

const defaults: IModuleContract = {
  name: null,
  displayName: null,
  components: [],
  directives: []
};

export function Module(define: Partial<IModuleContract> = {}) {
  return function module_factory(target: EntityConstructor<any>) {
    defineModule(target, { ...defaults, ...define });
    return <any>target;
  };
}
