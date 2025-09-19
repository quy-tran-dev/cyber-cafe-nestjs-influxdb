import { Module } from "@nestjs/common";
import { SimulationController } from "./simulation.controller";
import { SimulationService } from "./simulation.service";
import { GamePerformanceService } from "src/game_performance/game-performance.service";

@Module({
  controllers: [SimulationController],
  providers: [SimulationService, GamePerformanceService],
})
export class SimulationModule {}
