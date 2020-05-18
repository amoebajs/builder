import { EntityConstructor, resolveEntityMetaType } from "./base";

export const EXTENDS_DEFINE = "ambjs::extends_define";

export function defineExtends(target: EntityConstructor<any>, metadata: IExtendsContract) {
  return Reflect.defineMetadata(EXTENDS_DEFINE, metadata, target);
}

export function resolveExtends(target: EntityConstructor<any>, defaults: Partial<IExtendsContract> = {}) {
  return <IExtendsContract>Reflect.getMetadata(EXTENDS_DEFINE, target) || defaults;
}

export interface IExtendsContract {
  type: string | null;
  parent: EntityConstructor<any> | null;
}

const defaults: IExtendsContract = {
  type: null,
  parent: null,
};

export function Extends(parent: EntityConstructor<any>): ClassDecorator {
  const metaType = resolveEntityMetaType(parent);
  return function extendsFactory(target: EntityConstructor<any>) {
    metaType && defineExtends(target, { ...defaults, parent, type: metaType });
    return <any>target;
  };
}
