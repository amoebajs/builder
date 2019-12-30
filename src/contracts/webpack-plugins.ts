import webpack from "webpack";
import { Injectable } from "../core/decorators";

@Injectable()
export abstract class WebpackPlugins {
  public abstract createProgressPlugin(): webpack.Plugin;
}
