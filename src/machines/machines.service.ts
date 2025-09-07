import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InfluxDB, QueryApi, Point } from "@influxdata/influxdb-client";
import { SimulationService } from "src/simulator/simulator.service";

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

  async getMachines(): Promise<any[]> {
    const query = `
      from(bucket: "${process.env.INFLUX_BUCKET}")
        |> range(start: -30d)
        |> filter(fn: (r) => r._measurement == "machines")
        |> last()
    `;

    const machines: Record<string, any> = {};

    return new Promise((resolve, reject) => {
      this.queryApi.queryRows(query, {
        next: (row, tableMeta) => {
          const o = tableMeta.toObject(row);

          const key = o.hostname;
          if (!machines[key]) {
            machines[key] = {
              hostname: o.hostname,
              location: o.location,
              os: o.os,
              status: o._value,
            };
          }
        },
        error: (err) => {
          this.logger.error(`Query error: ${err}`);
          reject(err);
        },
        complete: () => {
          resolve(Object.values(machines));
        },
      });
    });
  }

  async findMachineByHostname(hostname: string) {
    const query = `
    from(bucket: "${process.env.INFLUX_BUCKET}")
      |> range(start: -30d)
      |> filter(fn: (r) => r._measurement == "machines" and r.hostname == "${hostname}")
      |> last()
  `;
    const result = await this.queryApi.collectRows(query);

    if (result.length === 0) {
      return null;
    }

    return {
      hostname,
      location: result[0].location,
      os: result[0].os,
      status: result[0]._value,
    };
  }

  async updateMachineStatus(
    hostname: string,
    status: "active" | "inactive" | "maintenance",
    user_id?: string,
  ) {
    const machine = await this.findMachineByHostname(hostname);

    if (!machine) {
      throw new NotFoundException(`Machine ${hostname} not found`);
    }

    const point = new Point("machines")
      .tag("hostname", machine.hostname)
      .tag("location", machine.location)
      .tag("os", machine.os)
      .stringField("status", status);

    if (user_id) {
      point.tag("user_id", user_id);
    }

    this.writeApi.writePoint(point);
    await this.writeApi.flush();

    if (status === "active") {
      this.simService.start(hostname, user_id ?? "guest", "normal");
    } else if (status === "inactive") {
      this.simService.stop(hostname);
    }

    return { message: `Updated ${hostname} to ${status}` };
  }

}
