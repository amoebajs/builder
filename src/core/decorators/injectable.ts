import { InjectDIToken } from "@bonbons/di";

export function Injectable() {
  return function _injectable(target: InjectDIToken<any>) {
    return target as any;
  };
}
