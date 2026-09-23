import { Router } from 'express';
import { validate } from '@/common/sanitation';
import { createChaplainService, getChaplainServices, getPublicChaplainServices, getEligibleServiceChaplains, updateChaplainService } from '@/controllers/v1/chaplain-service/chaplain-service.controller';
import { createPublicChaplainServiceBooking } from '@/controllers/v1/chaplain-service/chaplain-service-booking.controller';
import { cancelCurrentRequesterChaplainServiceBooking, getAdminChaplainServiceBookings, getCurrentProviderChaplainServiceBookings, getCurrentRequesterChaplainServiceBookings, updateAdminChaplainServiceBookingFinancials, updateAdminChaplainServiceBookingStatus, updateCurrentProviderChaplainServiceBookingStatus } from '@/controllers/v1/chaplain-service/chaplain-service-booking-management.controller';
import { UserType } from '@/generated/prisma/enums';
import { authenticate, optionalAuthenticate } from '@/middlewares/authentication';
import authorize from '@/middlewares/authorization';
import { expressRateLimit } from '@/middlewares/express-rate-limiter';
import { cancelCurrentRequesterBookingSchema, chaplainServiceBodySchema, createChaplainServiceBookingSchema, getChaplainServiceBookingsSchema, getChaplainServicesSchema, updateChaplainServiceBookingFinancialsSchema, updateChaplainServiceBookingStatusSchema } from '@/validators/chaplain-service';

const router = Router();
const adminAccess = [authenticate, authorize([UserType.ADMIN])];

router.get('/', expressRateLimit('basic'), ...adminAccess, validate(getChaplainServicesSchema), getChaplainServices);
router.get('/public', expressRateLimit('basic'), getPublicChaplainServices);
router.get('/public/chaplains', expressRateLimit('basic'), getEligibleServiceChaplains);
router.post('/public/bookings', expressRateLimit('basic'), optionalAuthenticate, validate(createChaplainServiceBookingSchema), createPublicChaplainServiceBooking);
router.get('/current/bookings', expressRateLimit('basic'), authenticate, authorize([UserType.MEMBER, UserType.OFFICER, UserType.ADMIN]), getCurrentProviderChaplainServiceBookings);
router.patch('/current/bookings/:id/status', expressRateLimit('basic'), authenticate, authorize([UserType.MEMBER, UserType.OFFICER, UserType.ADMIN]), validate(updateChaplainServiceBookingStatusSchema), updateCurrentProviderChaplainServiceBookingStatus);
router.get('/my-bookings', expressRateLimit('basic'), authenticate, getCurrentRequesterChaplainServiceBookings);
router.patch('/my-bookings/:id/cancel', expressRateLimit('basic'), authenticate, validate(cancelCurrentRequesterBookingSchema), cancelCurrentRequesterChaplainServiceBooking);
router.get('/bookings', expressRateLimit('basic'), ...adminAccess, validate(getChaplainServiceBookingsSchema), getAdminChaplainServiceBookings);
router.patch('/bookings/:id/status', expressRateLimit('basic'), ...adminAccess, validate(updateChaplainServiceBookingStatusSchema), updateAdminChaplainServiceBookingStatus);
router.patch('/bookings/:id/financials', expressRateLimit('basic'), ...adminAccess, validate(updateChaplainServiceBookingFinancialsSchema), updateAdminChaplainServiceBookingFinancials);
router.post('/', expressRateLimit('basic'), ...adminAccess, validate(chaplainServiceBodySchema), createChaplainService);
router.put('/:id', expressRateLimit('basic'), ...adminAccess, validate(chaplainServiceBodySchema), updateChaplainService);

export default router;
