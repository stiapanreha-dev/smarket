import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../database/entities/user.entity';
import { Merchant } from '../../../database/entities/merchant.entity';
import { OrderLineItem } from '../../../database/entities/order-line-item.entity';
import { OrderService } from '../services/order.service';
import { TransitionLineItemDto } from '../dto/transition-line-item.dto';
import { AddShippingInfoDto } from '../dto/add-shipping-info.dto';
import { AuthenticatedRequest } from '../../booking/interfaces/authenticated-request.interface';

@ApiTags('Merchant Orders')
@Controller('api/v1/merchant/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MERCHANT)
@ApiBearerAuth()
export class MerchantOrderController {
  constructor(
    private readonly orderService: OrderService,
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
    @InjectRepository(OrderLineItem)
    private readonly lineItemRepository: Repository<OrderLineItem>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get merchant orders' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  async getMerchantOrders(@Request() req: AuthenticatedRequest) {
    const merchant = await this.getMerchantByUserId(req.user.id);

    // Get all line items for this merchant
    const lineItems = await this.lineItemRepository.find({
      where: { merchant_id: merchant.id },
      relations: ['order', 'product'],
      order: { created_at: 'DESC' },
    });

    // Group by order
    const orderMap = new Map();
    for (const item of lineItems) {
      const orderId = item.order_id;
      if (!orderMap.has(orderId)) {
        orderMap.set(orderId, {
          order: item.order,
          items: [],
        });
      }
      orderMap.get(orderId).items.push(item);
    }

    const orders = Array.from(orderMap.values());

    return {
      success: true,
      data: orders,
    };
  }

  @Get(':orderId/items')
  @ApiOperation({ summary: 'Get merchant items in order' })
  @ApiParam({ name: 'orderId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Items retrieved successfully' })
  async getMerchantOrderItems(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const merchant = await this.getMerchantByUserId(req.user.id);

    const items = await this.lineItemRepository.find({
      where: {
        order_id: orderId,
        merchant_id: merchant.id,
      },
      relations: ['order', 'product'],
    });

    if (items.length === 0) {
      throw new ForbiddenException('No items found for this merchant in this order');
    }

    return {
      success: true,
      data: items,
    };
  }

  @Post(':orderId/items/:itemId/transition')
  @ApiOperation({ summary: 'Update line item status' })
  @ApiParam({ name: 'orderId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'itemId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  async transitionLineItem(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() transitionDto: TransitionLineItemDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const merchant = await this.getMerchantByUserId(req.user.id);

    // Verify merchant owns this item
    await this.verifyMerchantOwnership(itemId, merchant.id);

    const updatedItem = await this.orderService.updateLineItemStatus(
      orderId,
      itemId,
      transitionDto.to_status,
      {
        reason: transitionDto.reason,
        user_id: req.user.id,
        ...transitionDto.metadata,
      },
    );

    return {
      success: true,
      data: updatedItem,
      message: 'Line item status updated successfully',
    };
  }

  @Post(':orderId/items/:itemId/fulfill')
  @ApiOperation({ summary: 'Mark item as preparing/fulfilled' })
  @ApiParam({ name: 'orderId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'itemId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Item marked as fulfilled' })
  async fulfillItem(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const merchant = await this.getMerchantByUserId(req.user.id);
    await this.verifyMerchantOwnership(itemId, merchant.id);

    const item = await this.lineItemRepository.findOne({
      where: { id: itemId },
    });

    // Determine next status based on item type
    let nextStatus: string = 'preparing'; // default
    if (item) {
      if (item.type === 'physical') {
        nextStatus = item.status === 'payment_confirmed' ? 'preparing' : 'ready_to_ship';
      } else if (item.type === 'digital') {
        nextStatus = 'access_granted';
      } else if (item.type === 'service') {
        nextStatus = 'booking_confirmed';
      }
    }

    const updatedItem = await this.orderService.updateLineItemStatus(orderId, itemId, nextStatus, {
      reason: 'Merchant fulfilled item',
      user_id: req.user.id,
    });

    return {
      success: true,
      data: updatedItem,
      message: 'Item fulfilled successfully',
    };
  }

  @Post(':orderId/items/:itemId/ship')
  @ApiOperation({ summary: 'Mark item as shipped and add tracking info' })
  @ApiParam({ name: 'orderId', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'itemId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Item marked as shipped' })
  async shipItem(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() shippingDto: AddShippingInfoDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const merchant = await this.getMerchantByUserId(req.user.id);
    await this.verifyMerchantOwnership(itemId, merchant.id);

    const updatedItem = await this.orderService.updateLineItemStatus(orderId, itemId, 'shipped', {
      reason: 'Item shipped',
      user_id: req.user.id,
      tracking_number: shippingDto.tracking_number,
      carrier: shippingDto.carrier,
      estimated_delivery: shippingDto.estimated_delivery,
    });

    return {
      success: true,
      data: updatedItem,
      message: 'Item shipped successfully',
    };
  }

  /**
   * Helper methods
   */
  private async getMerchantByUserId(userId: string): Promise<Merchant> {
    const merchant = await this.merchantRepository.findOne({
      where: { owner_id: userId },
    });

    if (!merchant) {
      throw new ForbiddenException('Merchant profile not found');
    }

    return merchant;
  }

  private async verifyMerchantOwnership(itemId: string, merchantId: string): Promise<void> {
    const item = await this.lineItemRepository.findOne({
      where: { id: itemId, merchant_id: merchantId },
    });

    if (!item) {
      throw new ForbiddenException('Item not found or not owned by merchant');
    }
  }
}
