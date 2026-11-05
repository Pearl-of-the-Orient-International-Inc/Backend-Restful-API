"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cancel_event_1 = require("../../controllers/v1/event/cancel-event");
const create_event_1 = require("../../controllers/v1/event/create-event");
const delete_event_1 = require("../../controllers/v1/event/delete-event");
const get_event_attendees_1 = require("../../controllers/v1/event/get-event-attendees");
const get_event_certificate_eligible_attendees_1 = require("../../controllers/v1/event/get-event-certificate-eligible-attendees");
const get_all_events_1 = require("../../controllers/v1/event/get-all-events");
const get_event_by_id_1 = require("../../controllers/v1/event/get-event-by-id");
const get_public_events_1 = require("../../controllers/v1/event/get-public-events");
const get_public_event_by_id_1 = require("../../controllers/v1/event/get-public-event-by-id");
const invite_event_attendees_1 = require("../../controllers/v1/event/invite-event-attendees");
const event_registration_1 = require("../../controllers/v1/event/event-registration");
const update_event_1 = require("../../controllers/v1/event/update-event");
const sanitation_1 = require("../../common/sanitation");
const enums_1 = require("../../generated/prisma/enums");
const uploadthing_1 = require("../../lib/uploadthing");
const authentication_1 = require("../../middlewares/authentication");
const authorization_1 = __importDefault(require("../../middlewares/authorization"));
const express_rate_limiter_1 = require("../../middlewares/express-rate-limiter");
const event_1 = require("../../validators/event");
const router = (0, express_1.Router)();
router.get('/public', (0, express_rate_limiter_1.expressRateLimit)('basic'), (0, sanitation_1.validate)(event_1.getAllEventsSchema), get_public_events_1.getPublicEvents);
router.get('/public/:id', (0, express_rate_limiter_1.expressRateLimit)('basic'), get_public_event_by_id_1.getPublicEventById);
router.post('/create', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(event_1.createEventSchema), create_event_1.createEvent);
router.get('/:id/my-registration', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.MEMBER, enums_1.UserType.OFFICER]), event_registration_1.getCurrentMemberEventRegistration);
router.use('/thumbnail/upload', (0, express_rate_limiter_1.expressRateLimit)('basic'), (0, uploadthing_1.createUploadthingExpressHandler)({
    maxFileSize: '4MB',
    maxFileCount: 1,
}));
router.get('/', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(event_1.getAllEventsSchema), get_all_events_1.getAllEvents);
router.get('/:id/attendees', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), get_event_attendees_1.getEventAttendees);
router.get('/:id/certificate-eligible-attendees', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), get_event_certificate_eligible_attendees_1.getEventCertificateEligibleAttendees);
router.post('/:id/attendees', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(event_1.inviteEventAttendeesSchema), invite_event_attendees_1.inviteEventAttendees);
router.post('/:id/join', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.MEMBER, enums_1.UserType.OFFICER]), event_registration_1.registerCurrentMemberForEvent);
router.patch('/:id/attendees/:attendeeId/status', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(event_1.reviewEventAttendeeSchema), event_registration_1.reviewEventAttendee);
router.get('/:id', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), get_event_by_id_1.getEventById);
router.put('/:id', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), (0, sanitation_1.validate)(event_1.updateEventSchema), update_event_1.updateEvent);
router.patch('/:id/cancel', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), cancel_event_1.cancelEvent);
router.delete('/:id', (0, express_rate_limiter_1.expressRateLimit)('basic'), authentication_1.authenticate, (0, authorization_1.default)([enums_1.UserType.ADMIN]), delete_event_1.deleteEvent);
exports.default = router;
