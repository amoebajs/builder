import { Injectable } from "../../core/decorators";
import { Fs } from "./fs.contract";

@Injectable()
export class FsWebProvider implements Fs {
  public readFile(file: string | number | Buffer): Promise<string | Buffer> {
    throw new Error("not implemented.");
  }

  public writeFile(file: string | number | Buffer, data: any): Promise<void> {
    throw new Error("not implemented.");
  }
}
