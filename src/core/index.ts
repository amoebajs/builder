import { Constructor, resolveModule, resolvePage } from "../decorators";
import { createSelectPage } from "../utils";

interface IEntry<T = any> {
  moduleName?: string;
  name: string;
  displayName: string;
  value: T;
}

const GlobalMaps = {
  modules: <{ [key: string]: IEntry }>{},
  pages: <{ [key: string]: IEntry }>{}
};

export function useModule(module: Constructor<any>) {
  const metadata = resolveModule(module);
  const moduleName = metadata.name || "[unnamed]";
  GlobalMaps.modules[moduleName] = {
    name: moduleName,
    displayName: metadata.displayName || moduleName,
    value: module
  };
  if (metadata.pages) {
    metadata.pages.forEach(i => {
      const meta = resolvePage(i);
      const pageName = meta.name || "[unnamed]";
      GlobalMaps.pages[`${moduleName}@${pageName}`] = {
        name: pageName,
        displayName: meta.displayName || pageName,
        moduleName,
        value: i
      };
    });
  }
  // console.log(GlobalMaps);
}

export function createPage(name: string, page: string, options?: any) {
  if (!GlobalMaps.pages[page]) {
    throw new Error("page template not found");
  }
  return createSelectPage(name, GlobalMaps.pages[page].value, options, true);
}
