// src/game-performance/game-performance.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { InfluxDB, Point } from "@influxdata/influxdb-client";
import { GameMode } from "src/common/measurement/game_performance/game-performance.mode";
import { Mode } from "src/common/measurement/system-metrics/mode.type";
import { GamePerformanceField } from "src/common/measurement/game_performance/game-performance.field";

@Injectable()
export class GamePerformanceService {
  private readonly logger = new Logger(GamePerformanceService.name);
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

  generateGamePerformance(gameMode: GameMode, systemMode: Mode): GamePerformanceField {
    const base = {
      moba: { fps: [70, 90], ping: [30, 60], temp_cpu: [60, 75], temp_gpu: [65, 80] },
      fps:  { fps: [120, 200], ping: [20, 50], temp_cpu: [65, 80], temp_gpu: [70, 85] },
      aaa:  { fps: [40, 70], ping: [40, 80], temp_cpu: [70, 90], temp_gpu: [75, 95] },
    };

    const modifiers = {
      normal:      { fps: 1.0, ping: 1.0, cpu: 0, gpu: 0 },
      network_lag: { fps: 0.9, ping: 2.0, cpu: 0, gpu: 0 },
      machine_lag: { fps: 0.6, ping: 1.2, cpu: +8, gpu: +8 },
      multi_task:  { fps: 0.7, ping: 1.3, cpu: +8,  gpu: +5 },
      high_graphics: { fps: 0.7, ping: 1.0, cpu: +3,  gpu: +10 },
      crash: { fps: 0.0, ping: 0.0, cpu: 0, gpu: 0 },
    };

    const b = base[gameMode];
    const m = modifiers[systemMode] || modifiers["normal"];

    return {
      fps: this.rand(b.fps[0], b.fps[1]) * m.fps,
      ping: this.rand(b.ping[0], b.ping[1]) * m.ping,
      temp_cpu: this.rand(b.temp_cpu[0], b.temp_cpu[1]) + m.cpu,
      temp_gpu: this.rand(b.temp_gpu[0], b.temp_gpu[1]) + m.gpu,
    };
  }

  writeGamePerformance(hostname: string, user_id: string, fields: GamePerformanceField) {
    const point = new Point("game_performance")
      .tag("hostname", hostname)
      .tag("user_id", user_id)
      .floatField("fps", fields.fps)
      .floatField("ping", fields.ping)
      .floatField("temp_cpu", fields.temp_cpu)
      .floatField("temp_gpu", fields.temp_gpu);

    this.writeApi.writePoint(point);
    this.logger.debug(`Game performance written for ${hostname}`);
  }

  private rand(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
