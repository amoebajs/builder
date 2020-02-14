import { FiberRoot } from "react-reconciler";
import { SourceFileContext, IBasicEntityProvider } from "./base";
import { IInnerComponent } from "./component";
import { IConstructor } from "./decorators";

export type IType = IConstructor<IInnerComponent>;

export interface IProps {
  props: Record<string, any>;
  inputs: Record<string, any>;
  attaches: Record<string, any>;
}

export interface IContainer {
  _rootContainer?: FiberRoot;
}

export interface IInstance {}

export interface ITextInstance {}

export interface IHydratableInstance {}

export interface IPublicInstance {}

export interface IHostContext {}

export interface IUpdatePayload {}

export interface IChildSet {}

export interface ITimeoutHandle {}

export interface INoTimeout {}

export interface IEngineOptions {
  context: SourceFileContext<IBasicEntityProvider>;
}

export interface IEngine {
  render(element: JSX.Element): Promise<any>;
}

export abstract class ReconcilerEngine {
  abstract createEngine(options: IEngineOptions): IEngine;
}
