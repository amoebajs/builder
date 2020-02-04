import {
  EntityConstructor,
  IBasicI18NContract,
  IConstructor,
  UnnamedPartial,
  resolveParams,
  defineEntityMetaType,
  resolveEntityMetaType,
} from "./base";
import { resolveExtends } from ".";

export const DIRECTIVE_DEFINE = "ambjs::directive_define";

export function defineDirective(target: EntityConstructor<any>, metadata: IDirectiveContract) {
  return Reflect.defineMetadata(DIRECTIVE_DEFINE, metadata, target);
}

export function resolveDirective(target: EntityConstructor<any>, defaults: Partial<IDirectiveContract> = {}) {
  const metadata = <IDirectiveContract>Reflect.getMetadata(DIRECTIVE_DEFINE, target) || defaults;
  const metaType = resolveEntityMetaType(target);
  const extendMeta = resolveExtends(target);
  if (extendMeta.type === metaType && extendMeta.parent) {
    const parent = resolveDirective(extendMeta.parent, {});
    metadata.dependencies = {
      ...parent.dependencies,
      ...metadata.dependencies,
    };
  }
  return metadata;
  // return <IDirectiveContract>Reflect.getMetadata(DIRECTIVE_DEFINE, target) || defaults;
}

export interface IDirectiveContract extends IBasicI18NContract {
  name: string | null;
  version: string | number;
  displayName: string | null;
  dependencies: Record<string, string>;
}

const defaults: IDirectiveContract = {
  name: null,
  version: "0.0.1",
  displayName: null,
  dependencies: {},
  description: null,
  i18nDescription: null,
  i18nName: null,
};

export function Directive(name: string): ClassDecorator;
export function Directive(params: UnnamedPartial<IDirectiveContract>): ClassDecorator;
export function Directive(define: any) {
  const decoParams = resolveParams<IDirectiveContract>(define);
  return function customDirective(target: IConstructor<any>) {
    const options: IDirectiveContract = {
      ...defaults,
      ...decoParams,
      dependencies: {
        ...defaults.dependencies,
        ...decoParams.dependencies,
      },
    };
    defineEntityMetaType(target, "directive");
    defineDirective(target, options);
    return <any>target;
  };
}
