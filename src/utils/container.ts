import ts from "typescript";
import { IProcessConstructor, IProcessor } from "../providers";
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
  ExtensivePageProcessor,
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

export function useClassProcessors(
  name: string,
  statements: ts.Statement[],
  processors: IProcessConstructor[]
) {
  let states = statements;
  let target!: ts.ClassDeclaration;
  let updateClassTarget!: IProcessor["updateClassTarget"];
  const views: ts.JsxElement[] = [];
  for (const p of processors) {
    const processor = new p({
      target: ts.createIdentifier(name),
      statements: states
    });
    views.push(...processor.getAppendViews());
    const methods = processor.getAppendMethods();
    target = processor.getClassTarget();
    updateClassTarget = processor.updateClassTarget.bind(processor);
    states = processor.updateClassTarget(
      ts.updateClassDeclaration(
        target,
        target.decorators,
        target.modifiers,
        target.name,
        target.typeParameters,
        target.heritageClauses,
        (<ts.ClassElement[]>methods).concat(target.members)
      )
    );
  }
  const tgRenderIdx = target.members.findIndex(
    i =>
      ts.isMethodDeclaration(i) &&
      ts.isIdentifier(i.name) &&
      i.name.text === REACT.Render
  );
  const renderMethod = ts.createMethod(
    [],
    [ts.createModifier(ts.SyntaxKind.PublicKeyword)],
    undefined,
    ts.createIdentifier(REACT.Render),
    undefined,
    [],
    [],
    undefined,
    ts.createBlock([
      createConstVariableStatement(REACT.Props, false, undefined, THIS.Props),
      ts.createReturn(
        ts.createParen(createJsxElement(REACT.Fragment, [], {}, views))
      )
    ])
  );
  const tempStates = [...target.members];
  if (tgRenderIdx >= 0) {
    tempStates[tgRenderIdx] = renderMethod;
  } else {
    tempStates.push(renderMethod);
  }
  states = updateClassTarget(
    ts.updateClassDeclaration(
      target,
      target.decorators,
      target.modifiers,
      target.name,
      target.typeParameters,
      target.heritageClauses,
      tempStates
    )
  );
  return states;
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
      if (options[prop.name!]) {
        (<any>model)[prop.realName] = options[prop.name!];
      }
    }
  }
  model["onInit"]();
  return model;
}

function createPageContext(
  model: ExtensivePage<any>,
  processors: ExtensivePageProcessor[],
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
  for (const processor of processors) {
    context = processor(context, options, onUpdate);
  }
  return context;
}

export function createSelectPage<T extends typeof ExtensivePage>(
  name: string,
  template: T,
  options: any = {},
  processors: ExtensivePageProcessor[],
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
