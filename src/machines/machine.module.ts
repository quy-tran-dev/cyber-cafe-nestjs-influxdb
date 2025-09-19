import { Module } from '@nestjs/common';
import { MachinesController } from './machines.controller';
import { MachinesService } from './machines.service';
import { SimulationService } from 'src/simulation/simulation.service';
import { GamePerformanceService } from 'src/game_performance/game-performance.service';

@Module({
  controllers: [MachinesController],
  providers: [MachinesService, SimulationService, GamePerformanceService],
})
export class MachinesModule {}
