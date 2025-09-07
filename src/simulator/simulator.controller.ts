import { Controller, Post, Body } from "@nestjs/common";
import { SimulationService } from "./simulator.service";

@Controller("simulation")
export class SimulationController {
  constructor(private readonly simService: SimulationService) {}

  @Post("start")
  start(@Body() body: { hostname: string; user_id: string; mode?: any }) {
    return this.simService.start(body.hostname, body.user_id, body.mode);
  }

  @Post("change-mode")
  changeMode(@Body() body: { hostname: string; mode: any }) {
    return this.simService.changeMode(body.hostname, body.mode);
  }

  @Post("stop")
  stop(@Body() body: { hostname: string }) {
    return this.simService.stop(body.hostname);
  }
}
