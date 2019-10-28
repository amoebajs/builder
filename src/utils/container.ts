import ts from "typescript";
import { IProcessConstructor, IProcessor } from "../providers";
import {
  createExportModifier,
  TYPES,
  createConstVariableStatement,
  REACT,
  THIS,
  createJsxElement
} from "./base";
import { ExtensivePage } from "../core";

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

export function createSelectPage<T extends typeof ExtensivePage>(
  name: string,
  template: T,
  isExport = false
) {
  const model: ExtensivePage = new (<any>template)();
  model;
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
    [model.createRender()]
  );
}
