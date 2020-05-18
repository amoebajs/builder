import { InjectDIToken, InjectScope } from "@bonbons/di";
import { EntityConstructor } from "./base";

export const PROVIDER_SCOPE = "ambjs::provider_scope";

export function defineScope(target: EntityConstructor<any>, scope: InjectScope) {
  return Reflect.defineMetadata(PROVIDER_SCOPE, scope, target);
}

export function resolveScope(target: EntityConstructor<any>, defaults: InjectScope = InjectScope.Singleton) {
  return <InjectScope>Reflect.getMetadata(PROVIDER_SCOPE, target) || defaults;
}

export function getInjectScope(target: InjectDIToken<any>) {
  return resolveScope(target, InjectScope.Singleton);
}

export function Injectable(scope: InjectScope.Singleton | InjectScope.New = InjectScope.Singleton) {
  return function _injectable(target: InjectDIToken<any>) {
    defineScope(target, scope);
    return target as any;
  };
}
