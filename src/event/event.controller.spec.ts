import { Test, TestingModule } from '@nestjs/testing';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { NotFoundException } from '@nestjs/common';

describe('EventController', () => {
  let controller: EventController;
  const eventService = { getEvent: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventController],
      providers: [{ provide: EventService, useValue: eventService }],
    }).compile();

    controller = module.get<EventController>(EventController);
  });

  it('reports a missing event as not found', async () => {
    eventService.getEvent.mockResolvedValue(null);
    await expect(controller.getEventById('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
