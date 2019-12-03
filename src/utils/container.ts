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
} from "../plugins/pages";
import { resolveProperties } from "../decorators";

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
  const model: ExtensivePage = new (<any>template)(options);
  const props = resolveProperties(template);
  for (const key in props) {
    if (props.hasOwnProperty(key)) {
      const prop = props[key];
      if (options.hasOwnProperty(prop.name!)) {
        (<any>model)[prop.realName] = options[prop.name!];
      } else if (!!prop.group && options.hasOwnProperty(prop.group)) {
        (<any>model)[prop.realName] = options[prop.group!][prop.name!];
      }
    }
  }
  model["onInit"]();
  return model;
}

function createPageContext(
  model: ExtensivePage<any>,
  processors: any[],
  onUpdate: ImportStatementsUpdater,
  options: any
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
    processors[key].onNodePatch(context, onUpdate, () => {});
    processors[key].onInit();
    context = processors[key].context;
  }
  return context;
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
  const context = createPageContext(model, processors, onUpdate, options);
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
