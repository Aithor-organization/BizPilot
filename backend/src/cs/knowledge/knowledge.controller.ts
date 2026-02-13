import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantMemberGuard } from '../tenant/guards/tenant-member.guard';
import { KnowledgeService } from './knowledge.service';
import { RagService } from './rag.service';
import { UploadDocumentDto } from './dto/upload-document.dto';

@Controller('api/omnidesk/tenants/:tenantId/knowledge')
@UseGuards(JwtAuthGuard, TenantMemberGuard)
export class KnowledgeController {
  constructor(
    private knowledgeService: KnowledgeService,
    private ragService: RagService,
  ) {}

  @Post('documents')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (_req, file, cb) => {
        const ext = file.originalname.split('.').pop()?.toLowerCase();
        if (['pdf', 'txt', 'md'].includes(ext || '')) {
          cb(null, true);
        } else {
          cb(new Error('Only PDF, TXT, MD files are allowed'), false);
        }
      },
    }),
  )
  upload(
    @Param('tenantId') tenantId: string,
    @Body() dto: UploadDocumentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.knowledgeService.uploadDocument(tenantId, dto.title, file);
  }

  @Get('documents')
  findAll(@Param('tenantId') tenantId: string) {
    return this.knowledgeService.findAll(tenantId);
  }

  @Get('documents/:id')
  findById(@Param('tenantId') tenantId: string, @Param('id') id: string) {
    return this.knowledgeService.findById(tenantId, id);
  }

  @Delete('documents/:id')
  delete(@Param('tenantId') tenantId: string, @Param('id') id: string) {
    return this.knowledgeService.delete(tenantId, id);
  }

  @Post('search')
  async search(
    @Param('tenantId') tenantId: string,
    @Body() body: { query: string; topK?: number },
  ) {
    const results = await this.ragService.search(tenantId, body.query, body.topK ?? 5);
    return { results, query: body.query };
  }
}
