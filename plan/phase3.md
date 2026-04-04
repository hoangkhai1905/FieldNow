# Phase 3: Booking System (The Hard Part)

## Goal
Build the robust booking engine capable of handling concurrency and preventing double bookings.

## Tasks
1. **[Infrastructure] Tools Setup**
   - Configure docker-compose to run Redis locally.
   - Set up BullMQ for message queuing.
2. **[Backend] Booking Logic**
   - Implement `createBooking` using Redis Distributed Locks (`SETNX`).
   - Setup BullMQ delayed jobs to handle 15-minute booking expirations.
3. **[Frontend] Booking User Interface**
   - Slot selection UI.
   - Confirmation step with a mock payment generation.
4. **[Frontend] User Dashboard**
   - Implement the "My History" section to view user bookings.
