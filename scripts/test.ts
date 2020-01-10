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
  .addParamWithkeywordType("p01", "string")
  .addParamWithkeywordType("p02", "number")
  .addParamWithkeywordType("p03", "boolean", true)
  .setParamWithInitValue("p02", ts.createNumericLiteral("25258"))
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
