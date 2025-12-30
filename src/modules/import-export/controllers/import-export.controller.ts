import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Res,
  UseInterceptors,
  UploadedFile,
  Logger,
  ParseUUIDPipe,
  BadRequestException,
  NotFoundException,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from 'express';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@database/entities/user.entity';
import { Merchant } from '@database/entities/merchant.entity';
import { AuthenticatedRequest } from '@modules/booking/interfaces/authenticated-request.interface';
import { ExportService } from '../services/export.service';
import { ImportService } from '../services/import.service';
import { AiAnalyzerService, ColumnMapping } from '../services/ai-analyzer.service';
import { ProductMatcherService } from '../services/product-matcher.service';
import { ExportProductsDto } from '../dto/export-products.dto';
import { UpdateImportItemDto, ApproveAllItemsDto } from '../dto/update-import-item.dto';
import { ImportItemStatus } from '@database/entities/import-item.entity';

@Controller('merchant/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MERCHANT)
export class ImportExportController {
  private readonly logger = new Logger(ImportExportController.name);

  constructor(
    private readonly exportService: ExportService,
    private readonly importService: ImportService,
    private readonly aiAnalyzerService: AiAnalyzerService,
    private readonly productMatcherService: ProductMatcherService,
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
  ) {}

  /**
   * Helper to get merchant ID from authenticated user
   */
  private async getMerchantId(userId: string): Promise<string> {
    const merchant = await this.merchantRepository.findOne({
      where: { owner_id: userId },
    });

    if (!merchant) {
      throw new NotFoundException(
        'Merchant profile not found. Please complete merchant registration.',
      );
    }

    return merchant.id;
  }

  /**
   * POST /merchant/products/export
   * Export products to CSV format
   */
  @Post('export')
  @HttpCode(HttpStatus.OK)
  async exportProducts(
    @Request() req: AuthenticatedRequest,
    @Body() dto: ExportProductsDto,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.log(`Export requested by user ${req.user.id}`);

    const merchantId = await this.getMerchantId(req.user.id);

    const csvContent = await this.exportService.exportToCsv(merchantId, dto);

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `products_export_${timestamp}.csv`;

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', Buffer.byteLength(csvContent, 'utf-8'));

    // Add BOM for Excel compatibility
    const bom = '\uFEFF';
    res.send(bom + csvContent);
  }

  /**
   * POST /merchant/products/import/upload
   * Upload and parse import file
   */
  @Post('import/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max
      },
      fileFilter: (req, file, callback) => {
        const allowedMimes = [
          'text/csv',
          'text/plain',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/json',
          'text/xml',
          'application/xml',
        ];
        const allowedExts = ['.csv', '.xlsx', '.xls', '.json', '.xml', '.yml'];

        const ext = file.originalname.toLowerCase().split('.').pop();
        const isAllowedExt = allowedExts.includes(`.${ext}`);
        const isAllowedMime =
          allowedMimes.includes(file.mimetype) || file.mimetype.includes('spreadsheet');

        if (isAllowedExt || isAllowedMime) {
          callback(null, true);
        } else {
          callback(
            new BadRequestException(`Unsupported file type. Allowed: ${allowedExts.join(', ')}`),
            false,
          );
        }
      },
    }),
  )
  async uploadImportFile(
    @Request() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const merchantId = await this.getMerchantId(req.user.id);

    this.logger.log(
      `Import upload: ${file.originalname} (${file.size} bytes) by user ${req.user.id}`,
    );

    const session = await this.importService.uploadAndParse(merchantId, req.user.id, file);

    return {
      session_id: session.id,
      status: session.status,
      total_rows: session.total_rows,
      file_format: session.file_format,
      analysis_result: session.analysis_result,
    };
  }

  /**
   * GET /merchant/products/import/:sessionId
   * Get import session status
   */
  @Get('import/:sessionId')
  async getImportSession(
    @Request() req: AuthenticatedRequest,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    const merchantId = await this.getMerchantId(req.user.id);

    const session = await this.importService.getSession(sessionId, merchantId);

    return {
      id: session.id,
      status: session.status,
      file_format: session.file_format,
      original_filename: session.original_filename,
      total_rows: session.total_rows,
      processed_rows: session.processed_rows,
      success_count: session.success_count,
      error_count: session.error_count,
      new_count: session.new_count,
      update_count: session.update_count,
      skip_count: session.skip_count,
      analysis_result: session.analysis_result,
      error_message: session.error_message,
      created_at: session.created_at,
      completed_at: session.completed_at,
    };
  }

  /**
   * POST /merchant/products/import/:sessionId/analyze
   * Run AI analysis on import session
   */
  @Post('import/:sessionId/analyze')
  @HttpCode(HttpStatus.OK)
  async analyzeImport(
    @Request() req: AuthenticatedRequest,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    const merchantId = await this.getMerchantId(req.user.id);

    this.logger.log(`Starting AI analysis for session ${sessionId}`);

    const session = await this.aiAnalyzerService.analyzeSession(sessionId, merchantId);

    return {
      id: session.id,
      status: session.status,
      analysis_result: session.analysis_result,
    };
  }

  /**
   * POST /merchant/products/import/:sessionId/match
   * Run product matching on import session
   */
  @Post('import/:sessionId/match')
  @HttpCode(HttpStatus.OK)
  async matchProducts(
    @Request() req: AuthenticatedRequest,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    const merchantId = await this.getMerchantId(req.user.id);

    this.logger.log(`Starting product matching for session ${sessionId}`);

    await this.productMatcherService.matchItems(sessionId, merchantId);

    const stats = await this.productMatcherService.getMatchStats(sessionId);

    return {
      session_id: sessionId,
      status: 'reconciling',
      stats,
    };
  }

  /**
   * GET /merchant/products/import/:sessionId/items
   * Get import items with pagination
   */
  @Get('import/:sessionId/items')
  async getImportItems(
    @Request() req: AuthenticatedRequest,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @Query('status') status?: ImportItemStatus,
  ) {
    const merchantId = await this.getMerchantId(req.user.id);

    return this.importService.getItems(
      sessionId,
      merchantId,
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 50,
      status,
    );
  }

  /**
   * GET /merchant/products/import/:sessionId/stats
   * Get match statistics for session
   */
  @Get('import/:sessionId/stats')
  async getMatchStats(
    @Request() req: AuthenticatedRequest,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    const merchantId = await this.getMerchantId(req.user.id);

    // Verify session belongs to merchant
    await this.importService.getSession(sessionId, merchantId);

    return this.productMatcherService.getMatchStats(sessionId);
  }

  /**
   * PATCH /merchant/products/import/:sessionId/items/:itemId
   * Update import item
   */
  @Patch('import/:sessionId/items/:itemId')
  async updateImportItem(
    @Request() req: AuthenticatedRequest,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateImportItemDto,
  ) {
    const merchantId = await this.getMerchantId(req.user.id);

    return this.importService.updateItem(sessionId, itemId, merchantId, dto);
  }

  /**
   * POST /merchant/products/import/:sessionId/approve-all
   * Approve all items (or filtered by status)
   */
  @Post('import/:sessionId/approve-all')
  @HttpCode(HttpStatus.OK)
  async approveAllItems(
    @Request() req: AuthenticatedRequest,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() dto: ApproveAllItemsDto,
  ) {
    const merchantId = await this.getMerchantId(req.user.id);

    return this.importService.approveAll(sessionId, merchantId, dto);
  }

  /**
   * POST /merchant/products/import/:sessionId/execute
   * Execute import - create/update products
   */
  @Post('import/:sessionId/execute')
  @HttpCode(HttpStatus.OK)
  async executeImport(
    @Request() req: AuthenticatedRequest,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    const merchantId = await this.getMerchantId(req.user.id);

    this.logger.log(`Executing import for session ${sessionId}`);

    const session = await this.importService.executeImport(sessionId, merchantId);

    return {
      id: session.id,
      status: session.status,
      success_count: session.success_count,
      error_count: session.error_count,
      new_count: session.new_count,
      update_count: session.update_count,
      skip_count: session.skip_count,
      completed_at: session.completed_at,
    };
  }

  /**
   * POST /merchant/products/import/:sessionId/cancel
   * Cancel import session
   */
  @Post('import/:sessionId/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelImport(
    @Request() req: AuthenticatedRequest,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    const merchantId = await this.getMerchantId(req.user.id);

    const session = await this.importService.cancelSession(sessionId, merchantId);

    return {
      id: session.id,
      status: session.status,
    };
  }

  /**
   * PATCH /merchant/products/import/:sessionId/mapping
   * Update column mapping
   */
  @Patch('import/:sessionId/mapping')
  async updateColumnMapping(
    @Request() req: AuthenticatedRequest,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() dto: { mappings: ColumnMapping[] },
  ) {
    const merchantId = await this.getMerchantId(req.user.id);

    const session = await this.aiAnalyzerService.updateColumnMapping(
      sessionId,
      merchantId,
      dto.mappings,
    );

    return {
      id: session.id,
      status: session.status,
      analysis_result: session.analysis_result,
    };
  }

  /**
   * POST /merchant/products/import/:sessionId/items/:itemId/resolve
   * Resolve conflict for specific item
   */
  @Post('import/:sessionId/items/:itemId/resolve')
  @HttpCode(HttpStatus.OK)
  async resolveConflict(
    @Request() req: AuthenticatedRequest,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: { action: 'update' | 'skip' | 'insert' },
  ) {
    const merchantId = await this.getMerchantId(req.user.id);

    // Verify session belongs to merchant
    await this.importService.getSession(sessionId, merchantId);

    return this.productMatcherService.resolveConflict(itemId, sessionId, dto.action);
  }
}
