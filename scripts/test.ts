import ts from "typescript";
import { ImportDelegate, FunctionDelegate } from "../src/core/typescript/index";

const printer = ts.createPrinter();

let sourceFile = ts.createSourceFile("a.tsx", "", ts.ScriptTarget.ES2017);

const tsImport = new ImportDelegate()
  .setDefaultName("ts")
  .setModulePath("typescript")
  .emit();

const fsImport = new ImportDelegate()
  .setNamespaceName("fs")
  .setModulePath("fs-extra")
  .emit();

const childProcessImport = new ImportDelegate()
  .addNamedBinding("fork")
  .addNamedBinding("spawn", "spawnFn")
  .setModulePath("child_process")
  .emit();

const func = new FunctionDelegate()
  .setName("demoFn")
  .addkeywordTypeParam("p01", "string")
  .addkeywordTypeParam("p02", "number", false, ts.createNumericLiteral("25258"))
  .addkeywordTypeParam("p03", "boolean", true)
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
