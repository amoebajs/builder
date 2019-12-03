import { IPropertyContract } from ".";
import { defineProperty } from "./base";

const defaults: IPropertyContract = {
  name: null,
  displayName: null,
  group: null,
  displayGroupName: null,
  type: null,
  description: null
};

export function Input(params: Partial<IPropertyContract> = {}) {
  return function prop_input_factory(target: any, propertyKey: string) {
    defineProperty(target.constructor, {
      ...defaults,
      ...params,
      realName: propertyKey
    });
  };
}
