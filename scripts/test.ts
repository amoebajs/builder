import ts from "typescript";
import { ImportGenerator, FunctionGenerator } from "../src/core/typescript/index";

const printer = ts.createPrinter();

let sourceFile = ts.createSourceFile("a.tsx", "", ts.ScriptTarget.ES2017);

const tsImport = new ImportGenerator()
  .setDefaultName("ts")
  .setModulePath("typescript")
  .emit();

const fsImport = new ImportGenerator()
  .setNamespaceName("fs")
  .setModulePath("fs-extra")
  .emit();

const childProcessImport = new ImportGenerator()
  .addNamedBinding("fork")
  .addNamedBinding("spawn", "spawnFn")
  .setModulePath("child_process")
  .emit();

const func = new FunctionGenerator()
  .setName("demoFn")
  .pushParamWithType("p01", "string[]")
  .pushParamWithType("p02", "number")
  .pushParamWithType("p02_01", "string")
  .pushParamWithType("p03", ["boolean", "undefined"])
  .pushParamWithType("p04", "boolean | undefined")
  .pushParamWithType("p05", "Date", true)
  .pushParamWithType("p06", [], true)
  .updateParamInitValue("p01", "[]")
  .updateParamInitValue("p02", "25258")
  .updateParamInitValue("p02_01", '"sdfsdfsd"')
  // .setParamWithInitValue("p02_01", () => ts.createStringLiteral("sdfsdfsd"))
  .updateParamInitValue("p03", types => (types.includes("undefined") ? ts.createIdentifier("void 0") : ts.createTrue()))
  .updateParamDestruct("p06", ["a", "b", "c"])
  .pushTransformerBeforeEmit(node => {
    console.log("is function : " + ts.isFunctionDeclaration(node));
    return node;
  })
  .emit();

sourceFile = ts.updateSourceFileNode(
  sourceFile,
  [tsImport, fsImport, childProcessImport, func],
  sourceFile.isDeclarationFile,
  sourceFile.referencedFiles,
  sourceFile.typeReferenceDirectives,
  sourceFile.hasNoDefaultLib,
  sourceFile.libReferenceDirectives,
);

const result = printer.printNode(ts.EmitHint.SourceFile, sourceFile, sourceFile);

console.log(result);
