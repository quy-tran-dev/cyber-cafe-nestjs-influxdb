import { Controller, Post, Body } from '@nestjs/common';
import { SystemMetricsService } from './system-metrics.service';

@Controller('system-metrics')
export class SystemMetricsController {
  constructor(private readonly systemMetricsService: SystemMetricsService) {}

  @Post()
  async record(
    @Body()
    body: {
      hostname: string;
      user_id: string;
      cpu_usage: number;
      ram_usage: number;
      disk_io: number;
      gpu: number;
      network_io: number;
    },
  ) {
    return this.systemMetricsService.recordMetrics(body.hostname, body.user_id, {
      cpu_usage: body.cpu_usage,
      ram_usage: body.ram_usage,
      disk_io: body.disk_io,
      gpu: body.gpu,
      network_io: body.network_io,
    });
  }
}
