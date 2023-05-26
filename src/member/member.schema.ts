
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type MemberDocument = mongoose.HydratedDocument<Member>;

@Schema()
export class Member {
  @Prop({ required: true })
  name: string;

  @Prop({ unique: true })
  userName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true })
  updatedAt: Date;

  @Prop()
  uuid: string;

  @Prop()
  isEmailValidated: boolean;

  @Prop()
  eventsAttended: {
    eventId: string,
    hasAttended: boolean,
    answers: {
        index: number,
        answer: string
    }[]
  }[];

  @Prop()
  roles: string[];
}

export const MemberSchema = SchemaFactory.createForClass(Member);
