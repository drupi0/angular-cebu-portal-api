import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthImplService } from './auth.impl.service';
import { MemberModule } from 'src/member/member.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthSchema, JWT_CONSTANTS } from './auth.schema';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './local.strategy';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { TokenStrategy } from './token.strategy';

@Module({
  imports: [MemberModule, MongooseModule.forFeature([{ name: 'Auth', schema: AuthSchema}]), PassportModule,
            JwtModule.register({
              secret: JWT_CONSTANTS.secret,
              signOptions: { expiresIn: JWT_CONSTANTS.expiresIn }
            })],
  providers: [{ provide: AuthService, useClass: AuthImplService}, LocalStrategy, TokenStrategy],
  controllers: [AuthController]
})
export class AuthModule {}
