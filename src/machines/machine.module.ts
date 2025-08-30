import { Module } from '@nestjs/common';
import { MachinesController } from './machines.controller';

@Module({
  controllers: [MachinesController],
  providers: [MachinesController],
})
export class MachinesModule {}
