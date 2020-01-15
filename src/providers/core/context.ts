import { InjectScope, Injector } from "@bonbons/di";
import { BasicEntityProvider, GlobalMap } from "../../providers";
import { Injectable } from "../../core/decorators";
import { SourceFileContext } from "../../core";

@Injectable(InjectScope.New)
export class SourceFileBasicContext<T extends BasicEntityProvider> extends SourceFileContext<T> {
  constructor(protected injector: Injector, private globalMap: GlobalMap) {
    super();
  }

  public setProvider(provider: string) {
    this.provider = <T>this.injector.get(this.globalMap.getProvider(<any>provider));
  }
}
