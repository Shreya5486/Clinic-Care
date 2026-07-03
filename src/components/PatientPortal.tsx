import React, { useState, useEffect } from 'react';
import { getAccessToken } from '../lib/firebase';
import { api } from '../lib/api';
import { Doctor, Appointment } from '../types';
import { 
  Search, 
  Calendar, 
  Clock, 
  Sparkles, 
  Check, 
  AlertTriangle, 
  User, 
  X, 
  FileText, 
  Pill, 
  HelpCircle,
  Stethoscope
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';

interface PatientPortalProps {
  user: FirebaseUser;
  onNotificationTriggered: () => void;
}

export default function PatientPortal({ user, onNotificationTriggered }: PatientPortalProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialisation, setSpecialisation] = useState('All');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [date, setDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [symptoms, setSymptoms] = useState('');
  
  // AI Pre-visit States
  const [aiLoading, setAiLoading] = useState(false);
  const [aiUrgency, setAiUrgency] = useState<'Low' | 'Medium' | 'High'>('Low');
  const [aiSummary, setAiSummary] = useState('');
  const [aiQuestions, setAiQuestions] = useState<string[]>([]);
  const [aiReady, setAiReady] = useState(false);

  // Booking details
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');

  // Patient bookings history
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const specialisations = [
    'All',
    'Cardiology', 
    'Dermatology', 
    'Neurology', 
    'Pediatrics', 
    'General Medicine', 
    'Psychiatry', 
    'Orthopedics'
  ];

  useEffect(() => {
    fetchDoctors();
    fetchMyBookings();
  }, []);

  useEffect(() => {
    if (selectedDoctor && date) {
      calculateAvailableSlots(selectedDoctor, date);
    } else {
      setAvailableSlots([]);
    }
  }, [selectedDoctor, date]);

  const fetchDoctors = async () => {
    try {
      const list = await api.getDoctors();
      if (list.length === 0) {
        await autoSeedDoctors();
      } else {
        setDoctors(list);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyBookings = async () => {
    setLoadingHistory(true);
    try {
      const list = await api.getAppointments({ patientId: user.uid });
      setMyAppointments(list);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const autoSeedDoctors = async () => {
    try {
      const defaultDocs = [
        // Cardiology
        { id: 'doc_cardio_1', name: 'Michael Chen', email: 'michael.chen@clinic.com', specialisation: 'Cardiology', workingHoursStart: '09:00', workingHoursEnd: '17:00', slotDuration: 30, leaveDays: [] },
        { id: 'doc_cardio_2', name: 'Amanda Ross', email: 'amanda.ross@clinic.com', specialisation: 'Cardiology', workingHoursStart: '10:00', workingHoursEnd: '18:00', slotDuration: 30, leaveDays: [] },
        // Dermatology
        { id: 'doc_derm_1', name: 'Sarah Jenkins', email: 'sarah.jenkins@clinic.com', specialisation: 'Dermatology', workingHoursStart: '08:00', workingHoursEnd: '16:00', slotDuration: 15, leaveDays: [] },
        { id: 'doc_derm_2', name: 'David Patel', email: 'david.patel@clinic.com', specialisation: 'Dermatology', workingHoursStart: '11:00', workingHoursEnd: '19:00', slotDuration: 30, leaveDays: [] },
        // Neurology
        { id: 'doc_neuro_1', name: 'Gregory House', email: 'gregory.house@clinic.com', specialisation: 'Neurology', workingHoursStart: '09:00', workingHoursEnd: '17:00', slotDuration: 45, leaveDays: [] },
        { id: 'doc_neuro_2', name: 'Allison Cameron', email: 'allison.cameron@clinic.com', specialisation: 'Neurology', workingHoursStart: '08:30', workingHoursEnd: '16:30', slotDuration: 30, leaveDays: [] },
        // Pediatrics
        { id: 'doc_ped_1', name: 'Lisa Cuddy', email: 'lisa.cuddy@clinic.com', specialisation: 'Pediatrics', workingHoursStart: '09:00', workingHoursEnd: '15:00', slotDuration: 30, leaveDays: [] },
        { id: 'doc_ped_2', name: 'James Wilson', email: 'james.wilson@clinic.com', specialisation: 'Pediatrics', workingHoursStart: '10:00', workingHoursEnd: '17:00', slotDuration: 15, leaveDays: [] },
        // General Medicine
        { id: 'doc_gen_1', name: 'Robert Chase', email: 'robert.chase@clinic.com', specialisation: 'General Medicine', workingHoursStart: '08:00', workingHoursEnd: '17:00', slotDuration: 15, leaveDays: [] },
        { id: 'doc_gen_2', name: 'Eric Foreman', email: 'eric.foreman@clinic.com', specialisation: 'General Medicine', workingHoursStart: '09:00', workingHoursEnd: '18:00', slotDuration: 30, leaveDays: [] },
        // Psychiatry
        { id: 'doc_psych_1', name: 'Charles Xavier', email: 'charles.xavier@clinic.com', specialisation: 'Psychiatry', workingHoursStart: '10:00', workingHoursEnd: '17:00', slotDuration: 60, leaveDays: [] },
        { id: 'doc_psych_2', name: 'Jean Grey', email: 'jean.grey@clinic.com', specialisation: 'Psychiatry', workingHoursStart: '09:00', workingHoursEnd: '15:00', slotDuration: 45, leaveDays: [] },
        // Orthopedics
        { id: 'doc_ortho_1', name: 'Stephen Strange', email: 'stephen.strange@clinic.com', specialisation: 'Orthopedics', workingHoursStart: '08:00', workingHoursEnd: '16:00', slotDuration: 30, leaveDays: [] },
        { id: 'doc_ortho_2', name: 'John Watson', email: 'john.watson@clinic.com', specialisation: 'Orthopedics', workingHoursStart: '10:00', workingHoursEnd: '18:00', slotDuration: 30, leaveDays: [] }
      ];

      for (const d of defaultDocs) {
        await api.createDoctor(d);
      }
      fetchDoctors();
    } catch (err) {
      console.error('Error seeding doctors from patient portal:', err);
    }
  };

  const generateAIPreVisitSummary = async () => {
    if (!symptoms.trim()) {
      alert('Please describe your symptoms first to analyze.');
      return;
    }

    setAiLoading(true);
    setBookingError('');
    try {
      const response = await fetch('/api/ai/pre-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process symptoms with Gemini');
      }

      setAiUrgency(data.urgency || 'Low');
      setAiSummary(data.chiefComplaint || 'Consultation');
      setAiQuestions(data.suggestedQuestions || []);
      setAiReady(true);
    } catch (err: any) {
      console.error(err);
      // fallback
      setAiUrgency('Medium');
      setAiSummary('Symptom consultation evaluation requested.');
      setAiQuestions(['When did these symptoms first occur?']);
      setAiReady(true);
    } finally {
      setAiLoading(false);
    }
  };

  // Helper to generate hour-by-hour times slots based on doctor working hours
  const calculateAvailableSlots = async (docObj: Doctor, selectedDate: string) => {
    setSelectedSlot('');
    
    // Check if the doctor is on leave
    if (docObj.leaveDays && docObj.leaveDays.includes(selectedDate)) {
      setAvailableSlots([]);
      return;
    }

    // Generate all potential slots
    const slots: string[] = [];
    const [startH, startM] = docObj.workingHoursStart.split(':').map(Number);
    const [endH, endM] = docObj.workingHoursEnd.split(':').map(Number);
    
    let current = new Date();
    current.setHours(startH, startM, 0, 0);

    const end = new Date();
    end.setHours(endH, endM, 0, 0);

    while (current < end) {
      const hh = String(current.getHours()).padStart(2, '0');
      const mm = String(current.getMinutes()).padStart(2, '0');
      slots.push(`${hh}:${mm}`);
      current.setMinutes(current.getMinutes() + docObj.slotDuration);
    }

    try {
      const bookedList = await api.getAppointments({ doctorId: docObj.id });
      const bookedSlots = bookedList
        .filter(app => app.date === selectedDate && app.status === 'booked')
        .map(app => app.slot);

      // Filter out the booked slots
      const freeSlots = slots.filter(s => !bookedSlots.includes(s));
      setAvailableSlots(freeSlots);
    } catch (err) {
      console.error(err);
      setAvailableSlots(slots);
    }
  };

  const getEndDateTime = (dStr: string, tStr: string, durationMin: number): string => {
    const [h, m] = tStr.split(':').map(Number);
    const dateObj = new Date(`${dStr}T${tStr}`);
    if (isNaN(dateObj.getTime())) {
      const fallbackObj = new Date();
      return new Date(fallbackObj.getTime() + durationMin * 60000).toISOString();
    }
    return new Date(dateObj.getTime() + durationMin * 60000).toISOString();
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !date || !selectedSlot) {
      setBookingError('Please select doctor, date, and available slot.');
      return;
    }

    setBookingLoading(true);
    setBookingError('');
    setBookingSuccess('');

    let gcalEventId = '';

    try {
      // 1. Double check and create Google Calendar event if OAuth token is available
      const token = await getAccessToken();
      if (token) {
        try {
          const startIso = `${date}T${selectedSlot}:00`;
          const endIso = getEndDateTime(date, selectedSlot, selectedDoctor.slotDuration);

          const eventPayload = {
            summary: `Appointment: Dr. ${selectedDoctor.name} (${selectedDoctor.specialisation})`,
            description: `Healthcare Consultation with Dr. ${selectedDoctor.name}.\n\nPatient reported symptoms:\n"${symptoms || 'General Consultation'}"\n\nAI Urgency Assessment: ${aiUrgency}\nAI Chief Complaint: ${aiSummary}`,
            start: {
              dateTime: startIso,
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
            },
            end: {
              dateTime: endIso,
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
            },
            attendees: [
              { email: user.email || '' },
              { email: selectedDoctor.email }
            ],
            reminders: {
              useDefault: true
            }
          };

          const calRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventPayload)
          });
          
          if (calRes.ok) {
            const calData = await calRes.json();
            gcalEventId = calData.id || '';
            console.log('Google Calendar event created successfully:', gcalEventId);
          } else {
            console.warn('Google Calendar event creation failed or was rejected. Continuing with offline booking.');
          }
        } catch (calErr) {
          console.error('Error creating Google Calendar event:', calErr);
        }
      }

      // 2. Call transactional booking API to book securely and prevent double booking
      const response = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: selectedDoctor.id,
          doctorName: selectedDoctor.name,
          doctorEmail: selectedDoctor.email,
          patientId: user.uid,
          patientName: user.displayName || user.email?.split('@')[0] || 'Patient',
          patientEmail: user.email || '',
          date,
          slot: selectedSlot,
          symptoms: symptoms || 'General Consultation',
          urgency: aiUrgency,
          preVisitSummary: aiSummary,
          calendarEventId: gcalEventId
        })
      });

      const result = await response.json();
      if (!response.ok) {
        // If booking on DB failed, try to delete the previously created calendar event to remain in sync
        if (gcalEventId && token) {
          await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${gcalEventId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
        }
        throw new Error(result.error || 'Server error during transactional booking.');
      }

      setBookingSuccess(`Success! Appointment with Dr. ${selectedDoctor.name} has been booked on ${date} at ${selectedSlot}. Confirmations sent!`);
      
      // Reset form
      setSelectedDoctor(null);
      setDate('');
      setSelectedSlot('');
      setSymptoms('');
      setAiReady(false);
      
      // Refresh my bookings history
      fetchMyBookings();
      onNotificationTriggered();
    } catch (err: any) {
      setBookingError(err.message || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelAppointment = async (app: Appointment) => {
    const confirmed = window.confirm(`Are you sure you want to cancel your appointment with Dr. ${app.doctorName} on ${app.date} at ${app.slot}?`);
    if (!confirmed) return;

    try {
      // 1. Delete Google Calendar Event
      const token = await getAccessToken();
      if (token && app.calendarEventId) {
        try {
          await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${app.calendarEventId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          console.log('Google Calendar event deleted successfully.');
        } catch (calErr) {
          console.error('Failed to delete Google Calendar event:', calErr);
        }
      }

      // 2. Update status in DB
      await api.updateClinicalNotes(app.id, {
        status: 'cancelled'
      });

      fetchMyBookings();
      onNotificationTriggered();
      alert('Appointment cancelled successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to cancel appointment');
    }
  };

  const filteredDoctors = specialisation === 'All' 
    ? doctors 
    : doctors.filter(d => d.specialisation === specialisation);

  return (
    <div className="space-y-8 animate-fade-in" id="patient-portal">
      {/* Booking Form Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Doctor search & Slot Picker */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-sm space-y-7">
          <div className="border-b border-slate-50 pb-4">
            <h2 className="font-display text-lg font-bold text-gray-950 flex items-center space-x-2.5">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <Search className="w-4.5 h-4.5" />
              </div>
              <span>Find Physicians & Book Consultation</span>
            </h2>
            <p className="text-xs text-gray-400 mt-1.5">Filter active specialist doctors and secure your medical appointment slot instantly.</p>
          </div>

          <div className="space-y-6">
            {/* Spec Filter */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">Medical Speciality Filter</label>
              <div className="flex flex-wrap gap-2">
                {specialisations.map(spec => {
                  const isSel = specialisation === spec;
                  return (
                    <button
                      key={spec}
                      onClick={() => {
                        setSpecialisation(spec);
                        setSelectedDoctor(null);
                      }}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 border cursor-pointer ${
                        isSel 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/15' 
                          : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100 hover:text-slate-950'
                      }`}
                    >
                      {spec}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Doctor List */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Available Specialist Doctors ({filteredDoctors.length})</label>
              
              {filteredDoctors.length > 1 && (
                <div className="p-3.5 bg-gradient-to-r from-blue-50/40 to-indigo-50/40 border border-blue-100/40 rounded-2xl flex items-start gap-2.5 shadow-xs">
                  <div className="p-1 bg-blue-100 text-blue-700 rounded-lg">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-800">Multiple Specialists Available</p>
                    <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">
                      You have options! If you do not wish to book an appointment with a particular physician, you can easily select another certified specialist below.
                    </p>
                  </div>
                </div>
              )}

              {doctors.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 space-y-4">
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed">No active physicians registered in the database.</p>
                  <button
                    onClick={autoSeedDoctors}
                    className="text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2.5 rounded-xl border border-blue-200 transition shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer mx-auto animate-pulse"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Auto-populate Specialists (2 for every disease)</span>
                  </button>
                </div>
              ) : filteredDoctors.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  No active doctor profiles registered in this speciality. Administrative staff can add profiles.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[250px] overflow-y-auto pr-1">
                  {filteredDoctors.map(doc => {
                    const isSelected = selectedDoctor?.id === doc.id;
                    return (
                      <div
                        key={doc.id}
                        onClick={() => {
                          setSelectedDoctor(doc);
                          setDate('');
                          setSelectedSlot('');
                        }}
                        className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-200 relative overflow-hidden group ${
                          isSelected 
                            ? 'bg-blue-50/40 border-blue-400 shadow-sm shadow-blue-500/5' 
                            : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-xs'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-0 right-0 w-3 h-3 bg-blue-600 rounded-bl-xl flex items-center justify-center">
                            <div className="w-1 h-1 bg-white rounded-full"></div>
                          </div>
                        )}
                        <h4 className="font-display font-semibold text-sm text-gray-950 group-hover:text-blue-700 transition">Dr. {doc.name}</h4>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">{doc.specialisation}</p>
                        
                        <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between text-[10px] text-gray-400 font-mono">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-gray-300" />
                            <span>Shift: {doc.workingHoursStart} - {doc.workingHoursEnd}</span>
                          </span>
                          <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-sans">
                            {doc.slotDuration} min slots
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Date and Slot selection */}
            {selectedDoctor && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-slate-50">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Select Appointment Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full text-sm px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/10 bg-slate-50/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Available Real-Time Slots</label>
                  {!date ? (
                    <div className="text-xs text-gray-400 py-3 bg-slate-50 px-3.5 rounded-xl border border-slate-100/80 font-medium italic">Select appointment date first</div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-xs text-amber-600 bg-amber-50/60 py-3 px-3.5 rounded-xl border border-amber-100/60 font-medium leading-relaxed">
                      No matching slots available or doctor on leave on this date.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                      {availableSlots.map(s => {
                        const isSel = selectedSlot === s;
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSelectedSlot(s)}
                            className={`py-1.5 px-2 text-xs font-mono font-medium border rounded-lg transition-all duration-150 ${
                              isSel 
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Symptoms Form and AI analysis */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div className="border-b border-slate-50 pb-4">
              <h3 className="font-display text-base font-bold text-gray-950 flex items-center space-x-2">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span>AI Symptom Intake Assistant</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1.5">Describe your feelings to receive smart urgency tags and preparation queries via Gemini.</p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Describe your symptoms in detail</label>
              <textarea
                rows={3}
                placeholder="Describe current symptoms, pain location, duration, and any fever triggers..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="w-full text-xs px-3.5 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600/10 bg-slate-50/50 leading-relaxed placeholder-slate-400"
              />
            </div>

            {symptoms.trim() && (
              <button
                type="button"
                onClick={generateAIPreVisitSummary}
                disabled={aiLoading}
                className="w-full bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-100/60 text-blue-700 py-2.5 rounded-xl text-xs font-semibold hover:from-blue-100 hover:to-indigo-100 active:scale-[0.98] transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                {aiLoading ? (
                  <>
                    <Clock className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    <span>Gemini is evaluating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                    <span>Generate AI Pre-visit Analysis</span>
                  </>
                )}
              </button>
            )}

            {aiReady && (
              <div className="bg-gradient-to-br from-blue-50/30 to-indigo-50/30 border border-blue-100/70 rounded-2xl p-4.5 space-y-3.5 text-xs animate-fade-in shadow-xs">
                <div className="flex justify-between items-center border-b border-blue-100/40 pb-2">
                  <span className="font-semibold text-slate-800">Symptom Assessment</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                    aiUrgency === 'High' ? 'bg-rose-100 text-rose-700' :
                    aiUrgency === 'Medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {aiUrgency} Urgency
                  </span>
                </div>
                
                <div className="space-y-1">
                  <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Chief Complaint Summary</p>
                  <p className="text-gray-700 italic leading-relaxed bg-white/70 p-2.5 rounded-xl border border-blue-50/50">"{aiSummary}"</p>
                </div>

                {aiQuestions.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Recommended Consultation Questions</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-700 bg-white/70 p-2.5 rounded-xl border border-blue-50/50 leading-relaxed">
                      {aiQuestions.map((qStr, i) => (
                        <li key={i} className="text-[11px] font-medium">{qStr}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-50">
            {bookingError && (
              <div className="p-3.5 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            {bookingSuccess && (
              <div className="p-3.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl">
                {bookingSuccess}
              </div>
            )}

            <button
              type="button"
              onClick={handleBookAppointment}
              disabled={bookingLoading || !selectedDoctor || !date || !selectedSlot}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-3 rounded-xl font-bold text-sm shadow-md shadow-blue-600/10 hover:shadow-lg transition-all duration-200 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center space-x-2 cursor-pointer"
            >
              {bookingLoading ? (
                <>
                  <Clock className="w-4 h-4 animate-spin text-white" />
                  <span>Securing Clinic Time Slot...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Secure Booking & Sync Calendar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Bookings History and Post-Visit summaries */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <div className="border-b border-slate-50 pb-4">
          <h3 className="font-display text-base font-bold text-gray-950 flex items-center space-x-2">
            <div className="p-1.5 bg-blue-50/80 text-blue-600 rounded-lg">
              <FileText className="w-4.5 h-4.5" />
            </div>
            <span>My Personal Consultation Bookings</span>
          </h3>
          <p className="text-xs text-gray-400 mt-1">Review active schedules, consult historical reports, and access clinical medication prescriptions.</p>
        </div>

        {loadingHistory ? (
          <div className="py-12 text-center text-slate-400 text-sm font-medium animate-pulse">Retrieving patient clinic files...</div>
        ) : myAppointments.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs bg-slate-50/50 rounded-2xl border border-dashed border-slate-200/60">
            No current clinic appointments found for your profile. Create a booking above to initiate a consultation.
          </div>
        ) : (
          <div className="space-y-5">
            {myAppointments.map(app => (
              <div key={app.id} className="p-5 border border-slate-100 rounded-2xl bg-slate-50/30 hover:border-slate-200/80 transition-all duration-200 space-y-4 text-left shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-display font-bold text-sm text-gray-950">Consultation with Dr. {app.doctorName}</h4>
                    <p className="text-xs text-slate-400 mt-1 font-mono flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-gray-300" />
                      <span>{app.date} @ {app.slot}</span>
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${
                      app.status === 'booked' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                      app.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {app.status}
                    </span>

                    {app.status === 'booked' && (
                      <button
                        onClick={() => handleCancelAppointment(app)}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-100/60 px-2.5 py-1 rounded-lg transition cursor-pointer"
                      >
                        Cancel Appointment
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs text-gray-700">
                  <div className="lg:col-span-5 space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Symptoms Logged</p>
                    <p className="italic bg-white p-3.5 border border-slate-100 rounded-xl leading-relaxed text-gray-700 shadow-xs">"{app.symptoms}"</p>
                  </div>

                  <div className="lg:col-span-7">
                    {app.status === 'completed' && app.postVisitSummary ? (
                      <div className="bg-gradient-to-br from-emerald-50/40 to-teal-50/40 border border-emerald-100 rounded-2xl p-4.5 space-y-3 shadow-xs">
                        <p className="font-display font-bold text-emerald-900 flex items-center space-x-1.5 text-xs">
                          <Sparkles className="w-4 h-4 text-emerald-600" />
                          <span>AI Friendly After-Visit Health Companion</span>
                        </p>
                        
                        <div className="text-gray-700 space-y-2 leading-relaxed font-sans">
                          <div className="bg-white/95 p-4 border border-emerald-100/50 rounded-xl whitespace-pre-line text-xs font-medium text-slate-700 max-h-[180px] overflow-y-auto">
                            {app.postVisitSummary}
                          </div>
                        </div>
                      </div>
                    ) : app.status === 'completed' ? (
                      <div className="text-gray-400 p-4 bg-white border border-slate-100 rounded-xl flex items-center justify-center font-medium shadow-xs">
                        <Clock className="w-4 h-4 animate-spin text-emerald-600 mr-2" />
                        <span>AI is finalizing your after-visit summary report...</span>
                      </div>
                    ) : (
                      <div className="p-4 bg-white border border-slate-100 rounded-xl flex items-start space-x-2.5 text-slate-500 shadow-xs">
                        <Stethoscope className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-slate-700 text-xs">Waiting Consultation</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Report will be compiled once Dr. {app.doctorName} assesses symptoms during clinic visit.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
