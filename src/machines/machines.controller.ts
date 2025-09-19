import { Controller, Get, Param, Patch, Body, Query } from "@nestjs/common";
import { MachinesService } from "./machines.service";
import { Mode } from "src/common/measurement/system-metrics/mode.type";
import { GameMode } from "src/common/measurement/game_performance/game-performance.mode";

@Controller("machines")
export class MachinesController {
  constructor(private readonly machinesService: MachinesService) {}

  @Get()
  async getMachines() {
    return this.machinesService.getMachines();
  }

  @Get(":hostname")
  async getMachine(@Param("hostname") hostname: string) {
    return this.machinesService.findMachineByHostname(hostname);
  }

  @Patch(":hostname/status")
  async updateStatus(
    @Param("hostname") hostname: string,
    @Body("status") status: "active" | "inactive" | "maintenance",
    @Body("user_id") userId?: string,
  ) {
    return this.machinesService.updateMachineStatus(hostname, status, userId);
  }

  @Patch(":hostname/mode")
  async updateMode(
    @Param("hostname") hostname: string,
    @Body("mode") mode: Mode,
    @Body("game_mode") gameMode: GameMode,
  ) {
    return this.machinesService.changeSimulationMode(hostname, mode, gameMode);
  }
}
