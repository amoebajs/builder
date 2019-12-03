import { IConstructor } from "./base";

type DescHack<T> = {
  [key in keyof T]?: T[key] extends
    | { [key: string]: any | undefined }
    | undefined
    ? [string, DescHack<T[key]>] | DescHack<T[key]>
    : string;
};

export interface IPipeDefine<D> {
  description: DescHack<D>;
}

export function Pipe<T>(params: IPipeDefine<T>) {
  return function custom_pipe(targte: IConstructor<any>) {};
}
