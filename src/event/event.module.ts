import { Module } from '@nestjs/common';
import { EventController } from './event.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { EventSchema } from './event.schema';
import { EventServiceImpl } from './mongo/event.impl.service';
import { EventService } from './event.service';
import { MemberModule } from 'src/member/member.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Event', schema: EventSchema}]), MemberModule],
  providers: [ { provide: EventService , useClass: EventServiceImpl }],
  controllers: [EventController]
})
export class EventModule {}
