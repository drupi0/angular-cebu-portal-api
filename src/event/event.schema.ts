
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EventDocument = Event & Document;

@Schema()
export class Event {
  @Prop({ required: true })
  name: string;

  @Prop()
  tagLine: string;

  @Prop()
  shortDescription: string

  @Prop()
  longDescription: string

  @Prop({ required: true })
  dateStart: string;

  @Prop({ required: true })
  dateEnd: string;

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

  @Prop()
  questions: {
    index: number,
    question: string,
    type: string,
    options?: string[],
    isRequired: boolean
  }[];
}

export const EventSchema = SchemaFactory.createForClass(Event);
