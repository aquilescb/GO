import { Module } from "@nestjs/common";
import { AssistantModule } from "./assistant/assistant.module";

@Module({
  imports: [AssistantModule],
})
export class AppModule {}
