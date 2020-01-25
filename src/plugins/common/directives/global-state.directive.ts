import ts from "typescript";
import { BasicState, Directive, Input } from "#core";
import { ReactDirective } from "#providers";
import { classCase } from "#utils/case";

@Directive({ name: "global-state", version: "0.0.1-beta.0" })
export class GlobalStateDirective extends ReactDirective {
  @Input({ name: "state", useMap: { key: "string", value: "any" } })
  defaultStates: Array<[string, any]> = [];

  @Input({ name: "name" })
  defaultStateName: string = "__CONTEXT__";

  protected async onAttach() {
    await super.onAttach();
    this.render.appendRootVariable(this.defaultStateName, this.createContextBody());
    this.render.setRootState(BasicState.ContextInfo, { name: this.defaultStateName });
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
            ts.createPropertyAssignment("setState", ts.createIdentifier("set" + classCase(name))),
          ]),
        );
      }),
    );
  }
}
