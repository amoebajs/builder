import { Constructor, IModuleContract, defineModule } from "./base";

const defaults: IModuleContract = {
  name: null,
  displayName: null,
  pages: [],
  pipes: []
};

export function Module(define: Partial<IModuleContract> = {}) {
  return function module_factory(target: Constructor<any>) {
    defineModule(target, { ...defaults, ...define });
    return <any>target;
  };
}
