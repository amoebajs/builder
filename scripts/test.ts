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
  .addParamWithType("p01", "string[]")
  .addParamWithType("p02", "number")
  .addParamWithType("p03", ["boolean", "undefined"])
  .addParamWithType("p04", "boolean | undefined")
  .addParamWithType("p05", "Date", true)
  .setParamWithInitValue("p01", "[]")
  .setParamWithInitValue("p02", "25258")
  .setParamWithInitValue("p03", (_, nullable) => (nullable ? ts.createFalse() : ts.createTrue()))
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
