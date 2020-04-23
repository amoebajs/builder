import ts from "typescript";
import { Injector } from "@bonbons/di";
import {
  EntityConstructor,
  IBasicEntityProvider,
  IInnerCompnentChildRef,
  IInnerComponent,
  IInnerCompositionChildRef,
  IInnerDirectiveChildRef,
  Injectable,
  Observer,
  SourceFileContext,
  resolveObservables,
} from "../../core";
import { REACT } from "../../utils";
import { ReactDirective } from "../entities";
import { ReactHelper } from "../entity-helper";
import { BasicEntityProvider } from "./basic";

@Injectable()
export class ReactEntityProvider extends BasicEntityProvider {
  constructor(injector: Injector, protected readonly helper: ReactHelper) {
    super(injector, helper);
  }

  public async attachInstance(
    context: SourceFileContext<IBasicEntityProvider>,
    ref: IInnerCompnentChildRef | IInnerCompositionChildRef | IInnerDirectiveChildRef,
  ): Promise<any> {
    const instance = await super.attachInstance(context, ref);
    Object.defineProperty(instance, "__rootRef", {
      enumerable: true,
      configurable: false,
      get() {
        return ref.__rootRef && ref.__rootRef.__instanceRef;
      },
    });
    if (ref.__etype === "directiveChildRef") {
      const directive: ReactDirective = instance;
      Object.defineProperty(directive, "__parentRef", {
        enumerable: true,
        configurable: false,
        get() {
          return ref.__parentRef && ref.__parentRef.__instanceRef;
        },
      });
    }
    return instance;
  }

  protected async attachComponent(instance: IInnerComponent, options: IInnerCompnentChildRef["__options"]) {
    await super.attachComponent(instance, options);
    const template = Object.getPrototypeOf(instance).constructor;
    this._setEventTrigger(template, instance);
    return instance;
  }

  private _setEventTrigger(template: EntityConstructor<any>, instance: IInnerComponent) {
    const observables = resolveObservables(template).observables;
    for (const key in observables) {
      if (observables.hasOwnProperty(key)) {
        const alias = observables[key];
        if (!((<any>instance)[key] instanceof Observer)) {
          (<any>instance)[key] = new Observer();
        }
        const varRef: Observer = (<any>instance)[key];
        varRef["_host"] = <any>instance;
        varRef["_name"] = alias;
        varRef["_realName"] = key;
      }
    }
  }

  public afterImportsCreated(context: SourceFileContext<IBasicEntityProvider>, imports: ts.ImportDeclaration[]) {
    imports.unshift(
      this.helper.createNamespaceImport("react", REACT.NS).emit(),
      this.helper.createNamespaceImport("react-dom", REACT.DomNS).emit(),
    );
    return super.afterImportsCreated(context, imports);
  }

  public afterAllCreated(context: SourceFileContext<IBasicEntityProvider>, statements: ts.Statement[]) {
    return super.afterAllCreated(context, [
      ...statements,
      ts.createExpressionStatement(
        ts.createCall(
          ts.createPropertyAccess(ts.createIdentifier(REACT.DomNS), ts.createIdentifier("render")),
          [],
          [
            this.helper.createJsxElement(context.root.entityId, [], {}),
            ts.createCall(
              ts.createPropertyAccess(ts.createIdentifier("document"), ts.createIdentifier("getElementById")),
              [],
              [ts.createStringLiteral(context.rootSlot)],
            ),
          ],
        ),
      ),
    ]);
  }

  public resolveExtensionsMetadata(_: EntityConstructor<any>): { [name: string]: any } {
    return super.resolveExtensionsMetadata(_);
  }
}
