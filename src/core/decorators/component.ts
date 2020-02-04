import {
  EntityConstructor,
  IBasicI18NContract,
  UnnamedPartial,
  resolveParams,
  defineEntityMetaType,
  resolveEntityMetaType,
} from "./base";
import { resolveExtends } from "./extends";

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
export function Component(params: UnnamedPartial<IComponentContract>): ClassDecorator;
export function Component(define: any) {
  const decoParams = resolveParams<IComponentContract>(define);
  return function compFactory(target: EntityConstructor<any>) {
    const options: IComponentContract = {
      ...defaults,
      ...decoParams,
      dependencies: {
        ...defaults.dependencies,
        ...decoParams.dependencies,
      },
    };
    defineEntityMetaType(target, "component");
    defineComponent(target, options);
    return <any>target;
  };
}
