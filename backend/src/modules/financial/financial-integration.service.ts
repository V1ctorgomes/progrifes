import { Injectable } from "@nestjs/common";
import { FinancialRepository } from "./financial.repository";

@Injectable()
export class FinancialIntegrationService {
  constructor(private readonly repository: FinancialRepository) {}
}
