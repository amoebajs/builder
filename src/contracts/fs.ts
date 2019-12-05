import { Injectable } from "../decorators";

@Injectable()
export abstract class Fs {
  public abstract readFile(
    file: string | number | Buffer
  ): Promise<Buffer | string>;
  public abstract writeFile(
    file: string | number | Buffer,
    data: any
  ): Promise<void>;
}
