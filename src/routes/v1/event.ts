import { Router } from 'express';
import { cancelEvent } from '@/controllers/v1/event/cancel-event';
import { createEvent } from '@/controllers/v1/event/create-event';
import { deleteEvent } from '@/controllers/v1/event/delete-event';
import { getEventAttendees } from '@/controllers/v1/event/get-event-attendees';
import { getAllEvents } from '@/controllers/v1/event/get-all-events';
import { getEventById } from '@/controllers/v1/event/get-event-by-id';
import { getPublicEvents } from '@/controllers/v1/event/get-public-events';
import { inviteEventAttendees } from '@/controllers/v1/event/invite-event-attendees';
import { updateEvent } from '@/controllers/v1/event/update-event';
import { validate } from '@/common/sanitation';
import { UserType } from '@/generated/prisma/enums';
import { createUploadthingExpressHandler } from '@/lib/uploadthing';
import { authenticate } from '@/middlewares/authentication';
import authorize from '@/middlewares/authorization';
import { expressRateLimit } from '@/middlewares/express-rate-limiter';
import {
  createEventSchema,
  getAllEventsSchema,
  inviteEventAttendeesSchema,
  updateEventSchema,
} from '@/validators/event';

const router = Router();

router.get(
  '/public',
  expressRateLimit('basic'),
  validate(getAllEventsSchema),
  getPublicEvents,
);

router.post(
  '/create',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(createEventSchema),
  createEvent,
);

router.use(
  '/thumbnail/upload',
  expressRateLimit('basic'),
  createUploadthingExpressHandler({
    maxFileSize: '4MB',
    maxFileCount: 1,
  }),
);

router.get(
  '/',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(getAllEventsSchema),
  getAllEvents,
);

router.get(
  '/:id/attendees',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  getEventAttendees,
);

router.post(
  '/:id/attendees',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(inviteEventAttendeesSchema),
  inviteEventAttendees,
);

router.get(
  '/:id',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  getEventById,
);

router.put(
  '/:id',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(updateEventSchema),
  updateEvent,
);

router.patch(
  '/:id/cancel',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  cancelEvent,
);

router.delete(
  '/:id',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  deleteEvent,
);

export default router;
