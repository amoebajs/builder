import { EntityConstructor, definePage, IPageContract } from "./base";

const defaults: IPageContract = {
  name: null,
  displayName: null,
  useProvider: "react",
  abstract: false
};

export function Page(define: Partial<IPageContract> = {}) {
  return function page_factory(target: EntityConstructor<any>) {
    definePage(target, { ...defaults, ...define });
    return <any>target;
  };
}
