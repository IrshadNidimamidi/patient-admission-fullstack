package com.dscribe.patientadmission.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public class PatientRequest {

    @NotBlank(message = "Patient name is required")
    @Pattern(regexp = "^[A-Za-z ]+$", message = "Name must contain letters and spaces only")
    private String name;

    @NotNull(message = "Age is required")
    @Min(value = 0, message = "Age must be between 0 and 120")
    @Max(value = 120, message = "Age must be between 0 and 120")
    private Integer age;

    @NotBlank(message = "Gender is required")
    @Pattern(regexp = "^(Male|Female|Other)$", message = "Gender must be Male, Female or Other")
    private String gender;

    @NotBlank(message = "Ward is required")
    @Pattern(regexp = "^(Ward 3|Ward 5|ICU|Maternity)$", message = "Please select a valid ward")
    private String ward;

    @NotBlank(message = "Department is required")
    @Pattern(regexp = "^(Cardiology|General Medicine|Neurology|Obstetrics|Orthopedics|Pediatrics)$", message = "Please select a valid department")
    private String department;

    @NotBlank(message = "Doctor is required")
    @Pattern(regexp = "^(Dr\\. Asha Patel|Dr\\. Elias Morgan|Dr\\. Elena Ruiz|Dr\\. Nia Okafor|Dr\\. Sophie Laurent)$", message = "Please select a valid doctor")
    private String doctor;

    @NotNull(message = "Admission date is required")
    @PastOrPresent(message = "Admission date cannot be in the future")
    private LocalDate admissionDate;

    @Pattern(regexp = "^(Admitted|Discharged)$", message = "Status must be Admitted or Discharged")
    private String status;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getWard() { return ward; }
    public void setWard(String ward) { this.ward = ward; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getDoctor() { return doctor; }
    public void setDoctor(String doctor) { this.doctor = doctor; }

    public LocalDate getAdmissionDate() { return admissionDate; }
    public void setAdmissionDate(LocalDate admissionDate) { this.admissionDate = admissionDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
