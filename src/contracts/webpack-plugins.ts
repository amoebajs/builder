import webpack from "webpack";
import { Injectable } from "../decorators";

@Injectable()
export abstract class WebpackPlugins {
  public abstract createProgressPlugin(): webpack.Plugin;
}
