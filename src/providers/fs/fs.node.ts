import * as fs from "fs-extra";
import { Injectable } from "#core";
import { Fs } from "./fs.contract";

@Injectable()
export class FsNodeProvider implements Fs {
  public readFile(file: string | number | Buffer): Promise<string | Buffer> {
    return fs.readFile(file);
  }

  public writeFile(file: string | number | Buffer, data: any): Promise<void> {
    return fs.writeFile(file, data);
  }
}
