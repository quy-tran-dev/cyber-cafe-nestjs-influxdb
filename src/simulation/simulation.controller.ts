import { Controller, Post, Body } from "@nestjs/common";
import { SimulationService } from "./simulation.service";

@Controller("simulation")
export class SimulationController {
  constructor(private readonly simService: SimulationService) {}


}
