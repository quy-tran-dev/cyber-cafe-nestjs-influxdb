import { Injectable, Logger } from "@nestjs/common";
import { InfluxDB, Point } from "@influxdata/influxdb-client";
import { MachineRecord } from "src/common/measurement/machine/machine.record";
import { SystemMetricsRecord } from "src/common/measurement/system-metrics/system-metrics.record";
import { SystemMetricsField } from "src/common/measurement/system-metrics/system-metrics.field";
import { Mode } from "src/common/measurement/system-metrics/mode.type";
import { log } from "console";
import { SystemMetricsService } from "src/system-metrics/system-metrics.service";
import { GamePerformanceService } from "src/game_performance/game-performance.service";
import { GameMode } from "src/common/measurement/game_performance/game-performance.mode";

@Injectable()
export class SimulationService {
  private readonly logger = new Logger(SimulationService.name);
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private systemModes: Map<string, Mode> = new Map();
  private gameModes: Map<string, GameMode> = new Map();

  private influx: InfluxDB;
  private writeApi;

  constructor(
    private readonly gamePerformanceService: GamePerformanceService,
  ) {
    this.influx = new InfluxDB({
      url: process.env.INFLUX_URL!,
      token: process.env.INFLUX_TOKEN!,
    });

    this.writeApi = this.influx.getWriteApi(
      process.env.INFLUX_ORG!,
      process.env.INFLUX_BUCKET!,
    );
  }

  start(
    machine: MachineRecord,
    systemMode: Mode = "normal",
    gameMode: GameMode = "non-play",
  ) {
    if (this.intervals.has(machine.hostname)) {
      throw new Error(`${machine.hostname} is already running simulation`);
    }

    this.systemModes.set(machine.hostname, systemMode);
    this.gameModes.set(machine.hostname, gameMode);

    const interval = setInterval(() => {
      this.runSimulationTick(
        machine,
        this.systemModes.get(machine.hostname)!,
        this.gameModes.get(machine.hostname)!,
      );
    }, 5000);

    this.intervals.set(machine.hostname, interval);
    return {
      message: `Started simulation for ${machine.hostname} in systemMode ${systemMode}`,
    };
  }

  stop(machine: MachineRecord) {
    const interval = this.intervals.get(machine.hostname);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(machine.hostname);
      this.systemModes.delete(machine.hostname);
      this.gameModes.delete(machine.hostname);

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

  changeMode(hostname: string, systemMode: Mode, gameMode: GameMode, machine: MachineRecord) {

    if (!this.intervals.has(hostname)) {
      this.start(machine, "normal", "non-play");
    }

    this.systemModes.set(hostname, systemMode);
    this.gameModes.set(hostname, gameMode);

    this.logger.log(`System mode for ${hostname} updated to ${systemMode}, Game mode for ${hostname} updated to ${gameMode}`);
    return { message: `System mode for ${hostname} updated to ${systemMode}, Game mode for ${hostname} updated to ${gameMode}` };
  }

  private runSimulationTick(
    machine: MachineRecord,
    systemMode: Mode,
    gameMode: GameMode,
  ) {
    const metrics = this.generateMetrics(systemMode);

    if (this.checkCrash(metrics)) {
      this.logger.warn(`${machine.hostname} crashed!`);
      this.stop(machine);
      return;
    }

    this.writeSystemMetrics(machine, metrics);

    if (gameMode !== "non-play") {
      const gameMetrics = this.gamePerformanceService.generateGamePerformance(
        gameMode,
        systemMode,
      );
      this.gamePerformanceService.writeGamePerformance(
        machine.hostname,
        machine.user_id,
        gameMetrics,
      );
    }
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

  private generateMetrics(systemMode: Mode): SystemMetricsField {
    switch (systemMode) {
      case "normal":
        return {
          cpu: this.rand(20, 50),// %
          ram: this.rand(30, 60),// %
          gpu: this.rand(20, 30),// %
          disk: this.rand(30, 40),// %
          net: this.rand(200, 300),// Mbps
        };
      case "network_lag":
        return {
          cpu: this.rand(30, 50),
          ram: this.rand(30, 60),
          gpu: this.rand(20, 40),
          disk: this.rand(30, 70),
          net: this.rand(5, 20),
        };
      case "machine_lag":
        return {
          cpu: this.rand(70, 95),
          ram: this.rand(70, 95),
          gpu: this.rand(40, 50),
          disk: this.rand(70, 90),
          net: this.rand(100, 200),
        };
      case "multi_task":
        return {
          cpu: this.rand(50, 70),
          ram: this.rand(70, 90),
          gpu: this.rand(40, 60),
          disk: this.rand(50, 70),
          net: this.rand(200, 400),
        };
      case "high_graphics":
        return {
          cpu: this.rand(70, 90),
          ram: this.rand(70, 90),
          gpu: this.rand(80, 95),
          disk: this.rand(50, 80),
          net: this.rand(300, 600),
        };
      case "crash":
        return { cpu: 100, ram: 100, gpu: 100, disk: 100, net: 1000 };
    }
  }

  private rand(min: number, max: number) {
    return Math.floor(Math.random() * (max - min)) + min;
  }
}
