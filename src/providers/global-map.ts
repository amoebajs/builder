import { InjectDIToken } from "@bonbons/di";
import {
  EntityConstructor,
  IComponentContract,
  ICompositionContract,
  IDirectiveContract,
  IFrameworkDepts,
  IFrameworkStructure,
  IModuleContract,
  Injectable,
  resolveAttachProperties,
  resolveComponent,
  resolveComposition,
  resolveDirective,
  resolveEntityRefs,
  resolveInputProperties,
  resolveModule,
  resolveObservables,
  resolvePropertyGroups,
} from "../core";
import { BasicError } from "../errors";
import { BasicEntityProvider } from "./entity-parser";
import { wrapMetaIntoCtor } from "./entity-parser/basic";

export interface IMetadataGroup {
  entity: IDirectiveContract | IComponentContract | ICompositionContract | IModuleContract;
  inputs: Record<string, any>;
  attaches: Record<string, any>;
  groups: Record<string, any>;
  references: Record<string, any>;
  observers: Record<string, any>;
  entityExtensions?: Partial<IFrameworkStructure<Record<string, any>>>;
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
  compositions: { [name: string]: IMapEntry<any> };
}

export interface IGlobalMap {
  modules: { [key: string]: IModuleEntry<any> };
  globalComponentList: IMapEntry<any>[];
  globalDirectiveList: IMapEntry<any>[];
  globalCompositionList: IMapEntry<any>[];
}

@Injectable()
export class GlobalMap {
  public readonly maps: IGlobalMap = {
    modules: {},
    globalComponentList: [],
    globalDirectiveList: [],
    globalCompositionList: [],
  };

  public readonly providers: Partial<IFrameworkStructure<any>> = {};

  public useProvider(name: keyof IFrameworkDepts, provider: typeof BasicEntityProvider) {
    this.providers[name] = wrapMetaIntoCtor(provider, name);
    return this;
  }

  public useModule(mdname: EntityConstructor<any>, register: (injectable: InjectDIToken<any>) => InjectDIToken<any>) {
    const metadata = resolveModule(mdname);
    const moduleName = metadata.name || "[unnamed]";
    const thisModule: IModuleEntry<any> = (this.maps.modules[moduleName] = {
      name: moduleName,
      displayName: metadata.displayName || moduleName,
      value: register(mdname),
      components: {},
      directives: {},
      compositions: {},
      provider: metadata.provider,
      metadata: <any>{ entity: metadata },
    });
    if (metadata.components) {
      metadata.components.forEach(i => {
        const meta = resolveComponent(i);
        const pageName = meta.name || "[unnamed]";
        const component = (thisModule.components[pageName] = {
          name: pageName,
          displayName: meta.displayName || pageName,
          moduleName,
          value: register(i),
          provider: metadata.provider,
          metadata: <any>{ entity: meta },
        });
        this.maps.globalComponentList.push(component);
      });
    }
    if (metadata.directives) {
      metadata.directives.forEach(i => {
        const meta = resolveDirective(i);
        const pipeName = meta.name || "[unnamed]";
        const directive = (thisModule.directives[pipeName] = {
          name: pipeName,
          displayName: meta.displayName || pipeName,
          moduleName,
          value: register(i),
          provider: metadata.provider,
          metadata: <any>{ entity: meta },
        });
        this.maps.globalDirectiveList.push(directive);
      });
    }
    if (metadata.compositions) {
      metadata.compositions.forEach(i => {
        const meta = resolveComposition(i);
        const pipeName = meta.name || "[unnamed]";
        const composition = (thisModule.compositions[pipeName] = {
          name: pipeName,
          displayName: meta.displayName || pipeName,
          moduleName,
          value: register(i),
          provider: metadata.provider,
          metadata: <any>{ entity: meta },
        });
        this.maps.globalCompositionList.push(composition);
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

  public getComposition(module: string, name: string): IMapEntry<any> {
    return this.getModule(module).compositions[name];
  }

  public getComponentByType(component: InjectDIToken<any>): IMapEntry<any> {
    return this.maps.globalComponentList.find(i => i.value === component)!;
  }

  public getDirectiveByType(directive: InjectDIToken<any>): IMapEntry<any> {
    return this.maps.globalDirectiveList.find(i => i.value === directive)!;
  }

  public getCompositionByType(composition: InjectDIToken<any>): IMapEntry<any> {
    return this.maps.globalCompositionList.find(i => i.value === composition)!;
  }

  public getProvider(name: keyof IFrameworkDepts): typeof BasicEntityProvider {
    if (!this.providers[name]) throw new BasicError(`provider for [${name}] is not provided.`);
    return this.providers[name];
  }

  public initMetadatas(resolver: (provider: typeof BasicEntityProvider) => BasicEntityProvider) {
    for (const key in this.maps.modules) {
      if (this.maps.modules.hasOwnProperty(key)) {
        const thisModule = this.maps.modules[key];
        const provider = resolver(this.getProvider(<any>thisModule.provider));
        thisModule.metadata = {
          ...getEitityMetadata(thisModule.value, provider),
          ...thisModule.metadata,
        };
        for (const key in thisModule.components) {
          if (thisModule.components.hasOwnProperty(key)) {
            const thisComp = thisModule.components[key];
            thisComp.metadata = {
              ...getEitityMetadata(thisComp.value, provider),
              ...thisComp.metadata,
            };
          }
        }
        for (const key in thisModule.directives) {
          if (thisModule.directives.hasOwnProperty(key)) {
            const thisDire = thisModule.directives[key];
            thisDire.metadata = {
              ...getEitityMetadata(thisDire.value, provider),
              ...thisDire.metadata,
            };
          }
        }
        for (const key in thisModule.compositions) {
          if (thisModule.compositions.hasOwnProperty(key)) {
            const thisCpsi = thisModule.compositions[key];
            thisCpsi.metadata = {
              ...getEitityMetadata(thisCpsi.value, provider),
              ...thisCpsi.metadata,
            };
          }
        }
      }
    }
  }
}

export function getEitityMetadata(mdname: EntityConstructor<any>, provider?: BasicEntityProvider): IMetadataGroup {
  const result: IMetadataGroup = {
    entity: <any>{},
    groups: resolvePropertyGroups(mdname),
    inputs: resolveInputProperties(mdname),
    attaches: resolveAttachProperties(mdname),
    references: resolveEntityRefs(mdname),
    observers: resolveObservables(mdname),
  };
  if (!!provider) {
    result.entityExtensions = provider!.resolveExtensionsMetadata(mdname);
  }
  return result;
}
