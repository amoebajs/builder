import { EntityConstructor, IConstructor } from "./base";
import { Composition } from "../libs";

export const COMPOSITE_DEFINE = "ambjs::composite_define";

export interface ICompositionDelegate {}

export interface ICompositeContract {
  name: string;
  entity: EntityConstructor<any> | null;
  delegate: IConstructor<Composition> | null;
}

const defaultComposite: ICompositeContract = {
  name: "",
  entity: null,
  delegate: null,
};

export function Composite(entity: EntityConstructor<any>) {
  return function compositeDefine(target: any, propertyKey: string) {
    defineComposite(target.constructor, {
      ...defaultComposite,
      entity,
      name: propertyKey,
    });
  };
}

export function defineComposite(target: EntityConstructor<any>, metadata: ICompositeContract) {
  return Reflect.defineMetadata(
    COMPOSITE_DEFINE,
    {
      ...resolveCompositions(target),
      [metadata.name]: metadata,
    },
    target,
  );
}

export function resolveCompositions(target: EntityConstructor<any>) {
  return <{ [prop: string]: ICompositeContract }>Reflect.getMetadata(COMPOSITE_DEFINE, target) || {};
}
