import React from 'react';

const BookingSummary = ({ bookingDetails, onBookAnother }) => {
  const { name, email, department, eventName, ticketsBooked, pricePerTicket, bookingId, bookedAt } = bookingDetails;
  const totalAmount = ticketsBooked * pricePerTicket;

  const rows = [
    { icon: '👤', label: 'Attendee Name', value: name },
    { icon: '📧', label: 'Email', value: email },
    { icon: '🏛️', label: 'Department', value: department },
    { icon: '🎪', label: 'Event', value: eventName },
    { icon: '🎟️', label: 'Tickets Booked', value: `${ticketsBooked} ticket${ticketsBooked > 1 ? 's' : ''}` },
    { icon: '💰', label: 'Price per Ticket', value: `₹${pricePerTicket.toLocaleString('en-IN')}` },
    { icon: '📆', label: 'Booked On', value: bookedAt },
  ];

  return (
    <div className="card card-right summary-card">
      <div
        className="card-banner"
        style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
      />
      <div className="card-body">
        {/* Veltech Logo */}
        <div className="veltech-logo-container" style={{ marginBottom: '20px', paddingTop: '0' }}>
          <img 
            src="https://www.veltech.edu.in/wp-content/uploads/2026/01/veltech-logo-.png" 
            alt="Veltech University" 
            className="veltech-logo-img"
            style={{ maxWidth: '140px' }}
          />
        </div>

        {/* Success Icon */}
        <div className="summary-success-icon" aria-label="Booking confirmed" style={{ background: 'var(--gradient-dynamic)' }}>
          ✅
        </div>

        {/* Header */}
        <div className="summary-header">
          <h2 className="summary-title">Booking Confirmed!</h2>
          <p className="summary-subtitle">
            Your tickets are reserved. See you at the event! 🎉
          </p>
        </div>

        {/* Details */}
        <div className="section-label">
          <span>📋</span>
          <span>Booking Details</span>
        </div>

        <div>
          {rows.map(({ icon, label, value }) => (
            <div className="summary-row" key={label}>
              <div className="summary-key">
                <div className="summary-key-icon" aria-hidden="true">{icon}</div>
                <span>{label}</span>
              </div>
              <span className="summary-val">{value}</span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div
          className="summary-total-row"
          aria-label={`Total amount: ₹${totalAmount.toLocaleString('en-IN')}`}
        >
          <span className="summary-total-label">Total Amount</span>
          <span className="summary-total-value">
            ₹{totalAmount.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Booking ID */}
        <div className="summary-booking-id" aria-label={`Booking ID: ${bookingId}`}>
          <span>🔖</span>
          <span>Booking ID: <strong>{bookingId}</strong></span>
        </div>

        {/* Download Ticket Button */}
        <button
          className="btn-submit"
          onClick={() => {
            import('jspdf').then(({ jsPDF }) => {
              const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: [200, 100] // Custom ticket size
              });

              // Background color
              doc.setFillColor(248, 250, 252);
              doc.rect(0, 0, 200, 100, 'F');

              // Left side (Main Details)
              doc.setFillColor(255, 255, 255);
              doc.roundedRect(10, 10, 130, 80, 3, 3, 'FD');
              doc.setDrawColor(200, 200, 200);
              doc.setLineWidth(0.5);
              doc.rect(10, 10, 130, 80); // Border

              // Right side (Stub)
              doc.setFillColor(124, 58, 237); // Purple theme
              doc.roundedRect(145, 10, 45, 80, 3, 3, 'FD');

              // Dashed line between main and stub
              doc.setDrawColor(150, 150, 150);
              doc.setLineDashPattern([2, 2], 0);
              doc.line(142, 10, 142, 90);

              // Add Text - Main Side
              doc.setTextColor(30, 30, 30);
              doc.setFontSize(22);
              doc.setFont('helvetica', 'bold');
              doc.text("EventX Veltech University", 15, 25);
              
              doc.setFontSize(16);
              doc.setTextColor(100, 100, 100);
              doc.text(eventName, 15, 35);

              doc.setFontSize(12);
              doc.setTextColor(50, 50, 50);
              doc.text(`Attendee: ${name}`, 15, 50);
              doc.text(`Email: ${email}`, 15, 58);
              doc.text(`Department: ${department}`, 15, 66);
              doc.text(`Tickets Booked: ${ticketsBooked}`, 15, 74);
              doc.text(`Total Paid: INR ${totalAmount.toLocaleString('en-IN')}`, 15, 82);

              // Add Text - Stub Side
              doc.setTextColor(255, 255, 255);
              doc.setFontSize(14);
              doc.setFont('helvetica', 'bold');
              doc.text("TICKET", 167, 25, null, null, 'center');
              
              doc.setFontSize(10);
              doc.setFont('helvetica', 'normal');
              doc.text(`Qty: ${ticketsBooked}`, 167, 40, null, null, 'center');
              
              doc.setFontSize(8);
              const splitId = doc.splitTextToSize(`ID: ${bookingId}`, 40);
              doc.text(splitId, 167, 50, null, null, 'center');

              doc.setFontSize(10);
              doc.setFont('helvetica', 'bold');
              doc.text("ADMIT ONE", 167, 75, null, null, 'center');
              doc.text("VELTECH", 167, 82, null, null, 'center');

              doc.save(`Ticket_${bookingId}.pdf`);
            });
          }}
          style={{ width: '100%', marginBottom: '16px', background: 'var(--gradient-primary)' }}
        >
          <span>📥</span> Download PDF Ticket
        </button>

        {/* Book Another */}
        <button
          id="btn-book-another"
          className="btn-book-another"
          onClick={onBookAnother}
          aria-label="Book tickets for another attendee"
        >
          <span>🎟️</span>
          <span>Book Another Ticket</span>
        </button>
      </div>
    </div>
  );
};

export default BookingSummary;
