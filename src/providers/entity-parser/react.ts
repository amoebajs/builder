import ts from "typescript";
import { BasicEntityProvider } from "./basic";
import { ReactHelper } from "../../core/libs";
import { BasicComponent } from "../../core/component";
import { REACT } from "../../utils";
import { EntityConstructor, Injectable, resolveReactProps } from "../../core/decorators";
import { BasicDirective } from "../../core/directive";
import { ReactComponent, ReactDirective } from "../entities";
import { IBasicCompilationFinalContext } from "../../core";

@Injectable()
export class ReactEntityProvider extends BasicEntityProvider {
  protected helper = new ReactHelper();

  protected onImportsUpdate(model: BasicComponent, imports: ts.ImportDeclaration[]) {
    return super.onImportsUpdate(model, imports, [
      this.helper.createImport("react", REACT.NS),
      this.helper.createImport("react-dom", REACT.DomNS),
    ]);
  }

  protected onStatementsEmitted(model: BasicComponent, statements: ts.Statement[]) {
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

  protected createRootComponent(model: BasicComponent, context: IBasicCompilationFinalContext): ts.ClassDeclaration {
    return super.createRootComponent(model, context, false);
  }

  public resolveExtensionsMetadata(target: EntityConstructor<any>): { [name: string]: any } {
    return {
      props: resolveReactProps(target),
    };
  }

  public attachDirective(parent: BasicComponent, target: BasicDirective): BasicDirective;
  public attachDirective(parent: ReactComponent, target: ReactDirective): ReactDirective;
  public attachDirective(parent: ReactComponent, target: ReactDirective) {
    Object.defineProperty(target, "__parentId", {
      enumerable: true,
      configurable: false,
      get() {
        return parent.entityId;
      },
    });
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
