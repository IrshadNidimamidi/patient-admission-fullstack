package com.dscribe.patientadmission.repository;

import com.dscribe.patientadmission.model.Patient;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientRepository extends JpaRepository<Patient, Long> {
}
