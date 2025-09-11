import { Module } from '@nestjs/common';
import { SystemMetricsService } from './system-metrics.service';
import { SystemMetricsController } from './system-metrics.controller';

@Module({
  providers: [SystemMetricsService],
  controllers: [SystemMetricsController],
})
export class SystemMetricsModule {}
