# Patient Admission Management — Ward Records

A full-stack web application for hospital staff to manage admitted patients.
Built for the **DScribe Software Engineer Intern — Round 1 Task**.

## Live Link

- **Frontend:** https://patient-admission-app-beta.vercel.app
- **Backend API:** https://patient-admission-fullstack.onrender.com/api/patients

> Note: Backend is on Render free tier — first request may take 30–60 seconds to wake up.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Backend | Java 17 + Spring Boot 3.5 |
| Database | H2 file-based (persists across restarts) |
| Styling | Plain CSS — responsive for mobile, tablet, desktop |
| Deployment | Vercel (frontend) + Render Docker (backend) |

## Features

- Add a patient
- View list of all patients
- Filter by Ward, Department and Doctor
- Search patients by name
- Edit a patient
- Delete a patient (with confirmation)
- Mark a patient as Discharged
- Clean responsive design (mobile, tablet, desktop)
- Frontend + Backend validation
- Data persists after server restart

## Steps to Run Locally

### Prerequisites
- Java 17 or later
- Maven 3.9+
- Node.js 20+

### 1 — Start the Backend

```bash
cd backend
mvn spring-boot:run
```

API runs at: `http://localhost:8080/api/patients`

### 2 — Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at: `http://localhost:5173`

## Dropdown Values

| Field | Options |
|---|---|
| Gender | Male, Female, Other |
| Ward | Ward 3, Ward 5, ICU, Maternity |
| Department | Cardiology, General Medicine, Neurology, Obstetrics, Orthopedics, Pediatrics |
| Doctor | Dr. Asha Patel, Dr. Elias Morgan, Dr. Elena Ruiz, Dr. Nia Okafor, Dr. Sophie Laurent |

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/patients` | List all patients |
| GET | `/api/patients?search=name` | Search by name |
| GET | `/api/patients?ward=ICU` | Filter by ward |
| GET | `/api/patients/{id}` | Get one patient |
| POST | `/api/patients` | Add patient |
| PUT | `/api/patients/{id}` | Edit patient |
| PATCH | `/api/patients/{id}/discharge` | Mark as discharged |
| DELETE | `/api/patients/{id}` | Delete patient |

## Validation

Frontend validates before submitting. Backend uses Bean Validation and returns HTTP 400 with a clear error message for invalid data.

## Database

H2 file-based database — data saved to `backend/data/patientdb.mv.db`. Survives backend restarts.
