import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const EventContext = createContext(null);

const API_BASE_URL = 'http://localhost:5000/api';

export const EventProvider = ({ children }) => {
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/events`);
      const data = await response.json();
      if (data.success) {
        // Map DB fields to Frontend fields
        const mappedEvents = data.events.map(e => ({
          id: e.id,
          name: e.name,
          department: e.department,
          date: e.event_date,
          time: e.event_time,
          endTime: e.end_time,
          venue: e.venue,
          price: Number(e.price),
          totalTickets: e.total_tickets,
          availableTickets: e.available_tickets,
          description: e.description,
          status: e.status,
          createdAt: e.created_at
        }));
        setEvents(mappedEvents);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings`);
      const data = await response.json();
      if (data.success) {
        // Map DB fields to Frontend fields
        const mappedBookings = data.bookings.map(b => ({
          id: b.id,
          eventId: b.event_id,
          name: b.user_name,
          email: b.user_email,
          phone: b.user_phone,
          ticketsBooked: b.ticket_count,
          totalPrice: b.total_price,
          createdAt: b.created_at,
          attendeeNames: b.attendee_names || null, // array of names or null
          department: b.user_department || 'Student' 
        }));
        setBookings(mappedBookings);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchEvents(), fetchBookings()]);
      setLoading(false);
    };
    init();
  }, [fetchEvents, fetchBookings]);

  // CREATE
  const addEvent = useCallback(async (eventData) => {
    const newEventId = `evt-${Date.now().toString(36)}`;
    try {
      const eventVenue = eventData.venue.includes('Veltech University') 
        ? eventData.venue 
        : `${eventData.venue}, Veltech University`;

      const response = await fetch(`${API_BASE_URL}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...eventData, venue: eventVenue, id: newEventId })
      });
      const data = await response.json();
      if (data.success) {
        await fetchEvents();
        return true;
      }
    } catch (err) {
      console.error('Error adding event:', err);
    }
    return false;
  }, [fetchEvents]);

  // UPDATE
  const updateEvent = useCallback(async (id, updatedData) => {
    try {
      // Find current event to get availableTickets
      const current = events.find(e => e.id === id);
      const sold = current.totalTickets - current.availableTickets;
      const newAvailable = Math.max(0, Number(updatedData.totalTickets) - sold);

      const response = await fetch(`${API_BASE_URL}/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...updatedData, 
          availableTickets: newAvailable 
        })
      });
      const data = await response.json();
      if (data.success) {
        await fetchEvents();
        return true;
      }
    } catch (err) {
      console.error('Error updating event:', err);
    }
    return false;
  }, [events, fetchEvents]);

  // DELETE
  const deleteEvent = useCallback(async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/events/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        await fetchEvents();
        return true;
      }
    } catch (err) {
      console.error('Error deleting event:', err);
    }
    return false;
  }, [fetchEvents]);

  // BOOK TICKETS
  const bookTickets = useCallback(async (eventId, count, userDetails) => {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userDetails.bookingId,
          eventId,
          name: userDetails.name,
          email: userDetails.email,
          phone: userDetails.phone || '',
          ticketsBooked: count,
          totalPrice: userDetails.totalPrice || 0,
          attendeeNames: userDetails.attendeeNames || null // array of extra names
        })
      });
      const data = await response.json();
      if (data.success) {
        await Promise.all([fetchEvents(), fetchBookings()]);
        return true;
      }
    } catch (err) {
      console.error('Error booking tickets:', err);
    }
    return false;
  }, [fetchEvents, fetchBookings]);

  // CANCEL BOOKING (Power to both User and Admin)
  const cancelBooking = useCallback(async (bookingId, initiator = 'admin') => {
    try {
      const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}?initiatedBy=${initiator}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        await Promise.all([fetchEvents(), fetchBookings()]);
        return { success: true, email: data.email };
      }
    } catch (err) {
      console.error('Error cancelling booking:', err);
    }
    return { success: false };
  }, [fetchEvents, fetchBookings]);

  // GET single event
  const getEvent = useCallback(
    (id) => events.find((e) => e.id === id) || null,
    [events]
  );

  const value = {
    events,
    bookings,
    loading,
    addEvent,
    updateEvent,
    deleteEvent,
    bookTickets,
    cancelBooking,
    getEvent,
  };

  return (
    <EventContext.Provider value={value}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvents = () => {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error('useEvents must be inside EventProvider');
  return ctx;
};

export default EventContext;
