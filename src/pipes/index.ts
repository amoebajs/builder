import { Module } from "../decorators";
import { AddButtonPipe } from "./add-button.pipe";

@Module({
  name: "ambjs_common_pipe_module",
  displayName: "基础管道模块",
  pipes: [AddButtonPipe]
})
export class CommonPipeModule {}
