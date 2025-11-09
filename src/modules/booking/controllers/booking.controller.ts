import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { BookingService, ServiceService, SlotAvailabilityService } from '../services';
import {
  CreateBookingDto,
  CancelBookingDto,
  RescheduleBookingDto,
  GetAvailableSlotsDto,
} from '../dto';
import { parseISO } from 'date-fns';

@ApiTags('Bookings')
@Controller('api/v1/bookings')
export class BookingController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly serviceService: ServiceService,
    private readonly slotAvailabilityService: SlotAvailabilityService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiResponse({ status: 201, description: 'Booking created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @ApiResponse({ status: 409, description: 'Slot not available' })
  async createBooking(@Body() dto: CreateBookingDto, @Request() req: any) {
    const booking = await this.bookingService.createBooking(req.user.userId, dto);

    return {
      success: true,
      data: booking,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user bookings' })
  @ApiResponse({ status: 200, description: 'Bookings retrieved successfully' })
  async getUserBookings(@Request() req: any) {
    const bookings = await this.bookingService.getCustomerBookings(req.user.userId);

    return {
      success: true,
      data: bookings,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get booking by ID' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'Booking retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async getBooking(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    const booking = await this.bookingService.getBooking(id, req.user.userId);

    return {
      success: true,
      data: booking,
    };
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a booking' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({ status: 200, description: 'Booking cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Cannot cancel booking' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async cancelBooking(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelBookingDto,
    @Request() req: any,
  ) {
    const booking = await this.bookingService.cancelBooking(id, req.user.userId, dto);

    return {
      success: true,
      data: booking,
      message: 'Booking cancelled successfully',
    };
  }

  @Post(':id/reschedule')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reschedule a booking' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({
    status: 200,
    description: 'Booking rescheduled successfully',
  })
  @ApiResponse({ status: 400, description: 'Cannot reschedule booking' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async rescheduleBooking(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RescheduleBookingDto,
    @Request() req: any,
  ) {
    // Reschedule = cancel + create new
    // First cancel the old booking
    await this.bookingService.cancelBooking(id, req.user.userId, {
      reason: 'Rescheduled to new time',
    });

    // Get original booking details
    const oldBooking = await this.bookingService.getBooking(id);

    // Create new booking
    const newBooking = await this.bookingService.createBooking(
      req.user.userId,
      {
        service_id: oldBooking.service_id,
        provider_id: oldBooking.provider_id,
        start_at: dto.new_start_at,
        timezone: dto.timezone || oldBooking.timezone,
        customer_notes: oldBooking.customer_notes,
      },
      oldBooking.order_line_item_id,
    );

    return {
      success: true,
      data: newBooking,
      message: 'Booking rescheduled successfully',
    };
  }
}
