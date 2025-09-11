import { Injectable, Logger } from "@nestjs/common";
import { InfluxDB, Point } from "@influxdata/influxdb-client";
import { MachineRecord } from "src/common/measurement/machine/machine.record";
import { SystemMetricsRecord } from "src/common/measurement/system-metrics/system-metrics.record";
import { SystemMetricsField } from "src/common/measurement/system-metrics/system-metrics.field";
import { Mode } from "src/common/measurement/system-metrics/mode.type";
import { log } from "console";

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
      process.env.INFLUX_BUCKET!,
    );
  }

  start(machine: MachineRecord, mode: Mode = "normal") {
    if (this.intervals.has(machine.hostname)) {
      throw new Error(`${machine.hostname} is already running simulation`);
    }

    this.modes.set(machine.hostname, mode);

    const interval = setInterval(() => {
      this.runSimulationTick(machine, this.modes.get(machine.hostname)!);
    }, 5000);

    this.intervals.set(machine.hostname, interval);
    return {
      message: `Started simulation for ${machine.hostname} in mode ${mode}`,
    };
  }


  stop(machine: MachineRecord) {
    const interval = this.intervals.get(machine.hostname);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(machine.hostname);
      this.modes.delete(machine.hostname);

      const point = new Point("machines")
        .tag("hostname", machine.hostname)
        .tag("os", machine.os)
        .tag("location", machine.location)
        .tag("user_id", machine.user_id)
        .stringField("status", "inactive");

      this.writeApi.writePoint(point);
      this.writeApi.flush();
      return { message: `Stopped simulation for ${machine.hostname}` };
    }
    throw new Error(`${machine.hostname} is not running simulation`);
  }

  changeMode(hostname: string, mode: Mode) {
    if (!this.intervals.has(hostname)) {
      throw new Error(`${hostname} is not running simulation`);
    }
    this.modes.set(hostname, mode);
    log(`Changed ${hostname} to mode ${mode}`);
    return { message: `Changed ${hostname} to mode ${mode}` };
  }

  private runSimulationTick(machine: MachineRecord, mode: Mode) {
    const metrics = this.generateMetrics(mode);

    if (this.checkCrash(metrics)) {
      this.logger.warn(`${machine.hostname} crashed!`);
      this.stop(machine);
      return;
    }

    this.writeSystemMetrics(machine, metrics);
  }

  private writeSystemMetrics(
    machine: MachineRecord,
    metrics: SystemMetricsField,
  ) {
    const point = new Point("system_metrics")
      .tag("hostname", machine.hostname)
      .tag("user_id", machine.user_id)
      .floatField("cpu", metrics.cpu)
      .floatField("ram", metrics.ram)
      .floatField("gpu", metrics.gpu)
      .floatField("disk", metrics.disk)
      .floatField("net", metrics.net);

    this.writeApi.writePoint(point);
    this.logger.debug(`Wrote system metrics for ${machine.hostname}`);
  }

  private checkCrash(metrics?: SystemMetricsField): boolean {
  if (!metrics) return false;
  return metrics.cpu >= 100 || metrics.gpu >= 100 || metrics.ram >= 100;
}

  private generateMetrics(mode: Mode): SystemMetricsField {
    switch (mode) {
      case "normal":
        return {
          cpu: this.rand(20, 50),
          ram: this.rand(30, 60),
          gpu: this.rand(20, 40),
          disk: this.rand(30, 80),
          net: this.rand(100, 300),
        };
      case "network_lag":
        return {
          cpu: this.rand(20, 40),
          ram: this.rand(30, 50),
          gpu: this.rand(20, 40),
          disk: this.rand(30, 70),
          net: this.rand(5, 100),
        };
      case "machine_lag":
        return {
          cpu: this.rand(70, 95),
          ram: this.rand(70, 95),
          gpu: this.rand(60, 90),
          disk: this.rand(200, 300),
          net: this.rand(50, 200),
        };
      case "multi_task":
        return {
          cpu: this.rand(40, 70),
          ram: this.rand(80, 95),
          gpu: this.rand(30, 50),
          disk: this.rand(100, 200),
          net: this.rand(200, 400),
        };
      case "high_graphics":
        return {
          cpu: this.rand(60, 90),
          ram: this.rand(50, 80),
          gpu: this.rand(80, 95),
          disk: this.rand(100, 250),
          net: this.rand(300, 600),
        };
      case "crash":
        return { cpu: 100, ram: 100, gpu: 100, disk: 500, net: 1000 };
    }
  }

  private rand(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
