import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InfluxDB, QueryApi, Point } from "@influxdata/influxdb-client";
import { SimulationService } from "src/simulation/simulation.service";
import { MachineRecord } from "src/common/measurement/machine/machine.record";

@Injectable()
export class MachinesService {
  private readonly logger = new Logger(MachinesService.name);
  private writeApi;
  private queryApi;

  constructor(private readonly simService: SimulationService) {
    const influx = new InfluxDB({
      url: process.env.INFLUX_URL!,
      token: process.env.INFLUX_TOKEN!,
    });

    this.writeApi = influx.getWriteApi(
      process.env.INFLUX_ORG!,
      process.env.INFLUX_BUCKET!,
    );
    this.queryApi = influx.getQueryApi(process.env.INFLUX_ORG!);
  }

  async getMachines(): Promise<MachineRecord[]> {
    const query = `
      from(bucket: "${process.env.INFLUX_BUCKET}")
        |> range(start: -30d)
        |> filter(fn: (r) => r._measurement == "machines")
        |> last()
    `;

    const machines: Record<string, MachineRecord> = {};

    return new Promise((resolve, reject) => {
      this.queryApi.queryRows(query, {
        next: (row, tableMeta) => {
          const o = tableMeta.toObject(row);
          machines[o.hostname] = {
            hostname: o.hostname,
            os: o.os,
            location: o.location,
            user_id: o.user_id,
            status: o._value,
          };
        },
        error: (err) => {
          this.logger.error(`Query error: ${err}`);
          reject(err);
        },
        complete: () => resolve(Object.values(machines)),
      });
    });
  }

  async findMachineByHostname(hostname: string): Promise<MachineRecord | null> {
    const query = `
      from(bucket: "${process.env.INFLUX_BUCKET}")
        |> range(start: -30d)
        |> filter(fn: (r) => r._measurement == "machines" and r.hostname == "${hostname}")
        |> last()
    `;
    const result = await this.queryApi.collectRows(query);

    if (result.length === 0) return null;

    return {
      hostname,
      os: result[0].os,
      location: result[0].location,
      user_id: result[0].user_id,
      status: result[0]._value,
    };
  }

  async updateMachineStatus(
    hostname: string,
    status: "active" | "inactive" | "maintenance",
    user_id?: string,
  ) {
    const machine = await this.findMachineByHostname(hostname);
    if (!machine) throw new NotFoundException(`Machine ${hostname} not found`);

    const updatedMachine: MachineRecord = {
      ...machine,
      status,
      user_id: user_id ?? machine.user_id,
    };

    const point = new Point("machines")
      .tag("hostname", updatedMachine.hostname)
      .tag("os", updatedMachine.os)
      .tag("location", updatedMachine.location)
      .tag("user_id", updatedMachine.user_id)
      .stringField("status", status);

    this.writeApi.writePoint(point);
    await this.writeApi.flush();

    if (status === "active") {
      this.simService.start(updatedMachine, "normal");
    } else if (status === "inactive") {
      this.simService.stop(updatedMachine);
    }

    return { message: `Updated ${hostname} to ${status}` };
  }

  async changeSimulationMode(hostname: string, mode: string) {
    const machine = await this.findMachineByHostname(hostname);
    if (!machine) throw new NotFoundException(`Machine ${hostname} not found`);

    return this.simService.changeMode(hostname, mode as any);
  }
}
