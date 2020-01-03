import {
  EntityConstructor,
  IComponentContract,
  IDirectiveContract,
  IFrameworkDepts,
  IFrameworkStructure,
  IModuleContract,
  Injectable,
  resolveAttachProperties,
  resolveComponent,
  resolveDirective,
  resolveInputProperties,
  resolveModule,
  resolveOutputProperties,
  resolvePropertyGroups
} from "../core/decorators";
import { BasicError } from "../errors";
import { BasicEntityProvider } from "./entity-parser";
import { InjectDIToken } from "@bonbons/di";

export interface IMetadataGroup {
  entity: IDirectiveContract | IComponentContract | IModuleContract;
  inputs: { [name: string]: any };
  outputs: { [name: string]: any };
  attaches: { [name: string]: any };
  groups: { [name: string]: any };
  entityExtensions?: Partial<
    IFrameworkStructure<{
      [name: string]: any;
    }>
  >;
}

export interface IMapEntry<T = any> {
  moduleName?: string;
  name: string;
  displayName: string;
  value: T;
  provider: string;
  metadata: IMetadataGroup;
}

export interface IModuleEntry<T = any> extends IMapEntry<T> {
  components: { [name: string]: IMapEntry<any> };
  directives: { [name: string]: IMapEntry<any> };
}

export interface IGlobalMap {
  modules: { [key: string]: IModuleEntry<any> };
}

@Injectable()
export class GlobalMap {
  public readonly maps: IGlobalMap = { modules: {} };
  public readonly providers: Partial<IFrameworkStructure<any>> = {};

  public useProvider(
    name: keyof IFrameworkDepts,
    provider: typeof BasicEntityProvider
  ) {
    this.providers[name] = provider;
    return this;
  }

  public useModule(
    mdname: EntityConstructor<any>,
    register: (injectable: InjectDIToken<any>) => InjectDIToken<any>
  ) {
    const metadata = resolveModule(mdname);
    const moduleName = metadata.name || "[unnamed]";
    const thisModule: IModuleEntry<any> = (this.maps.modules[moduleName] = {
      name: moduleName,
      displayName: metadata.displayName || moduleName,
      value: register(mdname),
      components: {},
      directives: {},
      provider: metadata.provider,
      metadata: <any>{ entity: metadata }
    });
    if (metadata.components) {
      metadata.components.forEach(i => {
        const meta = resolveComponent(i);
        const pageName = meta.name || "[unnamed]";
        thisModule.components[pageName] = {
          name: pageName,
          displayName: meta.displayName || pageName,
          moduleName,
          value: register(i),
          provider: metadata.provider,
          metadata: <any>{ entity: meta }
        };
      });
    }
    if (metadata.directives) {
      metadata.directives.forEach(i => {
        const meta = resolveDirective(i);
        const pipeName = meta.name || "[unnamed]";
        thisModule.directives[pipeName] = {
          name: pipeName,
          displayName: meta.displayName || pipeName,
          moduleName,
          value: register(i),
          provider: metadata.provider,
          metadata: <any>{ entity: meta }
        };
      });
    }
    return this;
  }

  public getModule(name: string): IModuleEntry<any> {
    return this.maps.modules[name];
  }

  public getComponent(module: string, name: string): IMapEntry<any> {
    return this.getModule(module).components[name];
  }

  public getDirective(module: string, name: string): IMapEntry<any> {
    return this.getModule(module).directives[name];
  }

  public getProvider(name: keyof IFrameworkDepts): typeof BasicEntityProvider {
    if (!this.providers[name])
      throw new BasicError(`provider for [${name}] is not provided.`);
    return this.providers[name];
  }

  public initMetadatas(
    resolver: (provider: typeof BasicEntityProvider) => BasicEntityProvider
  ) {
    for (const key in this.maps.modules) {
      if (this.maps.modules.hasOwnProperty(key)) {
        const thisModule = this.maps.modules[key];
        const provider = resolver(this.getProvider(<any>thisModule.provider));
        thisModule.metadata = {
          ...getMetadata(thisModule.value, provider),
          ...thisModule.metadata
        };
        for (const key in thisModule.components) {
          if (thisModule.components.hasOwnProperty(key)) {
            const thisComp = thisModule.components[key];
            thisComp.metadata = {
              ...getMetadata(thisComp.value, provider),
              ...thisComp.metadata
            };
          }
        }
        for (const key in thisModule.directives) {
          if (thisModule.directives.hasOwnProperty(key)) {
            const thisDire = thisModule.directives[key];
            thisDire.metadata = {
              ...getMetadata(thisDire.value, provider),
              ...thisDire.metadata
            };
          }
        }
      }
    }
  }
}

export function getMetadata(
  mdname: EntityConstructor<any>,
  provider?: BasicEntityProvider
): IMetadataGroup {
  const result: IMetadataGroup = {
    entity: <any>{},
    groups: resolvePropertyGroups(mdname),
    inputs: resolveInputProperties(mdname),
    outputs: resolveOutputProperties(mdname),
    attaches: resolveAttachProperties(mdname)
  };
  if (!!provider) {
    result.entityExtensions = provider!.resolveExtensionsMetadata(mdname);
  }
  return result;
}
