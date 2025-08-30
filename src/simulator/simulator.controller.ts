import { Controller, Post, Body } from '@nestjs/common';
import { SimulatorService } from './simulator.service';

@Controller('simulate')
export class SimulatorController {
  constructor(private readonly simulatorService: SimulatorService) {}

  @Post('action')
  async simulate(@Body() body: { hostname: string; action: string }) {
    return this.simulatorService.simulateAction(body.hostname, body.action);
  }
}
