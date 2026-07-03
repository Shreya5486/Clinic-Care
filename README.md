# Clinic Care: Healthcare Appointment & Follow-up Manager

Welcome to **Clinic Care**, a comprehensive, full-stack healthcare appointment booking and follow-up management platform. Designed with separate, fully functional portals for **Patients**, **Doctors**, and **Admins**, the platform integrates Google Auth, Google Calendar API synchronization, and server-side Gemini AI for clinical symptom interpretation and post-visit summarisation.

---

## 🚀 Setup Guide & Environment Configuration

### Prerequisites
- **Node.js**: v18 or later
- **npm** or **yarn**

### Step-by-Step Installation

1. **Clone & Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file at the root of the project (using `.env.example` as a template):
   ```env
   GEMINI_API_KEY="your_gemini_api_key"
   APP_URL="your_hosted_or_local_url"
   
   # Optional SMTP credentials for live email delivery
   SMTP_HOST="smtp.mailtrap.io"
   SMTP_PORT=2525
   SMTP_USER="your_smtp_username"
   SMTP_PASS="your_smtp_password"
   SMTP_SECURE="false"
   ```

3. **Database Configuration**:
   The application uses Firebase Firestore. Configuration parameters are read directly from `firebase-applet-config.json` at the root, which is auto-provisioned by Google AI Studio Build.

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   The application will boot on port `3000`. Open `http://localhost:3000` to preview.

5. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 📂 Database Schema (Firestore)

The application models its persistent data in Firestore using five main collections:

### 1. `doctors`
Stores doctor profiles and availability.
- `id` (String): Document ID (e.g. `doc_123`)
- `name` (String): Doctor's full name
- `email` (String): Doctor's clinic email
- `specialisation` (String): Specialty (e.g. Neurology, Cardiology)
- `workingHoursStart` (String): Shift start (HH:MM format)
- `workingHoursEnd` (String): Shift end (HH:MM format)
- `slotDuration` (Number): Duration per consultation (e.g., 30 mins)
- `leaveDays` (Array of Strings): Scheduled leave dates (YYYY-MM-DD)

### 2. `patients`
Stores registered patient accounts.
- `id` (String): Firebase Auth UID
- `name` (String): Full name
- `email` (String): Registered email
- `createdAt` (String): ISO Timestamp

### 3. `appointments`
Manages transactional appointment bookings.
- `id` (String): Unique transaction ID
- `doctorId` / `doctorName` / `doctorEmail` (Strings): Cached physician details
- `patientId` / `patientName` / `patientEmail` (Strings): Cached patient details
- `date` (String): Chosen booking date (YYYY-MM-DD)
- `slot` (String): Starting hour slot (HH:MM)
- `symptoms` (String): Patient intake symptoms text
- `urgency` (String): "Low" | "Medium" | "High"
- `preVisitSummary` (String): AI-generated pre-visit report
- `clinicalNotes` (String): Doctor consultation notes
- `prescription` (String): Medication prescribed
- `postVisitSummary` (String): AI patient-friendly follow-up summary
- `status` (String): "booked" | "cancelled" | "completed"
- `calendarEventId` (String): Linked Google Calendar Event ID

### 4. `reminders`
Holds pending medication schedule tasks.
- `id` (String): Unique reminder ID
- `appointmentId` / `patientId` / `patientName` / `patientEmail` (Strings): References
- `doctorName` (String): Prescribing doctor
- `medication` (String): Active prescription
- `frequency` (String): Schedule interval ("Demo Alert (10s)", "Daily", etc.)
- `nextRun` (String): ISO Timestamp of the next notification run
- `status` (String): "active" | "sent" | "cancelled"

### 5. `notifications`
An audit trail and dispatch log for emails.
- `id` (String): Unique log ID
- `recipientEmail` / `subject` / `body` (Strings): Email payload details
- `type` (String): "booking" | "reminder" | "cancellation" | "leave"
- `sentAt` (String): Timestamp
- `status` (String): "sent" | "failed"

---

## 🤖 LLM Prompts & Graceful Failure Configurations

We utilize the `@google/genai` SDK on the server side to power symptom analyses and consultation conversions.

### Prompt 1: Pre-Visit Symptom Analysis
**System Prompt**:
> "Analyse these symptoms and return: urgency level (Low / Medium / High), chief complaint, and three suggested questions for the doctor. Symptoms: <symptoms>.\n\nYou MUST return ONLY a valid JSON object matching this schema: { \"urgency\": \"Low\"|\"Medium\"|\"High\", \"chiefComplaint\": \"String\", \"suggestedQuestions\": [\"String\", \"String\", \"String\"] }"

