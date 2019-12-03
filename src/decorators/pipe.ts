import { IConstructor, IPipeContract, definePipe } from "./base";

export function Pipe(params: IPipeContract | string) {
  return function custom_pipe(target: IConstructor<any>) {
    definePipe(target, {
      ...(typeof params === "string" ? { name: params } : params)
    });
    return <any>target;
  };
}
