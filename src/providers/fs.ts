import { Fs } from "../contracts";
import { Injectable } from "../core/decorators";

@Injectable()
export class FsProvider extends Fs {
  public readFile(file: string | number | Buffer): Promise<string | Buffer> {
    return require("fs-extra").readFile(file);
  }

  public writeFile(file: string | number | Buffer, data: any): Promise<void> {
    return require("fs-extra").writeFile(file, data);
  }
}
