import { InjectDIToken, InjectScope } from "@bonbons/di";

export function Injectable(scope: InjectScope = InjectScope.Singleton) {
  return function _injectable(target: InjectDIToken<any>) {
    // @ts-ignore add scope metadata
    target["__scope__"] = scope;
    return target as any;
  };
}
