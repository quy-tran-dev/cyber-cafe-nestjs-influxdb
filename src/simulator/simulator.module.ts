import { Module } from "@nestjs/common";
import { SimulationController } from "./simulator.controller";
import { SimulationService } from "./simulator.service";

@Module({
  controllers: [SimulationController],
  providers: [SimulationService],
})
export class SimulatorModule {}
