import ts from "typescript";
import { BasicState, Directive, Input } from "#core";
import { ReactDirective } from "#providers";
import { capitalize } from "lodash";

@Directive({ name: "global-state", version: "0.0.1-beta.0" })
export class GlobalStateDirective extends ReactDirective {
  @Input({ name: "state", useMap: { key: "string", value: "any" } })
  defaultStates: Array<[string, any]> = [];

  protected async onAttach() {
    await super.onAttach();
    this.render.appendRootVariable("__STATE__", this.createContextBody());
    this.render.setRootState(BasicState.ContextInfo, { name: "__STATE__" });
  }

  private createContextBody() {
    return ts.createObjectLiteral([ts.createPropertyAssignment("state", this.createState())]);
  }

  private createState() {
    return ts.createObjectLiteral(
      this.defaultStates.map(([name, value]) => {
        this.render.appendRootState(name, value);
        return ts.createPropertyAssignment(
          name,
          ts.createObjectLiteral([
            ts.createPropertyAssignment("value", ts.createIdentifier(name)),
            ts.createPropertyAssignment("setState", ts.createIdentifier("set" + capitalize(name))),
          ]),
        );
      }),
    );
  }
}
