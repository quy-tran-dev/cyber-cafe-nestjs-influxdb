import { Injectable } from '@nestjs/common';
import { InfluxDB, Point } from '@influxdata/influxdb-client';

@Injectable()
export class SimulatorService {
  private influx;

  constructor() {
    this.influx = new InfluxDB({
      url: process.env.INFLUX_URL!,
      token: process.env.INFLUX_TOKEN!,
    }).getWriteApi(process.env.INFLUX_ORG!, process.env.INFLUX_BUCKET!);
  }

  async simulateAction(hostname: string, action: string) {
    const point = new Point('game_performance')
      .tag('hostname', hostname)
      .tag('game_title', action)
      .intField('fps', Math.floor(Math.random() * 60) + 30)
      .floatField('cpu_temp_c', 40 + Math.random() * 20)
      .floatField('gpu_temp_c', 50 + Math.random() * 30)
      .intField('ping_ms', 20 + Math.floor(Math.random() * 80))
      .floatField('cpu_load_percent', Math.random() * 100)
      .floatField('gpu_load_percent', Math.random() * 100);

    this.influx.writePoint(point);
    await this.influx.flush();
    return { status: 'ok', action, hostname };
  }
}
