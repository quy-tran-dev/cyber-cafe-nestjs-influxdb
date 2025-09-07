import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { MachinesService } from "./machines.service";

@Controller("machines")
export class MachinesController {
  constructor(private readonly machinesService: MachinesService) {}

  @Get()
  async findAll() {
    return this.machinesService.getMachines();
  }

  @Post(":id/start")
  async start(
    @Param("id") hostname: string,
    @Body("user_id") user_id?: string
) {
    return this.machinesService.updateMachineStatus(hostname, "active", user_id);
  }

  @Post(":id/stop")
  async stop(@Param("id") hostname: string, 
    @Body("user_id") user_id?: string
) {
    return this.machinesService.updateMachineStatus(hostname, "inactive");
  }

  @Post(":id/maintenance")
  async maintenance(@Param("id") hostname: string) {
    return this.machinesService.updateMachineStatus(hostname, "maintenance");
  }

  @Patch(":hostname/status")
  updateStatus(
    @Param("hostname") hostname: string,
    @Body("status") status: "active" | "inactive" | "maintenance",
    @Body("user_id") user_id?: string,
  ) {
    return this.machinesService.updateMachineStatus(hostname, status, user_id);
  }
}
