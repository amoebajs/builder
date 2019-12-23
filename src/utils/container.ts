import ts from "typescript";
import {
  createExportModifier,
  TYPES,
  createConstVariableStatement,
  REACT,
  THIS,
  createJsxElement,
  exists
} from "./base";
import {
  ExtensivePage,
  IExtensivePageContext,
  ImportStatementsUpdater
} from "../pages/basic";
import { resolveProperties, IConstructor, resolvePipe } from "../decorators";
import { CommonPipe, RenderPipe, BasicPipe } from "../pipes/base";

export type ProcessorType =
  | IConstructor<CommonPipe | RenderPipe>
  | [IConstructor<CommonPipe | RenderPipe>, any]
  | (CommonPipe | RenderPipe);

export function createCustomPureClass(name: string, isExport = false) {
  return ts.createClassDeclaration(
    [],
    createExportModifier(isExport),
    ts.createIdentifier(name),
    [],
    [
      ts.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [
        TYPES.PureComponent
      ])
    ],
    [
      ts.createMethod(
        [],
        [ts.createModifier(ts.SyntaxKind.PublicKeyword)],
        undefined,
        ts.createIdentifier(REACT.Render),
        undefined,
        [],
        [],
        undefined,
        ts.createBlock([
          createConstVariableStatement(
            REACT.Props,
            false,
            undefined,
            THIS.Props
          ),
          ts.createReturn(
            ts.createParen(
              createJsxElement(REACT.Fragment, [], {}, /* views*/ [])
            )
          )
        ])
      )
    ]
  );
}

function createTemplateInstance<T extends typeof ExtensivePage>(
  template: T,
  options: any
) {
  const model = inputProperties<ExtensivePage>(template, options);
  model["onInit"]();
  return model;
}

function createPageContext(
  model: ExtensivePage<any>,
  processors: Array<ProcessorType>,
  onUpdate: ImportStatementsUpdater
) {
  let context: IExtensivePageContext = {
    extendParent: model.createExtendParent(),
    implementParents: model.createImplementParents(),
    fields: model.createFields(),
    properties: model.createProperties(),
    methods: model.createMethods(),
    rootChildren: model.createRenderChildren()
  };
  for (const key in processors) {
    const processor = processors[key];
    let instance!: CommonPipe;
    if (processor instanceof Array) {
      const [processorCtor, args = {}] = processor;
      instance = inputProperties<CommonPipe>(processorCtor, args);
      instance["pipeName"] = resolvePipe(processorCtor).name || "unnamed";
    } else if ("prototype" in processor) {
      instance = inputProperties<CommonPipe>(processor, {});
      instance["pipeName"] = resolvePipe(processor).name || "unnamed";
    } else {
      const args = (<BasicPipe>processor)["params"] || {};
      instance = inputProperties(processor, args);
      instance["pipeName"] =
        resolvePipe(Object.getPrototypeOf(processor).constructor).name ||
        "unnamed";
    }
    instance["onNodePatch"](context, onUpdate, (key, childNode) => {
      instance["childNodes"][key] = childNode;
    });
    instance["onInit"]();
    context = instance["context"];
  }
  return context;
}

function inputProperties<T = any>(template: any, options: any): T {
  const model =
    "prototype" in template ? new (<any>template)(options) : template;
  const ctor =
    "prototype" in template
      ? template
      : Object.getPrototypeOf(template).constructor;
  const props = resolveProperties(ctor);
  for (const key in props) {
    if (props.hasOwnProperty(key)) {
      const prop = props[key];
      const group = prop.group;
      if (
        group &&
        options.hasOwnProperty(group) &&
        options[group].hasOwnProperty(prop.name.value!)
      ) {
        (<any>model)[prop.realName] = options[group][prop.name.value!];
      } else if (options.hasOwnProperty(prop.name!)) {
        (<any>model)[prop.realName] = options[prop.name.value!];
      }
    }
  }
  // console.log(model);
  return model;
}

export function createSelectPage<T extends typeof ExtensivePage>(
  name: string,
  template: T,
  options: any = {},
  processors: Array<any>,
  onUpdate: ImportStatementsUpdater,
  isExport = false
) {
  const model = createTemplateInstance(template, options);
  const context = createPageContext(model, processors, onUpdate);
  return ts.createClassDeclaration(
    [],
    createExportModifier(isExport),
    ts.createIdentifier(name),
    [],
    exists([context.extendParent, ...context.implementParents]),
    exists([
      ...context.fields,
      ...context.properties,
      ...context.methods,
      model.createRender(context)
    ])
  );
}
