import { InjectDIToken } from "@bonbons/di";
import { IPropertyBase, IPropertyGroupBase } from "../../core/base";
import { EntityConstructor, IBasicI18NContract, UnnamedPartial, resolveParams, setDisplayI18NMeta } from "./base";

export const PROP_INPUT_DEFINE = "ambjs::property_input_define";
export const PROP_ATTACH_DEFINE = "ambjs::property_attach_define";
export const PROP_GROUP_DEFINE = "ambjs::property_define_group";

export interface IInputPropertyContract extends IPropertyGroupContract {
  group: string | null;
  type: "object" | "string" | "number" | "boolean" | (string | number)[] | number[] | string[] | null;
}

export interface IAttachPropertyContract extends IPropertyGroupContract {}

export interface IPropertyGroupContract extends IBasicI18NContract {}

export type REALNAME<T> = T & {
  /** real field key in class scope */
  realName: string;
};

const defaultGroup: IPropertyGroupContract = {
  name: null,
  displayName: null,
  description: null,
  i18nDescription: null,
  i18nName: null,
};

export function Group(name: string): ClassDecorator;
export function Group(params: UnnamedPartial<IPropertyGroupContract>): ClassDecorator;
export function Group(params: any) {
  const decoParams = resolveParams<IPropertyGroupContract>(params);
  if (!params.name) throw new Error("property group name can't be empty");
  return function propGroupFactory(target: any) {
    definePropertyGroup(target, {
      ...defaultGroup,
      ...decoParams,
    });
  };
}

const defaultInput: IInputPropertyContract = {
  name: null,
  displayName: null,
  group: null,
  type: null,
  description: null,
  i18nDescription: null,
  i18nName: null,
};

export function Input(): PropertyDecorator;
export function Input(name: string): PropertyDecorator;
export function Input(params: Partial<IInputPropertyContract>): PropertyDecorator;
export function Input(params?: any) {
  const decoParams = resolveParams<IInputPropertyContract>(params);
  return function propInputFactory(target: any, propertyKey: string) {
    defineInputProperty(target.constructor, {
      ...defaultInput,
      ...decoParams,
      realName: propertyKey,
    });
  };
}

const defaultOutput: IInputPropertyContract = {
  name: null,
  displayName: null,
  group: null,
  type: null,
  description: null,
  i18nDescription: null,
  i18nName: null,
};

export function Attach(): PropertyDecorator;
export function Attach(name: string): PropertyDecorator;
export function Attach(params: Partial<IAttachPropertyContract>): PropertyDecorator;
export function Attach(params?: any) {
  const decoParams = resolveParams<IAttachPropertyContract>(params);
  return function propAttachFactory(target: any, propertyKey: string) {
    defineAttachProperty(target.constructor, {
      ...defaultOutput,
      ...decoParams,
      realName: propertyKey,
    });
  };
}

export function defineInputProperty(target: EntityConstructor<any>, metadata: REALNAME<IInputPropertyContract>) {
  const data = createBasicMeta(metadata, target);
  return Reflect.defineMetadata(
    PROP_INPUT_DEFINE,
    {
      ...resolveInputProperties(target),
      [getGroupNameMeta(data)]: data,
    },
    target,
  );
}

export function defineAttachProperty(target: EntityConstructor<any>, metadata: REALNAME<IInputPropertyContract>) {
  const data = createBasicMeta(metadata, target);
  return Reflect.defineMetadata(
    PROP_ATTACH_DEFINE,
    {
      ...resolveAttachProperties(target),
      [getGroupNameMeta(data)]: data,
    },
    target,
  );
}

function createBasicMeta(metadata: REALNAME<IInputPropertyContract>, target: InjectDIToken<any>) {
  const propName = !metadata.name ? metadata.realName : metadata.name;
  const nameMeta = {
    value: propName,
    displayValue: metadata.displayName || null,
    i18n: metadata.i18nName ?? {},
  };
  const groupMeta = metadata.group || null;
  const descMeta = !!metadata.description
    ? {
        value: metadata.description,
        i18n: metadata.i18nDescription ?? {},
      }
    : null;
  const typeMeta = getTypeOfMeta(Reflect.getMetadata("design:type", target.prototype, metadata.realName));
  const data: IPropertyBase = {
    realName: metadata.realName,
    name: nameMeta,
    group: groupMeta,
    description: descMeta,
    type: typeMeta,
  };
  setDisplayI18NMeta(data.name, "zh-CN");
  setDisplayI18NMeta(data.description, "zh-CN", "value");
  return data;
}

export function resolveInputProperty(
  target: EntityConstructor<any>,
  name: string,
  defaults: Partial<IInputPropertyContract> = {},
) {
  return resolveInputProperties(target)[name] || defaults;
}

export function definePropertyGroup(target: EntityConstructor<any>, metadata: IPropertyGroupContract) {
  return Reflect.defineMetadata(
    PROP_GROUP_DEFINE,
    {
      ...resolvePropertyGroups(target),
      [metadata.name!]: {
        name: {
          value: metadata.name!,
          displayValue: metadata.displayName || null,
          i18n: metadata.i18nName ?? {},
        },
        description: !metadata.description
          ? {
              value: metadata.description,
              i18n: metadata.i18nDescription ?? {},
            }
          : null,
      },
    },
    target,
  );
}

export function resolveInputProperties(target: EntityConstructor<any>) {
  return <{ [prop: string]: IPropertyBase }>Reflect.getMetadata(PROP_INPUT_DEFINE, target) || {};
}

export function resolveAttachProperties(target: EntityConstructor<any>) {
  return <{ [prop: string]: IPropertyBase }>Reflect.getMetadata(PROP_ATTACH_DEFINE, target) || {};
}

export function resolvePropertyGroups(target: EntityConstructor<any>) {
  return <{ [prop: string]: IPropertyGroupBase }>Reflect.getMetadata(PROP_GROUP_DEFINE, target) || {};
}

function getGroupNameMeta(data: IPropertyBase) {
  return data.group ? `${data.group}.${data.name.value}` : data.name.value;
}

function getTypeOfMeta(typeRef: any) {
  return typeRef === Number ? "number" : typeRef === String ? "string" : typeRef === Boolean ? "boolean" : "object";
}
