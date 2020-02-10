import { Injectable } from "../../../core";
import { IWebpackOptions } from "../config";
import { WebpackBuild } from "./build.contract";

/* eslint-disable @typescript-eslint/no-unused-vars */

@Injectable()
export class WebpackBuildWebProvider implements WebpackBuild {
  public async buildSource(options: IWebpackOptions): Promise<void> {
    throw new Error("not implemented.");
  }
}
