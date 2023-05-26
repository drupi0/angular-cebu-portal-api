import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventModule } from './event/event.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [EventModule, MongooseModule.forRoot((process.env.MONGO_URL || "mongodb://localhost:27017").concat("/database"))],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
