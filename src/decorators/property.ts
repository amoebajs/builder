import { EntityConstructor } from "./base";
import {
  IDescriptionMeta,
  IPropertyBase,
  IWeakDescriptionMeta,
  IPropertyGroupBase
} from "../core/base";

export const PROP_INPUT_DEFINE = "ambjs::property_input_define";
export const PROP_OUTPUT_DEFINE = "ambjs::property_output_define";
export const PROP_GROUP_DEFINE = "ambjs::property_define_group";

export interface IOutputPropertyContract extends IPropertyGroupContract {
  group: string | null;
}

export interface IInputPropertyContract extends IOutputPropertyContract {
  type:
    | "object"
    | "string"
    | "number"
    | "boolean"
    | (string | number)[]
    | number[]
    | string[]
    | null;
}

export interface IPropertyGroupContract {
  name: string | null;
  displayName: string | null;
  description: string | null;
  i18nName: { [prop: string]: string } | null;
  i18nDescription: { [prop: string]: string } | null;
}

type REALNAME<T> = T & {
  /** real field key in class scope */
  realName: string;
};

const default_group: IPropertyGroupContract = {
  name: null,
  displayName: null,
  description: null,
  i18nDescription: null,
  i18nName: null
};

export function Group(params: Partial<IPropertyGroupContract> = {}) {
  if (!params.name) throw new Error("property group name can't be empty");
  return function prop_group_factory(target: any) {
    definePropertyGroup(target, {
      ...default_group,
      ...params
    });
  };
}

const default_input: IInputPropertyContract = {
  name: null,
  displayName: null,
  group: null,
  type: null,
  description: null,
  i18nDescription: null,
  i18nName: null
};

export function Input(params: Partial<IInputPropertyContract> = {}) {
  return function prop_input_factory(target: any, propertyKey: string) {
    defineInputProperty(target.constructor, {
      ...default_input,
      ...params,
      realName: propertyKey
    });
  };
}

const default_output: IInputPropertyContract = {
  name: null,
  displayName: null,
  group: null,
  type: null,
  description: null,
  i18nDescription: null,
  i18nName: null
};

export function Output(params: Partial<IInputPropertyContract> = {}) {
  return function prop_output_factory(target: any, propertyKey: string) {
    defineInputProperty(
      target.constructor,
      {
        ...default_output,
        ...params,
        realName: propertyKey
      },
      PROP_OUTPUT_DEFINE
    );
  };
}

export function defineInputProperty(
  target: EntityConstructor<any>,
  metadata: REALNAME<IInputPropertyContract>,
  metakey = PROP_INPUT_DEFINE
) {
  const propName = !metadata.name ? metadata.realName : metadata.name;
  const nameMeta = {
    value: propName,
    displayValue: metadata.displayName || null,
    i18n: metadata.i18nName ?? {}
  };
  const groupMeta = metadata.group || null;
  const descMeta = !!metadata.description
    ? {
        value: metadata.description,
        i18n: metadata.i18nDescription ?? {}
      }
    : null;
  const typeMeta = getTypeOfMeta(
    Reflect.getMetadata("design:type", target.prototype, metadata.realName)
  );
  const data: IPropertyBase = {
    realName: metadata.realName,
    name: nameMeta,
    group: groupMeta,
    description: descMeta,
    type: typeMeta
  };
  setDisplayI18NMeta(data.name, "zh-CN");
  setDisplayI18NMeta(data.description, "zh-CN", "value");
  return Reflect.defineMetadata(
    metakey,
    { ...resolveInputProperties(target), [getGroupNameMeta(data)]: data },
    target
  );
}

export function resolveInputProperty(
  target: EntityConstructor<any>,
  name: string,
  defaults: Partial<IInputPropertyContract> = {}
) {
  return resolveInputProperties(target)[name] || defaults;
}

export function definePropertyGroup(
  target: EntityConstructor<any>,
  metadata: IPropertyGroupContract
) {
  return Reflect.defineMetadata(
    PROP_GROUP_DEFINE,
    {
      ...resolvePropertyGroups(target),
      [metadata.name!]: {
        name: {
          value: metadata.name!,
          displayValue: metadata.displayName || null,
          i18n: metadata.i18nName ?? {}
        },
        description: !metadata.description
          ? {
              value: metadata.description,
              i18n: metadata.i18nDescription ?? {}
            }
          : null
      }
    },
    target
  );
}

export function resolveInputProperties(target: EntityConstructor<any>) {
  return (
    <{ [prop: string]: IPropertyBase }>(
      Reflect.getMetadata(PROP_INPUT_DEFINE, target)
    ) || {}
  );
}

export function resolveOutputProperties(target: EntityConstructor<any>) {
  return (
    <{ [prop: string]: IPropertyBase }>(
      Reflect.getMetadata(PROP_OUTPUT_DEFINE, target)
    ) || {}
  );
}

export function resolvePropertyGroups(target: EntityConstructor<any>) {
  return (
    <{ [prop: string]: IPropertyGroupBase }>(
      Reflect.getMetadata(PROP_GROUP_DEFINE, target)
    ) || {}
  );
}

function setDisplayI18NMeta(
  target: IDescriptionMeta | IWeakDescriptionMeta | undefined | null,
  key: string,
  mode: "displayValue" | "value" = "displayValue"
) {
  if (
    target &&
    target.i18n[key] === void 0 &&
    (<IDescriptionMeta>target)[mode] !== null
  ) {
    target.i18n[key] = (<IDescriptionMeta>target)[mode];
  }
  return target;
}

function getGroupNameMeta(data: IPropertyBase) {
  return data.group ? `${data.group}.${data.name.value}` : data.name.value;
}

function getTypeOfMeta(typeRef: any) {
  return typeRef === Number
    ? "number"
    : typeRef === String
    ? "string"
    : typeRef === Boolean
    ? "boolean"
    : "object";
}
