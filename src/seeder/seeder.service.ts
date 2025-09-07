import { Injectable, Logger } from '@nestjs/common';
import { InfluxDB, Point } from '@influxdata/influxdb-client';
import { machines } from './machines-data';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);
  private influx: InfluxDB;

  constructor() {
    this.influx = new InfluxDB({
      url: process.env.INFLUX_URL!,
      token: process.env.INFLUX_TOKEN!,
    });
  }

  async seedMachines() {
    const writeApi = this.influx.getWriteApi(
      process.env.INFLUX_ORG!,
      process.env.INFLUX_BUCKET!,
      'ns',
    );

    machines.forEach((m) => {
      const point = new Point('machines')
        .tag('hostname', m.hostname)
        .tag('location', m.location)
        .tag('os', m.os)
        .stringField('status', m.status);

      writeApi.writePoint(point);
    });

    await writeApi.close();
    this.logger.log('Seeded initial machine metadata');
  }

  
}
