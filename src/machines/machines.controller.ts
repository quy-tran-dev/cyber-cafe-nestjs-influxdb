import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { MachinesService } from './machines.service';

@Controller('machines')
export class MachinesController {
  constructor(private readonly machinesService: MachinesService) {}

  @Get()
  getAll() {
    return this.machinesService.getAll();
  }

  @Post(':id/start')
  startMachine(@Param('id') id: string) {
    return this.machinesService.startMachine(id);
  }

  @Post(':id/stop')
  stopMachine(@Param('id') id: string) {
    return this.machinesService.stopMachine(id);
  }

  @Post(':id/play/:game')
  playGame(@Param('id') id: string, @Param('game') game: string) {
    return this.machinesService.playGame(id, game);
  }

  @Post(':id/download')
  download(@Param('id') id: string, @Body() body: { file: string }) {
    return this.machinesService.download(id, body.file);
  }
}
