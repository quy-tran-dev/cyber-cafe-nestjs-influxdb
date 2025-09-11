import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { MachinesModule } from "./machines/machine.module";
import { SeederModule } from "./seeder/seeder.module";
import { SimulationModule } from "./simulation/simulation.module";

@Module({
  imports: [SimulationModule, MachinesModule, SeederModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
