import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar, Check, ChevronDown, Clock, Edit2, FileText,
  HeartPulse, Plus, Search, Stethoscope, Trash2, Users, UserCheck, X
} from "lucide-react";

const API = `${import.meta.env.VITE_API_URL || "http://localhost:8080/api"}/patients`;

const OPTIONS = {
  gender:     ["Male", "Female", "Other"],
  ward:       ["Ward 3", "Ward 5", "ICU", "Maternity"],
  department: ["Cardiology", "General Medicine", "Neurology", "Obstetrics", "Orthopedics", "Pediatrics"],
  doctor:     ["Dr. Asha Patel", "Dr. Elias Morgan", "Dr. Elena Ruiz", "Dr. Nia Okafor", "Dr. Sophie Laurent"]
};

// Static doctor roster (frontend-only, no backend needed)
const DOCTORS = [
  { id: 1, name: "Dr. Asha Patel",    dept: "Cardiology",       fee: 800,  status: "Active",    availability: "Mon 09:00–13:00, Tue 09:00–13:00, Wed 09:00–13:00, Thu 09:00–13:00, Fri 09:00–13:00", slots: { Mon:["09:00","10:00","11:00","12:00"], Tue:["09:00","10:00","11:00","12:00"], Wed:["09:00","10:00","11:00","12:00"], Thu:["09:00","10:00","11:00","12:00"], Fri:["09:00","10:00","11:00","12:00"] } },
  { id: 2, name: "Dr. Elias Morgan",  dept: "Neurology",         fee: 1000, status: "Active",    availability: "Mon 15:00–18:00, Tue 15:00–18:00, Thu 10:00–13:00, Sat 10:00–12:00", slots: { Mon:["15:00","16:00","17:00"], Tue:["15:00","16:00","17:00"], Thu:["10:00","11:00","12:00"], Sat:["10:00","11:00"] } },
  { id: 3, name: "Dr. Elena Ruiz",    dept: "Pediatrics",        fee: 500,  status: "Active",    availability: "Mon 09:00–12:00, Wed 09:00–12:00, Fri 09:00–12:00", slots: { Mon:["09:00","10:00","11:00"], Wed:["09:00","10:00","11:00"], Fri:["09:00","10:00","11:00"] } },
  { id: 4, name: "Dr. Nia Okafor",    dept: "General Medicine",  fee: 600,  status: "On Leave",  availability: "Mon 09:00–12:00, Thu 14:00–17:00", slots: { Mon:["09:00","10:00","11:00"], Thu:["14:00","15:00","16:00"] } },
  { id: 5, name: "Dr. Sophie Laurent",dept: "Orthopedics",        fee: 700,  status: "Active",    availability: "Tue 10:00–14:00, Wed 10:00–14:00, Fri 14:00–17:00", slots: { Tue:["10:00","11:00","12:00","13:00"], Wed:["10:00","11:00","12:00","13:00"], Fri:["14:00","15:00","16:00"] } },
];

const PATIENTS_LIST = ["Tara Bose", "Vikram Rao", "Meera Iyer", "Anaya Das", "Arjun Kapoor", "Rohan Mehta"];
const DAY_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const today = new Date().toISOString().slice(0, 10);

