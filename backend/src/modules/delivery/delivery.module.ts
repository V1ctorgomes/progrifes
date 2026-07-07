import { Module, forwardRef } from "@nestjs/common";
import { DeliveryPersonController } from "./delivery-person.controller";
import { DeliveryPersonRepository } from "./delivery-person.repository";
import { DeliveryPersonService } from "./delivery-person.service";
import { DeliverySettingsController } from "./delivery-settings.controller";
import { DeliverySettingsService } from "./delivery-settings.service";
import { DeliveryTrackingController } from "./delivery-tracking.controller";
import { DeliveryTrackingRepository } from "./delivery-tracking.repository";
import { DeliveryTrackingService } from "./delivery-tracking.service";
import { NeighborhoodController } from "./neighborhood.controller";
import { NeighborhoodRepository } from "./neighborhood.repository";
import { NeighborhoodService } from "./neighborhood.service";
import { OrdersModule } from "../orders/orders.module";

@Module({
  imports: [forwardRef(() => OrdersModule)],
  controllers: [
    DeliverySettingsController,
    NeighborhoodController,
    DeliveryPersonController,
    DeliveryTrackingController,
  ],
  providers: [
    DeliverySettingsService,
    NeighborhoodService,
    NeighborhoodRepository,
    DeliveryPersonService,
    DeliveryPersonRepository,
    DeliveryTrackingService,
    DeliveryTrackingRepository,
  ],
  exports: [
    DeliverySettingsService,
    NeighborhoodService,
    DeliveryPersonService,
    DeliveryTrackingService,
  ],
})
export class DeliveryModule {}
