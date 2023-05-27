import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { Event, EventDocument } from './event.schema';
import { EventService } from './event.service';
import { MemberService } from 'src/member/member.service';

@Injectable()
export class EventServiceImpl implements EventService {
    constructor(@InjectModel(Event.name) private readonly eventModel: Model<EventDocument>, 
               private memberSvc: MemberService) {}

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
        await this.eventModel.findByIdAndUpdate(eventId, event);
        return this.getEvent(eventId);
    }

    async deleteEvent(eventId): Promise<Event> {
        return this.eventModel.findByIdAndDelete(eventId);
    }

    async getAllEvents(): Promise<Event[]> {
        return this.eventModel.find({});
    }

    async joinEvent(eventId, memberId): Promise<boolean> {
        const memberObj = await this.memberSvc.getMember(memberId);
        
        if(!memberObj) {
            return false;
        }

        const eventObj = await this.eventModel.findById(eventId).exec();

        if(!eventObj) {
            return false;
        }

        if(!eventObj.isAcceptingRegistration) {
            return false;
        }

        memberObj.eventsAttended = memberObj.eventsAttended.filter(event => event === eventId);
        memberObj.eventsAttended.push(eventId);
        
        await this.memberSvc.updateMember(memberId, memberObj);

        return true;
    }
}
