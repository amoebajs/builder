export enum BasicState {
  RenderTagName = "renderTageName",
  RenderTagAttrs = "renderTagAttrs",
  RenderChildrenMap = "renderTagChildNodes",
  RenderChildrenRuleMap = "renderTagChildNodeRules",
  UnshiftNodes = "renderUnshiftNodes",
  PushedNodes = "renderPushedNodes",
  UseStates = "compUseStates",
  UseCallbacks = "compUseCallbacks",
  UseEffects = "compUseEffects",
  UseRefs = "compUseRefs",
  UseMemos = "compUseMemos",
  UseObservers = "compUseObservers",
  ContextInfo = "rootContextInfo",
  UnshiftVariables = "unshiftVariables",
  PushedVariables = "pushedVariables",
  FnsBeforeRender = "fnsBeforeRender",
  RootElementChangeFns = "rootElementChangeFns",
  AppendChildrenHooks = "appendChildrenHooks",
}
