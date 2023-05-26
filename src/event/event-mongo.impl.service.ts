import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { Event, EventDocument } from './event.schema';
import { EventService } from './event.service';

@Injectable()
export class EventMongoImplService implements EventService {
    constructor(@InjectModel(Event.name) private readonly eventModel: Model<EventDocument>) {}

    async getEvent(eventId: string): Promise<Event> {
        if(!isValidObjectId(eventId)) {
            return null;
        }

        return this.eventModel.findById(eventId).exec();
    }


    async createEvent(event: Event): Promise<Event> {
        const newEvent = new this.eventModel(event);
        return newEvent.save();
    }

    async updateEvent(eventId: string, event: Event): Promise<Event> {
        return this.eventModel.findByIdAndUpdate(eventId, event);
    }

    async deleteEvent(eventId): Promise<Event> {
        return this.eventModel.findByIdAndDelete(eventId);
    }

    async getAllEvents(): Promise<Event[]> {
        return this.eventModel.find({});
    }
}
