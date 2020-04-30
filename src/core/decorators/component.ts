import {
  EntityConstructor,
  IBasicI18NContract,
  UnnamedPartial,
  defineEntityMetaType,
  resolveEntityMetaType,
  resolveParams,
} from "./base";
import { Extends, resolveExtends } from "./extends";
import { resolveDirective } from "./directive";

export const COMPONENT_DEFINE = "ambjs::component_define";
export const REQUIRE_DEFINE = "ambjs::require_define";

export function defineRequire(target: EntityConstructor<any>, metadata: IRequireContract[]) {
  const exists = resolveRequire(target, []);
  return Reflect.defineMetadata(REQUIRE_DEFINE, [...exists, ...metadata], target);
}

export function resolveRequire(target: EntityConstructor<any>, defaults: IRequireContract[] = []) {
  let metadata = <IRequireContract[]>Reflect.getMetadata(REQUIRE_DEFINE, target) || defaults;
  const metaType = resolveEntityMetaType(target);
  const extendMeta = resolveExtends(target);
  if (extendMeta.type === metaType && extendMeta.parent) {
    const parent = resolveRequire(extendMeta.parent, []);
    metadata = [...parent, ...metadata];
  }
  return metadata;
}

export function defineComponent(target: EntityConstructor<any>, metadata: IComponentContract) {
  return Reflect.defineMetadata(COMPONENT_DEFINE, metadata, target);
}

export function resolveComponent(target: EntityConstructor<any>, defaults: Partial<IComponentContract> = {}) {
  const metadata = <IComponentContract>Reflect.getMetadata(COMPONENT_DEFINE, target) || defaults;
  const metaType = resolveEntityMetaType(target);
  const extendMeta = resolveExtends(target);
  if (extendMeta.type === metaType && extendMeta.parent) {
    const parent = resolveComponent(extendMeta.parent, {});
    metadata.dependencies = {
      ...parent.dependencies,
      ...metadata.dependencies,
    };
  }
  const requires = resolveRequire(target);
  for (const req of requires) {
    metadata.dependencies = {
      ...resolveDirective(req.entity).dependencies,
      ...metadata.dependencies,
    };
  }
  return metadata;
}

export interface IComponentContract extends IBasicI18NContract {
  name: string | null;
  version: string | number;
  displayName: string | null;
  dependencies: Record<string, string>;
}

export type IRequireInputsContract = Record<string, unknown | ((fields: any) => unknown)>;

export interface IRequireContract {
  type: string;
  scopeId?: string | symbol;
  entity: EntityConstructor<any>;
  inputs: IRequireInputsContract;
}

interface IExtend {
  parent: EntityConstructor<any> | null;
}

const defaults: IComponentContract = {
  name: null,
  version: "0.0.1",
  displayName: null,
  dependencies: {},
  description: null,
  i18nDescription: null,
  i18nName: null,
};

export function Component(name: string): ClassDecorator;
export function Component(params: UnnamedPartial<IComponentContract & IExtend>): ClassDecorator;
export function Component(define: any) {
  const decoParams = resolveParams<IComponentContract & IExtend>(define);
  const { parent, ...otherOptions } = decoParams;
  return function compFactory(target: EntityConstructor<any>) {
    const options: IComponentContract = {
      ...defaults,
      ...otherOptions,
      dependencies: {
        ...defaults.dependencies,
        ...otherOptions.dependencies,
      },
    };
    defineEntityMetaType(target, "component");
    defineComponent(target, options);
    if (parent) Extends(parent)(<any>target);
    return <any>target;
  };
}

export function Require(entity: EntityConstructor<any>): ClassDecorator;
export function Require(entity: EntityConstructor<any>, scopeId: string | symbol): ClassDecorator;
export function Require(entity: EntityConstructor<any>, inputs: IRequireInputsContract): ClassDecorator;
export function Require(
  entity: EntityConstructor<any>,
  scopeId: string | symbol,
  inputs: IRequireInputsContract,
): ClassDecorator;
export function Require(entity: EntityConstructor<any>, ...args: any[]) {
  const [p01, p02] = args;
  let inputs!: IRequireInputsContract;
  let scope!: string;
  if (typeof p01 === "string") {
    scope = p01;
    inputs = p02;
  } else {
    inputs = p01;
  }
  return function requireFn(target: EntityConstructor<any>) {
    const existList = resolveRequire(target, []);
    defineRequire(target, [
      {
        type: resolveEntityMetaType(entity),
        scopeId: scope ?? `_Require${existList.length}`,
        inputs: inputs ?? {},
        entity,
      },
    ]);
    return <any>target;
  };
}
