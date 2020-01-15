import ts from "typescript";
import prettier from "prettier";
import { FunctionGenerator, ImportGenerator } from "../src/core/typescript/index";

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
  .setExportType(true, true)
  .pushParam("p0")
  .pushParam({ name: "p1", type: "string[]", initValue: "[]" })
  .pushParam({ name: "p2", type: "number", initValue: "25258" })
  .pushParam({ name: "p2_01", type: "string", initValue: '"sdfsdfsd"' })
  .pushParam({
    name: "p3",
    type: ["boolean", "undefined"],
    initValue: types => (types.includes("undefined") ? ts.createIdentifier("void 0") : ts.createTrue()),
  })
  .pushParam({ name: "p4", type: "boolean | undefined", initValue: "true" })
  .pushParam({ name: "p5", type: "Date", nullable: true })
  .pushParam({ initValue: "{}", destruct: ["a", "b", "c"] })
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

console.log(prettier.format(result, { parser: "typescript", printWidth: 100 }));
