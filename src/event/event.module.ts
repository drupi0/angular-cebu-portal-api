import { Module } from '@nestjs/common';
import { EventController } from './event.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { EventSchema } from './event.schema';
import { EventMongoImplService } from './event-mongo.impl.service';
import { EventService } from './event.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Event', schema: EventSchema}])],
  providers: [ { provide: EventService , useClass: EventMongoImplService }],
  controllers: [EventController]
})
export class EventModule {}
