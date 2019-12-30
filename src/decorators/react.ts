import { resolveParams, IBasicI18NContract, EntityConstructor } from "./base";
import { REALNAME } from "./property";
import { IPropertyBase } from "../core/base";

export const REACT_PROPS_DEFINE = "ambjs::extensions_react_props_define";

export interface IReactPropPropertyContract extends IBasicI18NContract {
  type: any;
}

const default_input: IReactPropPropertyContract = {
  name: null,
  displayName: null,
  description: null,
  i18nDescription: null,
  i18nName: null,
  type: null
};

export function ReactProp(): PropertyDecorator;
export function ReactProp(name: string): PropertyDecorator;
export function ReactProp(
  params: Partial<IReactPropPropertyContract>
): PropertyDecorator;
export function ReactProp(params?: any) {
  const deco_params = resolveParams<IReactPropPropertyContract>(params);
  return function react_prop_factory(target: any, propertyKey: string) {
    defineReactProps(target.constructor, {
      ...default_input,
      ...deco_params,
      realName: propertyKey
    });
  };
}

function defineReactProps(
  target: EntityConstructor<any>,
  { realName, ...others }: REALNAME<IReactPropPropertyContract>
) {
  Reflect.defineMetadata(
    REACT_PROPS_DEFINE,
    { ...resolveReactProps(target), [others.name || realName]: others },
    target
  );
}

export function resolveReactProps(target: EntityConstructor<any>) {
  return (
    <{ [prop: string]: IPropertyBase }>(
      Reflect.getMetadata(REACT_PROPS_DEFINE, target)
    ) || {}
  );
}
