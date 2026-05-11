const EventEmitter = require('events');

class BookingEvents extends EventEmitter {}

module.exports = new BookingEvents();
