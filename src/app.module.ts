import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { SimulatorModule } from "./simulator/simulator.module";
import { MachinesModule } from "./machines/machine.module";
import { SeederModule } from "./seeder/seeder.module";

@Module({
  imports: [SimulatorModule, MachinesModule, SeederModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
