import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: "ok",
      service: "grifres-backend",
      timestamp: new Date().toISOString(),
    };
  }
}
