import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { NotificationLog, Reminder } from '../types';
import { 
  Mail, 
  Clock, 
  Bell, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Sparkles, 
  Calendar, 
  ShieldAlert 
} from 'lucide-react';

export default function NotificationCenter() {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsRefreshing(true);
    try {
      const logsList = await api.getNotifications();
      setLogs(logsList);

      const remindersList = await api.getReminders();
      // Sort reminders by nextRun ascending
      remindersList.sort((a, b) => new Date(a.nextRun || '').getTime() - new Date(b.nextRun || '').getTime());
      setReminders(remindersList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in" id="notification-center">
      {/* Description header */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900 flex items-center space-x-2">
            <Bell className="text-blue-600 w-5 h-5" />
            <span>Clinic Dispatcher & Reminder Engine Dashboard</span>
          </h2>
          <p className="text-xs text-gray-500">
            Real-time status of system-generated notifications, email alerts, Google Calendar sync actions, and active medication cron schedules.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={isRefreshing}
          className="px-4 py-2 border border-gray-200 hover:border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white transition flex items-center space-x-1.5"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Console Logs</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Email notifications log */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center space-x-2">
            <Mail className="w-4 h-4 text-gray-500" />
            <span>Dispatched Clinic Alerts & Email Logs</span>
          </h3>

          <p className="text-xs text-gray-500 leading-relaxed">
            Every booking, reschedule, cancellation, or medication reminder writes here immediately. You can inspect actual SMTP email structures and contents here!
          </p>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {loading ? (
              <p className="text-center py-12 text-sm text-gray-400">Loading dispatcher archives...</p>
            ) : logs.length === 0 ? (
              <p className="text-center py-12 text-xs text-gray-400 italic bg-gray-50 rounded-xl border">
                No alerts dispatched yet. Create doctor profiles and book a consultation slot to trigger emails!
              </p>
            ) : (
              logs.map(log => (
                <div key={log.id} className="p-4 border border-gray-100 rounded-xl bg-gray-50/40 text-left space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                        log.type === 'leave' ? 'bg-amber-100 text-amber-800' :
                        log.type === 'reminder' ? 'bg-indigo-100 text-indigo-800' :
                        log.type === 'cancellation' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {log.type}
                      </span>
                      <h4 className="font-semibold text-gray-900 text-sm mt-1">{log.subject}</h4>
                      <p className="text-xs text-gray-400">To: <span className="text-gray-600 font-medium">{log.recipientEmail}</span></p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-[10px] text-gray-400 flex items-center space-x-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{new Date(log.sentAt).toLocaleTimeString()}</span>
                      </span>
                      <span className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center space-x-0.5">
                        <CheckCircle className="w-3 h-3 inline" />
                        <span>Dispatched</span>
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-700 bg-white p-3 rounded-lg border border-gray-100/60 whitespace-pre-line leading-relaxed font-mono">
                    {log.body}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Medication reminder schedules */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center space-x-2">
            <Bell className="w-4 h-4 text-gray-500" />
            <span>Medication Reminders Scheduled Runs</span>
          </h3>

          <p className="text-xs text-gray-500 leading-relaxed">
            The server-side reminder background worker monitors this pool every 15 seconds. Once the countdown expires, it triggers an alert and reschedules the next interval.
          </p>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {loading ? (
              <p className="text-center py-12 text-sm text-gray-400">Loading active reminder registers...</p>
            ) : reminders.length === 0 ? (
              <p className="text-center py-12 text-xs text-gray-400 italic bg-gray-50 rounded-xl border">
                No active reminder schedules. When doctors complete a consultation and prescribe medications, a reminder schedule will appear here immediately!
              </p>
            ) : (
              reminders.map(rem => {
                const now = new Date();
                const next = new Date(rem.nextRun);
                const isOverdue = next <= now;
                return (
                  <div key={rem.id} className="p-4 border border-gray-100 rounded-xl bg-white text-left space-y-3 shadow-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">Medication: {rem.medication}</h4>
                        <p className="text-xs text-gray-400">Patient: <span className="text-gray-700 font-medium">{rem.patientName} ({rem.patientEmail})</span></p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Prescribed by Dr. {rem.doctorName}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase ${
                        rem.status === 'active' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {rem.status}
                      </span>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between text-[11px] text-gray-500 gap-1 border-t border-gray-50 pt-2.5">
                      <span>Frequency: <strong className="text-gray-700">{rem.frequency}</strong></span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span>Next trigger: </span>
                        <strong className={`font-semibold ${isOverdue ? 'text-rose-500 animate-pulse' : 'text-gray-800'}`}>
                          {next.toLocaleTimeString()} ({isOverdue ? 'Triggering...' : 'Pending'})
                        </strong>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
