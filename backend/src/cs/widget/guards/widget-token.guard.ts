import { CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { WidgetService } from '../widget.service';

@Injectable()
export class WidgetTokenGuard implements CanActivate {
  constructor(private widgetService: WidgetService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const embedToken = request.params.embedToken;

    if (!embedToken) {
      throw new ForbiddenException('embedToken required');
    }

    const widget = await this.widgetService.findByEmbedToken(embedToken);
    if (!widget) {
      throw new NotFoundException('Widget not found');
    }

    // Origin 검증
    const origin = request.headers.origin || request.headers.referer;
    if (widget.allowedOrigins.length > 0 && origin) {
      const isAllowed = widget.allowedOrigins.some((o: string) => origin.startsWith(o));
      if (!isAllowed) {
        throw new ForbiddenException('Origin not allowed');
      }
    }

    request.widget = widget;
    request.tenantId = widget.tenantId;
    return true;
  }
}
