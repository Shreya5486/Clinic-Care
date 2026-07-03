import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Doctor, Appointment, Reminder } from '../types';
import { 
  HeartPulse, 
  Clock, 
  AlertTriangle, 
  Check, 
  Sparkles, 
  FileText, 
  Pill, 
  User, 
  ChevronRight 
} from 'lucide-react';

interface DoctorPortalProps {
  onNotificationTriggered: () => void;
}

export default function DoctorPortal({ onNotificationTriggered }: DoctorPortalProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Notes submission state
  const [selectedApp, setSelectedApp] = useState<Appointment | null>(null);
  const [notes, setNotes] = useState('');
  const [prescription, setPrescription] = useState('');
  const [reminderFreq, setReminderFreq] = useState('Daily');
  const [submitting, setSubmitting] = useState(false);
  const [notesError, setNotesError] = useState('');
  const [notesSuccess, setNotesSuccess] = useState('');

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDocId) {
      fetchAppointments(selectedDocId);
    } else {
      setAppointments([]);
      setLoading(false);
    }
  }, [selectedDocId]);

  const fetchDoctors = async () => {
    try {
      const list = await api.getDoctors();
      if (list.length === 0) {
        await autoSeedDoctors();
      } else {
        setDoctors(list);
        if (list.length > 0) {
          setSelectedDocId(list[0].id);
        } else {
          setLoading(false);
        }
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
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
      console.error('Error seeding doctors from doctor portal:', err);
      setLoading(false);
    }
  };

  const fetchAppointments = async (docId: string) => {
    setLoading(true);
    try {
      const list = await api.getAppointments({ doctorId: docId });
      setAppointments(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    setNotesError('');
    setNotesSuccess('');
    setSubmitting(true);

    if (!notes || !prescription) {
      setNotesError('Please enter clinical notes and medication prescription details.');
      setSubmitting(false);
      return;
    }

    try {
      // 1. Fetch LLM patient-friendly post-visit summary
      const response = await fetch('/api/ai/post-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: `${notes}. Prescribed: ${prescription}` })
      });

      const aiResult = await response.json();
      if (!response.ok) {
        throw new Error(aiResult.error || 'Failed to generate AI post-visit summary');
      }

      const formattedPostVisitSummary = `
### Summary of Visit
${aiResult.summary}

### Medication Directions
${aiResult.medicationSchedule}

### Next Steps & Follow-up
${aiResult.followUpSteps}
      `.trim();

      // 2. Update Appointment document
      await api.updateClinicalNotes(selectedApp.id, {
        clinicalNotes: notes,
        prescription,
        postVisitSummary: formattedPostVisitSummary,
        status: 'completed'
      });

      // 3. Register Medication Reminder
      const reminderId = `rem_${Date.now()}`;
      let nextRun = new Date();
      if (reminderFreq === 'Demo Alert (10s)') {
        nextRun.setSeconds(nextRun.getSeconds() + 10);
      } else if (reminderFreq === 'Daily') {
        nextRun.setDate(nextRun.getDate() + 1);
      } else if (reminderFreq === 'Twice daily') {
        nextRun.setHours(nextRun.getHours() + 12);
      } else if (reminderFreq === 'Weekly') {
        nextRun.setDate(nextRun.getDate() + 7);
      }

      const newReminder: Reminder = {
        id: reminderId,
        appointmentId: selectedApp.id,
        patientId: selectedApp.patientId,
        patientName: selectedApp.patientName,
        patientEmail: selectedApp.patientEmail,
        doctorName: selectedApp.doctorName,
        medication: prescription,
        frequency: reminderFreq,
        nextRun: nextRun.toISOString(),
        status: 'active'
      };

      await api.createReminder(newReminder);

      setNotesSuccess('Visit completed! AI patient summary compiled, and medication reminders scheduled.');
      setNotes('');
      setPrescription('');
      setSelectedApp(null);
      
      // Refresh list
      fetchAppointments(selectedDocId);
      onNotificationTriggered();
    } catch (err: any) {
      setNotesError(err.message || 'Failed to complete appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const activeDoc = doctors.find(d => d.id === selectedDocId);

  return (
    <div className="space-y-8 animate-fade-in" id="doctor-portal">
      {/* Selector for physician simulation */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shadow-sm">
            <HeartPulse className="w-5.5 h-5.5" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-gray-950 flex items-center space-x-1.5">
              <span>Physician Simulation Desk</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Toggle between active doctor profiles to emulate consultation workflow and review schedules.</p>
          </div>
        </div>

        <div className="flex items-center space-x-3.5 bg-slate-50/80 px-4 py-2 rounded-2xl border border-slate-100">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Profile:</label>
          <select
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="text-xs font-semibold text-gray-800 bg-white border border-slate-200/80 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-600/10 cursor-pointer"
          >
            {doctors.length === 0 ? (
              <option value="">No physicians created yet</option>
            ) : (
              doctors.map(d => (
                <option key={d.id} value={d.id}>Dr. {d.name} ({d.specialisation})</option>
              ))
            )}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm font-medium animate-pulse">Loading physician schedules...</div>
      ) : !selectedDocId || doctors.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-slate-200 shadow-xs max-w-lg mx-auto space-y-3">
          <p className="text-sm font-semibold text-gray-700">No doctor profiles registered</p>
          <p className="text-xs text-gray-400 leading-relaxed">
            Please switch to the Administrator role to configure professional doctor profiles before reviewing the Physician Simulation Portal.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Appointment list */}
          <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-slate-50 pb-3">
                <h3 className="font-display text-sm font-bold text-gray-950 flex items-center justify-between">
                  <span>Schedules for Dr. {activeDoc?.name}</span>
                  <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100 font-mono">
                    {appointments.length} Total
                  </span>
                </h3>
                <p className="text-[10px] text-gray-400 mt-1">Review active bookings and click on booked slots to open the active visit consultation desk.</p>
              </div>

              {appointments.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-150">
                  No consultation appointments scheduled.
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {appointments.map(app => {
                    const isSelected = selectedApp?.id === app.id;
                    const isCompleted = app.status === 'completed';
                    return (
                      <div
                        key={app.id}
                        onClick={() => {
                          if (app.status === 'booked') {
                            setSelectedApp(app);
                            setNotesSuccess('');
                            setNotesError('');
                          }
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all duration-200 relative ${
                          app.status !== 'booked' ? 'bg-slate-50/70 border-slate-100/80 opacity-60' :
                          isSelected ? 'bg-blue-50/40 border-blue-400 shadow-xs' :
                          'bg-white border-slate-100 hover:border-slate-200 hover:shadow-xs cursor-pointer'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-display font-semibold text-gray-950 text-sm">{app.patientName}</p>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">{app.patientEmail}</p>
                          </div>
                          
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                            app.status === 'booked' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                            app.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            'bg-slate-100 text-slate-400 border-slate-200'
                          }`}>
                            {app.status}
                          </span>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-400">
                          <span className="flex items-center space-x-1 font-mono">
                            <Clock className="w-3.5 h-3.5 text-slate-300" />
                            <span>{app.date} @ {app.slot}</span>
                          </span>

                          {app.urgency && app.status === 'booked' && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              app.urgency === 'High' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                              app.urgency === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                              'bg-blue-50 text-blue-600 border border-blue-100'
                            }`}>
                              {app.urgency} Urgency
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Active Visit Desk */}
          <div className="lg:col-span-7">
            {selectedApp ? (
              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                <div className="border-b border-slate-150 pb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-base font-bold text-gray-950">Active Consultation Desk</h3>
                    <p className="text-xs text-gray-400 mt-1 font-sans">
                      Patient: <strong className="text-slate-700">{selectedApp.patientName}</strong> | Schedule: <strong className="text-slate-700 font-mono">{selectedApp.date} @ {selectedApp.slot}</strong>
                    </p>
                  </div>
                  <button 
                    onClick={() => setSelectedApp(null)}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-600 hover:bg-slate-50 px-2.5 py-1 rounded-lg transition"
                  >
                    Close Desk
                  </button>
                </div>

                {/* AI Pre-visit Symptom Analysis */}
                <div className="bg-gradient-to-br from-blue-50/40 to-indigo-50/40 border border-blue-100/70 rounded-2xl p-4.5 sm:p-5 space-y-4">
                  <h4 className="font-display text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>AI Pre-visit Symptom Insight</span>
                  </h4>

                  <div className="space-y-4 text-xs text-gray-700">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Patient symptoms description</p>
                      <p className="text-slate-800 bg-white/90 p-3.5 rounded-xl border border-blue-100/30 italic leading-relaxed">
                        "{selectedApp.symptoms}"
                      </p>
                    </div>

                    {selectedApp.preVisitSummary ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Symptom Interpretation</p>
                          <div className="bg-white/95 p-3 rounded-xl border border-blue-100/30 space-y-2.5 shadow-xs">
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] text-slate-400">Urgency:</span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                selectedApp.urgency === 'High' ? 'bg-rose-100 text-rose-700' :
                                selectedApp.urgency === 'Medium' ? 'bg-amber-100 text-amber-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {selectedApp.urgency}
                              </span>
                            </div>
                            <p className="text-xs leading-relaxed text-slate-700 font-medium">
                              {selectedApp.preVisitSummary}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Proposed Diagnosis Prompts</p>
                          <ul className="list-disc list-inside space-y-1 text-xs text-slate-700 bg-white/95 p-3.5 rounded-xl border border-blue-100/30 leading-relaxed">
                            <li className="font-medium">Verify fever triggers and pain history timelines.</li>
                            <li className="font-medium">Verify drug allergies or related treatments.</li>
                            <li className="font-medium">Evaluate light sensitivity and local fatigue.</li>
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-white/80 rounded-xl text-xs text-gray-500 italic">
                        No AI summary pre-compiled for this appointment.
                      </div>
                    )}
                  </div>
                </div>

                {/* Consultation inputs */}
                <form onSubmit={handleCompleteVisit} className="space-y-5">
                  <h4 className="font-display text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>Post-Visit Clinical Report</span>
                  </h4>

                  {notesError && (
                    <div className="p-3.5 text-xs text-rose-600 bg-rose-50 rounded-xl border border-rose-100 flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>{notesError}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Clinical Consultation Notes</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Enter professional clinical assessment, diagnosis codes, symptoms feedback, and rehabilitation guides..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full text-xs px-3.5 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/10 bg-slate-50/40 leading-relaxed placeholder-slate-400 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Prescribed Medications Details</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ibuprofen 400mg (three times daily)"
                        value={prescription}
                        onChange={(e) => setPrescription(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/10 bg-slate-50/40 placeholder-slate-400 font-medium"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Follow-up Reminder Frequency</label>
                      <select
                        value={reminderFreq}
                        onChange={(e) => setReminderFreq(e.target.value)}
                        className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/40 font-semibold focus:outline-none focus:ring-2 cursor-pointer"
                      >
                        <option value="Demo Alert (10s)">Demo Alert (Immediate - 10s)</option>
                        <option value="Daily">Daily Scheduled Reminder</option>
                        <option value="Twice daily">Twice Daily Scheduled Reminder</option>
                        <option value="Weekly">Weekly Scheduled Reminder</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-3 rounded-xl font-bold text-sm shadow-md shadow-blue-600/10 hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin text-white" />
                        <span>Compiling Patient Friendly AI Report...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Complete Visit & Submit Notes</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-white p-16 rounded-3xl border border-dashed border-slate-200 text-center flex flex-col items-center justify-center space-y-4 shadow-xs">
                <div className="p-4 bg-slate-50 text-slate-300 rounded-full">
                  <HeartPulse className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-display font-semibold text-gray-900 text-sm">Patient Visit Desk Empty</h4>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto mt-1 leading-relaxed">
                    Select an active booking from the schedules column on the left to review pre-visit symptoms summaries and submit clinical consultation notes.
                  </p>
                </div>
              </div>
            )}

            {notesSuccess && (
              <div className="p-4 mt-4 text-xs text-emerald-800 bg-emerald-50 border border-emerald-150 rounded-2xl flex items-start space-x-2.5 animate-fade-in shadow-xs">
                <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="font-medium">{notesSuccess}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
