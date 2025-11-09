import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { BookingService, ScheduleService, ServiceService } from '../services';
import { CreateScheduleDto, UpdateScheduleDto, CompleteBookingDto } from '../dto';
import { BookingStatus } from '@database/entities';

@ApiTags('Provider Bookings')
@Controller('api/v1/provider')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProviderBookingController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly scheduleService: ScheduleService,
    private readonly serviceService: ServiceService,
  ) {}

  // === Schedule Management ===

  @Get('schedule')
  @ApiOperation({ summary: 'Get provider schedules' })
  @ApiResponse({
    status: 200,
    description: 'Schedules retrieved successfully',
  })
  async getSchedules(@Request() req: any) {
    const schedules = await this.scheduleService.getProviderSchedules(req.user.userId);

    return {
      success: true,
      data: schedules,
    };
  }

  @Post('schedule')
  @ApiOperation({ summary: 'Create a schedule' })
  @ApiResponse({ status: 201, description: 'Schedule created successfully' })
  @ApiResponse({ status: 409, description: 'Schedule already exists' })
  async createSchedule(@Body() dto: CreateScheduleDto, @Request() req: any) {
    // Set provider_id from authenticated user
    const schedule = await this.scheduleService.createSchedule({
      ...dto,
      provider_id: req.user.userId,
    });

    return {
      success: true,
      data: schedule,
    };
  }

  @Put('schedule/:id')
  @ApiOperation({ summary: 'Update a schedule' })
  @ApiParam({ name: 'id', description: 'Schedule ID' })
  @ApiResponse({ status: 200, description: 'Schedule updated successfully' })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  async updateSchedule(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateScheduleDto) {
    const schedule = await this.scheduleService.updateSchedule(id, dto);

    return {
      success: true,
      data: schedule,
    };
  }

  // === Booking Management ===

  @Get('bookings')
  @ApiOperation({ summary: 'Get provider bookings' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: BookingStatus,
    description: 'Filter by status',
  })
  @ApiResponse({
    status: 200,
    description: 'Bookings retrieved successfully',
  })
  async getBookings(@Request() req: any, @Query('status') status?: BookingStatus) {
    const bookings = await this.bookingService.getProviderBookings(req.user.userId, status);

    return {
      success: true,
      data: bookings,
    };
  }

  @Post('bookings/:id/start')
  @ApiOperation({ summary: 'Mark booking as in progress' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({
    status: 200,
    description: 'Booking started successfully',
  })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async startBooking(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    const booking = await this.bookingService.startBooking(id, req.user.userId);

    return {
      success: true,
      data: booking,
      message: 'Booking started',
    };
  }

  @Post('bookings/:id/complete')
  @ApiOperation({ summary: 'Mark booking as completed' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({
    status: 200,
    description: 'Booking completed successfully',
  })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async completeBooking(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteBookingDto,
    @Request() req: any,
  ) {
    const booking = await this.bookingService.completeBooking(
      id,
      req.user.userId,
      dto.provider_notes,
    );

    return {
      success: true,
      data: booking,
      message: 'Booking completed',
    };
  }

  @Post('bookings/:id/no-show')
  @ApiOperation({ summary: 'Mark booking as no-show' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({
    status: 200,
    description: 'Booking marked as no-show',
  })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async markNoShow(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    const booking = await this.bookingService.markNoShow(id, req.user.userId);

    return {
      success: true,
      data: booking,
      message: 'Booking marked as no-show',
    };
  }

  // === Service Management ===

  @Get('services')
  @ApiOperation({ summary: 'Get provider services' })
  @ApiResponse({
    status: 200,
    description: 'Services retrieved successfully',
  })
  async getServices(@Request() req: any) {
    const services = await this.serviceService.getProviderServices(req.user.userId);

    return {
      success: true,
      data: services,
    };
  }
}
