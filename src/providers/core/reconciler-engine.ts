import { Injector, InjectScope } from "@bonbons/di";
import R, { OpaqueHandle, Reconciler, HostConfig } from "react-reconciler";
import {
  ReconcilerEngine,
  IEngineOptions,
  IInstance,
  ITextInstance,
  IContainer,
  IPublicInstance,
  IHostContext,
  IType,
  IProps,
  resolveComponent,
  IUpdatePayload,
  ITimeoutHandle,
  INoTimeout,
  IChildSet,
  IHydratableInstance,
  Injectable,
} from "../../core";
import { BasicComponentChildRef } from "../entities";

@Injectable(InjectScope.New)
export class ReactReconcilerEngine extends ReconcilerEngine {
  private engine!: Reconciler<IInstance, ITextInstance, IContainer, IPublicInstance>;

  constructor(protected injector: Injector) {
    super();
  }

  private createHostConfig({
    context,
  }: IEngineOptions): HostConfig<
    IType,
    IProps,
    IContainer,
    IInstance,
    ITextInstance,
    IHydratableInstance,
    IPublicInstance,
    IHostContext,
    IUpdatePayload,
    IChildSet,
    ITimeoutHandle,
    INoTimeout
  > {
    const { provider } = context;
    const injector = this.injector;
    return {
      getPublicInstance(instance: IInstance | ITextInstance): IPublicInstance {
        return {};
      },

      getRootHostContext(rootContainerInstance: IContainer): IHostContext {
        return {};
      },

      getChildHostContext(
        parentHostContext: IHostContext,
        type: IType,
        rootContainerInstance: IContainer,
      ): IHostContext {
        return {};
      },

      prepareForCommit(containerInfo: IContainer): void {},

      resetAfterCommit(containerInfo: IContainer): void {},

      createInstance(
        type: IType,
        props: IProps,
        rootContainerInstance: IContainer,
        hostContext: IHostContext,
        internalInstanceHandle: OpaqueHandle,
      ): IInstance {
        const ref = injector.get(BasicComponentChildRef);
        // const metadata = resolveComponent(type);
        ref["__options"] = {
          input: props.inputs,
          props: props.props,
          attach: props.attaches,
        };
        return ref;
      },

      appendInitialChild(parentInstance: IInstance, child: IInstance | ITextInstance): void {},

      finalizeInitialChildren(
        parentInstance: IInstance,
        type: IType,
        props: IProps,
        rootContainerInstance: IContainer,
        hostContext: IHostContext,
      ): boolean {
        return false;
      },

      prepareUpdate(
        instance: IInstance,
        type: IType,
        oldProps: IProps,
        newProps: IProps,
        rootContainerInstance: IContainer,
        hostContext: IHostContext,
      ): null | IUpdatePayload {
        return null;
      },

      shouldSetTextContent(type: IType, props: IProps): boolean {
        return false;
      },
      shouldDeprioritizeSubtree(type: IType, props: IProps): boolean {
        return false;
      },

      createTextInstance(
        text: string,
        rootContainerInstance: IContainer,
        hostContext: IHostContext,
        internalInstanceHandle: OpaqueHandle,
      ): ITextInstance {
        return {};
      },

      scheduleDeferredCallback(callback: () => any, options?: { timeout: number }): any {},

      cancelDeferredCallback(callbackID: any): void {},

      setTimeout(handler: (...args: any[]) => void, timeout: number): ITimeoutHandle | INoTimeout {
        return {};
      },
      clearTimeout(handle: ITimeoutHandle | INoTimeout): void {},

      now(): number {
        return Date.now();
      },

      // Temporary workaround for scenario where multiple renderers concurrently
      // render using the same context objects. E.g. React DOM and React ART on the
      // same page. DOM is the primary renderer; ART is the secondary renderer.
      isPrimaryRenderer: false,
      noTimeout: false,
      supportsMutation: false,
      supportsPersistence: false,
      supportsHydration: false,

      //#region Mutation
      appendChild(parentInstance: IInstance, child: IInstance | ITextInstance): void {},
      appendChildToContainer(container: IContainer, child: IInstance | ITextInstance): void {},
      commitTextUpdate(textInstance: ITextInstance, oldText: string, newText: string): void {},
      commitMount(instance: IInstance, type: IType, newProps: IProps, internalInstanceHandle: OpaqueHandle): void {},
      commitUpdate(
        instance: IInstance,
        updatePayload: IUpdatePayload,
        type: IType,
        oldProps: IProps,
        newProps: IProps,
        internalInstanceHandle: OpaqueHandle,
      ): void {},
      insertBefore(
        parentInstance: IInstance,
        child: IInstance | ITextInstance,
        beforeChild: IInstance | ITextInstance,
      ): void {},
      insertInContainerBefore(
        container: IContainer,
        child: IInstance | ITextInstance,
        beforeChild: IInstance | ITextInstance,
      ): void {},
      removeChild(parentInstance: IInstance, child: IInstance | ITextInstance): void {},
      removeChildFromContainer(container: IContainer, child: IInstance | ITextInstance): void {},
      resetTextContent(instance: IInstance): void {},
      //#endregion

      //#region Persistence
      cloneInstance(
        instance: IInstance,
        updatePayload: null | IUpdatePayload,
        type: IType,
        oldProps: IProps,
        newProps: IProps,
        internalInstanceHandle: OpaqueHandle,
        keepChildren: boolean,
        recyclableInstance: IInstance,
      ): IInstance {
        return {};
      },

      createContainerChildSet(container: IContainer): IChildSet {
        return {};
      },

      appendChildToContainerChildSet(childSet: IChildSet, child: IInstance | ITextInstance): void {},
      finalizeContainerChildren(container: IContainer, newChildren: IChildSet): void {},

      replaceContainerChildren(container: IContainer, newChildren: IChildSet): void {},
      //#endregion

      //#region Hydration
      canHydrateInstance(instance: IHydratableInstance, type: IType, props: IProps): null | IInstance {
        return null;
      },
      canHydrateTextInstance(instance: IHydratableInstance, text: string): null | ITextInstance {
        return null;
      },
      getNextHydratableSibling(instance: IInstance | ITextInstance | IHydratableInstance): null | IHydratableInstance {
        return null;
      },
      getFirstHydratableChild(parentInstance: IInstance | IContainer): null | IHydratableInstance {
        return {};
      },
      hydrateInstance(
        instance: IInstance,
        type: IType,
        props: IProps,
        rootContainerInstance: IContainer,
        hostContext: IHostContext,
        internalInstanceHandle: OpaqueHandle,
      ): null | IUpdatePayload {
        return null;
      },
      hydrateTextInstance(textInstance: ITextInstance, text: string, internalInstanceHandle: OpaqueHandle): boolean {
        return false;
      },
      didNotMatchHydratedContainerTextInstance(
        parentContainer: IContainer,
        textInstance: ITextInstance,
        text: string,
      ): void {},
      didNotMatchHydratedTextInstance(
        parentType: IType,
        parentProps: IProps,
        parentInstance: IInstance,
        textInstance: ITextInstance,
        text: string,
      ): void {},
      didNotHydrateContainerInstance(parentContainer: IContainer, instance: IInstance | ITextInstance): void {},
      didNotHydrateInstance(
        parentType: IType,
        parentProps: IProps,
        parentInstance: IInstance,
        instance: IInstance | ITextInstance,
      ): void {},
      didNotFindHydratableContainerInstance(parentContainer: IContainer, type: IType, props: IProps): void {},
      didNotFindHydratableContainerTextInstance(parentContainer: IContainer, text: string): void {},
      didNotFindHydratableInstance(
        parentType: IType,
        parentProps: IProps,
        parentInstance: IInstance,
        type: IType,
        props: IProps,
      ): void {},
      didNotFindHydratableTextInstance(
        parentType: IType,
        parentProps: IProps,
        parentInstance: IInstance,
        text: string,
      ): void {},
      //#endregion
    };
  }

  public createEngine(options: IEngineOptions) {
    if (!this.engine) this.engine = R(this.createHostConfig(options));
    const engine = this.engine;
    const container: IContainer = {};
    return {
      render(element: JSX.Element) {
        container._rootContainer = engine.createContainer(container, false, false);
        return new Promise(resolve => {
          engine.updateContainer(element, container._rootContainer!, null, () => resolve(container));
        });
      },
    };
  }
}
