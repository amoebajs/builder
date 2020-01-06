import { InjectDIToken, InjectScope } from "@bonbons/di";
import { defineScope, resolveScope } from "./base";

export function getInjectScope(target: InjectDIToken<any>) {
  return resolveScope(target, InjectScope.Singleton);
}

export function Injectable(scope: InjectScope.Singleton | InjectScope.New = InjectScope.Singleton) {
  return function _injectable(target: InjectDIToken<any>) {
    defineScope(target, scope);
    return target as any;
  };
}