### Prompt 2: Post-Visit Consultation Summary
**System Prompt**:
> "Convert these clinical notes into a patient-friendly summary with medication schedule and follow-up steps: <notes>.\n\nYou MUST return ONLY a valid JSON object matching this schema: { \"summary\": \"String\", \"medicationSchedule\": \"String\", \"followUpSteps\": \"String\" }"

### Graceful Failure Handlers
If an LLM call fails (e.g. API key limit reached, network failure, or parsing error), the server handles the exception immediately using structured try-catch blocks and injects a robust fallback schema. The app remains fully operational.

---

## 📅 Google Calendar API Integration with OAuth 2.0

1. **OAuth Setup**: When patients or doctors sign in, they use the Firebase "Sign in with Google" popup.
2. **Access Token Cache**: Upon successful authentication, the Google Calendar access token is securely cached in-memory/sessionStorage.
3. **Event Booking**: On booking, the client-side uses the Google Calendar API to trigger `POST /calendar/v3/calendars/primary/events`, adding both the patient and doctor as attendees.
4. **Cancellation**: When an appointment is cancelled, the client-side issues a `DELETE /calendar/v3/calendars/primary/events/{eventId}` request using the cached token.

---

## 🛠️ API Documentation

### 1. `POST /api/ai/pre-visit`
- **Payload**: `{ "symptoms": "String" }`
- **Output**: JSON containing AI-suggested questions and urgency level.

### 2. `POST /api/ai/post-visit`
- **Payload**: `{ "notes": "String" }`
- **Output**: JSON containing patient-friendly summary, medication schedule, and follow-up steps.

### 3. `POST /api/appointments/book`
- **Payload**: `{ doctorId, patientId, date, slot, symptoms, urgency, preVisitSummary, calendarEventId, ... }`
- **Output**: Transactional booking confirmation. Runs inside a Firestore transaction.

### 4. `POST /api/doctors/leave`
- **Payload**: `{ "doctorId": "String", "date": "YYYY-MM-DD" }`
- **Output**: Marks leave, cancels conflicting bookings, and logs patient notifications.

---

## 📐 System Design Write-Up (Under 800 Words)

### 1. Double-Booking Prevention & Concurrency Control
In a highly active clinic, simultaneous booking attempts for the same physician slot pose a classic concurrency challenge. To guarantee complete transactional isolation, Clinic Care utilizes **Firestore server-side transactions** executed via Node.js `/api/appointments/book`. 

When a patient attempts to book, the database transaction locks the appointment namespace. The transaction executes an atomic read querying active appointments on the specified doctor ID, date, and slot. If the query yields any active booked record, the transaction immediately rolls back and throws an explicit validation error: *"This time slot has already been booked."* Only when the slot is verified to be vacant does the transaction write the new booking document. This architecture completely prevents race conditions and dirty writes, ensuring slot integrity at scale.

### 2. Doctor Leave Conflict Handling
When an admin schedules leave for a doctor on a specific date, any pre-existing appointments on that date represent scheduling conflicts. Clinic Care resolves this by treating leave creation as an atomic cascade operation in `/api/doctors/leave`:
1. The specified date is appended to the doctor's `leaveDays` array.
2. The server queries all active appointments matching the doctor ID and date.
3. For each appointment found, the status is updated from `'booked'` to `'cancelled'` with an explicit `'Doctor leave declared'` audit reason.
4. Simultaneously, a personalized cancellation notification is written to the `notifications` collection and optionally dispatched via Nodemailer.
5. In the UI, the patient is presented with clear reschedule controls, and the corresponding calendar event is safely deleted using the Google Calendar API.

### 3. Slot Hold Mechanism (Safe Orchestration)
To prevent "slot hoarding" (where patients begin booking but abandon the process, keeping slots locked), Clinic Care employs an **Optimistic Slot Allocation** strategy. Instead of placing aggressive write-locks on time slots when a patient opens the booking page, availability is evaluated dynamically on page load and date change. 

The slot is only formally reserved when the transactional booking API completes. If another user books the slot in the brief window between page rendering and booking completion, the transactional safety loop catches it and safely prompts the current user to choose a different slot. This lightweight, non-blocking design optimizes user experience and database throughput.

### 4. Notification Failure Handling & Reliability
Notification systems must be resilient to external SMTP timeouts or API failures. Clinic Care implements a **Durable Notification Outbox Pattern**. 

Instead of relying solely on synchronous email execution (which can fail and disrupt the booking flow), all alerts (booking confirmations, reminders, cancellations) are first persisted as documents inside the `notifications` collection with a status of `'sent'` or `'failed'`. The Express server runs a background loop checking scheduled medication reminders. If a failure occurs, the record is flagged, allowing for automated email retries. Furthermore, the persistent `notifications` outbox is rendered live on the system dashboard, ensuring that patients and doctors always have a reliable, system-of-record console to verify their alerts regardless of external email server status.
