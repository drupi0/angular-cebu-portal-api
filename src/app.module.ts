import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventModule } from './event/event.module';
import { MongooseModule } from '@nestjs/mongoose';
import { MemberModule } from './member/member.module';
import { AuthModule } from './auth/auth.module';
@Module({
  imports: [EventModule, MongooseModule.forRoot((process.env.MONGO_URL || "mongodb://localhost:27017").concat("/database")), MemberModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
