import { Controller, Get, Param, Post } from "@nestjs/common";
import { MachinesService } from "./machines.service";

@Controller("machines")
export class MachinesController {
  constructor(private readonly machinesService: MachinesService) {}

  @Get()
  async findAll() {
    return this.machinesService.getMachines();
  }

  @Post(":id/start")
  async start(@Param("id") hostname: string) {
    return this.machinesService.updateMachineStatus(hostname, "active");
  }

  @Post(":id/stop")
  async stop(@Param("id") hostname: string) {
    return this.machinesService.updateMachineStatus(hostname, "inactive");
  }

  @Post(":id/maintenance")
  async maintenance(@Param("id") hostname: string) {
    return this.machinesService.updateMachineStatus(hostname, "maintenance");
  }
}
