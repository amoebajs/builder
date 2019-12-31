import ts from "typescript";
import { Directive, Input } from "../../core/decorators";
import { ReactDirective } from "../../providers";
import { TYPES } from "../../utils";

@Directive({ name: "custom-click" })
export class CustomClickDirective extends ReactDirective {
  @Input()
  public host!: string;

  @Input()
  public eventType: "setState" = "setState";

  @Input()
  public attrName: string = "onClick";

  @Input()
  public targetName!: string;

  @Input()
  public expression: string = "e => e";

  protected async onAttach() {
    try {
      this.render.appendJsxAttribute(
        this.host!,
        this.attrName!,
        ts.createJsxExpression(undefined, this.resolveExpr())
      );
    } catch (error) {
      /** ignore */
    }
  }

  private resolveExpr() {
    if (!this.targetName) return;
    const [input, output] = this.expression.split("=>").map(i => i.trim());
    if (input.length === 1) {
      const [start, ...others] = output.split(".");
      return ts.createArrowFunction(
        [],
        [],
        [
          ts.createParameter(
            [],
            [],
            undefined,
            ts.createIdentifier(input),
            undefined,
            TYPES.Any,
            undefined
          )
        ],
        undefined,
        undefined,
        ts.createParen(
          ts.createCall(
            ts.createPropertyAccess(
              ts.createThis(),
              ts.createIdentifier(this.eventType)
            ),
            [],
            [
              ts.createObjectLiteral(
                [
                  ts.createPropertyAssignment(
                    ts.createIdentifier(this.targetName),
                    others.length > 0
                      ? ts.createPropertyAccess(
                          ts.createIdentifier(start),
                          others.join(".")
                        )
                      : ts.createIdentifier(start)
                  )
                ],
                false
              )
            ]
          )
        )
      );
    }
    return undefined;
  }
}
