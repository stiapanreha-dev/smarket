import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { OrderService } from '../services/order.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { GetOrdersDto } from '../dto/get-orders.dto';
import { CancelOrderDto } from '../dto/cancel-order.dto';
import { AuthenticatedRequest } from '../../booking/interfaces/authenticated-request.interface';

@ApiTags('Orders')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create order from checkout session' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid checkout session' })
  @ApiResponse({ status: 404, description: 'Checkout session not found' })
  async createOrder(@Body() createOrderDto: CreateOrderDto, @Request() req: AuthenticatedRequest) {
    const order = await this.orderService.createOrderFromCheckout(
      createOrderDto.checkout_session_id,
      createOrderDto.payment_intent_id,
    );

    return {
      success: true,
      data: order,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user orders' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  async getUserOrders(@Query() query: GetOrdersDto, @Request() req: AuthenticatedRequest) {
    const result = await this.orderService.getUserOrders(req.user.id, {
      page: query.page,
      limit: query.limit,
      status: query.status,
    });

    return {
      success: true,
      data: result.orders,
      meta: {
        page: result.page,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  @Get(':orderNumber')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order by order number' })
  @ApiParam({ name: 'orderNumber', example: 'ORD-12345-ABC' })
  @ApiResponse({ status: 200, description: 'Order found' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrder(@Param('orderNumber') orderNumber: string, @Request() req: AuthenticatedRequest) {
    const order = await this.orderService.getOrderByNumber(orderNumber);

    // Verify ownership
    if (order.user_id !== req.user.id) {
      throw new ForbiddenException('You do not have access to this order');
    }

    return {
      success: true,
      data: order,
    };
  }

  @Post(':orderId/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel order' })
  @ApiParam({ name: 'orderId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Order cannot be cancelled' })
  async cancelOrder(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() cancelDto: CancelOrderDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const order = await this.orderService.getOrderById(orderId);

    // Verify ownership
    if (order.user_id !== req.user.id) {
      throw new ForbiddenException('You do not have access to this order');
    }

    const cancelledOrder = await this.orderService.cancelOrder(
      orderId,
      cancelDto.reason,
      req.user.id,
    );

    return {
      success: true,
      data: cancelledOrder,
      message: 'Order cancelled successfully',
    };
  }

  @Get(':orderNumber/track')
  @ApiOperation({ summary: 'Track order (public endpoint for guest orders)' })
  @ApiParam({ name: 'orderNumber', example: 'ORD-12345-ABC' })
  @ApiResponse({ status: 200, description: 'Order tracking info' })
  async trackOrder(@Param('orderNumber') orderNumber: string, @Query('email') email?: string) {
    const order = await this.orderService.getOrderByNumber(orderNumber);

    // For guest orders, verify email
    if (!order.user_id && order.guest_email !== email) {
      throw new ForbiddenException('Invalid email for this order');
    }

    return {
      success: true,
      data: {
        order_number: order.order_number,
        status: order.status,
        created_at: order.created_at,
        line_items: order.line_items.map((item) => ({
          product_name: item.product_name,
          quantity: item.quantity,
          status: item.status,
          tracking:
            item.type === 'physical'
              ? {
                  tracking_number: (item.fulfillment_data as any)?.tracking_number,
                  carrier: (item.fulfillment_data as any)?.carrier,
                  estimated_delivery: (item.fulfillment_data as any)?.estimated_delivery,
                }
              : null,
        })),
      },
    };
  }
}
