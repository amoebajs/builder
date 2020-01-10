import { EntityConstructor, IBasicI18NContract, resolveParams } from "./base";
import { REALNAME } from "./property";
import { IPropertyBase } from "../base";

export const PROPS_DEFINE = "ambjs::prop_define";

export interface IEnumPropPropertyContract<Value> extends IBasicI18NContract {
  type: "select";
  allowValues: Value[];
}
export interface ICommonPropPropertyContract extends IBasicI18NContract {
  type: "input" | "switch";
}

export type PropPropertyContract<Value = unknown> = IEnumPropPropertyContract<Value> | ICommonPropPropertyContract;

const defaultInput: PropPropertyContract = {
  name: null,
  displayName: null,
  description: null,
  i18nDescription: null,
  i18nName: null,
  type: "input",
};

export function Prop(): PropertyDecorator;
export function Prop(name: string): PropertyDecorator;
export function Prop<Value>(params: Partial<PropPropertyContract<Value>>): PropertyDecorator;
export function Prop<Value>(params?: Partial<PropPropertyContract<Value>> | string) {
  const decoParams = resolveParams<PropPropertyContract<Value>>(params);
  return function propFactory(target: any, propertyKey: string) {
    defineProp(target.constructor, <REALNAME<PropPropertyContract>>{
      ...defaultInput,
      ...decoParams,
      realName: propertyKey,
    });
  };
}

function defineProp(target: EntityConstructor<any>, { realName, ...others }: REALNAME<PropPropertyContract>) {
  Reflect.defineMetadata(PROPS_DEFINE, { ...resolveProps(target), [others.name || realName]: others }, target);
}

export function resolveProps(target: EntityConstructor<any>) {
  return <{ [prop: string]: IPropertyBase }>Reflect.getMetadata(PROPS_DEFINE, target) || {};
}
