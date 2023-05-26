import { Body, Controller, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { Event } from './event.schema';
import { EventService } from './event.service';

@Controller('event')
export class EventController {
    
    @Get(":eventId")
    async getEventById(@Param('eventId') eventId: string): Promise<Event> {
        const eventObj = await this.eventSvc.getEvent(eventId);

        if(!eventObj) {
            throw new NotFoundException(`${eventId} not found`);
        }

        return eventObj;
    }

    @Post("create")
    async createEvent(@Body() eventObj: Event): Promise<Event> {
        return await this.eventSvc.createEvent(eventObj);
    }

    @Patch(":eventId")
    async updateEvent(@Param('eventId') eventId: string, @Body() eventObj: Event): Promise<Event> {
        return await this.eventSvc.updateEvent(eventId, eventObj);
    }
    

    constructor(private eventSvc: EventService){}
}
