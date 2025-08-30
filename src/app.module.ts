import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { SimulatorModule } from "./simulator/simulator.module";
import { MachinesModule } from "./machines/machine.module";

@Module({
  imports: [SimulatorModule, MachinesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
