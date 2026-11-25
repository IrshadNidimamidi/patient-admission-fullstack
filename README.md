# Patient Admission Management — Ward Records

A full-stack web application for hospital staff to manage admitted patients.
Built for the **DScribe Software Engineer Intern — Round 1 Task**.

---

## Live Link

> 🔗 **[Add your deployed URL here after deployment]**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Backend | Java 17 + Spring Boot 3.5 |
| Database | H2 (file-based, persists across restarts) |
| Styling | Plain CSS (responsive — mobile, tablet, desktop) |

---

## Features

- ✅ Add a patient
- ✅ View list of all patients
- ✅ Filter by Ward, Department and Doctor
- ✅ Search patients by name
- ✅ Edit a patient
- ✅ Delete a patient (with confirmation)
- ✅ Mark a patient as Discharged
- ✅ Clean responsive design (mobile, tablet, desktop)
- ✅ Frontend + Backend validation
- ✅ Data persists after server restart (H2 file-based DB)

---

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

Backend runs at: `http://localhost:8080`
API base: `http://localhost:8080/api/patients`

### 2 — Start the Frontend

Open a **second terminal**:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

### 3 — Open the App

Go to `http://localhost:5173` in your browser.
Make sure the backend is running — the frontend fetches data from port 8080.

---

## Dropdown Values

The frontend and backend both use these exact values:

| Field | Options |
|---|---|
| Gender | Male, Female, Other |
| Ward | Ward 3, Ward 5, ICU, Maternity |
| Department | Cardiology, General Medicine, Neurology, Obstetrics, Orthopedics, Pediatrics |
| Doctor | Dr. Asha Patel, Dr. Elias Morgan, Dr. Elena Ruiz, Dr. Nia Okafor, Dr. Sophie Laurent |
| Status | Admitted, Discharged |

---

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/patients` | List all patients |
| GET | `/api/patients?search=name` | Search by name |
| GET | `/api/patients?ward=ICU&department=Cardiology&doctor=Dr.+Asha+Patel` | Filter |
| GET | `/api/patients/{id}` | Get one patient |
| POST | `/api/patients` | Add patient |
| PUT | `/api/patients/{id}` | Edit patient |
| PATCH | `/api/patients/{id}/discharge` | Mark as discharged |
| DELETE | `/api/patients/{id}` | Delete patient |

---

## Validation

**Frontend** — validates before submitting:
- Name: required, letters and spaces only
- Age: required, 0–120
- Gender, Ward, Department, Doctor: must select from list
- Admission Date: required, cannot be future date

**Backend** — Bean Validation rejects invalid requests with HTTP 400:
```json
{
  "status": 400,
  "error": "Validation failed",
  "message": "name: Name must contain letters and spaces only"
}
```

---

## Database

Uses **H2 file-based database** — data saved to `backend/data/patientdb.mv.db`.
Data survives backend restarts (not in-memory).

H2 console (dev only): `http://localhost:8080/h2-console`
- JDBC URL: `jdbc:h2:file:./data/patientdb`
- Username: `sa`
- Password: *(leave blank)*

---

## Screenshots

> Add screenshots here before submission.

---

## Project Structure

```
patient-admission-fullstack/
├── backend/
│   ├── src/main/java/com/dscribe/patientadmission/
│   │   ├── controller/PatientController.java
│   │   ├── service/PatientService.java
│   │   ├── model/Patient.java
│   │   ├── dto/PatientRequest.java
│   │   ├── repository/PatientRepository.java
│   │   └── exception/GlobalExceptionHandler.java
│   ├── src/main/resources/application.properties
│   └── pom.xml
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── styles.css
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```
