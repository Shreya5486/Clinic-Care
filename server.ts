import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3000;
const app = express();
app.use(express.json());

// Load Firebase configuration
const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
let firebaseConfig: any = {};
if (fs.existsSync(firebaseConfigPath)) {
  firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
}

// Initialize Firebase Admin SDK
let adminApp;
if (getApps().length === 0) {
  try {
    adminApp = initializeApp({
      projectId: firebaseConfig.projectId || process.env.FIREBASE_PROJECT_ID || 'youthful-ember-f8gvj'
    });
    console.log('Firebase Admin initialized with Project ID:', firebaseConfig.projectId);
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
  }
} else {
  adminApp = getApps()[0];
}

import { localDb } from './local-db';
const firestore = localDb;


// Initialize Google Gen AI
const geminiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: geminiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Helper for sending email (and writing to Firestore notification log)
async function sendSystemNotification(to: string, subject: string, body: string, type: 'booking' | 'reminder' | 'cancellation' | 'leave', appointmentId?: string) {
  const notifId = firestore.collection('notifications').doc().id;
  const notifDoc = {
    id: notifId,
    recipientEmail: to,
    subject,
    body,
    sentAt: new Date().toISOString(),
    status: 'sent',
    type,
    appointmentId: appointmentId || ''
  };

  try {
    // Write notification record to firestore so it displays on the user dashboard
    await firestore.collection('notifications').doc(notifId).set(notifDoc);
    console.log(`Notification logged: ${subject} to ${to}`);

    // If SMTP is configured, we can attempt standard Nodemailer send
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: `"Healthcare Clinic" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text: body,
      });
      console.log('Nodemailer SMTP email delivered successfully');
    }
  } catch (err) {
    console.error('Notification log or SMTP failed:', err);
    // Mark as failed if error occurs
    await firestore.collection('notifications').doc(notifId).update({ status: 'failed' });
  }
}

// Background poll loop for reminders (polls every 15 seconds)
setInterval(async () => {
  try {
    const now = new Date();
    const remindersSnap = await firestore.collection('reminders')
      .where('status', '==', 'active')
      .where('nextRun', '<=', now.toISOString())
      .get();

    for (const doc of remindersSnap.docs) {
      const reminder = doc.data();
      
      // Send reminder notification
      const subject = `Medication Reminder: ${reminder.medication}`;
      const body = `Hi ${reminder.patientName},\n\nThis is a friendly reminder to take your prescribed medication: "${reminder.medication}" (Frequency: ${reminder.frequency}) as directed by Dr. ${reminder.doctorName}.\n\nStay healthy!\n- Clinic Management`;
      
      await sendSystemNotification(
        reminder.patientEmail,
        subject,
        body,
        'reminder',
        reminder.appointmentId
      );

      // Determine next run date based on frequency
      let nextRunDate = new Date();
      if (reminder.frequency === 'Demo Alert (10s)') {
        // Trigger once, then set status to completed
        await doc.ref.update({
          status: 'sent',
          updatedAt: new Date().toISOString()
        });
        continue;
      } else if (reminder.frequency === 'Daily') {
        nextRunDate.setDate(nextRunDate.getDate() + 1);
      } else if (reminder.frequency === 'Twice daily') {
        nextRunDate.setHours(nextRunDate.getHours() + 12);
      } else if (reminder.frequency === 'Weekly') {
        nextRunDate.setDate(nextRunDate.getDate() + 7);
      } else {
        // Fallback default (1 hour)
        nextRunDate.setHours(nextRunDate.getHours() + 1);
      }

      await doc.ref.update({
        nextRun: nextRunDate.toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error running reminders cron loop:', error);
  }
}, 15000);

// ==========================================
// API ROUTES
// ==========================================

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', database: firebaseConfig.projectId });
});

// AI Symptom Pre-visit Summary
app.post('/api/ai/pre-visit', async (req, res) => {
  const { symptoms } = req.body;
  if (!symptoms) {
    return res.status(400).json({ error: 'Symptoms text is required' });
  }

  const prompt = `Analyse these symptoms and return: urgency level (Low / Medium / High), chief complaint, and three suggested questions for the doctor. Symptoms: ${symptoms}.
  
  You MUST return ONLY a valid JSON object matching this schema, without any markdown formatting, backticks, or extra commentary:
  {
    "urgency": "Low" | "Medium" | "High",
    "chiefComplaint": "A short summary of the main symptom",
    "suggestedQuestions": ["Question 1", "Question 2", "Question 3"]
  }`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    const responseText = response.text || '';
    // Clean up potential markdown formatting in model output
    const cleanJSON = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleanJSON);
    res.json(result);
  } catch (error: any) {
    console.error('LLM Pre-visit failure, falling back gracefully:', error);
    // Graceful Fallback if LLM fails
    res.json({
      urgency: 'Medium',
      chiefComplaint: symptoms.substring(0, 80) + (symptoms.length > 80 ? '...' : ''),
      suggestedQuestions: [
        'How long have you been experiencing these symptoms?',
        'Does anything make the symptoms better or worse?',
        'Are you currently taking any other treatments or medications?'
      ],
      fallback: true
    });
  }
});

// AI Post-visit Friendly Summary
app.post('/api/ai/post-visit', async (req, res) => {
  const { notes } = req.body;
  if (!notes) {
    return res.status(400).json({ error: 'Clinical notes are required' });
  }

  const prompt = `Convert these clinical notes into a patient-friendly summary with medication schedule and follow-up steps: ${notes}.
  
  You MUST return ONLY a valid JSON object matching this schema, with no markdown formatting or backticks:
  {
    "summary": "Warm, encouraging, simple explanation of the diagnosis or assessment.",
    "medicationSchedule": "Simple list of medications and when to take them.",
    "followUpSteps": "Clear bulleted list of next steps, warnings, or return instructions."
  }`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    const responseText = response.text || '';
    const cleanJSON = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleanJSON);
    res.json(result);
  } catch (error: any) {
    console.error('LLM Post-visit failure, falling back gracefully:', error);
    // Graceful Fallback
    res.json({
      summary: `Patient-friendly summary: The doctor has evaluated your notes. Diagnosis/treatment plan: ${notes}`,
      medicationSchedule: 'Please take your medications as prescribed in your medical documentation.',
      followUpSteps: 'Monitor your symptoms closely. Contact the clinic or go to the nearest emergency center if symptoms worsen.',
      fallback: true
    });
  }
});

// Safe Transactional Appointment Booking (Preventions Double-Booking)
app.post('/api/appointments/book', async (req, res) => {
  const { 
    doctorId, doctorName, doctorEmail,
    patientId, patientName, patientEmail,
    date, slot, symptoms, urgency, preVisitSummary,
    calendarEventId
  } = req.body;

  if (!doctorId || !patientId || !date || !slot) {
    return res.status(400).json({ error: 'Missing required booking parameters' });
  }

  try {
    const appointmentId = firestore.collection('appointments').doc().id;

    await firestore.runTransaction(async (transaction) => {
      // Check if there is already an active booking for this doctor on this date and slot
      const existingBookings = firestore.collection('appointments')
        .where('doctorId', '==', doctorId)
        .where('date', '==', date)
        .where('slot', '==', slot)
        .where('status', '==', 'booked');

      const snapshot = await transaction.get(existingBookings);
      if (!snapshot.empty) {
        throw new Error('This time slot has already been booked. Please pick another time or date.');
      }

      // Check if doctor is on leave on this date
      const doctorRef = firestore.collection('doctors').doc(doctorId);
      const doctorDoc = await transaction.get(doctorRef);
      if (doctorDoc.exists) {
        const doctorData = doctorDoc.data()!;
        const leaveDays = doctorData.leaveDays || [];
        if (leaveDays.includes(date)) {
          throw new Error(`The doctor is on leave on ${date} and unavailable for booking.`);
        }
      }

      // Record the booking
      const appRef = firestore.collection('appointments').doc(appointmentId);
      transaction.set(appRef, {
        id: appointmentId,
        doctorId,
        doctorName,
        doctorEmail,
        patientId,
        patientName,
        patientEmail,
        date,
        slot,
        symptoms,
        urgency: urgency || 'Low',
        preVisitSummary: preVisitSummary || '',
        status: 'booked',
        calendarEventId: calendarEventId || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    });

    // Send Confirmations
    const confirmSubject = `Appointment Confirmed: Dr. ${doctorName}`;
    const confirmBody = `Dear ${patientName},\n\nYour appointment with Dr. ${doctorName} has been successfully scheduled on ${date} at ${slot}.\n\nSymptoms reported: ${symptoms}\nUrgency: ${urgency}\n\nThank you for choosing our clinic.\n- Clinic Management`;
    
    await sendSystemNotification(patientEmail, confirmSubject, confirmBody, 'booking', appointmentId);
    await sendSystemNotification(doctorEmail, `New Booking Alert: ${patientName}`, `You have a new appointment with patient ${patientName} on ${date} at ${slot}.\n\nSymptoms: ${symptoms}\nAI Pre-Visit Urgency: ${urgency}`, 'booking', appointmentId);

    res.json({ success: true, appointmentId });
  } catch (error: any) {
    console.error('Booking transaction failure:', error);
    res.status(400).json({ error: error.message });
  }
});

// Admin doctor leave marking & cancellation conflict handler
app.post('/api/doctors/leave', async (req, res) => {
  const { doctorId, date } = req.body;
  if (!doctorId || !date) {
    return res.status(400).json({ error: 'Doctor ID and Date are required' });
  }

  try {
    const doctorRef = firestore.collection('doctors').doc(doctorId);
    const docSnap = await doctorRef.get();
    if (!docSnap.exists) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const doctorData = docSnap.data()!;
    const leaveDays = doctorData.leaveDays || [];
    
    if (!leaveDays.includes(date)) {
      leaveDays.push(date);
      await doctorRef.update({ leaveDays });
    }

    // Cancel all appointments scheduled for this doctor on this day
    const affectedSnap = await firestore.collection('appointments')
      .where('doctorId', '==', doctorId)
      .where('date', '==', date)
      .where('status', '==', 'booked')
      .get();

    const cancelledList: any[] = [];
    for (const appDoc of affectedSnap.docs) {
      const appData = appDoc.data();
      await appDoc.ref.update({
        status: 'cancelled',
        updatedAt: new Date().toISOString(),
        cancellationReason: 'Doctor leave declared'
      });

      // Send cancellation emails
      const patientSubject = `ALERT: Appointment Cancelled - Dr. ${doctorData.name} on Leave`;
      const patientBody = `Dear ${appData.patientName},\n\nWe apologize for the inconvenience, but your appointment with Dr. ${doctorData.name} on ${date} at ${appData.slot} has been cancelled because the doctor will be on leave.\n\nPlease log in to the clinic dashboard to reschedule or choose another physician.\n\nWarm regards,\nClinic Management`;
      
      await sendSystemNotification(appData.patientEmail, patientSubject, patientBody, 'leave', appData.id);
      
      cancelledList.push({
        id: appData.id,
        patientName: appData.patientName,
        patientEmail: appData.patientEmail,
        slot: appData.slot,
        calendarEventId: appData.calendarEventId
      });
    }

    // Notify doctor as well
    const doctorSubject = `Leave Confirmed: ${date}`;
    const doctorBody = `Hi Dr. ${doctorData.name},\n\nYour leave on ${date} has been marked. A total of ${affectedSnap.size} appointment(s) have been cancelled, and affected patients have been notified.\n\nBest regards,\nAdministration`;
    await sendSystemNotification(doctorData.email, doctorSubject, doctorBody, 'leave');

    res.json({
      success: true,
      leaveMarked: date,
      cancelledCount: affectedSnap.size,
      cancelledAppointments: cancelledList
    });
  } catch (error: any) {
    console.error('Leave setting conflict resolution failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET doctors list
app.get('/api/doctors', async (req, res) => {
  try {
    const snap = await firestore.collection('doctors').get();
    const list = snap.docs.map(doc => doc.data());
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST create/update doctor
app.post('/api/doctors', async (req, res) => {
  const { id, name, email, specialisation, workingHoursStart, workingHoursEnd, slotDuration, leaveDays } = req.body;
  if (!id || !name || !email) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  try {
    await firestore.collection('doctors').doc(id).set({
      id, name, email, specialisation, workingHoursStart, workingHoursEnd, slotDuration, leaveDays: leaveDays || []
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE doctor
app.delete('/api/doctors/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await firestore.collection('doctors').doc(id).delete();
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET appointments list
app.get('/api/appointments', async (req, res) => {
  const { patientId, doctorId } = req.query;
  try {
    let q: any = firestore.collection('appointments');
    if (patientId) {
      q = q.where('patientId', '==', patientId);
    } else if (doctorId) {
      q = q.where('doctorId', '==', doctorId);
    }
    const snap = await q.get();
    const list = snap.docs.map(doc => doc.data());
    // Sort descending by createdAt
    list.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST clinical notes & prescription
app.post('/api/appointments/:id/clinical-notes', async (req, res) => {
  const { id } = req.params;
  const { clinicalNotes, prescription, status, postVisitSummary } = req.body;
  try {
    await firestore.collection('appointments').doc(id).update({
      clinicalNotes,
      prescription,
      status: status || 'completed',
      postVisitSummary: postVisitSummary || '',
      updatedAt: new Date().toISOString()
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET reminders
app.get('/api/reminders', async (req, res) => {
  try {
    const snap = await firestore.collection('reminders').get();
    const list = snap.docs.map(doc => doc.data());
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST reminders
app.post('/api/reminders', async (req, res) => {
  const { id, appointmentId, patientId, patientName, patientEmail, doctorName, medication, frequency, nextRun, status } = req.body;
  const finalId = id || `rem_${Date.now()}`;
  try {
    await firestore.collection('reminders').doc(finalId).set({
      id: finalId, appointmentId, patientId, patientName, patientEmail, doctorName, medication, frequency, nextRun, status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    res.json({ success: true, id: finalId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET notifications log
app.get('/api/notifications', async (req, res) => {
  try {
    const snap = await firestore.collection('notifications').get();
    const list = snap.docs.map(doc => doc.data());
    list.sort((a: any, b: any) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET patient profile
app.get('/api/patients/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const docSnap = await firestore.collection('patients').doc(id).get();
    if (docSnap.exists) {
      res.json(docSnap.data());
    } else {
      res.status(404).json({ error: 'Patient not found' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST create/update patient profile
app.post('/api/patients', async (req, res) => {
  const { id, name, email } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'ID is required' });
  }
  try {
    const patientRef = firestore.collection('patients').doc(id);
    const docSnap = await patientRef.get();
    if (!docSnap.exists) {
      await patientRef.set({
        id,
        name: name || 'Patient',
        email: email || '',
        createdAt: new Date().toISOString()
      });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mount Vite middleware or Static files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
