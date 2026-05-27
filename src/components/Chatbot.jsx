import React, { useState, useRef, useEffect, useCallback } from 'react';

// ── Rule-based response engine ────────────────────────────
function getBotReply(input, events, role = 'user', bookings = [], user = null, allDepartments = []) {
  const msg = input.toLowerCase().trim();

  // 1. Greetings & Identity
  if (/^(hi|hello|hey|hii|helo|yo|sup|namaste)/.test(msg)) {
    if (role === 'admin') {
      return `👋 Hello, Admin ${user?.name?.split(' ')[0] || ''}! I'm your EventX Dashboard Assistant. I can help you with analytics, event creation, and booking management. What can I do for you today?`;
    }
    return `👋 Hello! I'm EventX Assistant. I can help you find events, check ticket availability, and answer booking questions. What would you like to know?`;
  }

  if (/^(who are you|your name|what is your name)/.test(msg))
    return "🤖 I am the EventX Assistant, your virtual guide for Veltech University events! I can help you navigate the platform and find the best events to attend.";

  // 2. Help / Features
  if (/help|what can you do|features|assist|menu/.test(msg)) {
    if (role === 'admin') {
      return "🛡️ Admin Assistant Features:\n• **Analytics**: Ask for revenue or ticket stats\n• **Create Event**: Type 'create event' to start\n• **View Bookings**: Ask 'how to see bookings'\n• **Edit/Delete**: Learn how to manage events\n• **Popular Events**: Find out which events are trending";
    }
    return "🤖 I can help you with:\n• View today's & upcoming events\n• Check ticket availability\n• Find event prices\n• Explain how to book tickets\n• Find your booked tickets & PDFs\n• Answer general questions\n\nJust ask me anything! 😊";
  }

  // 3. Navigation & UI Help
  if (/(logout|sign out|leave|exit).*(button|where|how)/.test(msg) || msg === 'logout') {
    return "🚪 To logout:\nClick the **'Logout'** button with the exit icon (🚪) located at the far right of the top navigation bar (header).";
  }
  if (/(login|sign in|register|sign up).*(where|how)/.test(msg)) {
    return "🔐 You can find the **Login** and **Register** buttons on the landing page. If you are already logged in, you can find the **Logout** button in the header.";
  }

  // 4. User's specific tickets / "My Tickets"
  if (/(my|mine|find|where|show|get|download).*(ticket|booking|qr|pass|pdf)/.test(msg)) {
    if (role === 'user' && user && bookings.length > 0) {
      const myBookings = bookings.filter(b => b.email === user.email);
      if (myBookings.length > 0) {
        const list = myBookings.map(b => {
          const evt = events.find(e => e.id === b.eventId);
          return `• **${evt?.name || 'Event'}**: ${b.ticketsBooked} ticket(s)`;
        }).join('\n');
        return `📄 You have **${myBookings.length}** active booking(s):\n${list}\n\nYou can download the PDFs from the **'My Tickets'** section in the header! 🎟️`;
      }
    }
    return "📄 To find your booked tickets:\n1️⃣ Click on **'My Tickets'** in the top navigation menu (header).\n2️⃣ You will see a list of all your active and past bookings.\n3️⃣ Click the **'Download PDF'** button to save your ticket with the QR code. 🎟️";
  }

  // 4. ADMIN: Analytics & Stats
  if (role === 'admin') {
    if (/(analytics|stat|revenue|total|money|income|profit).*(earn|booking|sale|sell|sold)/.test(msg) || msg === 'analytics') {
      const totalRevenue = events.reduce((sum, e) => sum + ((e.totalTickets - e.availableTickets) * e.price), 0);
      const totalSold = events.reduce((sum, e) => sum + (e.totalTickets - e.availableTickets), 0);
      return `📊 **EventX Analytics Overview**:\n💰 **Total Revenue**: ₹${totalRevenue.toLocaleString('en-IN')}\n🎟️ **Tickets Sold**: ${totalSold}\n📅 **Active Events**: ${events.filter(e => e.status === 'active').length}\n\nAnything else you'd like to analyze?`;
    }

    if (/(popular|trending|best|top).*(event|sale|sell|sold)/.test(msg)) {
      const sorted = [...events].sort((a, b) => (b.totalTickets - b.availableTickets) - (a.totalTickets - a.availableTickets));
      const top = sorted[0];
      if (top && (top.totalTickets - top.availableTickets) > 0) {
        return `🔥 **Most Popular Event**: "${top.name}"\n📈 **Tickets Sold**: ${top.totalTickets - top.availableTickets} (${Math.round(((top.totalTickets - top.availableTickets)/top.totalTickets)*100)}% capacity)\n🏛️ **Department**: ${top.department}`;
      }
      return "📊 No tickets have been sold yet, so there's no trending event!";
    }

    if (/(view|show|see|list|where).*(booking|attendee|registration)/.test(msg)) {
      if (bookings.length > 0) {
        const recent = bookings.slice(-3).reverse().map(b => `• **${b.name}**: ${b.ticketsBooked} tkt(s) for ${events.find(e => e.id === b.eventId)?.name || 'Event'}`).join('\n');
        return `📋 **Recent Bookings**:\n${recent}\n\nTo see the full list, click the **'View Bookings'** tab in the dashboard!`;
      }
      return "📋 **How to view bookings**:\n1️⃣ In the Admin Dashboard, click the **'View Bookings'** tab.\n2️⃣ You'll see a list of all recent registrations.\n3️⃣ Use the **'Names'** button on any card to see individual attendee names.";
    }

    if (/(edit|change|update|delete|remove).*(event|detail)/.test(msg)) {
      return "🛠️ **Managing Events**:\n• **Edit**: Find the event card and click the pencil icon (✏️).\n• **Delete**: Click the trash icon (🗑️) on the event card.\n• **Status**: Completed events are automatically locked for editing.";
    }
  }

  // 5. How to book
  if (/how.*(book|reserve|get ticket|purchase|buy)/.test(msg))
    return "🎟️ Booking is easy!\n1️⃣ Select an event from the event list\n2️⃣ Fill in your name, email & phone\n3️⃣ Choose number of tickets\n4️⃣ Click 'Book Tickets'\nYou'll receive a confirmation email with a QR code! 📧";

  // 6. List events
  if (/(list|show|tell|what|which|any|all).*(event|happening|today|upcoming|available)/.test(msg) || msg === 'events') {
    const now = new Date();
    const todayStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    const upcoming = events.filter(e => e.date >= todayStr && e.status === 'active');
    if (upcoming.length === 0) return "📭 No upcoming events right now. Check back soon!";
    const listed = upcoming.slice(0, 5).map(e => `• ${e.name} — ${new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} @ ${e.venue?.replace(', Veltech University', '') || 'Veltech'}`).join('\n');
    return `🎓 Upcoming Events (${upcoming.length} total):\n${listed}${upcoming.length > 5 ? `\n…and ${upcoming.length - 5} more!` : ''}`;
  }

  // 7. Price query
  if (/(price|cost|fee|how much|ticket price|charges|expensive|free).*(ticket|event|for)/.test(msg) || /(price|cost)/.test(msg)) {
    const match = events.find(e => msg.includes(e.name.toLowerCase()) || msg.includes(e.name.toLowerCase().split(' ')[0]));
    if (match) return `💰 **${match.name}**: ₹${match.price === 0 ? 'Free' : match.price} per ticket. ${match.availableTickets > 0 ? `${match.availableTickets} seats still available!` : '⚠️ Sold out!'}`;
    
    const free = events.filter(e => e.price === 0 && e.status === 'active');
    const paid = events.filter(e => Number(e.price) > 0 && e.status === 'active');
    let reply = '💰 Ticket prices vary by event:\n';
    if (free.length) reply += `• **Free Events**: ${free.map(e => e.name).slice(0, 3).join(', ')}\n`;
    if (paid.length) {
      const prices = paid.map(e => Number(e.price));
      reply += `• **Paid Events**: From ₹${Math.min(...prices)} to ₹${Math.max(...prices)}\n`;
    }
    return reply + "\nYou can see the exact price by selecting an event on the dashboard!";
  }

  // 8. Availability
  if (/(how many|availability|seats left|remaining|sold out|full|capacity).*(ticket|seat)/.test(msg) || /availability/.test(msg)) {
    const match = events.find(e => msg.includes(e.name.toLowerCase().split(' ')[0]) || msg.includes(e.name.toLowerCase()));
    if (match) {
      const pct = Math.round((match.availableTickets / match.totalTickets) * 100);
      if (match.availableTickets === 0) return `⚠️ Sorry! "${match.name}" is sold out.`;
      if (pct < 20) return `🔴 Only ${match.availableTickets} tickets left for "${match.name}" — book fast!`;
      return `✅ "${match.name}" has ${match.availableTickets} of ${match.totalTickets} tickets available.`;
    }
    const soldOut = events.filter(e => e.availableTickets === 0 && e.status === 'active');
    const available = events.filter(e => e.availableTickets > 0 && e.status === 'active');
    return `📊 ${available.length} events have tickets available right now. ${soldOut.length > 0 ? `${soldOut.length} event(s) are currently sold out.` : 'All upcoming events have seats available!'}`;
  }

  // 10. Venue (Refined to avoid false positives)
  if (/(venue|location|address|place|held).*(of|for|is|at)/.test(msg) || (msg.includes('where') && (msg.includes('event') || msg.includes('held') || msg.includes('happening')))) {
    const match = events.find(e => e.status === 'active' && (msg.includes(e.name.toLowerCase().split(' ')[0]) || msg.includes(e.name.toLowerCase())));
    if (match) return `📍 "${match.name}" is held at:\n${match.venue}\n\nYou can see the venue on the interactive map in the event details! 🗺️`;
    return "📍 All events are held at various venues within Veltech University campus, Chennai. Select an event to see its exact location on the map! 🗺️";
  }

  // 10. Department listing & filter
  if (/(list|how many|show|all|total).*(department|dept)/.test(msg)) {
    if (allDepartments.length > 0) {
      return `🏛️ **Total Departments (${allDepartments.length})**:\n${allDepartments.map(d => `• ${d}`).join('\n')}`;
    }
    const depts = [...new Set(events.map(e => e.department).filter(Boolean))];
    if (depts.length > 0) return `🏛️ **Departments with active events**:\n${depts.map(d => `• ${d}`).join('\n')}`;
    return "🏛️ All major engineering and management departments at Veltech University participate in events!";
  }

  if (/(cse|ece|mba|mechanical|civil|it |information technology|ai |artificial intelligence|data science|management)/.test(msg)) {
    const deptMap = { 
      cse: 'computer science', ece: 'electronics', mba: 'management', mechanical: 'mechanical', 
      civil: 'civil', 'information technology': 'information technology', 'it ': 'information technology',
      'ai ': 'artificial intelligence', 'data science': 'data science', management: 'management'
    };
    const deptKey = Object.keys(deptMap).find(k => msg.includes(k));
    if (deptKey) {
      const filtered = events.filter(e => e.department?.toLowerCase().includes(deptMap[deptKey]) && e.status === 'active');
      if (filtered.length === 0) return `🏛️ No upcoming events listed for the **${deptMap[deptKey].toUpperCase()}** department right now.`;
      return `🏛️ **${deptMap[deptKey].toUpperCase()}** Events:\n${filtered.slice(0, 4).map(e => `• ${e.name} — ${new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`).join('\n')}`;
    }
  }

  // 11. Timing / Date
  if (/(when|date|time|start|end|duration|hour)/.test(msg)) {
    const match = events.find(e => e.status === 'active' && (msg.includes(e.name.toLowerCase().split(' ')[0]) || msg.includes(e.name.toLowerCase())));
    if (match) return `📅 **${match.name}**\nDate: ${new Date(match.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}\nTime: ${match.time} to ${match.endTime || 'Closing'}`;
    return "📅 Most events start at 10:00 AM. Please select a specific event from the dashboard to see its exact timings!";
  }

  // 12. Organizers
  if (/(who|organizer|contact|support|host|dept|department)/.test(msg)) {
    const match = events.find(e => e.status === 'active' && (msg.includes(e.name.toLowerCase().split(' ')[0]) || msg.includes(e.name.toLowerCase())));
    if (match) return `🏛️ **${match.name}** is organized by the **${match.department}** department of Veltech University.`;
    return "🏛️ Events are organized by various departments (CSE, ECE, Mechanical, etc.) of Veltech University. You can see the organizing department on each event card!";
  }

  // 13. Cancel booking
  if (/(cancel|refund|delete|remove|unbook)/.test(msg))
    return "❌ To cancel a booking:\n1. Click 'My Tickets' in the header\n2. Find your booking\n3. Click 'Delete Booking'\nRefunds (if any) are processed within 2–3 business days.";

  // 14. OTP
  if (/(otp|verify|verification|email verify|confirm email)/.test(msg))
    return "📧 Email verification is required during registration. Enter your email, click 'Send OTP', and type the 6-digit code you receive. It expires in 1 minute.";

  // 15. Thanks
  if (/(thank|thanks|great|awesome|nice|cool|perfect|good|excellent)/.test(msg))
    return "😊 You're welcome! Feel free to ask anything else. Happy to help you at EventX! 🎓";

  // 16. Bye
  if (/(bye|goodbye|see you|cya|take care)/.test(msg))
    return "👋 Goodbye! Have a great time at the event! See you around 🎉";

  // 17. Default
  return "🤔 I didn't quite catch that. Try asking:\n• 'Show upcoming events'\n• 'How do I book a ticket?'\n• 'Where can I find my tickets?'\n• 'Are there any free events?'";
}

// ── Chatbot Component ─────────────────────────────────────
const Chatbot = ({ events = [], bookings = [], role = 'user', user = null, allDepartments = [], onCreateEvent = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, from: 'bot', text: `👋 Hi! I'm the EventX Assistant. I can help you with ${role === 'admin' ? 'managing the platform, analytics and creating events' : 'finding events and booking tickets'}. Ask me anything! 🎓`, ts: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  
  // ── Event Creation State (Admin Only) ───────────────────
  const [creationStep, setCreationStep] = useState(0);
  const [pendingEvent, setPendingEvent] = useState({});

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { if (isOpen) { scrollToBottom(); setUnread(0); } }, [messages, isOpen, scrollToBottom]);
  useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 100); }, [isOpen]);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return;
    const userMsg = { id: Date.now(), from: 'user', text: text.trim(), ts: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    await new Promise(r => setTimeout(r, 600 + Math.random() * 600));

    let reply = '';
    const msg = text.toLowerCase().trim();

    // ── ADMIN: Event Creation Flow ─────────────────────────
    if (role === 'admin' && onCreateEvent) {
      // Allow user to cancel the flow at any time
      if (creationStep > 0 && /(cancel|exit|stop|quit|nevermind)/.test(msg)) {
        setCreationStep(0);
        setPendingEvent({});
        reply = "🆗 Event creation cancelled. What else can I help you with?";
      } else if (creationStep === 0 && /(create|add|new).*(event|booking)/.test(msg)) {
        setCreationStep(1);
        reply = "⚡ Sure! I can help you create a new event. Please tell me the **Event Name**. (Type 'cancel' to stop anytime)";
      } else if (creationStep === 1) {
        setPendingEvent(p => ({ ...p, name: text }));
        setCreationStep(2);
        reply = `Got it: "${text}". Which **Department** is organizing this? (e.g., CSE, ECE, MBA)`;
      } else if (creationStep === 2) {
        setPendingEvent(p => ({ ...p, department: text }));
        setCreationStep(3);
        reply = "Great. What is the **Date**? (Format: YYYY-MM-DD)";
      } else if (creationStep === 3) {
        setPendingEvent(p => ({ ...p, date: text }));
        setCreationStep(4);
        reply = "What **Time** does it start? (e.g., 10:00 AM)";
      } else if (creationStep === 4) {
        setPendingEvent(p => ({ ...p, time: text }));
        setCreationStep(5);
        reply = "Where is the **Venue**? (e.g., Main Auditorium)";
      } else if (creationStep === 5) {
        setPendingEvent(p => ({ ...p, venue: text }));
        setCreationStep(6);
        reply = "What is the **Price** per ticket? (Enter 0 for Free)";
      } else if (creationStep === 6) {
        setPendingEvent(p => ({ ...p, price: text }));
        setCreationStep(7);
        reply = "Finally, how many **Total Tickets** are available?";
      } else if (creationStep === 7) {
        const finalEvent = { ...pendingEvent, totalTickets: text, availableTickets: text, status: 'active', description: `Created via AI Assistant on ${new Date().toLocaleDateString()}` };
        setIsTyping(false);
        const success = await onCreateEvent(finalEvent);
        if (success) {
          reply = "✅ **Success!** The event has been created and is now live on the dashboard for all users. Anything else you need?";
        } else {
          reply = "❌ **Error:** I couldn't create the event. Please ensure all details are correct and try again.";
        }
        setCreationStep(0);
        setPendingEvent({});
      }
    }

    // ── Standard Replies (if not in creation flow) ─────────
    if (!reply) {
      reply = getBotReply(text, events, role, bookings, user, allDepartments);
    }

    setIsTyping(false);
    const botMsg = { id: Date.now() + 1, from: 'bot', text: reply, ts: new Date() };
    setMessages(prev => [...prev, botMsg]);
    if (!isOpen) setUnread(prev => prev + 1);
  }, [events, bookings, isOpen, role, user, onCreateEvent, creationStep, pendingEvent]);

  const handleSubmit = (e) => { e.preventDefault(); sendMessage(input); };

  const QUICK = role === 'admin' 
    ? ['Create Event', 'View Bookings', 'Help', 'Analytics']
    : ['Show events', 'How to book?', 'Where are my tickets?', 'Free events?', 'Check availability'];

  const fmtTime = (d) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <>
      {/* Floating Button */}
      <button
        id="btn-chatbot-toggle"
        onClick={() => { setIsOpen(o => !o); setUnread(0); }}
        title="EventX Assistant"
        aria-label="Open chatbot"
        style={{
          position: 'fixed', bottom: '28px', right: '28px', zIndex: 9999,
          width: '58px', height: '58px', borderRadius: '50%',
          background: role === 'admin' ? 'linear-gradient(135deg, #ef4444, #7c3aed)' : 'linear-gradient(135deg, #7c3aed, #3b82f6)',
          border: 'none', cursor: 'pointer', boxShadow: role === 'admin' ? '0 8px 32px rgba(239,68,68,0.4)' : '0 8px 32px rgba(124,58,237,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem', transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {isOpen ? '✕' : '💬'}
        {unread > 0 && !isOpen && (
          <span style={{
            position: 'absolute', top: '-4px', right: '-4px',
            background: '#ef4444', color: '#fff', fontSize: '0.6rem', fontWeight: 800,
            width: '18px', height: '18px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #0a0a12',
          }}>{unread}</span>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: '98px', right: '28px', zIndex: 9998,
          width: '340px', maxHeight: '520px',
          display: 'flex', flexDirection: 'column',
          borderRadius: '20px', overflow: 'hidden',
          background: 'rgba(10,10,20,0.97)',
          backdropFilter: 'blur(24px)',
          border: `1px solid ${role === 'admin' ? 'rgba(239,68,68,0.3)' : 'rgba(124,58,237,0.3)'}`,
          boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
          animation: 'fadeInUp 0.25s ease both',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px',
            background: role === 'admin' ? 'linear-gradient(135deg, rgba(239,68,68,0.3), rgba(124,58,237,0.2))' : 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(59,130,246,0.2))',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: role === 'admin' ? 'linear-gradient(135deg, #ef4444, #7c3aed)' : 'linear-gradient(135deg, #7c3aed, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>{role === 'admin' ? '🛡️' : '🤖'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>EventX {role === 'admin' ? 'Admin' : 'Assistant'}</div>
              <div style={{ fontSize: '0.7rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '6px', height: '6px', background: '#34d399', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                Online · Veltech University
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '1rem', padding: '4px', borderRadius: '6px' }}>✕</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(124,58,237,0.3) transparent' }}>
            {messages.map(m => (
              <div key={m.id} style={{ display: 'flex', flexDirection: m.from === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '8px' }}>
                {m.from === 'bot' && (
                  <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: role === 'admin' ? 'linear-gradient(135deg, #ef4444, #7c3aed)' : 'linear-gradient(135deg, #7c3aed, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', flexShrink: 0 }}>{role === 'admin' ? '🛡️' : '🤖'}</div>
                )}
                <div style={{ maxWidth: '78%' }}>
                  <div style={{
                    padding: '9px 13px', borderRadius: m.from === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: m.from === 'user' ? (role === 'admin' ? 'linear-gradient(135deg, #ef4444, #7c3aed)' : 'linear-gradient(135deg, #7c3aed, #3b82f6)') : 'rgba(255,255,255,0.07)',
                    border: m.from === 'bot' ? '1px solid rgba(255,255,255,0.08)' : 'none',
                    fontSize: '0.82rem', color: '#fff', lineHeight: '1.5',
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  }}>{m.text}</div>
                  <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', marginTop: '3px', textAlign: m.from === 'user' ? 'right' : 'left', paddingLeft: '4px', paddingRight: '4px' }}>
                    {fmtTime(m.ts)}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: role === 'admin' ? 'linear-gradient(135deg, #ef4444, #7c3aed)' : 'linear-gradient(135deg, #7c3aed, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', flexShrink: 0 }}>{role === 'admin' ? '🛡️' : '🤖'}</div>
                <div style={{ padding: '10px 14px', borderRadius: '18px 18px 18px 4px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {[0, 0.2, 0.4].map((d, i) => (
                    <span key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: role === 'admin' ? '#ef4444' : '#7c3aed', display: 'inline-block', animation: `bounce 1s ${d}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies */}
          <div style={{ padding: '8px 12px', display: 'flex', gap: '6px', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            {QUICK.map(q => (
              <button key={q} onClick={() => sendMessage(q)} style={{ padding: '4px 10px', borderRadius: '100px', background: role === 'admin' ? 'rgba(239,68,68,0.15)' : 'rgba(124,58,237,0.15)', border: `1px solid ${role === 'admin' ? 'rgba(239,68,68,0.3)' : 'rgba(124,58,237,0.3)'}`, color: role === 'admin' ? '#fca5a5' : '#c4b5fd', fontSize: '0.7rem', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}>
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '8px' }}>
            <input
              ref={inputRef}
              id="chatbot-input"
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={creationStep > 0 ? "Enter details..." : "Ask me anything…"}
              style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '100px', padding: '9px 14px', color: '#fff', fontSize: '0.82rem', outline: 'none', fontFamily: 'inherit' }}
            />
            <button type="submit" disabled={!input.trim() || isTyping}
              style={{ width: '36px', height: '36px', borderRadius: '50%', background: input.trim() ? (role === 'admin' ? 'linear-gradient(135deg, #ef4444, #7c3aed)' : 'linear-gradient(135deg, #7c3aed, #3b82f6)') : 'rgba(255,255,255,0.08)', border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed', color: '#fff', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}>
              ➤
            </button>
          </form>
        </div>
      )}

      <style>{`
        @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }
      `}</style>
    </>
  );
};

export default Chatbot;
