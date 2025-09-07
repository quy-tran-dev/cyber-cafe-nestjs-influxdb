import { Injectable, Logger } from "@nestjs/common";
import { InfluxDB, Point } from "@influxdata/influxdb-client";

type Mode = "normal" | "network_lag" | "machine_lag";

@Injectable()
export class SimulationService {
  private readonly logger = new Logger(SimulationService.name);
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private modes: Map<string, Mode> = new Map();

  private influx: InfluxDB;
  private writeApi;

  constructor() {
    this.influx = new InfluxDB({
      url: process.env.INFLUX_URL!,
      token: process.env.INFLUX_TOKEN!,
    });

    this.writeApi = this.influx.getWriteApi(
      process.env.INFLUX_ORG!,
      process.env.INFLUX_BUCKET!
    );
  }

  start(hostname: string, userId: string, mode: Mode = "normal") {
    if (this.intervals.has(hostname)) {
      throw new Error(`${hostname} is already running simulation`);
    }

    this.modes.set(hostname, mode);

    const interval = setInterval(() => {
      const metrics = this.generateMetrics(mode);

      const point = new Point("system_metrics")
        .tag("hostname", hostname)
        .tag("user_id", userId)
        .floatField("cpu_usage", metrics.cpu)
        .floatField("ram_usage", metrics.ram)
        .floatField("disk_io", metrics.disk)
        .floatField("network_io", metrics.net);

      this.writeApi.writePoint(point);
      this.logger.debug(`Wrote metrics for ${hostname} in mode ${mode}`);
    }, 5000);

    this.intervals.set(hostname, interval);
    return { message: `Started simulation for ${hostname} in mode ${mode}` };
  }

  changeMode(hostname: string, mode: Mode) {
    if (!this.intervals.has(hostname)) {
      throw new Error(`${hostname} is not running simulation`);
    }
    this.modes.set(hostname, mode);
    return { message: `Changed ${hostname} to mode ${mode}` };
  }

  stop(hostname: string) {
    const interval = this.intervals.get(hostname);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(hostname);
      this.modes.delete(hostname);
      return { message: `Stopped simulation for ${hostname}` };
    }
    throw new Error(`${hostname} is not running simulation`);
  }

  private generateMetrics(mode: Mode) {
    switch (mode) {
      case "normal":
        return {
          cpu: this.rand(20, 50),
          ram: this.rand(30, 60),
          disk: this.rand(50, 150),
          net: this.rand(100, 300),
        };
      case "network_lag":
        return {
          cpu: this.rand(20, 40),
          ram: this.rand(30, 50),
          disk: this.rand(50, 120),
          net: this.rand(500, 1000),
        };
      case "machine_lag":
        return {
          cpu: this.rand(70, 95),
          ram: this.rand(70, 95),
          disk: this.rand(200, 400),
          net: this.rand(50, 200),
        };
    }
  }

  private rand(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
