const express = require('express');
const controller = require('../controllers/eventController');

const router = express.Router();

router.get('/events/search', controller.getPublicEvents);
router.get('/events', controller.getPublicEvents);
router.get('/events/:id', controller.getPublicEvent);
router.get('/categories', controller.getCategories);
router.get('/organisations', controller.getOrganisations);
router.post('/registrations', controller.createRegistration);

router.get('/admin/events', controller.getAdminEvents);
router.get('/admin/events/:id', controller.getAdminEvent);
router.post('/admin/events', controller.createEvent);
router.put('/admin/events/:id', controller.updateEvent);
router.delete('/admin/events/:id', controller.deleteEvent);

module.exports = router;
