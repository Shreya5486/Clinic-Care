import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Doctor, Appointment } from '../types';
import { Plus, Trash, Calendar, Clock, AlertTriangle, Check, User, HeartPulse, Sparkles } from 'lucide-react';

interface AdminPortalProps {
  onNotificationTriggered: () => void;
}

export default function AdminPortal({ onNotificationTriggered }: AdminPortalProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states for new doctor
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [specialisation, setSpecialisation] = useState('Cardiology');
  const [hoursStart, setHoursStart] = useState('09:00');
  const [hoursEnd, setHoursEnd] = useState('17:00');
  const [duration, setDuration] = useState(30);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states for marking leave
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveError, setLeaveError] = useState('');
  const [leaveSuccess, setLeaveSuccess] = useState('');

  const specialisations = [
    'Cardiology', 
    'Dermatology', 
    'Neurology', 
    'Pediatrics', 
    'General Medicine', 
    'Psychiatry', 
    'Orthopedics'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch doctors
      const docList = await api.getDoctors();
      
      if (docList.length === 0) {
        await seedDefaultDoctors();
        return;
      }

      setDoctors(docList);
      if (docList.length > 0) {
        setSelectedDoctorId(docList[0].id);
      }

      // Fetch appointments
      const appList = await api.getAppointments();
      setAppointments(appList);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !email) {
      setError('Please fill in doctor name and email');
      return;
    }

    try {
      const docId = `doc_${Date.now()}`;
      const newDoc: Doctor = {
        id: docId,
        name,
        email,
        specialisation,
        workingHoursStart: hoursStart,
        workingHoursEnd: hoursEnd,
        slotDuration: Number(duration),
        leaveDays: []
      };

      await api.createDoctor(newDoc);
      setSuccess(`Doctor Dr. ${name} added successfully!`);
      setName('');
      setEmail('');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to add doctor');
    }
  };

  const handleDeleteDoctor = async (id: string, doctorName: string) => {
    if (!window.confirm(`Are you sure you want to remove Dr. ${doctorName}?`)) return;
    try {
      await api.deleteDoctor(id);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete doctor');
    }
  };

  const handleMarkLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeaveError('');
    setLeaveSuccess('');

    if (!selectedDoctorId || !leaveDate) {
      setLeaveError('Please select a doctor and date.');
      return;
    }

    const doctor = doctors.find(d => d.id === selectedDoctorId);
    if (!doctor) return;

    const confirmed = window.confirm(
      `Marking Dr. ${doctor.name} on leave for ${leaveDate} will automatically CANCEL all bookings on this date and NOTIFY the patients. Proceed?`
    );
    if (!confirmed) return;

    try {
      const response = await fetch('/api/doctors/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId: selectedDoctorId, date: leaveDate })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Server failed to mark leave');
      }

      setLeaveSuccess(
        `Leave marked for Dr. ${doctor.name} on ${leaveDate}. ${result.cancelledCount} appointments cancelled. Notifications sent!`
      );
      setLeaveDate('');
      fetchData();
      onNotificationTriggered();
    } catch (err: any) {
      setLeaveError(err.message || 'Failed to set leave');
    }
  };

  const seedDefaultDoctors = async () => {
    setError('');
    setSuccess('');
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

      for (const dObj of defaultDocs) {
        await api.createDoctor(dObj);
      }
      setSuccess('Successfully pre-populated 14 specialist doctors (2 for each disease/specialisation category)!');
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to seed doctors');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" id="admin-portal">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-xs">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Physicians</p>
            <p className="text-2xl font-display font-extrabold text-gray-950 mt-1">{doctors.length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-xs">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Bookings</p>
            <p className="text-2xl font-display font-extrabold text-gray-950 mt-1">{appointments.length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl shadow-xs">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Upcoming Today</p>
            <p className="text-2xl font-display font-extrabold text-gray-950 mt-1">
              {appointments.filter(a => a.date === new Date().toISOString().split('T')[0] && a.status === 'booked').length}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Manage Doctor Profiles */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <h2 className="font-display text-base font-bold text-gray-950 flex items-center space-x-2.5">
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Plus className="w-5 h-5" />
            </span>
            <span>Create Doctor Profile</span>
          </h2>

          <form onSubmit={handleAddDoctor} className="space-y-4">
            {error && (
              <div className="p-3.5 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="p-3.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center space-x-2">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Doctor's Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Sarah Connor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/10 bg-slate-50/40 font-medium placeholder-slate-450"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Doctor Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. sarah.connor@clinic.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/10 bg-slate-50/40 font-medium placeholder-slate-450"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Specialisation</label>
                <select
                  value={specialisation}
                  onChange={(e) => setSpecialisation(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/40 font-semibold focus:outline-none focus:ring-2 cursor-pointer"
                >
                  {specialisations.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Shift Start</label>
                <input
                  type="time"
                  required
                  value={hoursStart}
                  onChange={(e) => setHoursStart(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 bg-slate-50/40 font-medium cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Shift End</label>
                <input
                  type="time"
                  required
                  value={hoursEnd}
                  onChange={(e) => setHoursEnd(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 bg-slate-50/40 font-medium cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Slot Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/40 font-semibold focus:outline-none cursor-pointer"
              >
                <option value={15}>15 Minutes Slot</option>
                <option value={30}>30 Minutes Slot</option>
                <option value={45}>45 Minutes Slot</option>
                <option value={60}>60 Minutes Slot</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              Add Doctor Profile
            </button>
          </form>
        </div>

        {/* Doctor Leave Conflict Manager */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <h2 className="font-display text-base font-bold text-gray-950 flex items-center space-x-2.5">
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Calendar className="w-5 h-5" />
            </span>
            <span>Declare Leave & Conflict Resolver</span>
          </h2>

          <p className="text-xs text-gray-400 leading-relaxed font-sans">
            When a physician is marked on leave, the system acts immediately to void scheduling overlaps, flag past bookings as cancelled, and notify patients via automated simulation alerts.
          </p>

          <form onSubmit={handleMarkLeave} className="space-y-4">
            {leaveError && (
              <div className="p-3.5 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{leaveError}</span>
              </div>
            )}
            {leaveSuccess && (
              <div className="p-3.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center space-x-2">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>{leaveSuccess}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Select Physician</label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/40 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="">-- Choose Doctor --</option>
                {doctors.map(doc => (
                  <option key={doc.id} value={doc.id}>Dr. {doc.name} ({doc.specialisation})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Leave Date</label>
              <input
                type="date"
                required
                value={leaveDate}
                onChange={(e) => setLeaveDate(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 bg-slate-50/40 font-medium cursor-pointer"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl font-bold text-sm shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              Declare Leave & Cancel Overlaps
            </button>
          </form>
        </div>
      </div>

      {/* Active Doctors Directory */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-50 pb-3">
          <div>
            <h2 className="font-display text-base font-bold text-gray-950">Physicians Directory</h2>
            <p className="text-xs text-gray-400 mt-0.5">Comprehensive index of active practitioners and their associated weekly schedules.</p>
          </div>
          <button
            onClick={seedDefaultDoctors}
            className="text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 px-3.5 py-2 rounded-xl border border-blue-200 shadow-xs flex items-center space-x-1.5 transition cursor-pointer self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            <span>Seed 14 Specialist Doctors (2 per disease)</span>
          </button>
        </div>
        
        <div className="overflow-x-auto rounded-2xl border border-slate-50">
          <table className="w-full text-left text-xs text-slate-500">
            <thead className="text-[10px] text-slate-400 uppercase bg-slate-50/80 font-bold tracking-wider">
              <tr>
                <th className="px-6 py-3.5 border-b border-slate-100">Doctor</th>
                <th className="px-6 py-3.5 border-b border-slate-100">Specialisation</th>
                <th className="px-6 py-3.5 border-b border-slate-100 font-mono">Working Hours</th>
                <th className="px-6 py-3.5 border-b border-slate-100">Slot Length</th>
                <th className="px-6 py-3.5 border-b border-slate-100">Leave Days</th>
                <th className="px-6 py-3.5 border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {doctors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                    No doctor profiles found. Use the form above to add a new physician profile.
                  </td>
                </tr>
              ) : (
                doctors.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-50/40 transition">
                    <td className="px-6 py-4">
                      <span className="font-display font-bold text-slate-900 text-sm">Dr. {doc.name}</span>
                      <div className="text-[10px] text-slate-400 font-mono">{doc.email}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-600">{doc.specialisation}</td>
                    <td className="px-6 py-4 font-mono text-slate-500 font-medium">{doc.workingHoursStart} - {doc.workingHoursEnd}</td>
                    <td className="px-6 py-4 font-medium text-slate-500">{doc.slotDuration} mins</td>
                    <td className="px-6 py-4">
                      {doc.leaveDays && doc.leaveDays.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {doc.leaveDays.map(ld => (
                            <span key={ld} className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full border border-amber-100">
                              {ld}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400 bg-slate-50/70 px-2 py-0.5 rounded-full border border-slate-100">None scheduled</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteDoctor(doc.id, doc.name)}
                        className="text-rose-500 hover:text-rose-700 p-2 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                      >
                        <Trash className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Appointment Monitoring */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div>
          <h2 className="font-display text-base font-bold text-gray-950">Appointments & Registration Ledger</h2>
          <p className="text-xs text-gray-400 mt-0.5">Full audit trail of patients registrations, symptom severity, and live consultation states.</p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-50">
          <table className="w-full text-left text-xs text-slate-500">
            <thead className="text-[10px] text-slate-400 uppercase bg-slate-50/80 font-bold tracking-wider">
              <tr>
                <th className="px-6 py-3.5 border-b border-slate-100">Patient</th>
                <th className="px-6 py-3.5 border-b border-slate-100">Assigned Physician</th>
                <th className="px-6 py-3.5 border-b border-slate-100 font-mono">Date & Time</th>
                <th className="px-6 py-3.5 border-b border-slate-100">Urgency</th>
                <th className="px-6 py-3.5 border-b border-slate-100">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                    No bookings logged yet in the database.
                  </td>
                </tr>
              ) : (
                appointments.map(app => (
                  <tr key={app.id} className="hover:bg-slate-50/40 transition">
                    <td className="px-6 py-4">
                      <span className="font-display font-bold text-slate-900 text-sm">{app.patientName}</span>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{app.patientEmail}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-700">Dr. {app.doctorName}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-600">{app.date}</span>
                      <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{app.slot}</span>
                    </td>
                    <td className="px-6 py-4">
                      {app.urgency ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          app.urgency === 'High' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                          app.urgency === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          'bg-blue-50 text-blue-700 border border-blue-100'
                        }`}>
                          {app.urgency}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        app.status === 'booked' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        app.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        'bg-slate-100 text-slate-500 border border-slate-250'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
