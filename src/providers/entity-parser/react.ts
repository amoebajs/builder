import ts from "typescript";
import { Injector } from "@bonbons/di";
import { BasicEntityProvider, IPropertiesOptions } from "./basic";
import { IInnerComponent } from "../../core/component";
import { REACT } from "../../utils";
import { EntityConstructor, Injectable } from "../../core/decorators";
import { BasicDirective } from "../../core/directive";
import { ReactComponent, ReactDirective } from "../entities";
import { IBasicCompilationFinalContext } from "../../core";
import { ReactHelper } from "../entity-helper";

@Injectable()
export class ReactEntityProvider extends BasicEntityProvider {
  constructor(injector: Injector, protected readonly helper: ReactHelper) {
    super(injector, helper);
  }

  protected createRootComponent(
    model: IInnerComponent,
    context: IBasicCompilationFinalContext,
    isExport = true,
  ): ts.Statement {
    return this.helper.createFunctionByContext(!isExport, model.entityId, context);
  }

  protected onImportsUpdate(model: IInnerComponent, imports: ts.ImportDeclaration[]) {
    imports.unshift(
      this.helper.createNamespaceImport("react", REACT.NS),
      this.helper.createNamespaceImport("react-dom", REACT.DomNS),
      this.helper.createImport("react", undefined, [REACT.UseState, REACT.UseCallback]),
    );
    return super.onImportsUpdate(model, imports);
  }

  protected emitFunctionComponentContext(context: Partial<IBasicCompilationFinalContext>) {
    return context;
  }

  protected onStatementsEmitted(model: IInnerComponent, statements: ts.Statement[]) {
    return [
      ...statements,
      ts.createExpressionStatement(
        ts.createCall(
          ts.createPropertyAccess(ts.createIdentifier(REACT.DomNS), ts.createIdentifier("render")),
          [],
          [
            this.helper.createJsxElement(model.entityId, [], {}),
            ts.createCall(
              ts.createPropertyAccess(ts.createIdentifier("document"), ts.createIdentifier("getElementById")),
              [],
              [ts.createStringLiteral("app")],
            ),
          ],
        ),
      ),
    ];
  }

  public resolveExtensionsMetadata(_: EntityConstructor<any>): { [name: string]: any } {
    return super.resolveExtensionsMetadata(_);
  }

  protected onInputPropertiesInit(_: EntityConstructor<any>, __: IPropertiesOptions) {
    return super.onInputPropertiesInit(_, __);
  }

  public attachDirective(parent: IInnerComponent, target: BasicDirective): BasicDirective;
  public attachDirective(parent: ReactComponent, target: ReactDirective): ReactDirective;
  public attachDirective(parent: IInnerComponent | ReactComponent, target: ReactDirective) {
    Object.defineProperty(target, "__parentRef", {
      enumerable: true,
      configurable: false,
      get() {
        return parent;
      },
    });
    return target;
  }
}
