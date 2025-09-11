import { Module } from '@nestjs/common';
import { MachinesController } from './machines.controller';
import { MachinesService } from './machines.service';
import { SimulationService } from 'src/simulation/simulation.service';

@Module({
  controllers: [MachinesController],
  providers: [MachinesService, SimulationService],
})
export class MachinesModule {}
