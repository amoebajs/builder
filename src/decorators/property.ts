import { IPropertyContract } from ".";
import {
  defineProperty,
  IPropertyGroupContract,
  definePropertyGroup
} from "./base";

const defaults: IPropertyContract = {
  name: null,
  displayName: null,
  group: null,
  type: null,
  description: null,
  i18nDescription: null,
  i18nName: null
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

const default_groups: IPropertyGroupContract = {
  name: null,
  displayName: null,
  description: null,
  i18nDescription: null,
  i18nName: null
};

export function Group(params: Partial<IPropertyGroupContract> = {}) {
  if (!params.name) throw new Error("property group name can't be empty");
  return function prop_input_factory(target: any) {
    definePropertyGroup(target, {
      ...default_groups,
      ...params
    });
  };
}
