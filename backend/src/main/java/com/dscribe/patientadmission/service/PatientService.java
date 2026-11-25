package com.dscribe.patientadmission.service;

import com.dscribe.patientadmission.dto.PatientRequest;
import com.dscribe.patientadmission.model.Patient;
import com.dscribe.patientadmission.repository.PatientRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

@Service
public class PatientService {
    private final PatientRepository repository;

    public PatientService(PatientRepository repository) {
        this.repository = repository;
    }

    public List<Patient> getAll(String search, String ward, String department, String doctor) {
        return repository.findAll().stream()
                .filter(p -> search == null || search.isBlank()
                        || p.getName().toLowerCase(Locale.ROOT).contains(search.toLowerCase(Locale.ROOT)))
                .filter(p -> ward == null || ward.isBlank() || p.getWard().equalsIgnoreCase(ward))
                .filter(p -> department == null || department.isBlank()
                        || p.getDepartment().equalsIgnoreCase(department))
                .filter(p -> doctor == null || doctor.isBlank() || p.getDoctor().equalsIgnoreCase(doctor))
                .toList();
    }

    public Patient getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Patient not found with id: " + id));
    }

    public Patient create(PatientRequest request) {
        Patient patient = new Patient();
        copyRequest(request, patient);
        patient.setStatus("Admitted");
        return repository.save(patient);
    }

    public Patient update(Long id, PatientRequest request) {
        Patient patient = getById(id);
        copyRequest(request, patient);
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            patient.setStatus(request.getStatus());
        }
        return repository.save(patient);
    }

    public Patient discharge(Long id) {
        Patient patient = getById(id);
        patient.setStatus("Discharged");
        return repository.save(patient);
    }

    public void delete(Long id) {
        Patient patient = getById(id);
        repository.delete(patient);
    }

    private void copyRequest(PatientRequest request, Patient patient) {
        patient.setName(request.getName().trim());
        patient.setAge(request.getAge());
        patient.setGender(request.getGender());
        patient.setWard(request.getWard());
        patient.setDepartment(request.getDepartment());
        patient.setDoctor(request.getDoctor());
        patient.setAdmissionDate(request.getAdmissionDate());
    }
}
