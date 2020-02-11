import "jest";
import { mocked } from "ts-jest/utils";
import * as common from "../src/core/base/common";
const commonMocked = mocked(common);

test("src/core/base/common", () => {
  expect(typeof commonMocked).toBe("object");
  expect(Object.keys(commonMocked).length).toBe(0);
});
