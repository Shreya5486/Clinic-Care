export interface Doctor {
  id: string;
  name: string;
  email: string;
  specialisation: string;
  workingHoursStart: string; // e.g. "09:00"
  workingHoursEnd: string;   // e.g. "17:00"
  slotDuration: number;      // e.g. 30 (minutes)
  leaveDays: string[];       // e.g. ["2026-07-10"]
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorEmail: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  date: string;              // YYYY-MM-DD
  slot: string;              // HH:MM
  symptoms: string;
  urgency?: 'Low' | 'Medium' | 'High';
  preVisitSummary?: string;
  clinicalNotes?: string;
  prescription?: string;
  postVisitSummary?: string;
  status: 'booked' | 'cancelled' | 'completed';
  calendarEventId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Reminder {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  doctorName: string;
  medication: string;
  frequency: string;         // e.g., "Daily", "Twice daily", "Weekly"
  nextRun: string;           // ISO timestamp
  status: 'active' | 'sent' | 'cancelled';
}

export interface NotificationLog {
  id: string;
  recipientEmail: string;
  subject: string;
  body: string;
  sentAt: string;
  status: 'sent' | 'failed';
  type: 'booking' | 'reminder' | 'cancellation' | 'leave';
}
