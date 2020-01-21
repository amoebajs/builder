import { Injectable } from "#core";

@Injectable()
export abstract class Fs {
  public abstract readFile(file: string | number | Buffer): Promise<string | Buffer>;

  public abstract writeFile(file: string | number | Buffer, data: any): Promise<void>;
}
