import { Router } from 'express';
import { cancelEvent } from '@/controllers/v1/event/cancel-event';
import { createEvent } from '@/controllers/v1/event/create-event';
import { deleteEvent } from '@/controllers/v1/event/delete-event';
import { getEventAttendees } from '@/controllers/v1/event/get-event-attendees';
import { getEventCertificateEligibleAttendees } from '@/controllers/v1/event/get-event-certificate-eligible-attendees';
import { getAllEvents } from '@/controllers/v1/event/get-all-events';
import { getEventById } from '@/controllers/v1/event/get-event-by-id';
import { getPublicEvents } from '@/controllers/v1/event/get-public-events';
import { getPublicEventById } from '@/controllers/v1/event/get-public-event-by-id';
import { inviteEventAttendees } from '@/controllers/v1/event/invite-event-attendees';
import {
  getCurrentMemberEventRegistration,
  registerCurrentMemberForEvent,
  reviewEventAttendee,
} from '@/controllers/v1/event/event-registration';
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
  reviewEventAttendeeSchema,
  updateEventSchema,
} from '@/validators/event';

const router = Router();

router.get(
  '/public',
  expressRateLimit('basic'),
  validate(getAllEventsSchema),
  getPublicEvents,
);

router.get(
  '/public/:id',
  expressRateLimit('basic'),
  getPublicEventById,
);

router.post(
  '/create',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(createEventSchema),
  createEvent,
);

router.get(
  '/:id/my-registration',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.MEMBER, UserType.OFFICER]),
  getCurrentMemberEventRegistration,
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

router.get(
  '/:id/certificate-eligible-attendees',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  getEventCertificateEligibleAttendees,
);

router.post(
  '/:id/attendees',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(inviteEventAttendeesSchema),
  inviteEventAttendees,
);

router.post(
  '/:id/join',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.MEMBER, UserType.OFFICER]),
  registerCurrentMemberForEvent,
);

router.patch(
  '/:id/attendees/:attendeeId/status',
  expressRateLimit('basic'),
  authenticate,
  authorize([UserType.ADMIN]),
  validate(reviewEventAttendeeSchema),
  reviewEventAttendee,
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
