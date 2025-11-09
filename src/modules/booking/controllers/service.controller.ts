import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
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
import { ServiceService, SlotAvailabilityService } from '../services';
import { CreateServiceDto, UpdateServiceDto, GetAvailableSlotsDto } from '../dto';
import { parseISO } from 'date-fns';

@ApiTags('Services')
@Controller('api/v1/services')
export class ServiceController {
  constructor(
    private readonly serviceService: ServiceService,
    private readonly slotAvailabilityService: SlotAvailabilityService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all active services' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiResponse({ status: 200, description: 'Services retrieved successfully' })
  async getServices(@Query('category') category?: string) {
    const services = await this.serviceService.getActiveServices(category);

    return {
      success: true,
      data: services,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service by ID' })
  @ApiParam({ name: 'id', description: 'Service ID' })
  @ApiResponse({ status: 200, description: 'Service retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async getService(@Param('id', ParseUUIDPipe) id: string) {
    const service = await this.serviceService.getService(id);

    return {
      success: true,
      data: service,
    };
  }

  @Get(':id/available-slots')
  @ApiOperation({ summary: 'Get available time slots for a service' })
  @ApiParam({ name: 'id', description: 'Service ID' })
  @ApiQuery({ name: 'date', description: 'Date (YYYY-MM-DD)', example: '2024-07-15' })
  @ApiQuery({ name: 'provider_id', required: false, description: 'Provider ID' })
  @ApiResponse({
    status: 200,
    description: 'Available slots retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async getAvailableSlots(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: GetAvailableSlotsDto,
  ) {
    const date = parseISO(query.date);
    const slots = await this.slotAvailabilityService.getAvailableSlots(
      id,
      date,
      query.provider_id,
    );

    return {
      success: true,
      data: slots,
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new service' })
  @ApiResponse({ status: 201, description: 'Service created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async createService(@Body() dto: CreateServiceDto) {
    const service = await this.serviceService.createService(dto);

    return {
      success: true,
      data: service,
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a service' })
  @ApiParam({ name: 'id', description: 'Service ID' })
  @ApiResponse({ status: 200, description: 'Service updated successfully' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async updateService(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    const service = await this.serviceService.updateService(id, dto);

    return {
      success: true,
      data: service,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a service' })
  @ApiParam({ name: 'id', description: 'Service ID' })
  @ApiResponse({ status: 200, description: 'Service deleted successfully' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async deleteService(@Param('id', ParseUUIDPipe) id: string) {
    await this.serviceService.deleteService(id);

    return {
      success: true,
      message: 'Service deleted successfully',
    };
  }
}
