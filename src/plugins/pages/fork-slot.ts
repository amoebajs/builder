import { createJsxElement, DOMS } from "../../utils";
import { Page } from "../../decorators";
import { ExtensivePage } from "./basic";

@Page({
  name: "fork_slot_page",
  displayName: "拆分布局页面"
})
export class ForkSlotPage extends ExtensivePage {
  protected onInit() {
    this.state.rootElement.name = DOMS.Div;
    this.state.rootElement.attrs["className"] = "root-container";
    this.state.rootChildren.push(
      createJsxElement(DOMS.Span, [], { className: "bold-font" }, [
        "inner-text"
      ])
    );
  }

  public createRenderChildren() {
    return [
      createJsxElement(
        "div",
        [],
        { className: "div-left" },
        this.state.rootChildren
      ),
      createJsxElement(
        "div",
        [],
        { className: "div-right" },
        this.state.rootChildren
      )
    ];
  }
}
