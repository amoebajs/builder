import {
  EntityConstructor,
  IBasicI18NContract,
  UnnamedPartial,
  resolveParams,
  defineEntityMetaType,
  resolveEntityMetaType,
} from "./base";
import { resolveExtends, Extends } from "./extends";

export const COMPONENT_DEFINE = "ambjs::component_define";

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
  return metadata;
}

export interface IComponentContract extends IBasicI18NContract {
  name: string | null;
  version: string | number;
  displayName: string | null;
  dependencies: Record<string, string>;
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
