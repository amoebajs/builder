import { IConstructor, IPipeContract, definePipe } from "./base";

const defaults: IPipeContract = {
  name: null,
  displayName: null,
  useProvider: "react"
};

export function Pipe(params: IPipeContract | string) {
  return function custom_pipe(target: IConstructor<any>) {
    definePipe(target, {
      ...defaults,
      ...(typeof params === "string" ? { name: params } : params)
    });
    return <any>target;
  };
}
