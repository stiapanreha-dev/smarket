import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TerminusModule } from '@nestjs/terminus';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller';
import { AuthModule } from '@modules/auth/auth.module';
import { UserModule } from '@modules/user/user.module';
import { CatalogModule } from '@modules/catalog/catalog.module';
import { InventoryModule } from '@modules/inventory/inventory.module';
import { BookingModule } from '@modules/booking/booking.module';
import { OrdersModule } from '@modules/orders/orders.module';
import { PaymentModule } from '@modules/payment/payment.module';
import { NotificationModule } from '@modules/notification/notification.module';
import { CartModule } from '@modules/cart/cart.module';
import { CheckoutModule } from '@modules/checkout/checkout.module';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests per TTL
      },
    ]),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'snailmarket'),
        password: configService.get('DB_PASSWORD', 'snailmarket_password'),
        database: configService.get('DB_DATABASE', 'snailmarket'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),

    // Health checks
    TerminusModule,

    // Business modules
    AuthModule,
    UserModule,
    CatalogModule,
    CartModule,
    CheckoutModule,
    InventoryModule,
    BookingModule,
    OrdersModule,
    PaymentModule,
    NotificationModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
