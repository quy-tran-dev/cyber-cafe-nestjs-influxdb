import { Injectable, Logger } from '@nestjs/common';
import { InfluxDB, Point } from '@influxdata/influxdb-client';
import { MachineRecord } from 'src/common/measurement/machine/machine.record';
import { SystemMetricsField } from 'src/common/measurement/system-metrics/system-metrics.field';

@Injectable()
export class SystemMetricsService {
  private influx: InfluxDB;
  private writeApi;
    private readonly logger = new Logger(SystemMetricsService.name);
  

  constructor() {
    this.influx = new InfluxDB({
      url: process.env.INFLUX_URL!,
      token: process.env.INFLUX_TOKEN!,
    });

    this.writeApi = this.influx.getWriteApi(
      process.env.INFLUX_ORG!,
      process.env.INFLUX_BUCKET!,
    );
  }

  async recordMetrics(
    hostname: string,
    user_id: string,
    metrics: {
      cpu_usage: number;
      ram_usage: number;
      gpu: number;
      disk_io: number;
      network_io: number;
    },
  ) {
    const point = new Point('system_metrics')
      .tag('hostname', hostname)
      .tag('user_id', user_id)
      .floatField('cpu_usage', metrics.cpu_usage)
      .floatField('ram_usage', metrics.ram_usage)
      .floatField("gpu_usage", metrics.gpu)
      .floatField('disk_io', metrics.disk_io)
      .floatField('network_io', metrics.network_io);

    this.writeApi.writePoint(point);
    await this.writeApi.flush();

    return { message: `Metrics recorded for ${hostname} by ${user_id}` };
  }
}
