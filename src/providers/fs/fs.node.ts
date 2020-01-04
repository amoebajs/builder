import { Injectable } from "../../core/decorators";
import { Fs } from "./fs.contract";

@Injectable()
export class FsNodeProvider implements Fs {
  public readFile(file: string | number | Buffer): Promise<string | Buffer> {
    return require("fs-extra").readFile(file);
  }

  public writeFile(file: string | number | Buffer, data: any): Promise<void> {
    return require("fs-extra").writeFile(file, data);
  }
}
