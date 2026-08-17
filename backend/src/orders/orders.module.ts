import { Module } from '@nestjs/common';
import { OperationLogsModule } from '../operation-logs/operation-logs.module';
import { ClientOrdersController, OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({ imports: [OperationLogsModule], controllers: [OrdersController, ClientOrdersController], providers: [OrdersService] })
export class OrdersModule {}
