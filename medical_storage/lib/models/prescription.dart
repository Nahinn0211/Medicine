import 'package:intl/intl.dart';
import 'package:medical_storage/models/medicine.dart';

enum PrescriptionStatus {
  ACTIVE,
  COMPLETED,
  CANCELLED,
  EXPIRED
}

class Prescription {
  final String? id;
  final String? patientId;
  final String? doctorId;
  final String? appointmentId;
  final String? medicineId;
  final Medicine? medicine;
  final String? dosage;
  final DateTime? prescriptionDate;
  final DateTime? expiryDate;
  final String? notes;
  final PrescriptionStatus? status;
  final bool? isValid;
  final bool? isNearingExpiry;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Prescription({
    this.id,
    this.patientId,
    this.doctorId,
    this.appointmentId,
    this.medicineId,
    this.medicine,
    this.dosage,
    this.prescriptionDate,
    this.expiryDate,
    this.notes,
    this.status,
    this.isValid,
    this.isNearingExpiry,
    this.createdAt,
    this.updatedAt,
  });

  factory Prescription.fromJson(Map<String, dynamic> json) {
    // Parse the status enum from string
    PrescriptionStatus? parseStatus(String? statusStr) {
      if (statusStr == null) return null;

      switch (statusStr.toUpperCase()) {
        case 'ACTIVE':
          return PrescriptionStatus.ACTIVE;
        case 'COMPLETED':
          return PrescriptionStatus.COMPLETED;
        case 'CANCELLED':
          return PrescriptionStatus.CANCELLED;
        case 'EXPIRED':
          return PrescriptionStatus.EXPIRED;
        default:
          return null;
      }
    }

    // Parse date strings to DateTime objects safely
    DateTime? parseDateTime(String? dateTimeStr) {
      if (dateTimeStr == null) return null;
      try {
        return DateTime.parse(dateTimeStr);
      } catch (e) {
        print('Error parsing date: $e');
        return null;
      }
    }

    return Prescription(
      id: json['id']?.toString(),
      patientId: json['patientId']?.toString(),
      doctorId: json['doctorId']?.toString(),
      appointmentId: json['appointmentId']?.toString(),
      medicineId: json['medicineId']?.toString(),
      medicine: json['medicine'] != null
          ? Medicine.fromJson(json['medicine'])
          : null,
      dosage: json['dosage'],
      prescriptionDate: parseDateTime(json['prescriptionDate']),
      expiryDate: parseDateTime(json['expiryDate']),
      notes: json['notes'],
      status: parseStatus(json['status']),
      isValid: json['isValid'],
      isNearingExpiry: json['isNearingExpiry'],
      createdAt: parseDateTime(json['createdAt']),
      updatedAt: parseDateTime(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    // Convert enum to string
    String? statusToString(PrescriptionStatus? status) {
      if (status == null) return null;
      return status.toString().split('.').last;
    }

    // Format DateTime to string
    String? formatDateTime(DateTime? dateTime) {
      if (dateTime == null) return null;
      return dateTime.toIso8601String();
    }

    return {
      'id': id,
      'patientId': patientId,
      'doctorId': doctorId,
      'appointmentId': appointmentId,
      'medicineId': medicineId,
      'medicine': medicine?.toJson(),
      'dosage': dosage,
      'prescriptionDate': formatDateTime(prescriptionDate),
      'expiryDate': formatDateTime(expiryDate),
      'notes': notes,
      'status': statusToString(status),
      'isValid': isValid,
      'isNearingExpiry': isNearingExpiry,
      'createdAt': formatDateTime(createdAt),
      'updatedAt': formatDateTime(updatedAt),
    };
  }

  // Helper method to format prescription date for display
  String getFormattedPrescriptionDate() {
    if (prescriptionDate == null) return 'N/A';
    return DateFormat('dd/MM/yyyy HH:mm').format(prescriptionDate!);
  }

  // Helper method to format expiry date for display
  String getFormattedExpiryDate() {
    if (expiryDate == null) return 'N/A';
    return DateFormat('dd/MM/yyyy').format(expiryDate!);
  }

  // Helper method to check if prescription is active
  bool isActive() {
    return status == PrescriptionStatus.ACTIVE;
  }

  // Helper method to check if prescription is expired
  bool isExpired() {
    if (expiryDate == null) return false;
    return DateTime.now().isAfter(expiryDate!);
  }

  // Helper method to check expiry status
  String getExpiryStatus() {
    if (expiryDate == null) return 'Không xác định';
    if (isExpired()) return 'Đã hết hạn';
    if (isNearingExpiry == true) return 'Sắp hết hạn';
    return 'Còn hạn';
  }
}