import { EntityConstructor } from "./base";

export const ENTITY_OBSERVER_DEFINE = "ambjs::entity_observable";

export interface IEntityNotifyOptions {
  name: string | null;
}

export interface IEntityNotifyContract {
  observables: Record<string, string>;
}

const defaults: IEntityNotifyContract = {
  observables: {},
};

export function Observable(): PropertyDecorator;
export function Observable(name: string): PropertyDecorator;
export function Observable(name?: string) {
  return function notifyFac(target: any, propertykey: string, _?: PropertyDescriptor) {
    defineObservables(target.constructor, {
      ...defaults,
      observables: {
        [propertykey]: name || propertykey,
      },
    });
  };
}

export function defineObservables(target: EntityConstructor<any>, metadata: IEntityNotifyContract) {
  const exist = resolveObservables(target);
  exist.observables = {
    ...exist.observables,
    ...metadata.observables,
  };
  return Reflect.defineMetadata(ENTITY_OBSERVER_DEFINE, exist, target);
}

export function resolveObservables(
  target: EntityConstructor<any>,
  defaults: Partial<IEntityNotifyContract> = { observables: {} },
) {
  return <IEntityNotifyContract>Reflect.getMetadata(ENTITY_OBSERVER_DEFINE, target) || defaults;
}
