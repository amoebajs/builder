import { Path } from "./path";
import {
  Injectable,
  resolveModule,
  resolvePage,
  resolvePipe,
  EntityConstructor
} from "../decorators";

export interface IMapEntry<T = any> {
  moduleName?: string;
  name: string;
  displayName: string;
  value: T;
  pages: { [name: string]: any };
  pipes: { [name: string]: any };
}

@Injectable()
export class GlobalMap {
  protected GlobalMaps: {
    modules: { [key: string]: IMapEntry };
    pages: { [key: string]: IMapEntry };
    pipes: { [key: string]: IMapEntry };
  } = { modules: {}, pipes: {}, pages: {} };

  public useModule(mdname: EntityConstructor<any>) {
    const metadata = resolveModule(mdname);
    const moduleName = metadata.name || "[unnamed]";
    const thisModule: IMapEntry<any> = (this.GlobalMaps.modules[moduleName] = {
      name: moduleName,
      displayName: metadata.displayName || moduleName,
      value: mdname,
      pages: {},
      pipes: {}
    });
    if (metadata.pages) {
      metadata.pages.forEach(i => {
        const meta = resolvePage(i);
        const pageName = meta.name || "[unnamed]";
        thisModule.pages[pageName] = {
          name: pageName,
          displayName: meta.displayName || pageName,
          moduleName,
          value: i
        };
      });
    }
    if (metadata.pipes) {
      metadata.pipes.forEach(i => {
        const meta = resolvePipe(i);
        const pipeName = meta.name || "[unnamed]";
        thisModule.pipes[pipeName] = {
          name: pipeName,
          displayName: meta.displayName || pipeName,
          moduleName,
          value: i
        };
      });
    }
    return this;
  }

  public getModule(name: string): IMapEntry<any> {
    return this.GlobalMaps.modules[name];
  }

  public getPage(module: string, name: string): any {
    return this.getModule(module).pages[name];
  }

  public getPipe(module: string, name: string): any {
    return this.getModule(module).pipes[name];
  }
}

export interface IPageCreateOptions {
  page: {
    module: string;
    name: string;
    options?: { [name: string]: any };
    post: Array<{
      module: string;
      name: string;
      args?: { [name: string]: any };
    }>;
  };
}

@Injectable()
export abstract class Builder {
  constructor(protected path: Path, protected globalMap: GlobalMap) {}
  public abstract async createSource(
    outDir: string,
    fileName: string,
    configs: IPageCreateOptions
  ): Promise<void>;
}
