import { EntityConstructor, IBasicI18NContract, resolveParams } from "./base";
import { REALNAME } from "./property";
import { IPropertyBase } from "../base";

export const PROPS_DEFINE = "ambjs::prop_define";

export interface IPropPropertyContract extends IBasicI18NContract {
  type: any;
}

const defaultInput: IPropPropertyContract = {
  name: null,
  displayName: null,
  description: null,
  i18nDescription: null,
  i18nName: null,
  type: null,
};

export function Prop(): PropertyDecorator;
export function Prop(name: string): PropertyDecorator;
export function Prop(params: Partial<IPropPropertyContract>): PropertyDecorator;
export function Prop(params?: any) {
  const decoParams = resolveParams<IPropPropertyContract>(params);
  return function propFactory(target: any, propertyKey: string) {
    defineProp(target.constructor, {
      ...defaultInput,
      ...decoParams,
      realName: propertyKey,
    });
  };
}

function defineProp(target: EntityConstructor<any>, { realName, ...others }: REALNAME<IPropPropertyContract>) {
  Reflect.defineMetadata(PROPS_DEFINE, { ...resolveProps(target), [others.name || realName]: others }, target);
}

export function resolveProps(target: EntityConstructor<any>) {
  return <{ [prop: string]: IPropertyBase }>Reflect.getMetadata(PROPS_DEFINE, target) || {};
}