const emptyForm = { name: "", age: "", gender: "", ward: "", department: "", doctor: "", admissionDate: today };

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [role, setRole] = useState("Admin"); // "Admin" | "Patient"

  // Admin state
  const [patients, setPatients]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [globalError, setGlobalError]   = useState("");
  const [notice, setNotice]             = useState("");
  const [search, setSearch]             = useState("");
  const [filters, setFilters]           = useState({ ward: "", department: "", doctor: "" });
  const [adminTab, setAdminTab]         = useState("overview");
  const [addOpen, setAddOpen]           = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm]                 = useState(emptyForm);
  const [formError, setFormError]       = useState("");
  const [saving, setSaving]             = useState(false);

  // Patient portal state
  const [viewingAs, setViewingAs]       = useState(PATIENTS_LIST[0]);
  const [patientTab, setPatientTab]     = useState("find");
  const [bookTarget, setBookTarget]     = useState(null); // doctor to book

  // Doctor portal state
  const [actingAs, setActingAs]         = useState(DOCTORS[0].name);
  const [doctorTab, setDoctorTab]       = useState("dashboard");

  /* ── data ── */
  const load = useCallback(async () => {
    setLoading(true); setGlobalError("");
    try {
      const p = new URLSearchParams();
      if (search.trim()) p.set("search", search.trim());
      Object.entries(filters).forEach(([k, v]) => v && p.set(k, v));
      const r = await fetch(`${API}?${p}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setPatients(await r.json());
    } catch (e) {
      setGlobalError(`Cannot reach backend. Start Spring Boot on port 8080. (${e.message})`);
    } finally { setLoading(false); }
  }, [search, filters]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (!notice) return; const t = setTimeout(() => setNotice(""), 3000); return () => clearTimeout(t); }, [notice]);

  const stats = useMemo(() => ({
    total:      patients.length,
    admitted:   patients.filter(p => p.status === "Admitted").length,
    discharged: patients.filter(p => p.status === "Discharged").length,
    doctors:    DOCTORS.length,
  }), [patients]);

  /* ── admin form helpers ── */
  const openAdd   = () => { setForm(emptyForm); setFormError(""); setAddOpen(true); };
  const openEdit  = p  => { setEditTarget(p); setForm({ name: p.name, age: String(p.age), gender: p.gender, ward: p.ward, department: p.department, doctor: p.doctor, admissionDate: p.admissionDate, status: p.status }); setFormError(""); };
  const closeEdit = () => { setEditTarget(null); setFormError(""); };

  const validate = () => {
    if (!form.name.trim()) return "Patient name is required.";
    if (!/^[A-Za-z ]+$/.test(form.name.trim())) return "Name must contain letters and spaces only.";
    const age = Number(form.age);
    if (form.age === "" || !Number.isInteger(age) || age < 0 || age > 120) return "Age must be 0–120.";
    for (const k of ["gender","ward","department","doctor"])
      if (!OPTIONS[k].includes(form[k])) return `Select a valid ${k}.`;
    if (!form.admissionDate) return "Admission date is required.";
    if (form.admissionDate > today) return "Admission date cannot be in the future.";
    return "";
  };

  const save = async e => {
    e.preventDefault();
    const err = validate(); if (err) { setFormError(err); return; }
    setSaving(true); setFormError("");
    const payload = { ...form, name: form.name.trim(), age: Number(form.age), status: form.status || "Admitted" };
    try {
      const isEdit = !!editTarget;
      const r = await fetch(isEdit ? `${API}/${editTarget.id}` : API, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!r.ok) { let b = {}; try { b = await r.json(); } catch {} throw new Error(b.message || b.error || "Could not save."); }
      setAddOpen(false); closeEdit();
      setNotice(isEdit ? "Patient updated." : "Patient added.");
      await load();
    } catch (e) { setFormError(e.message); }
    finally { setSaving(false); }
  };

  const discharge = async p => {
    if (p.status === "Discharged") return;
    try {
      const r = await fetch(`${API}/${p.id}/discharge`, { method: "PATCH" });
      if (!r.ok) throw new Error("Failed.");
      setNotice(`${p.name} discharged.`); await load();
    } catch (e) { setGlobalError(e.message); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const r = await fetch(`${API}/${deleteTarget.id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Failed.");
      setNotice("Patient deleted."); setDeleteTarget(null); await load();
    } catch (e) { setGlobalError(e.message); setDeleteTarget(null); }
  };

  /* ── render ── */
  return (
    <div className="app">

      {/* ══ NAVBAR ══ */}
      <header className="navbar">
        <div className="navbar-left">
          <div className="brand-logo"><HeartPulse size={18}/></div>
          <div className="brand-text">
            <span className="brand-name">Ward Records</span>
            <span className="brand-sub">Hospital Management</span>
          </div>
        </div>

        {/* Admin tabs */}
        {role === "Admin" && (
          <nav className="nav-tabs">
            <button className={`nav-tab${adminTab === "overview"   ? " active" : ""}`} onClick={() => setAdminTab("overview")}>Overview</button>
            <button className={`nav-tab${adminTab === "patients"   ? " active" : ""}`} onClick={() => setAdminTab("patients")}>Patients</button>
            <button className={`nav-tab${adminTab === "doctors"    ? " active" : ""}`} onClick={() => setAdminTab("doctors")}>Doctors &amp; Staff</button>
            <button className={`nav-tab${adminTab === "scheduling" ? " active" : ""}`} onClick={() => setAdminTab("scheduling")}>Scheduling</button>
            <button className={`nav-tab${adminTab === "billing"    ? " active" : ""}`} onClick={() => setAdminTab("billing")}>Billing</button>
            <button className={`nav-tab${adminTab === "reports"    ? " active" : ""}`} onClick={() => setAdminTab("reports")}>Reports</button>
          </nav>
        )}

        {/* Patient tabs */}
        {role === "Patient" && (
          <nav className="nav-tabs">
            <button className={`nav-tab${patientTab === "find"          ? " active" : ""}`} onClick={() => setPatientTab("find")}>Find a Doctor</button>
            <button className={`nav-tab${patientTab === "appointments"  ? " active" : ""}`} onClick={() => setPatientTab("appointments")}>My Appointments</button>
            <button className={`nav-tab${patientTab === "payments"      ? " active" : ""}`} onClick={() => setPatientTab("payments")}>Payments</button>
            <button className={`nav-tab${patientTab === "prescriptions" ? " active" : ""}`} onClick={() => setPatientTab("prescriptions")}>Prescriptions &amp; Reports</button>
          </nav>
        )}

        {/* Doctor tabs */}
        {role === "Doctor" && (
          <nav className="nav-tabs">
            <button className={`nav-tab${doctorTab === "dashboard"    ? " active" : ""}`} onClick={() => setDoctorTab("dashboard")}>Dashboard</button>
            <button className={`nav-tab${doctorTab === "appointments" ? " active" : ""}`} onClick={() => setDoctorTab("appointments")}>Appointments</button>
            <button className={`nav-tab${doctorTab === "mypatients"   ? " active" : ""}`} onClick={() => setDoctorTab("mypatients")}>My Patients</button>
          </nav>
        )}

        <div className="navbar-right">
          {/* Doctor "Acting as" selector */}
          {role === "Doctor" && (
            <div className="viewing-as">
              <span className="viewing-label">Acting as</span>
              <div className="ns-wrap">
                <select value={actingAs} onChange={e => setActingAs(e.target.value)}>
                  {DOCTORS.map(d => <option key={d.name}>{d.name}</option>)}
                </select>
                <ChevronDown size={13} className="ns-arrow"/>
              </div>
            </div>
          )}
          {/* Patient "Viewing as" selector */}
          {role === "Patient" && (
            <div className="viewing-as">
              <span className="viewing-label">Viewing as</span>
              <div className="ns-wrap">
                <select value={viewingAs} onChange={e => setViewingAs(e.target.value)}>
                  {PATIENTS_LIST.map(n => <option key={n}>{n}</option>)}
                </select>
                <ChevronDown size={13} className="ns-arrow"/>
              </div>
            </div>
          )}
          <button className={`role-btn${role === "Patient" ? " active" : ""}`} onClick={() => { setRole("Patient"); setPatientTab("find"); }}>Patient</button>
          <button className={`role-btn${role === "Doctor"  ? " active" : ""}`} onClick={() => { setRole("Doctor"); setDoctorTab("dashboard"); }}>Doctor</button>
          <button className={`role-btn${role === "Admin"   ? " active" : ""}`} onClick={() => { setRole("Admin"); setAdminTab("overview"); }}>Admin</button>
        </div>
      </header>

      {/* ══ TOASTS ══ */}
      {notice      && <div className="toast success"><Check size={14}/> {notice} <button onClick={() => setNotice("")}><X size={13}/></button></div>}
      {globalError && <div className="toast error">{globalError} <button onClick={() => setGlobalError("")}><X size={13}/></button></div>}

      {/* ══ PAGES ══ */}
      <main className="page-wrap">

        {/* Admin */}
        {role === "Admin" && adminTab === "overview" && (
          <OverviewPage stats={stats} patients={patients} onGoPatients={() => setAdminTab("patients")} />
        )}
        {role === "Admin" && adminTab === "patients" && (
          <PatientsPage
            patients={patients} loading={loading}
            search={search} setSearch={setSearch}
            filters={filters} setFilters={setFilters}
            onAdd={openAdd} onEdit={openEdit}
            onDelete={setDeleteTarget} onDischarge={discharge}
          />
        )}
        {role === "Admin" && adminTab === "doctors" && (
          <DoctorsPage />
        )}
        {role === "Admin" && adminTab === "scheduling" && (
          <SchedulingPage />
        )}
        {role === "Admin" && adminTab === "billing" && (
          <BillingPage />
        )}
        {role === "Admin" && adminTab === "reports" && (
          <ReportsPage patients={patients} />
        )}

        {/* Patient portal */}
        {role === "Patient" && patientTab === "find" && (
          <FindDoctorPage viewingAs={viewingAs} onBook={setBookTarget} />
        )}
        {role === "Patient" && patientTab === "appointments" && (
          <MyAppointmentsPage viewingAs={viewingAs} onBook={() => setPatientTab("find")} />
        )}
        {role === "Patient" && patientTab === "payments" && (
          <PaymentsPage viewingAs={viewingAs} />
        )}
        {role === "Patient" && patientTab === "prescriptions" && (
          <PrescriptionsPage viewingAs={viewingAs} />
        )}

        {/* Doctor portal */}
        {role === "Doctor" && doctorTab === "dashboard" && (
          <DoctorDashboard actingAs={actingAs} patients={patients} onManageAppts={() => setDoctorTab("appointments")} onMyPatients={() => setDoctorTab("mypatients")} />
        )}
        {role === "Doctor" && doctorTab === "appointments" && (
          <DoctorAppointments actingAs={actingAs} />
        )}
        {role === "Doctor" && doctorTab === "mypatients" && (
          <DoctorMyPatients actingAs={actingAs} patients={patients} />
        )}
      </main>

      {/* ══ ADMIN MODALS ══ */}
      {addOpen && (
        <Modal title="Add Patient" onClose={() => setAddOpen(false)}>
          <PatientForm form={form} setForm={setForm} formError={formError} saving={saving} onSubmit={save} onCancel={() => setAddOpen(false)} isEdit={false} />
        </Modal>
      )}
      {editTarget && (
        <Modal title="Edit Patient" onClose={closeEdit}>
          <PatientForm form={form} setForm={setForm} formError={formError} saving={saving} onSubmit={save} onCancel={closeEdit} isEdit={true} />
        </Modal>
      )}
      {deleteTarget && (
        <div className="backdrop" onMouseDown={e => e.target === e.currentTarget && setDeleteTarget(null)}>
          <div className="confirm-modal">
            <h3>Delete patient</h3>
            <p>Delete <strong>{deleteTarget.name}</strong>? This cannot be undone.</p>
            <div className="confirm-actions">
              <button className="btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn-danger" onClick={confirmDelete}>Delete patient</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ BOOK APPOINTMENT MODAL ══ */}
      {bookTarget && (
        <BookModal doctor={bookTarget} viewingAs={viewingAs} onClose={() => setBookTarget(null)} onBooked={(msg) => { setNotice(msg); setBookTarget(null); }} />
      )}
    </div>
  );
}

// ─── Doctor Dashboard ────────────────────────────────────────────────────────
const DOCTOR_SCHEDULE = {
  "Dr. Asha Patel": [
    { id:1, time:"09:00", patient:"Tara Bose",    reason:"Playwright smoke visit",  paid:"Paid",   status:"Scheduled",  date:"2026-11-25", fee:800 },
    { id:2, time:"10:00", patient:"Meera Iyer",   reason:"Chest pain follow-up",   paid:"Unpaid", status:"Scheduled",  date:"2026-11-25", fee:800 },
    { id:3, time:"09:00", patient:"Kabir Singh",  reason:"Post-op review",          paid:"Paid",   status:"Completed",  date:"2026-11-20", fee:800 },
  ],
  "Dr. Elias Morgan": [
    { id:1, time:"15:00", patient:"Vikram Rao",   reason:"Neurology consultation",  paid:"Unpaid", status:"Scheduled",  date:"2026-11-25", fee:1000 },
    { id:2, time:"15:00", patient:"Rohan Mehta",  reason:"Headache assessment",     paid:"Paid",   status:"Completed",  date:"2026-11-22", fee:1000 },
  ],
  "Dr. Elena Ruiz": [
    { id:1, time:"09:00", patient:"Anaya Das",    reason:"Routine checkup",         paid:"Paid",   status:"Scheduled",  date:"2026-11-25", fee:500 },
  ],
  "Dr. Nia Okafor": [
    { id:1, time:"09:00", patient:"Sana Sheikh",  reason:"Fever & fatigue",         paid:"Paid",   status:"Cancelled",  date:"2026-11-24", fee:600 },
  ],
  "Dr. Sophie Laurent": [
    { id:1, time:"09:00", patient:"Tara Bose",    reason:"t",                       paid:"Unpaid", status:"Cancelled",  date:"2027-01-05", fee:700 },
    { id:2, time:"11:30", patient:"Arjun Kapoor", reason:"Knee pain after fall",    paid:"Unpaid", status:"Scheduled",  date:"2026-11-25", fee:700 },
    { id:3, time:"10:00", patient:"Tara Bose",    reason:"Playwright smoke visit",  paid:"Paid",   status:"Scheduled",  date:"2026-11-25", fee:700 },
    { id:4, time:"11:00", patient:"Kabir Singh",  reason:"Cast removal follow-up",  paid:"Paid",   status:"Completed",  date:"2026-11-22", fee:700 },
  ],
};

function DoctorDashboard({ actingAs, patients, onManageAppts, onMyPatients }) {
  const doc = DOCTORS.find(d => d.name === actingAs) || DOCTORS[0];
  const allSchedule = DOCTOR_SCHEDULE[actingAs] || [];
  const schedule = allSchedule.filter(s => s.date === today);
  const myPatients = patients.filter(p => p.doctor === actingAs);
  const todayVisits = schedule.length;
  const scheduledAhead = schedule.filter(s => s.status === "Scheduled").length;
  const unpaidFees = schedule.filter(s => s.paid === "Unpaid").reduce((sum, s) => sum + s.fee, 0);

  return (
    <div className="dr-page">
      <div className="dr-header">
        <div>
          <h1 className="page-title">Dr. panel — {actingAs}</h1>
          <p className="dr-sub">{doc.dept} · {doc.availability.split(",")[0].replace(/Mon |Tue |Wed |Thu |Fri |Sat /g,"").trim()} ward</p>
        </div>
        <div className="dr-header-btns">
          <button className="btn-primary" onClick={onManageAppts}>Manage appointments</button>
          <button className="btn-link" onClick={onMyPatients}>My patients</button>
        </div>
      </div>

      <div className="stat-grid" style={{gridTemplateColumns:"repeat(4,1fr)", marginBottom:24}}>
        <StatCard label="TODAY'S VISITS"    value={todayVisits} />
        <StatCard label="SCHEDULED AHEAD"   value={scheduledAhead} />
        <StatCard label="MY PATIENTS"       value={myPatients.length} />
        <StatCard label="UNPAID VISIT FEES" value={`₹${unpaidFees}`} />
      </div>

      <div className="dr-schedule-panel">
        <h2 className="dr-schedule-title"><Calendar size={16}/> Today's schedule</h2>
        {schedule.length === 0 ? (
          <p className="pay-empty" style={{textAlign:"left", padding:"16px 0"}}>No appointments scheduled for today.</p>
        ) : (
          <table className="dr-schedule-table">
            <tbody>
              {schedule.map((s, i) => (
                <tr key={i}>
                  <td className="dr-time">{s.time}</td>
                  <td className="dr-patient">{s.patient}</td>
                  <td className="dr-reason">{s.reason}</td>
                  <td className="dr-pills">
                    <span className={`pill ${s.paid === "Paid" ? "pill-green" : "pill-amber"}`}>{s.paid}</span>
                    <span className="pill pill-teal">{s.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="dr-hint">
        <Users size={13}/> Patients see you under "Find a Doctor" — keep availability current in Admin → Doctors &amp; Staff.
      </p>
    </div>
  );
}

// ─── Doctor Appointments ──────────────────────────────────────────────────────
function DoctorAppointments({ actingAs }) {
  const allAppts = DOCTOR_SCHEDULE[actingAs] || [];
  const [statusFilter, setStatusFilter] = useState("All");
  const [appts, setAppts] = useState(allAppts);
  const [noteTarget, setNoteTarget] = useState(null); // { patient, doctor }

  // reset when doctor changes
  useEffect(() => { setAppts(DOCTOR_SCHEDULE[actingAs] || []); }, [actingAs]);

  const filters = ["All", "Scheduled", "Completed", "Cancelled"];
  const shown = statusFilter === "All" ? appts : appts.filter(a => a.status === statusFilter);

  const markComplete = id => setAppts(prev => prev.map(a => a.id === id ? {...a, status:"Completed"} : a));
  const markCancel   = id => setAppts(prev => prev.map(a => a.id === id ? {...a, status:"Cancelled"} : a));

  return (
    <div className="dr-page">
      <h1 className="page-title">Appointments</h1>
      <p className="page-sub" style={{color:"#1d6fe8"}}>
        Visits booked with {actingAs}. Complete a visit to leave its fee as a pending bill if unpaid.
      </p>

      {/* Filter tabs */}
      <div className="ma-filter-tabs" style={{marginBottom:20}}>
        {filters.map(f => {
          const count = f === "All" ? allAppts.length : allAppts.filter(a => a.status === f).length;
          return (
            <button key={f} className={`ma-ftab${statusFilter === f ? " active" : ""}`} onClick={() => setStatusFilter(f)}>
              {f} {f === "All" ? `(${count})` : count > 0 ? `(${count})` : ""}
            </button>
          );
        })}
      </div>

      {/* Appointment cards */}
      <div className="appt-list">
        {shown.length === 0 ? (
          <div className="pay-list-card"><p className="pay-empty">No {statusFilter.toLowerCase()} appointments.</p></div>
        ) : shown.map(a => (
          <div className="appt-card" key={a.id}>
            <div className="appt-card-left">
              <div className="appt-patient-row">
                <span className="appt-patient">{a.patient}</span>
                <span className={`pill ${
                  a.status === "Scheduled"  ? "pill-teal" :
                  a.status === "Completed"  ? "pill-green" : "pill-red"
                }`}>{a.status}</span>
                <span className={`pill ${a.paid === "Paid" ? "pill-green" : "pill-amber"}`}>{a.paid}</span>
              </div>
              {a.reason && <div className="appt-reason" style={{color: a.status === "Cancelled" ? "#aab4c8" : "#1d6fe8"}}>{a.reason}</div>}
              <div className="appt-meta">
                <Calendar size={12}/> {fmtDate(a.date)}
                &nbsp;&nbsp;<Clock size={12}/> {a.time}
                &nbsp;&nbsp;₹{a.fee}
              </div>
            </div>
            <div className="appt-actions">
              {a.status === "Scheduled" && <>
                <button className="btn-complete" onClick={() => markComplete(a.id)}>Complete</button>
                <button className="appt-action-btn" onClick={() => markCancel(a.id)}>Cancel</button>
              </>}
              <button className="appt-action-btn" onClick={() => setNoteTarget({ patient: a.patient, doctor: actingAs })}>
                <Edit2 size={13}/> Note
              </button>
              <button className="appt-action-btn"><FileText size={13}/> Prescribe</button>
            </div>
          </div>
        ))}
      </div>

      {/* Note modal */}
      {noteTarget && (
        <NoteModal patient={noteTarget.patient} doctor={noteTarget.doctor} onClose={() => setNoteTarget(null)} />
      )}
    </div>
  );
}

// ─── Note Modal ───────────────────────────────────────────────────────────────
function NoteModal({ patient, doctor, onClose, onSave }) {
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes]         = useState("");
  const [saved, setSaved]         = useState(false);

  const submit = e => {
    e.preventDefault();
    if (onSave) {
      onSave(diagnosis, notes);
    } else {
      setSaved(true);
      setTimeout(() => { onClose(); }, 900);
    }
  };

  return (
    <div className="backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal note-modal">
        <div className="modal-head">
          <div>
            <h2>Add Consultation Note</h2>
            <p className="book-modal-sub">For {patient} — attending {doctor}</p>
          </div>
          <button className="modal-close" onClick={onClose}><X size={17}/></button>
        </div>

        {saved ? (
          <div className="note-saved"><Check size={18}/> Note saved successfully.</div>
        ) : (
          <form onSubmit={submit}>
            <div className="pf-full" style={{marginBottom:16}}>
              <label>Diagnosis</label>
              <input
                placeholder="e.g. Essential hypertension"
                value={diagnosis}
                onChange={e => setDiagnosis(e.target.value)}
              />
            </div>
            <div className="pf-full" style={{marginBottom:16}}>
              <label>Consultation Notes</label>
              <textarea
                className="note-textarea"
                placeholder="Observations, vitals, next steps..."
                rows={5}
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
            <div className="pf-actions">
              <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary">Save Note</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}


// ─── Doctor My Patients ───────────────────────────────────────────────────────
function DoctorMyPatients({ actingAs, patients }) {
  const myPatients = patients.filter(p => p.doctor === actingAs);
  const admitted   = myPatients.filter(p => p.status === "Admitted").length;
  const discharged = myPatients.filter(p => p.status === "Discharged").length;
  const avgAge     = myPatients.length ? Math.round(myPatients.reduce((s, p) => s + p.age, 0) / myPatients.length) : 0;
  const [recordPatient, setRecordPatient] = useState(null);

  return (
    <div className="dr-page">
      <h1 className="page-title">My Patients</h1>
      <p className="page-sub">Ward patients under {actingAs}. Open a record to review history and write notes.</p>

      <div className="stat-grid" style={{gridTemplateColumns:"repeat(4,1fr)", marginBottom:24}}>
        <StatCard label="MY PATIENTS" value={myPatients.length} />
        <StatCard label="ADMITTED"    value={admitted} />
        <StatCard label="DISCHARGED"  value={discharged} />
        <StatCard label="AVG AGE"     value={avgAge} />
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th><th>Age</th><th>Gender</th>
              <th style={{color:"#1d6fe8"}}>Ward</th>
              <th>Admission</th>
              <th>Status</th>
              <th style={{textAlign:"right", color:"#1d6fe8"}}>Record</th>
            </tr>
          </thead>
          <tbody>
            {myPatients.length === 0 ? (
              <tr><td colSpan="7" className="td-empty">No patients assigned.</td></tr>
            ) : myPatients.map(p => (
              <tr key={p.id}>
                <td className="td-name" style={{color:"#1d6fe8"}}>{p.name}</td>
                <td>{p.age}</td>
                <td>{p.gender}</td>
                <td>{p.ward}</td>
                <td>{fmtDate(p.admissionDate)}</td>
                <td><span className={`pill ${p.status === "Admitted" ? "pill-green" : "pill-grey"}`}>{p.status}</span></td>
                <td style={{textAlign:"right"}}>
                  <button className="view-record-btn" onClick={() => setRecordPatient(p)}>
                    👁 View record
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {recordPatient && (
        <ClinicalRecordModal patient={recordPatient} actingAs={actingAs} onClose={() => setRecordPatient(null)} />
      )}
    </div>
  );
}


// ─── Clinical Record Modal ────────────────────────────────────────────────────
function ClinicalRecordModal({ patient, actingAs, onClose }) {
  const [recTab, setRecTab]       = useState("appointments");
  const [showNote, setShowNote]   = useState(false);
  const [notes, setNotes]         = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);

  // appointments for this patient from DOCTOR_SCHEDULE
  const appts = (DOCTOR_SCHEDULE[actingAs] || []).filter(a => a.patient === patient.name);

  // demo bills
  const bills = appts.filter(a => a.paid === "Unpaid").map(a => ({ desc: `Consultation — ${actingAs}`, date: a.date, time: a.time, fee: a.fee, paid: "Unpaid" }));

  const tabs = [
    { key:"appointments",  label:`Appointments (${appts.length})` },
    { key:"prescriptions", label:`Prescriptions (${prescriptions.length})` },
    { key:"notes",         label:`Notes (${notes.length})` },
    { key:"bills",         label:`Bills (${bills.length})` },
  ];

  return (
    <div className="backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal cr-modal">
        {/* Header */}
        <div className="modal-head">
          <div>
            <h2>{patient.name} — clinical record</h2>
            <p className="book-modal-sub">{patient.age} · {patient.gender} · {patient.ward} · {patient.department}</p>
          </div>
          <button className="modal-close" onClick={onClose}><X size={17}/></button>
        </div>

        {/* Action buttons */}
        <div className="cr-actions">
          <button className="btn-ghost cr-btn" onClick={() => setShowNote(true)}><Edit2 size={13}/> Add note</button>
          <button className="btn-primary"><FileText size={13}/> New prescription</button>
        </div>

        {/* Tabs */}
        <div className="cr-tabs">
          {tabs.map(t => (
            <button key={t.key} className={`cr-tab${recTab === t.key ? " active" : ""}`} onClick={() => setRecTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="cr-body">
          {recTab === "appointments" && (
            appts.length === 0
              ? <p className="pay-empty">No appointments on record.</p>
              : appts.map((a, i) => (
                <div className="cr-row" key={i}>
                  <span className="cr-row-date"><strong>{fmtDate(a.date)}</strong> {a.time}</span>
                  <span className="cr-row-reason">{a.reason}</span>
                  <span className={`pill ${a.status === "Scheduled" ? "pill-teal" : a.status === "Completed" ? "pill-green" : "pill-red"}`}>{a.status}</span>
                  <span className={`pill ${a.paid === "Paid" ? "pill-green" : "pill-amber"}`}>{a.paid}</span>
                </div>
              ))
          )}
          {recTab === "prescriptions" && (
            prescriptions.length === 0
              ? <p className="pay-empty">No prescriptions yet.</p>
              : prescriptions.map((pr, i) => <div className="cr-row" key={i}>{pr.text}</div>)
          )}
          {recTab === "notes" && (
            notes.length === 0
              ? <p className="pay-empty">No notes written yet.</p>
              : notes.map((n, i) => (
                <div className="cr-note-item" key={i}>
                  <div className="cr-note-meta">{n.date} · {actingAs}</div>
                  <div className="cr-note-diag"><strong>{n.diagnosis}</strong></div>
                  <div className="cr-note-text">{n.text}</div>
                </div>
              ))
          )}
          {recTab === "bills" && (
            bills.length === 0
              ? <p className="pay-empty">No pending bills.</p>
              : bills.map((b, i) => (
                <div className="cr-row" key={i}>
                  <span className="cr-row-reason">{b.desc}</span>
                  <span className="cr-row-date">{fmtDate(b.date)} {b.time}</span>
                  <span className="cr-row-fee">₹{b.fee}</span>
                  <span className={`pill ${b.paid === "Paid" ? "pill-green" : "pill-amber"}`}>{b.paid}</span>
                </div>
              ))
          )}
        </div>
      </div>

      {/* Note sub-modal */}
      {showNote && (
        <NoteModal
          patient={patient.name}
          doctor={actingAs}
          onClose={() => setShowNote(false)}
          onSave={(diagnosis, text) => {
            setNotes(prev => [...prev, { diagnosis, text, date: new Date().toLocaleDateString("en-GB") }]);
            setShowNote(false);
            setRecTab("notes");
          }}
        />
      )}
    </div>
  );
}

// ─── Billing page ─────────────────────────────────────────────────────────────
const BILL_CATEGORIES = ["Consultation","Procedure","Pharmacy","Room","Lab","Other"];
const BILL_PATIENTS   = ["Tara Bose","Arjun Kapoor","Sana Sheikh","Vikram Rao","Kabir Singh","Anaya Das","Rohan Mehta","Leela Fernandes"];

const BILLS_INIT = [
  { id:1,  patient:"Tara Bose",       desc:"Consultation — Dr. Aiden Cole",        cat:"Consultation", amount:700,    status:"Paid",    created:"2026-11-25" },
  { id:2,  patient:"Arjun Kapoor",    desc:"Procedure — X-ray & casting",          cat:"Procedure",    amount:3100,   status:"Paid",    created:"2026-11-18" },
  { id:3,  patient:"Sana Sheikh",     desc:"Pharmacy — post-op medication kit",    cat:"Pharmacy",     amount:1240.5, status:"Pending", created:"2026-11-18" },
  { id:4,  patient:"Vikram Rao",      desc:"Room & nursing — ICU day 3",           cat:"Room",         amount:5200,   status:"Pending", created:"2026-11-18" },
  { id:5,  patient:"Kabir Singh",     desc:"Consultation — Dr. Aiden Cole",        cat:"Consultation", amount:700,    status:"Paid",    created:"2026-11-16" },
  { id:6,  patient:"Anaya Das",       desc:"Consultation — Dr. Elena Rostova",     cat:"Consultation", amount:500,    status:"Paid",    created:"2026-11-16" },
  { id:7,  patient:"Rohan Mehta",     desc:"Consultation — Dr. Sarah Jenkins",     cat:"Consultation", amount:800,    status:"Paid",    created:"2026-11-16" },
  { id:8,  patient:"Leela Fernandes", desc:"Consultation — Dr. Priya Nair",        cat:"Consultation", amount:900,    status:"Paid",    created:"2026-11-16" },
  { id:9,  patient:"Rohan Mehta",     desc:"Consultation — Dr. Sarah Jenkins",     cat:"Consultation", amount:800,    status:"Paid",    created:"2026-11-15" },
];

function BillingPage() {
  const [bills, setBills]           = useState(BILLS_INIT);
  const [statusFilter, setStatusFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const shown = statusFilter ? bills.filter(b => b.status === statusFilter) : bills;

  const collected  = bills.filter(b => b.status === "Paid").reduce((s, b) => s + b.amount, 0);
  const pending    = bills.filter(b => b.status === "Pending").reduce((s, b) => s + b.amount, 0);
  const paidShare  = bills.length ? Math.round((bills.filter(b => b.status === "Paid").length / bills.length) * 100) : 0;

  const markPaid = id => setBills(prev => prev.map(b => b.id === id ? {...b, status:"Paid"} : b));

  const addBill = newBill => {
    setBills(prev => [{
      id: Date.now(),
      patient:  newBill.patient,
      desc:     newBill.desc,
      cat:      newBill.cat,
      amount:   Number(newBill.amount),
      status:   "Pending",
      created:  today,
    }, ...prev]);
    setCreateOpen(false);
  };

  return (
    <div className="billing-page">
      {/* Header */}
      <div className="doc-page-header">
        <div>
          <h1 className="page-title">Billing &amp; Payments</h1>
          <p className="page-sub">Hospital charges and collections — consultation fees land here automatically.</p>
        </div>
        <button className="btn-primary" onClick={() => setCreateOpen(true)}>
          <Plus size={15}/> Create Bill
        </button>
      </div>

      {/* 4 stat cards */}
      <div className="stat-grid-8" style={{gridTemplateColumns:"repeat(4,1fr)", marginBottom:20}}>
        <StatCard label="COLLECTED"    value={`₹${collected.toLocaleString()}`} />
        <StatCard label="PENDING"      value={`₹${pending.toLocaleString()}`} />
        <StatCard label="BILLS SHOWN"  value={shown.length} />
        <StatCard label="PAID SHARE"   value={`${paidShare}%`} />
      </div>

      {/* Filter + note row */}
      <div className="billing-toolbar">
        <div className="ns-wrap">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option>Paid</option>
            <option>Pending</option>
          </select>
          <ChevronDown size={14} className="ns-arrow"/>
        </div>
        <span className="billing-note">
          <span style={{color:"#aab4c8"}}>⊙</span> Demo payments — no real gateway
        </span>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{color:"#1d6fe8"}}>Patient</th>
              <th style={{color:"#1d6fe8"}}>Description</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Created</th>
              <th style={{textAlign:"right"}}>Action</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <tr><td colSpan="7" className="td-empty">No bills found.</td></tr>
            ) : shown.map(b => (
              <tr key={b.id}>
                <td className="td-name" style={{color: b.status === "Pending" ? "#1d6fe8" : "#1a1f36"}}>{b.patient}</td>
                <td style={{color: b.status === "Pending" ? "#1d6fe8" : "#525f7f", fontSize:13}}>{b.desc}</td>
                <td>{b.cat}</td>
                <td style={{fontWeight:600}}>₹{b.amount.toLocaleString()}</td>
                <td>
                  <span className={`pill ${b.status === "Paid" ? "pill-green" : "pill-amber"}`}>{b.status}</span>
                </td>
                <td style={{color:"#8898aa", fontSize:12}}>{fmtDate(b.created)}</td>
                <td style={{textAlign:"right"}}>
                  {b.status === "Pending" ? (
                    <button className="mark-paid-btn" onClick={() => markPaid(b.id)}>Mark as paid</button>
                  ) : (
                    <span style={{fontSize:12, color:"#aab4c8"}}>Mark as paid</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Bill modal */}
      {createOpen && (
        <CreateBillModal
          patients={BILL_PATIENTS}
          onClose={() => setCreateOpen(false)}
          onSave={addBill}
        />
      )}
    </div>
  );
}

function CreateBillModal({ patients, onClose, onSave }) {
  const [patient, setPatient] = useState("");
  const [desc,    setDesc]    = useState("");
  const [cat,     setCat]     = useState("");
  const [amount,  setAmount]  = useState("");
  const [err,     setErr]     = useState("");

  const submit = e => {
    e.preventDefault();
    if (!patient) { setErr("Select a patient."); return; }
    if (!desc.trim()) { setErr("Enter a description."); return; }
    if (!cat) { setErr("Select a category."); return; }
    if (!amount || Number(amount) <= 0) { setErr("Enter a valid amount."); return; }
    onSave({ patient, desc: desc.trim(), cat, amount });
  };

  return (
    <div className="backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{width:"min(480px,100%)"}}>
        <div className="modal-head">
          <div>
            <h2>Create Bill</h2>
            <p className="book-modal-sub">Charge a patient for pharmacy, room, procedures or other items.</p>
          </div>
          <button className="modal-close" onClick={onClose}><X size={17}/></button>
        </div>
        <form onSubmit={submit}>
          <div className="pf-full" style={{marginBottom:14}}>
            <label>Patient</label>
            <div className="ms-wrap">
              <select value={patient} onChange={e => { setPatient(e.target.value); setErr(""); }}>
                <option value="">Select patient</option>
                {patients.map(p => <option key={p}>{p}</option>)}
              </select>
              <ChevronDown size={14} className="ms-arrow"/>
            </div>
          </div>
          <div className="pf-full" style={{marginBottom:14}}>
            <label>Description</label>
            <input
              placeholder="e.g. Pharmacy — post-op medication kit"
              value={desc}
              onChange={e => { setDesc(e.target.value); setErr(""); }}
            />
          </div>
          <div className="pf-row" style={{marginBottom:14}}>
            <div className="pf-field">
              <label>Category</label>
              <div className="ms-wrap">
                <select value={cat} onChange={e => { setCat(e.target.value); setErr(""); }}>
                  <option value="">Select category</option>
                  {BILL_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <ChevronDown size={14} className="ms-arrow"/>
              </div>
            </div>
            <div className="pf-field">
              <label>Amount (₹)</label>
              <input
                type="number" min="1"
                placeholder="e.g. 1200"
                value={amount}
                onChange={e => { setAmount(e.target.value); setErr(""); }}
              />
            </div>
          </div>
          {err && <p className="pf-error">{err}</p>}
          <div className="pf-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Create Bill</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Reports page ─────────────────────────────────────────────────────────────
function ReportsPage({ patients }) {
  const deptCounts = useMemo(() => {
    const c = {};
    OPTIONS.department.forEach(d => { c[d] = patients.filter(p => p.department === d).length; });
    return c;
  }, [patients]);
  const maxDept   = Math.max(...Object.values(deptCounts), 1);
  const chartDays = useMemo(() => getLast7Days(), []);

  const apptToday = ALL_APPTS.filter(a => a.date === today && a.status !== "Cancelled").length;
  const apptAhead = ALL_APPTS.filter(a => a.date > today  && a.status === "Scheduled").length;
  const revColl   = ALL_APPTS.filter(a => a.paid === "Paid").reduce((s,a) => s + a.fee, 0);
  const revPend   = ALL_APPTS.filter(a => a.paid === "Unpaid" && a.status !== "Cancelled").reduce((s,a) => s + a.fee, 0);

  return (
    <div className="reports-page">
      <h1 className="page-title">Reports &amp; Analytics</h1>
      <p className="page-sub">How the hospital is running — admissions, departments and bookings.</p>

      <div className="stat-grid-8" style={{gridTemplateColumns:"repeat(4,1fr)", marginBottom:24}}>
        <StatCard label="APPOINTMENTS TODAY" value={apptToday} />
        <StatCard label="SCHEDULED AHEAD"    value={apptAhead} />
        <StatCard label="REVENUE COLLECTED"  value={`₹${revColl.toLocaleString()}`} />
        <StatCard label="REVENUE PENDING"    value={`₹${revPend.toLocaleString()}`} />
      </div>

      {/* Appointments bar chart */}
      <div className="chart-panel" style={{marginBottom:24}}>
        <h2 className="chart-title">Appointments — last 7 days</h2>
        <BarChart days={chartDays} />
      </div>

      {/* Patients by department horizontal bar chart */}
      <div className="chart-panel">
        <h2 className="chart-title">Patients by department</h2>
        <div className="dept-chart">
          {OPTIONS.department.map(d => (
            <div className="dept-row" key={d}>
              <span className="dept-label">{d}</span>
              <div className="dept-bar-wrap"><div className="dept-bar" style={{width:`${(deptCounts[d]/maxDept)*100}%`}}/></div>
              <span className="dept-count">{deptCounts[d]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


const SCHED_APPTS_INIT = [
  { id:1,  patient:"Tara Bose",      doctor:"Dr. Sophie Laurent", dept:"Orthopedics",      date:"2027-01-05", time:"09:00", fee:700,  status:"Cancelled",  paid:"Unpaid" },
  { id:2,  patient:"Vikram Rao",     doctor:"Dr. Nia Okafor",     dept:"Internal Medicine",date:"2026-11-27", time:"15:00", fee:600,  status:"Scheduled",  paid:"Unpaid" },
  { id:3,  patient:"Sana Sheikh",    doctor:"Dr. Elias Morgan",   dept:"Neurology",        date:"2026-11-26", time:"09:30", fee:1000, status:"Scheduled",  paid:"Unpaid" },
  { id:4,  patient:"Arjun Kapoor",   doctor:"Dr. Sophie Laurent", dept:"Orthopedics",      date:"2026-11-25", time:"11:30", fee:700,  status:"Scheduled",  paid:"Unpaid" },
  { id:5,  patient:"Meera Iyer",     doctor:"Dr. Elena Ruiz",     dept:"Pediatrics",       date:"2026-11-25", time:"10:00", fee:500,  status:"Scheduled",  paid:"Unpaid" },
  { id:6,  patient:"Tara Bose",      doctor:"Dr. Sophie Laurent", dept:"Orthopedics",      date:"2026-11-25", time:"10:00", fee:700,  status:"Scheduled",  paid:"Paid"   },
  { id:7,  patient:"Rohan Mehta",    doctor:"Dr. Sarah Jenkins",  dept:"Cardiology",       date:"2026-11-25", time:"09:00", fee:800,  status:"Scheduled",  paid:"Paid"   },
  { id:8,  patient:"Leela Fernandes",doctor:"Dr. Sophie Laurent", dept:"General Surgery",  date:"2026-11-24", time:"10:00", fee:900,  status:"Completed",  paid:"Paid"   },
  { id:9,  patient:"Kabir Singh",    doctor:"Dr. Sophie Laurent", dept:"Orthopedics",      date:"2026-11-23", time:"16:00", fee:700,  status:"Completed",  paid:"Paid"   },
  { id:10, patient:"Rohan Mehta",    doctor:"Dr. Sarah Jenkins",  dept:"Cardiology",       date:"2026-11-22", time:"09:30", fee:800,  status:"Completed",  paid:"Paid"   },
  { id:11, patient:"Anaya Das",      doctor:"Dr. Elena Ruiz",     dept:"Pediatrics",       date:"2026-11-21", time:"09:00", fee:500,  status:"Completed",  paid:"Paid"   },
  { id:12, patient:"Vikram Rao",     doctor:"Dr. Elias Morgan",   dept:"Neurology",        date:"2026-11-21", time:"15:00", fee:1000, status:"Completed",  paid:"Paid"   },
];

const SCHED_DOCTORS = ["Dr. Aiden Cole","Dr. Elena Rostova","Dr. Marcus Vance","Dr. Omar Haddad","Dr. Priya Nair","Dr. Sarah Jenkins"];

function SchedulingPage() {
  const [appts, setAppts]           = useState(SCHED_APPTS_INIT);
  const [dateFilter, setDateFilter] = useState("");
  const [docFilter, setDocFilter]   = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [cancelTarget, setCancelTarget]         = useState(null);

  // unique doctors from actual data
  const doctorOptions = [...new Set(appts.map(a => a.doctor))].sort();

  // filtered list
  const shown = appts.filter(a => {
    if (dateFilter   && a.date   !== dateFilter)              return false;
    if (docFilter    && a.doctor !== docFilter)               return false;
    if (statusFilter && a.status !== statusFilter)            return false;
    return true;
  });

  const hasFilters = dateFilter || docFilter || statusFilter;
  const clearFilters = () => { setDateFilter(""); setDocFilter(""); setStatusFilter(""); };

  const doReschedule = (id, newDate, newTime) => {
    setAppts(prev => prev.map(a => a.id === id ? {...a, date: newDate, time: newTime, status:"Scheduled"} : a));
    setRescheduleTarget(null);
  };

  const doCancel = id => {
    setAppts(prev => prev.map(a => a.id === id ? {...a, status:"Cancelled"} : a));
    setCancelTarget(null);
  };

  return (
    <div className="sched-page">
      {/* Header */}
      <h1 className="page-title">Appointment Scheduling</h1>
      <p className="page-sub" style={{marginBottom:20}}>
        Every booking across doctors — reschedule or cancel any scheduled visit.
      </p>

      {/* Filters bar */}
      <div className="sched-filters">
        <input
          type="date"
          className="sched-date-input"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
        />

        {/* Doctor dropdown */}
        <div className="ns-wrap">
          <select value={docFilter} onChange={e => setDocFilter(e.target.value)}>
            <option value="">All doctors</option>
            {doctorOptions.map(d => <option key={d}>{d}</option>)}
          </select>
          <ChevronDown size={14} className="ns-arrow"/>
        </div>

        {/* Status dropdown */}
        <div className="ns-wrap">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            <option>Scheduled</option>
            <option>Completed</option>
            <option>Cancelled</option>
          </select>
          <ChevronDown size={14} className="ns-arrow"/>
        </div>

        {hasFilters && (
          <button className="clear-link" onClick={clearFilters}><X size={13}/> Clear filters</button>
        )}
        <span className="pt-count" style={{marginLeft:"auto"}}>{shown.length} appointment{shown.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Date</th>
              <th>Time</th>
              <th>Fee</th>
              <th>Status</th>
              <th>Payment</th>
              <th style={{textAlign:"right"}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <tr><td colSpan="8" className="td-empty">No appointments match the selected filters.</td></tr>
            ) : shown.map(a => (
              <tr key={a.id}>
                <td className="td-name">{a.patient}</td>
                <td>
                  <div style={{fontWeight:600, color:"#1a1f36", fontSize:13}}>{a.doctor}</div>
                  <div style={{fontSize:11, color:"#8898aa"}}>{a.dept}</div>
                </td>
                <td>{fmtDate(a.date)}</td>
                <td>{a.time}</td>
                <td>₹{a.fee}</td>
                <td>
                  <span className={`pill ${
                    a.status === "Scheduled" ? "pill-teal" :
                    a.status === "Completed" ? "pill-green" : "pill-red"
                  }`}>{a.status}</span>
                </td>
                <td>
                  <span className={`pill ${a.paid === "Paid" ? "pill-green" : "pill-amber"}`}>{a.paid}</span>
                </td>
                <td>
                  <div className="sched-actions">
                    <button
                      className={`sched-action-btn${a.status !== "Scheduled" ? " disabled" : ""}`}
                      disabled={a.status !== "Scheduled"}
                      onClick={() => setRescheduleTarget(a)}
                    >
                      <Calendar size={13}/> Reschedule
                    </button>
                    <button
                      className={`sched-cancel-btn${a.status !== "Scheduled" ? " disabled" : ""}`}
                      disabled={a.status !== "Scheduled"}
                      onClick={() => setCancelTarget(a)}
                    >
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reschedule modal */}
      {rescheduleTarget && (
        <RescheduleModal
          appt={rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          onSave={(newDate, newTime) => doReschedule(rescheduleTarget.id, newDate, newTime)}
        />
      )}

      {/* Cancel confirmation */}
      {cancelTarget && (
        <div className="backdrop" onMouseDown={e => e.target === e.currentTarget && setCancelTarget(null)}>
          <div className="confirm-modal">
            <div className="confirm-modal-head">
              <h3>Cancel Appointment</h3>
              <button className="modal-close" onClick={() => setCancelTarget(null)}><X size={17}/></button>
            </div>
            <p>
              Cancel {cancelTarget.patient}'s visit with {cancelTarget.doctor} on {fmtDate(cancelTarget.date)}?
            </p>
            <div className="confirm-actions" style={{marginTop:24}}>
              <button className="btn-ghost" onClick={() => setCancelTarget(null)}>Cancel</button>
              <button className="btn-delete-doctor" onClick={() => doCancel(cancelTarget.id)}>Yes, cancel it</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RescheduleModal({ appt, onClose, onSave }) {
  const [newDate, setNewDate] = useState(appt.date);
  const [newTime, setNewTime] = useState(appt.time);

  const submit = e => {
    e.preventDefault();
    if (!newDate || !newTime) return;
    onSave(newDate, newTime);
  };

  return (
    <div className="backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{width:"min(420px,100%)"}}>
        <div className="modal-head">
          <div>
            <h2>Reschedule Appointment</h2>
            <p className="book-modal-sub">{appt.patient} with {appt.doctor}</p>
          </div>
          <button className="modal-close" onClick={onClose}><X size={17}/></button>
        </div>
        <form onSubmit={submit}>
          <div className="pf-full" style={{marginBottom:14}}>
            <label>Date</label>
            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} required />
          </div>
          <div className="pf-full" style={{marginBottom:14}}>
            <label>Time</label>
            <input type="time" className="time-input" style={{width:"100%"}} value={newTime} onChange={e => setNewTime(e.target.value)} required />
          </div>
          <div className="pf-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}


const WARDS_LIST = ["Ward 3", "Ward 5", "ICU", "Maternity", "General Ward A", "General Ward B", "Surgical Post-Op", "Pediatrics Ward"];
const DEPT_LIST  = ["Cardiology", "General Medicine", "Neurology", "Obstetrics", "Orthopedics", "Pediatrics", "General Surgery", "Internal Medicine"];
const STATUS_LIST = ["Active", "On Leave", "Inactive"];
const DAY_LIST    = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

const INITIAL_DOCTORS = [
  { id:1, name:"Dr. Asha Patel",    email:"asha.patel@wardrecords.health",    dept:"Cardiology",       ward:"ICU",             fee:800,  phone:"+91 98200 10001", status:"Active",   slots:["Mon 09:00–13:00","Tue 09:00–13:00","Fri 09:00–13:00"] },
  { id:2, name:"Dr. Elias Morgan",  email:"elias.morgan@wardrecords.health",  dept:"Neurology",        ward:"General Ward A",  fee:1000, phone:"+91 98200 10002", status:"Active",   slots:["Mon 15:00–18:00","Tue 15:00–18:00","Thu 10:00–13:00"] },
  { id:3, name:"Dr. Elena Ruiz",    email:"elena.ruiz@wardrecords.health",    dept:"Pediatrics",       ward:"Pediatrics Ward", fee:500,  phone:"+91 98200 10003", status:"Active",   slots:["Mon 09:00–12:00","Wed 09:00–12:00","Fri 09:00–12:00"] },
  { id:4, name:"Dr. Nia Okafor",    email:"nia.okafor@wardrecords.health",    dept:"General Medicine", ward:"General Ward A",  fee:600,  phone:"+91 98200 10004", status:"On Leave", slots:["Mon 09:00–12:00","Thu 14:00–17:00"] },
  { id:5, name:"Dr. Sophie Laurent",email:"sophie.laurent@wardrecords.health",dept:"Orthopedics",      ward:"General Ward B",  fee:700,  phone:"+91 98200 10005", status:"Active",   slots:["Tue 10:00–14:00","Wed 10:00–14:00","Fri 14:00–17:00"] },
  { id:6, name:"Dr. Sarah Jenkins", email:"sarah.jenkins@wardrecords.health", dept:"Cardiology",       ward:"ICU",             fee:800,  phone:"+91 98200 10006", status:"Active",   slots:["Mon 09:00–13:00","Tue 09:00–13:00","Wed 09:00–13:00","Fri 09:00–13:00"] },
];

function DoctorsPage() {
  const [doctors, setDoctors]       = useState(INITIAL_DOCTORS);
  const [editDoc, setEditDoc]       = useState(null);  // doctor being edited
  const [addOpen, setAddOpen]       = useState(false); // new doctor form
  const [deleteDoc, setDeleteDoc]   = useState(null);  // doctor to delete

  const openEdit = d => setEditDoc({...d});
  const closeEdit = () => setEditDoc(null);

  const saveDoctor = updated => {
    if (updated.id) {
      setDoctors(prev => prev.map(d => d.id === updated.id ? updated : d));
    } else {
      setDoctors(prev => [...prev, { ...updated, id: Date.now() }]);
    }
    setEditDoc(null);
    setAddOpen(false);
  };

  const confirmDeleteDoctor = () => {
    setDoctors(prev => prev.filter(d => d.id !== deleteDoc.id));
    setDeleteDoc(null);
  };

  return (
    <div className="doctors-page">
      {/* Header */}
      <div className="doc-page-header">
        <div>
          <h1 className="page-title">Doctors &amp; Staff</h1>
          <p className="page-sub">The roster patients book into — keep fees and availability current.</p>
        </div>
        <button className="btn-primary" onClick={() => setAddOpen(true)}>
          <Users size={15}/> Add Doctor
        </button>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Doctor</th>
              <th>Department</th>
              <th style={{color:"#1d6fe8"}}>Base ward</th>
              <th>Fee</th>
              <th style={{color:"#1d6fe8"}}>Availability</th>
              <th>Status</th>
              <th style={{textAlign:"right"}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map(d => (
              <tr key={d.id}>
                <td>
                  <div className="doc-cell-name">{d.name}</div>
                  <div className="doc-cell-email">{d.email}</div>
                </td>
                <td>{d.dept}</td>
                <td>{d.ward}</td>
                <td>₹{d.fee}</td>
                <td className="doc-avail-cell">{d.slots.join(", ")}</td>
                <td>
                  <span className={`pill ${d.status === "Active" ? "pill-teal" : d.status === "On Leave" ? "pill-amber" : "pill-grey"}`}>
                    {d.status}
                  </span>
                </td>
                <td>
                  <div className="doc-actions">
                    <button className="doc-action-btn" title="Edit doctor" onClick={() => openEdit(d)}>
                      <Edit2 size={15}/>
                    </button>
                    <button className="doc-action-btn doc-delete-btn" title="Delete doctor" onClick={() => setDeleteDoc(d)}>
                      <Trash2 size={15}/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      {editDoc && (
        <DoctorFormModal
          doc={editDoc}
          title="Edit Doctor"
          subtitle="Update the doctor's profile and availability."
          onClose={closeEdit}
          onSave={saveDoctor}
        />
      )}

      {/* Add modal */}
      {addOpen && (
        <DoctorFormModal
          doc={{ id:null, name:"", email:"", dept:"", ward:"", fee:"", phone:"", status:"Active", slots:[] }}
          title="Add Doctor"
          subtitle="Add a new doctor to the roster."
          onClose={() => setAddOpen(false)}
          onSave={saveDoctor}
        />
      )}

      {/* Delete confirmation */}
      {deleteDoc && (
        <div className="backdrop" onMouseDown={e => e.target === e.currentTarget && setDeleteDoc(null)}>
          <div className="confirm-modal">
            <div className="confirm-modal-head">
              <h3>Delete Doctor</h3>
              <button className="modal-close" onClick={() => setDeleteDoc(null)}><X size={17}/></button>
            </div>
            <p>Delete {deleteDoc.name}? Their patient links are cleared. This can't be undone.</p>
            <div className="confirm-actions">
              <button className="btn-ghost" onClick={() => setDeleteDoc(null)}>Cancel</button>
              <button className="btn-delete-doctor" onClick={confirmDeleteDoctor}>Delete Doctor</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Doctor Form Modal (Add / Edit) ──────────────────────────────────────────
function DoctorFormModal({ doc, title, subtitle, onClose, onSave }) {
  const [form, setForm] = useState({ ...doc });

  // availability slot builder
  const [slotDay,   setSlotDay]   = useState("Mon");
  const [slotFrom,  setSlotFrom]  = useState("09:00");
  const [slotTo,    setSlotTo]    = useState("13:00");

  const set = k => v => setForm(f => ({...f, [k]: v}));

  const addSlot = () => {
    const slot = `${slotDay} ${slotFrom}–${slotTo}`;
    if (!form.slots.includes(slot)) setForm(f => ({...f, slots: [...f.slots, slot]}));
  };
  const removeSlot = idx => setForm(f => ({...f, slots: f.slots.filter((_,i) => i !== idx)}));

  const submit = e => {
    e.preventDefault();
    onSave({ ...form, fee: Number(form.fee) });
  };

  return (
    <div className="backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal doctor-modal">
        <div className="modal-head">
          <div>
            <h2>{title}</h2>
            <p className="book-modal-sub">{subtitle}</p>
          </div>
          <button className="modal-close" onClick={onClose}><X size={17}/></button>
        </div>

        <form onSubmit={submit}>
          {/* Doctor Name */}
          <div className="pf-full" style={{marginBottom:14}}>
            <label>Doctor Name</label>
            <input placeholder="e.g. Dr. Alex Smith" value={form.name} onChange={e => set("name")(e.target.value)} required />
          </div>

          {/* Department + Base Ward */}
          <div className="pf-row" style={{marginBottom:14}}>
            <div className="pf-field">
              <label>Department</label>
              <div className="ms-wrap">
                <select value={form.dept} onChange={e => set("dept")(e.target.value)} required>
                  <option value="">Select</option>
                  {DEPT_LIST.map(d => <option key={d}>{d}</option>)}
                </select>
                <ChevronDown size={14} className="ms-arrow"/>
              </div>
            </div>
            <div className="pf-field">
              <label>Base Ward</label>
              <input placeholder="e.g. General Ward A" value={form.ward} onChange={e => set("ward")(e.target.value)} />
            </div>
          </div>

          {/* Phone + Email */}
          <div className="pf-row" style={{marginBottom:14}}>
            <div className="pf-field">
              <label>Contact Phone</label>
              <input placeholder="+91 98200 00000" value={form.phone} onChange={e => set("phone")(e.target.value)} />
            </div>
            <div className="pf-field">
              <label>Email</label>
              <input type="email" placeholder="dr@wardrecords.health" value={form.email} onChange={e => set("email")(e.target.value)} />
            </div>
          </div>

          {/* Fee + Status */}
          <div className="pf-row" style={{marginBottom:14}}>
            <div className="pf-field">
              <label>Consultation Fee (₹)</label>
              <input type="number" placeholder="e.g. 700" min="0" value={form.fee} onChange={e => set("fee")(e.target.value)} />
            </div>
            <div className="pf-field">
              <label>Status</label>
              <div className="ms-wrap">
                <select value={form.status} onChange={e => set("status")(e.target.value)}>
                  {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
                </select>
                <ChevronDown size={14} className="ms-arrow"/>
              </div>
            </div>
          </div>

          {/* Weekly availability builder */}
          <div className="pf-full" style={{marginBottom:8}}>
            <label>Weekly availability</label>
            <div className="slot-builder">
              <div className="ms-wrap" style={{minWidth:80}}>
                <select value={slotDay} onChange={e => setSlotDay(e.target.value)}>
                  {DAY_LIST.map(d => <option key={d}>{d}</option>)}
                </select>
                <ChevronDown size={13} className="ms-arrow"/>
              </div>
              <input type="time" className="time-input" value={slotFrom} onChange={e => setSlotFrom(e.target.value)} />
              <span className="slot-to">to</span>
              <input type="time" className="time-input" value={slotTo}   onChange={e => setSlotTo(e.target.value)} />
              <button type="button" className="slot-add-btn" onClick={addSlot}>+ Add</button>
            </div>

            {/* Slot tags */}
            {form.slots.length > 0 && (
              <div className="slot-tags">
                {form.slots.map((s, i) => (
                  <span className="slot-tag" key={i}>
                    {s}
                    <button type="button" className="slot-tag-remove" onClick={() => removeSlot(i)}><X size={11}/></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="pf-actions" style={{marginTop:20}}>
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save Doctor</button>
          </div>
        </form>
      </div>
    </div>
  );
}


// Generate last-7-days appointment counts from ALL_APPTS
function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const label = `${d.getDate()} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()]} ${d.getFullYear()}`;
    const count = ALL_APPTS.filter(a => a.date === iso && a.status !== "Cancelled").length;
    days.push({ iso, label, count });
  }
  return days;
}

// Demo appointment + revenue data (static)
const ALL_APPTS = Object.values({
  "Dr. Asha Patel": [
    { id:1,  time:"09:00", patient:"Tara Bose",    reason:"Playwright smoke visit",  paid:"Paid",   status:"Scheduled",  date:"2026-11-25", fee:800 },
    { id:2,  time:"10:00", patient:"Meera Iyer",   reason:"Chest pain follow-up",   paid:"Unpaid", status:"Scheduled",  date:"2026-11-25", fee:800 },
    { id:3,  time:"09:00", patient:"Kabir Singh",  reason:"Post-op review",          paid:"Paid",   status:"Completed",  date:"2026-11-20", fee:800 },
    { id:12, time:"09:00", patient:"Sana Sheikh",  reason:"General checkup",         paid:"Paid",   status:"Completed",  date:"2026-11-22", fee:800 },
  ],
  "Dr. Elias Morgan": [
    { id:4,  time:"15:00", patient:"Vikram Rao",   reason:"Neurology consultation",  paid:"Unpaid", status:"Scheduled",  date:"2026-11-25", fee:1000 },
    { id:5,  time:"15:00", patient:"Rohan Mehta",  reason:"Headache assessment",     paid:"Paid",   status:"Completed",  date:"2026-11-22", fee:1000 },
    { id:13, time:"15:00", patient:"Anaya Das",    reason:"Follow-up visit",         paid:"Paid",   status:"Completed",  date:"2026-11-21", fee:1000 },
  ],
  "Dr. Elena Ruiz": [
    { id:6,  time:"09:00", patient:"Anaya Das",    reason:"Routine checkup",         paid:"Paid",   status:"Scheduled",  date:"2026-11-25", fee:500 },
    { id:14, time:"09:00", patient:"Kabir Singh",  reason:"Pediatric review",        paid:"Paid",   status:"Completed",  date:"2026-11-21", fee:500 },
    { id:15, time:"10:00", patient:"Tara Bose",    reason:"Allergy assessment",      paid:"Paid",   status:"Completed",  date:"2026-11-23", fee:500 },
  ],
  "Dr. Nia Okafor": [
    { id:7,  time:"09:00", patient:"Sana Sheikh",  reason:"Fever & fatigue",         paid:"Paid",   status:"Cancelled",  date:"2026-11-24", fee:600 },
    { id:16, time:"09:00", patient:"Rohan Mehta",  reason:"Blood pressure check",    paid:"Paid",   status:"Completed",  date:"2026-11-19", fee:600 },
  ],
  "Dr. Sophie Laurent": [
    { id:8,  time:"11:30", patient:"Arjun Kapoor", reason:"Knee pain after fall",    paid:"Unpaid", status:"Scheduled",  date:"2026-11-25", fee:700 },
    { id:9,  time:"10:00", patient:"Tara Bose",    reason:"Playwright smoke visit",  paid:"Paid",   status:"Scheduled",  date:"2026-11-25", fee:700 },
    { id:10, time:"11:00", patient:"Kabir Singh",  reason:"Cast removal follow-up",  paid:"Paid",   status:"Completed",  date:"2026-11-22", fee:700 },
    { id:11, time:"10:00", patient:"Vikram Rao",   reason:"Post-surgery check",      paid:"Paid",   status:"Completed",  date:"2026-11-24", fee:700 },
    { id:17, time:"11:00", patient:"Meera Iyer",   reason:"Fracture review",         paid:"Paid",   status:"Completed",  date:"2026-11-23", fee:700 },
  ],
}).flat();

// ─── Shared bar chart component (pixel-based heights) ─────────────────────────
const CHART_H = 160;

function BarChart({ days }) {
  const maxBar = Math.max(...days.map(d => d.count), 1);
  const [hovered, setHovered] = useState(null);
  return (
    <div className="bar-chart-wrap">
      <div className="bar-y-axis" style={{height: CHART_H}}>
        {[maxBar, Math.round(maxBar*0.75), Math.round(maxBar*0.5), Math.round(maxBar*0.25), 0].map((v,i) => (
          <span key={i} className="bar-y-label">{v}</span>
        ))}
      </div>
      <div className="bar-cols-wrap">
        <div className="bar-area" style={{height: CHART_H}}>
          {days.map((d, i) => {
            const barH = maxBar > 0 ? Math.max(Math.round((d.count / maxBar) * CHART_H), d.count > 0 ? 4 : 0) : 0;
            const isHov = hovered === i;
            return (
              <div className="bar-col-new" key={i}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                {isHov && d.count > 0 && (
                  <div className="bar-tooltip">
                    {d.label}<br/>
                    <span style={{color:"#1d6fe8"}}>Booked : {d.count} appointment{d.count !== 1 ? "s" : ""}</span>
                  </div>
                )}
                <div className="bar-fill-new" style={{ height: barH, background: isHov ? "#a8c8f8" : "#1d6fe8" }}/>
              </div>
            );
          })}
        </div>
        <div className="bar-x-row">
          {days.map((d, i) => (
            <div className="bar-x-cell" key={i}><span className="bar-x-label">{d.label}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OverviewPage({ stats, patients, onGoPatients }) {
  const chartDays = useMemo(() => getLast7Days(), []);

  const apptToday    = ALL_APPTS.filter(a => a.date === today && a.status !== "Cancelled").length;
  const apptAhead    = ALL_APPTS.filter(a => a.date > today  && a.status === "Scheduled").length;
  const revCollected = ALL_APPTS.filter(a => a.paid === "Paid").reduce((s, a) => s + a.fee, 0);
  const revPending   = ALL_APPTS.filter(a => a.paid === "Unpaid" && a.status !== "Cancelled").reduce((s, a) => s + a.fee, 0);

  const [hoveredBar, setHoveredBar] = useState(null);

  return (
    <div className="overview">
      <h1 className="page-title">Hospital Overview</h1>
      <p className="page-sub">Live totals across wards, <span style={{color:"#1d6fe8"}}>doctors</span>, appointments and billing.</p>

      {/* 8 stat cards — 2 rows of 4 */}
      <div className="stat-grid-8">
        <StatCard label="TOTAL PATIENTS"     value={stats.total} />
        <StatCard label="ADMITTED"           value={stats.admitted} />
        <StatCard label="DISCHARGED"         value={stats.discharged} />
        <StatCard label="DOCTORS"            value={stats.doctors} />
        <StatCard label="APPOINTMENTS TODAY" value={apptToday} />
        <StatCard label="SCHEDULED AHEAD"    value={apptAhead} />
        <StatCard label="REVENUE COLLECTED"  value={`₹${revCollected.toLocaleString()}`} />
        <StatCard label="REVENUE PENDING"    value={`₹${revPending.toLocaleString()}`} />
      </div>

      {/* Bar chart — Appointments last 7 days */}
      <div className="chart-panel" style={{marginBottom:24}}>
        <h2 className="chart-title">Appointments — last 7 days</h2>
        <BarChart days={chartDays} />
      </div>

      {/* Quick links — 3 column grid */}
      <div className="quick-grid-3">
        <button className="quick-card" onClick={onGoPatients}>
          <span className="quick-title">Patient Management</span>
          <span className="quick-sub">Ward records, admit, discharge, delete</span>
        </button>
        <div className="quick-card disabled">
          <span className="quick-title">Doctors &amp; Staff</span>
          <span className="quick-sub">Roster, fees and availability</span>
        </div>
        <div className="quick-card disabled">
          <span className="quick-title">Appointment Scheduling</span>
          <span className="quick-sub">Reschedule and cancel visits</span>
        </div>
        <div className="quick-card disabled">
          <span className="quick-title">Billing &amp; Payments</span>
          <span className="quick-sub">Bills, collections and dues</span>
        </div>
        <div className="quick-card disabled">
          <span className="quick-title">Reports &amp; Analytics</span>
          <span className="quick-sub">Trends across the hospital</span>
        </div>
        <div className="quick-card-link">
          <span>Open Reports &amp; Analytics</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

// ─── Patients page ────────────────────────────────────────────────────────────
function PatientsPage({ patients, loading, search, setSearch, filters, setFilters, onAdd, onEdit, onDelete, onDischarge }) {
  const clearFilters = () => { setSearch(""); setFilters({ ward: "", department: "", doctor: "" }); };
  const hasFilters = search || filters.ward || filters.department || filters.doctor;
  return (
    <div className="patients-page">
      <div className="pt-toolbar">
        <div className="pt-search-wrap">
          <Search size={15} className="pt-search-icon"/>
          <input className="pt-search" placeholder="Search patients by name..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <div className="pt-toolbar-right">
          {hasFilters && <button className="clear-link" onClick={clearFilters}><X size={13}/> Clear filters</button>}
          <span className="pt-count">Showing {patients.length} patient{patients.length !== 1 ? "s" : ""}</span>
          <button className="btn-primary" onClick={onAdd}><Users size={15}/> Add Patient</button>
        </div>
      </div>
      <div className="pt-filters">
        <NativeSelect value={filters.ward}       onChange={v => setFilters(f => ({...f, ward: v}))}       options={OPTIONS.ward}       placeholder="All wards"/>
        <NativeSelect value={filters.department} onChange={v => setFilters(f => ({...f, department: v}))} options={OPTIONS.department} placeholder="All departments"/>
        <NativeSelect value={filters.doctor}     onChange={v => setFilters(f => ({...f, doctor: v}))}     options={OPTIONS.doctor}     placeholder="All doctors"/>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Age</th><th>Gender</th><th>Ward</th><th>Department</th><th>Doctor</th><th>Admission Date</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan="9" className="td-empty"><span className="spinner"/> Loading...</td></tr>
            : patients.length === 0 ? <tr><td colSpan="9" className="td-empty">No patients found.</td></tr>
            : patients.map(p => (
              <tr key={p.id}>
                <td className="td-name">{p.name}</td>
                <td>{p.age}</td><td>{p.gender}</td><td>{p.ward}</td><td>{p.department}</td><td>{p.doctor}</td>
                <td>{fmtDate(p.admissionDate)}</td>
                <td><span className={`pill ${p.status === "Admitted" ? "pill-green" : "pill-grey"}`}>{p.status}</span></td>
                <td className="td-actions">
                  <button className="action-link" title="Edit" onClick={() => onEdit(p)}><Edit2 size={14}/></button>
                  <button className="action-link discharge-link" title="Discharge" disabled={p.status === "Discharged"} onClick={() => onDischarge(p)}><UserCheck size={14}/> Discharge</button>
                  <button className="action-link delete-link" title="Delete" onClick={() => onDelete(p)}><Trash2 size={14}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Find a Doctor page ───────────────────────────────────────────────────────
function FindDoctorPage({ viewingAs, onBook }) {
  const [docSearch, setDocSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");

  const filtered = DOCTORS.filter(d => {
    const matchName = d.name.toLowerCase().includes(docSearch.toLowerCase()) || d.dept.toLowerCase().includes(docSearch.toLowerCase());
    const matchDept = !deptFilter || d.dept === deptFilter;
    return matchName && matchDept;
  });

  return (
    <div className="find-doctor-page">
      <h1 className="page-title">Find a Doctor</h1>
      <p className="page-sub">Booking as <strong>{viewingAs}</strong>. Search specialists and book a visit in their availability windows.</p>

      {/* Search + dept filter */}
      <div className="fd-search-panel">
        <div className="fd-search-wrap">
          <Search size={15} className="fd-search-icon"/>
          <input
            className="fd-search"
            placeholder="Search doctors by name or specialty..."
            value={docSearch}
            onChange={e => setDocSearch(e.target.value)}
          />
        </div>
        <div className="ns-wrap">
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
            <option value="">All departments</option>
            {OPTIONS.department.map(d => <option key={d}>{d}</option>)}
          </select>
          <ChevronDown size={14} className="ns-arrow"/>
        </div>
      </div>

      {/* Doctor cards grid */}
      <div className="doc-grid">
        {filtered.length === 0 ? (
          <p className="fd-empty">No doctors match your search.</p>
        ) : filtered.map(doc => (
          <div className="doc-card" key={doc.id}>
            <div className="doc-card-top">
              <div className="doc-avatar"><Stethoscope size={18}/></div>
              <div className="doc-info">
                <span className="doc-name">{doc.name}</span>
                <span className="doc-dept">{doc.dept}</span>
              </div>
              <span className={`pill ${doc.status === "Active" ? "pill-teal" : "pill-amber"}`}>{doc.status}</span>
            </div>
            <div className="doc-avail"><Clock size={13}/> {doc.availability}</div>
            <div className="doc-footer">
              <span className="doc-fee">₹{doc.fee} per visit</span>
              <div className="doc-footer-btns">
                <button className="btn-outline-sm"><Calendar size={13}/> Availability</button>
                <button
                  className="btn-primary-sm"
                  disabled={doc.status !== "Active"}
                  onClick={() => onBook(doc)}
                >Book</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── My Appointments page (demo data) ────────────────────────────────────────
const DEMO_APPOINTMENTS = [
  { id: 1, doctor: "Dr. Sophie Laurent", dept: "Orthopedics", date: "2026-11-25", time: "10:00", fee: 700, status: "Scheduled", paid: "Paid",   reason: "Playwright smoke visit", patient: "Tara Bose" },
  { id: 2, doctor: "Dr. Asha Patel",     dept: "Cardiology",  date: "2026-11-05", time: "09:00", fee: 800, status: "Completed", paid: "Paid",   reason: "Follow-up visit",        patient: "Tara Bose" },
];

function MyAppointmentsPage({ viewingAs, onBook }) {
  const [filter, setFilter] = useState("All");
  const myAppts = DEMO_APPOINTMENTS.filter(a => a.patient === "Tara Bose");
  const upcoming = myAppts.filter(a => a.status === "Scheduled");
  const past     = myAppts.filter(a => a.status !== "Scheduled");
  const shown    = filter === "Upcoming" ? upcoming : filter === "Past" ? past : myAppts;

  return (
    <div className="my-appts-page">
      <div className="ma-header">
        <div>
          <h1 className="page-title">My Appointments</h1>
          <p className="page-sub">History for {viewingAs}. Cancel any time before the visit.</p>
        </div>
        <button className="btn-primary" onClick={onBook}>Book new appointment</button>
      </div>
      <div className="ma-filter-tabs">
        {["Upcoming","Past","All"].map(f => (
          <button key={f} className={`ma-ftab${filter === f ? " active" : ""}`} onClick={() => setFilter(f)}>
            {f} {f === "Upcoming" ? `(${upcoming.length})` : f === "Past" ? `(${past.length})` : `(${myAppts.length})`}
          </button>
        ))}
      </div>
      <div className="ma-list">
        {shown.length === 0 ? <p className="fd-empty">No appointments found.</p> : shown.map(a => (
          <div className="ma-card" key={a.id}>
            <div className="ma-card-left">
              <div className="ma-doc-name">{a.doctor} <span className={`pill ${a.status === "Scheduled" ? "pill-teal" : "pill-grey"}`}>{a.status}</span> <span className={`pill ${a.paid === "Paid" ? "pill-green" : "pill-amber"}`}>{a.paid}</span></div>
              <div className="ma-card-sub">{a.dept} · {a.reason}</div>
              <div className="ma-card-meta"><Calendar size={12}/> {fmtDate(a.date)} &nbsp; <Clock size={12}/> {a.time} &nbsp; ₹{a.fee}</div>
            </div>
            {a.status === "Scheduled" && <button className="btn-ghost-sm">Cancel</button>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Book Appointment modal ───────────────────────────────────────────────────
function BookModal({ doctor, viewingAs, onClose, onBooked }) {
  const [date, setDate]     = useState(today);
  const [time, setTime]     = useState("");
  const [reason, setReason] = useState("");
  const [err, setErr]       = useState("");

  const dayName = date ? DAY_SHORT[new Date(date + "T00:00:00").getDay()] : "";
  const slots   = (date && doctor.slots[dayName]) || [];

  const submit = e => {
    e.preventDefault();
    if (!date)   { setErr("Please select a date."); return; }
    if (!time)   { setErr("Please select a time slot."); return; }
    if (!reason.trim()) { setErr("Please enter a reason for the visit."); return; }
    onBooked(`Appointment booked with ${doctor.name} on ${fmtDate(date)} at ${time}.`);
  };

  return (
    <div className="backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal book-modal">
        <div className="modal-head">
          <div>
            <h2>Book Appointment</h2>
            <p className="book-modal-sub">{doctor.name} — {doctor.dept} · ₹{doctor.fee} per visit</p>
          </div>
          <button className="modal-close" onClick={onClose}><X size={17}/></button>
        </div>

        <form onSubmit={submit} className="book-form">
          <div className="pf-full">
            <label>Date</label>
            <input type="date" value={date} min={today} onChange={e => { setDate(e.target.value); setTime(""); setErr(""); }}/>
          </div>

          <div className="pf-full">
            <label>Time — {dayName ? `${dayName} slots` : "select a date first"}</label>
            {slots.length === 0 ? (
              <div className="no-slots-notice">No open slots on this day — the doctor sees patients only in their availability windows.</div>
            ) : (
              <div className="ns-wrap" style={{width:"100%"}}>
                <select value={time} onChange={e => { setTime(e.target.value); setErr(""); }}>
                  <option value="">Select a time slot</option>
                  {slots.map(s => <option key={s}>{s}</option>)}
                </select>
                <ChevronDown size={14} className="ns-arrow"/>
              </div>
            )}
          </div>

          <div className="pf-full">
            <label>Reason for visit</label>
            <input placeholder="e.g. Chest discomfort follow-up" value={reason} onChange={e => { setReason(e.target.value); setErr(""); }}/>
          </div>

          {err && <p className="pf-error">{err}</p>}

          <div className="pf-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Book Appointment</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
function NativeSelect({ value, onChange, options, placeholder }) {
  return (
    <div className="ns-wrap">
      <select value={value} onChange={e => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
      <ChevronDown size={14} className="ns-arrow"/>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}><X size={17}/></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PatientForm({ form, setForm, formError, saving, onSubmit, onCancel, isEdit }) {
  const s = k => v => setForm(o => ({...o, [k]: v}));
  return (
    <form onSubmit={onSubmit} className="pf">
      <div className="pf-full"><label>Patient name</label><input placeholder="Full name" value={form.name} onChange={e => s("name")(e.target.value)}/></div>
      <div className="pf-row">
        <div className="pf-field"><label>Age</label><input type="number" placeholder="Age in years" min="0" max="120" value={form.age} onChange={e => s("age")(e.target.value)}/></div>
        <div className="pf-field"><label>Gender</label><ModalSelect value={form.gender} onChange={s("gender")} options={OPTIONS.gender} placeholder="Select gender"/></div>
      </div>
      <div className="pf-row">
        <div className="pf-field"><label>Ward</label><ModalSelect value={form.ward} onChange={s("ward")} options={OPTIONS.ward} placeholder="Select ward"/></div>
        <div className="pf-field"><label>Department</label><ModalSelect value={form.department} onChange={s("department")} options={OPTIONS.department} placeholder="Select department"/></div>
      </div>
      <div className="pf-row">
        <div className="pf-field"><label>Doctor</label><ModalSelect value={form.doctor} onChange={s("doctor")} options={OPTIONS.doctor} placeholder="Select doctor"/></div>
        <div className="pf-field"><label>Admission date</label><input type="date" max={today} value={form.admissionDate} onChange={e => s("admissionDate")(e.target.value)}/></div>
      </div>
      {"status" in form && (
        <div className="pf-full"><label>Status</label><ModalSelect value={form.status} onChange={s("status")} options={["Admitted","Discharged"]} placeholder="Select status"/></div>
      )}
      {formError && <p className="pf-error">{formError}</p>}
      <div className="pf-actions">
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving…" : isEdit ? "Save changes" : <><Plus size={15}/> Add Patient</>}</button>
      </div>
    </form>
  );
}

function ModalSelect({ value, onChange, options, placeholder }) {
  return (
    <div className="ms-wrap">
      <select value={value} onChange={e => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
      <ChevronDown size={14} className="ms-arrow"/>
    </div>
  );
}

// ─── Payments page ────────────────────────────────────────────────────────────
const DEMO_BILLS = [
  // "Tara Bose" has all paid — so total due = 0, matching the screenshot
];

function PaymentsPage({ viewingAs }) {
  const myBills = DEMO_BILLS.filter(b => b.patient === viewingAs);
  const unpaidBills    = myBills.filter(b => b.type === "bill"  && b.paid === "Unpaid");
  const unpaidVisits   = myBills.filter(b => b.type === "visit" && b.paid === "Unpaid");
  const totalDue = [...unpaidBills, ...unpaidVisits].reduce((s, b) => s + b.amount, 0);

  return (
    <div className="payments-page">
      <h1 className="page-title">Online Payments</h1>
      <p className="page-sub">Outstanding charges for <strong>{viewingAs}</strong>. Demo checkout — <span className="accent-link">no real charge is made</span>.</p>

      {/* Total due card */}
      <div className="pay-total-card">
        <span className="pay-total-label">TOTAL DUE</span>
        <span className="pay-total-value">₹{totalDue}</span>
      </div>

      {/* Bills section */}
      <div className="pay-section-label">BILLS</div>
      <div className="pay-list-card">
        {unpaidBills.length === 0 ? (
          <p className="pay-empty">No pending bills — all settled.</p>
        ) : unpaidBills.map(b => (
          <div className="pay-row" key={b.id}>
            <div>
              <div className="pay-row-title">{b.description}</div>
              <div className="pay-row-sub">{fmtDate(b.date)}</div>
            </div>
            <div className="pay-row-right">
              <span className="pay-amount">₹{b.amount}</span>
              <button className="btn-primary-sm">Pay now</button>
            </div>
          </div>
        ))}
      </div>

      {/* Unpaid visit fees */}
      <div className="pay-section-label">UNPAID VISIT FEES</div>
      <div className="pay-list-card">
        {unpaidVisits.length === 0 ? (
          <p className="pay-empty">Nothing due for upcoming visits.</p>
        ) : unpaidVisits.map(b => (
          <div className="pay-row" key={b.id}>
            <div>
              <div className="pay-row-title">{b.description}</div>
              <div className="pay-row-sub">{b.doctor} · {fmtDate(b.date)} {b.time}</div>
            </div>
            <div className="pay-row-right">
              <span className="pay-amount">₹{b.amount}</span>
              <button className="btn-primary-sm">Pay now</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Prescriptions & Reports page ─────────────────────────────────────────────
const DEMO_PRESCRIPTIONS = [
  { id: 1, patient: "Tara Bose", doctor: "Dr. Sophie Laurent", dept: "Orthopedics", date: "2026-11-25", type: "Prescription", title: "Post-visit prescription", items: ["Ibuprofen 400mg — twice daily for 5 days", "Physiotherapy referral — 3 sessions"] },
  { id: 2, patient: "Tara Bose", doctor: "Dr. Asha Patel",     dept: "Cardiology",  date: "2026-11-05", type: "Report",       title: "ECG Summary Report",          items: ["Normal sinus rhythm", "No significant ST changes", "Follow up in 3 months"] },
];

function PrescriptionsPage({ viewingAs }) {
  const [typeFilter, setTypeFilter] = useState("All");
  const myRx = DEMO_PRESCRIPTIONS.filter(r => r.patient === viewingAs);
  const shown = typeFilter === "All" ? myRx : myRx.filter(r => r.type === typeFilter);

  return (
    <div className="rx-page">
      <h1 className="page-title">Prescriptions &amp; Reports</h1>
      <p className="page-sub">Documents issued to <strong>{viewingAs}</strong> across all visits.</p>

      <div className="ma-filter-tabs" style={{marginBottom: 20}}>
        {["All","Prescription","Report"].map(f => (
          <button key={f} className={`ma-ftab${typeFilter === f ? " active" : ""}`} onClick={() => setTypeFilter(f)}>{f}</button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="pay-list-card"><p className="pay-empty">No documents found.</p></div>
      ) : shown.map(rx => (
        <div className="rx-card" key={rx.id}>
          <div className="rx-card-head">
            <div>
              <div className="rx-title">{rx.title}</div>
              <div className="rx-meta">{rx.doctor} · {rx.dept} · {fmtDate(rx.date)}</div>
            </div>
            <span className={`pill ${rx.type === "Prescription" ? "pill-teal" : "pill-blue"}`}>{rx.type}</span>
          </div>
          <ul className="rx-items">
            {rx.items.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
          <div className="rx-footer">
            <button className="btn-outline-sm"><FileText size={13}/> Download PDF</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function fmtDate(d) {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${parseInt(day)} ${months[parseInt(m)-1]} ${y}`;
}
