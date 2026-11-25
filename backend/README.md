# Patient Admission Management — Spring Boot Backend

## Requirements
- Java 17 or later
- Maven 3.9+ (or use your IDE's Maven support)

## Run
From this directory:
```bash
mvn spring-boot:run
```
API base URL: `http://localhost:8080/api/patients`

H2 console: `http://localhost:8080/h2-console`
- JDBC URL: `jdbc:h2:file:./data/patientdb`
- User: `sa`
- Password: leave blank

The file-based H2 database stores data in the `data` directory and retains it after a normal server restart.

## Supported dropdown values
- Gender: `Male`, `Female`, `Other`
- Ward: `Ward 3`, `Ward 5`, `ICU`, `Maternity`
- Department: `Cardiology`, `General Medicine`, `Neurology`, `Obstetrics`, `Orthopedics`, `Pediatrics`
- Doctor: `Dr. Asha Patel`, `Dr. Elias Morgan`, `Dr. Elena Ruiz`, `Dr. Nia Okafor`, `Dr. Sophie Laurent`

The frontend dropdown options must use these exact values, or you can update the validation patterns in `PatientRequest.java`.

## API endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/patients` | List patients |
| GET | `/api/patients?search=irshad` | Search by patient name |
| GET | `/api/patients?ward=ICU&department=Cardiology&doctor=Dr.%20Anil%20Kumar` | Filter |
| GET | `/api/patients/{id}` | Get one patient |
| POST | `/api/patients` | Add patient |
| PUT | `/api/patients/{id}` | Edit patient |
| PATCH | `/api/patients/{id}/discharge` | Mark discharged |
| DELETE | `/api/patients/{id}` | Delete patient |

## Example POST/PUT JSON
```json
{
  "name": "Meera Iyer",
  "age": 34,
  "gender": "Female",
  "ward": "Ward 3",
  "department": "Cardiology",
  "doctor": "Dr. Asha Patel",
  "admissionDate": "2026-11-24"
}
```

Status is set to `Admitted` when a patient is created. The discharge endpoint changes it to `Discharged`.

## Validation
Backend validation checks:
- Name required; letters and spaces only
- Age required; 0–120
- Gender, ward, department and doctor must match supported dropdown values
- Admission date required and cannot be in the future

Invalid requests return HTTP 400 with a readable JSON error message.

## Frontend connection
The React development server commonly runs on `http://localhost:5173`; that origin is enabled with CORS in `PatientController`.
