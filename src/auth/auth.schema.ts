
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type AuthDocument = mongoose.HydratedDocument<Auth>;

@Schema()
export class Auth {
  @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'Member' })
  uuid: string;

  @Prop({ required: true })
  password: string;
}

export const AuthSchema = SchemaFactory.createForClass(Auth);

export interface AuthToken {
    access_token: string;
}

export const JWT_CONSTANTS = {
    secret: process.env.SECRET_KEY || 'g94Xc8g@89h3TG^7!yBVKAs7%D9&*J4p#V^Z',
    expiresIn: process.env.TOKEN_EXPIRY || '1d',
    saltOrRounds: 10
  };
  