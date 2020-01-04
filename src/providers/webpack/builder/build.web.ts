import { Injectable } from "../../../core/decorators";
import { IWebpackOptions } from "../config";
import { WebpackBuild } from "./build.contract";

@Injectable()
export class WebpackBuildWebProvider implements WebpackBuild {
  public async buildSource(options: IWebpackOptions): Promise<void> {
    throw new Error("not implemented.");
  }
}
