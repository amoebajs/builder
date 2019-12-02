import { IConstructor } from "./base";

export function Pipe<T>(params: T) {
  return function custom_pipe(targte: IConstructor<T>) {};
}
