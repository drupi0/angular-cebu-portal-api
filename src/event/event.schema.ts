
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EventDocument = Event & Document;

@Schema()
export class Event {
  @Prop({ required: true })
  name: string;

  @Prop()
  shortDescription: string

  @Prop()
  longDescription: string

  @Prop({ required: true })
  dateStart: Date;

  @Prop({ required: true })
  dateEnd: Date;

  @Prop({ required: true })
  location: string;

  @Prop()
  locationUrl: string;
  
  @Prop()
  headerImage: string;

  @Prop({ required: true })
  participantLimit: number;

  @Prop({ required: true })
  isAcceptingRegistration: boolean;

  @Prop()
  certificateTemplate: string;
}

export const EventSchema = SchemaFactory.createForClass(Event);
