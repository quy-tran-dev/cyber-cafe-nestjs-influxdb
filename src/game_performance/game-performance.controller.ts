import { Controller, Post, Body } from "@nestjs/common";
import { GamePerformanceService } from "./game-performance.service";
import { GameMode } from "src/common/measurement/game_performance/game-performance.mode";
import { Mode } from "src/common/measurement/system-metrics/mode.type";

@Controller("game-performance")
export class GamePerformanceController {
  constructor(private readonly gpService: GamePerformanceService) {}

  @Post("simulate")
  simulate(
    @Body("hostname") hostname: string,
    @Body("user_id") user_id: string,
    @Body("gameMode") gameMode: GameMode,
    @Body("systemMode") systemMode: Mode,
  ) {
    const fields = this.gpService.generateGamePerformance(gameMode, systemMode);
    this.gpService.writeGamePerformance(hostname, user_id, fields);

    return { message: "Game performance simulated", data: fields };
  }
}
