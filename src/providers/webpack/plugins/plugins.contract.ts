import { Plugin } from "webpack";
import { Injectable } from "../../../core/decorators";

@Injectable()
export abstract class WebpackPlugins {
  public abstract createProgressPlugin(): Plugin;
}
