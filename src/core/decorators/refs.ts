import { EntityConstructor } from "./base";

export const ENTITY_REF_DEFINE = "ambjs::entity_reference_define";

export interface IEntityRefOptions {
  name: string | null;
}

export interface IEntityRefContract {
  references: Record<string, string>;
}

const defaults: IEntityRefContract = {
  references: {},
};

export function Reference(): PropertyDecorator;
export function Reference(name: string): PropertyDecorator;
export function Reference(name?: string) {
  return function referenceFac(target: any, propertykey: string, _?: PropertyDescriptor) {
    defineEntityRefs(target.constructor, {
      ...defaults,
      references: {
        [propertykey]: name || propertykey,
      },
    });
  };
}

export function defineEntityRefs(target: EntityConstructor<any>, metadata: IEntityRefContract) {
  const exist = resolveEntityRefs(target);
  exist.references = {
    ...exist.references,
    ...metadata.references,
  };
  return Reflect.defineMetadata(ENTITY_REF_DEFINE, exist, target);
}

export function resolveEntityRefs(
  target: EntityConstructor<any>,
  defaults: Partial<IEntityRefContract> = { references: {} },
) {
  return <IEntityRefContract>Reflect.getMetadata(ENTITY_REF_DEFINE, target) || defaults;
}
