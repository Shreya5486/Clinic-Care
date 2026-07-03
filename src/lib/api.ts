import { Doctor, Appointment, Reminder, NotificationLog } from '../types';

export const api = {
  async getDoctors(): Promise<Doctor[]> {
    const res = await fetch('/api/doctors');
    if (!res.ok) throw new Error('Failed to fetch doctors');
    return res.json();
  },

  async createDoctor(doctor: Doctor): Promise<void> {
    const res = await fetch('/api/doctors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doctor),
    });
    if (!res.ok) throw new Error('Failed to save doctor profile');
  },

  async deleteDoctor(id: string): Promise<void> {
    const res = await fetch(`/api/doctors/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete doctor');
  },

  async getAppointments(filters?: { patientId?: string; doctorId?: string }): Promise<Appointment[]> {
    const params = new URLSearchParams();
    if (filters?.patientId) params.append('patientId', filters.patientId);
    if (filters?.doctorId) params.append('doctorId', filters.doctorId);
    
    const res = await fetch(`/api/appointments?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch appointments');
    return res.json();
  },

  async bookAppointment(data: any): Promise<any> {
    const res = await fetch('/api/appointments/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to book appointment');
    return result;
  },

  async updateClinicalNotes(
    id: string,
    data: { clinicalNotes?: string; prescription?: string; status?: string; postVisitSummary?: string }
  ): Promise<void> {
    const res = await fetch(`/api/appointments/${id}/clinical-notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to save clinical notes');
  },

  async getReminders(): Promise<Reminder[]> {
    const res = await fetch('/api/reminders');
    if (!res.ok) throw new Error('Failed to fetch reminders');
    return res.json();
  },

  async createReminder(reminder: any): Promise<void> {
    const res = await fetch('/api/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reminder),
    });
    if (!res.ok) throw new Error('Failed to create reminder');
  },

  async getNotifications(): Promise<NotificationLog[]> {
    const res = await fetch('/api/notifications');
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  async getPatientProfile(id: string): Promise<any> {
    const res = await fetch(`/api/patients/${id}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to fetch patient profile');
    return res.json();
  },

  async createPatientProfile(id: string, name: string, email: string): Promise<void> {
    const res = await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name, email }),
    });
    if (!res.ok) throw new Error('Failed to create patient profile');
  },

  async markDoctorLeave(doctorId: string, date: string): Promise<any> {
    const res = await fetch('/api/doctors/leave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctorId, date }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to mark leave');
    return result;
  }
};
