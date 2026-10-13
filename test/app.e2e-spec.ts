import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { createConnection, Connection } from 'mongoose';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { EventService } from '../src/event/event.service';

describe('Application HTTP smoke tests', () => {
  let app: INestApplication;
  let connection: Connection;
  const events = { getEvent: jest.fn() };

  beforeAll(async () => {
    // Compile the real module graph without connecting to a local/production DB.
    connection = createConnection();
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(getConnectionToken())
      .useValue(connection)
      .overrideProvider(EventService)
      .useValue(events)
      .compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    await connection?.close();
  });

  it('serves the root route', async () => {
    await request(app.getHttpServer()).get('/').expect(200).expect('Hello World!');
  });

  it('returns an event through the HTTP adapter', async () => {
    events.getEvent.mockResolvedValue({ name: 'Angular Cebu Meetup' });
    await request(app.getHttpServer())
      .get('/event/507f1f77bcf86cd799439011')
      .expect(200)
      .expect({ name: 'Angular Cebu Meetup' });
  });

  it('preserves the event-not-found response', async () => {
    events.getEvent.mockResolvedValue(null);
    await request(app.getHttpServer()).get('/event/missing').expect(404);
  });

  it('rejects unauthenticated member requests', async () => {
    await request(app.getHttpServer())
      .get('/member/507f1f77bcf86cd799439011')
      .expect(401);
  });

  it('rejects malformed bearer tokens', async () => {
    await request(app.getHttpServer())
      .get('/member/507f1f77bcf86cd799439011')
      .set('Authorization', 'Bearer invalid')
      .expect(401);
  });
});
