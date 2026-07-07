import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import jwt from 'jsonwebtoken';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: any }>();
    const authHeader = request.headers.authorization;
    const publicEndpoints = [
      {method: 'POST', path : 'users/register'},
      {method: 'POST', path: 'users/login'}
    ];
    const isAuthRoute =  [
      '/users/register','/users/login','/auth/*'
    ].some(p => request.originalUrl.startsWith(p));

    if (isAuthRoute) {
      return true;
    }

    if (!authHeader || typeof authHeader !== 'string') {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization format');
    }

    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = jwt.verify(token, secret);
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
