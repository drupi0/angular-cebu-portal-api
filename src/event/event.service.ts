import { Event } from './event.schema'


export class EventService {
    getEvent: (eventId: string) => Promise<Event>;
    createEvent: (eventObj: Event) => Promise<Event>;
    updateEvent: (eventId: string, eventObj: Event) => Promise<Event>;
    deleteEvent: (eventId) => Promise<Event>;
    getAllEvents: () => Promise<Event[]>
}