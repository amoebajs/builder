import { EntityConstructor, IBasicI18NContract, UnnamedPartial, defineEntityMetaType, resolveParams } from "./base";

export const COMPOSITION_DEFINE = "ambjs::composition_define";

export interface ICompositionDelegate {}

export interface ICompositionContract extends IBasicI18NContract {
  name: string | null;
  version: string | number;
  displayName: string | null;
}

const defaultComposite: ICompositionContract = {
  name: null,
  version: "0.0.1",
  displayName: null,
  description: null,
  i18nDescription: null,
  i18nName: null,
};

export function Composition(name: string): ClassDecorator;
export function Composition(params: UnnamedPartial<ICompositionContract>): ClassDecorator;
export function Composition(define: any) {
  const decoParams = resolveParams<ICompositionContract>(define);
  return function compositeDefine(target: EntityConstructor<any>) {
    defineComposition(target, {
      ...defaultComposite,
      ...decoParams,
    });
    defineEntityMetaType(target, "composition");
    return <any>target;
  };
}

export function defineComposition(target: EntityConstructor<any>, metadata: ICompositionContract) {
  return Reflect.defineMetadata(COMPOSITION_DEFINE, metadata, target);
}

export function resolveComposition(target: EntityConstructor<any>, defaults: Partial<ICompositionContract> = {}) {
  return <ICompositionContract>Reflect.getMetadata(COMPOSITION_DEFINE, target) || defaults;
}
