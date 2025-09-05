import { Controller, Get } from '@nestjs/common';
import { SeederService } from './seeder.service';

@Controller('seeder')
export class SeederController {
  constructor(private readonly seederService: SeederService) {}

  @Get('machines')
  async seedMachines() {
    await this.seederService.seedMachines();
    return { message: 'Initial machines seeded' };
  }
}
