import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:medical_storage/models/appointment.dart';
import 'package:medical_storage/models/review.dart';
import 'package:medical_storage/models/prescription.dart';
import 'package:medical_storage/services/auth_service.dart';
import 'base_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:intl/intl.dart';

class AppointmentService extends BaseService<Appointment> {
  // Initialize the AuthService properly as a field
  final AuthService _authService = AuthService();

  AppointmentService() : super(
      endpoint: 'appointments',
      fromJson: Appointment.fromJson
  );

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  Future<List<Appointment>> getAppointmentsByPatient(String patientId) async {
    try {
      // Thêm header Authorization nếu cần
      final token = await getToken();
      final response = await http.get(
        Uri.parse('$baseUrl/appointments/patient/$patientId'),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json; charset=UTF-8',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        // Xử lý response
        final String decodedBody = utf8.decode(response.bodyBytes);

        final dynamic parsedJson = json.decode(decodedBody);

        if (parsedJson is List) {
          final appointments = <Appointment>[];

          for (var i = 0; i < parsedJson.length; i++) {
            try {
              final item = parsedJson[i];
              if (item is Map<String, dynamic>) {
                final appointment = Appointment.fromJson(item);
                appointments.add(appointment);
              }
            } catch (e) {
              print('Error parsing appointment at index $i: $e');
              // Tiếp tục với item tiếp theo thay vì dừng toàn bộ quá trình
            }
          }

          return appointments;
        } else {
          throw Exception('Expected List but got ${parsedJson.runtimeType}');
        }
      } else if (response.statusCode == 401) {
        throw Exception('Unauthorized: Please log in again');
      } else if (response.statusCode == 404) {
        return [];
      } else {
        print('Error response: ${response.body}');
        throw Exception('Failed to load appointments: Server returned ${response.statusCode}');
      }
    } catch (e) {
      print('Exception in getAppointmentsByPatient: $e');
      if (e is FormatException) {
        throw Exception('Invalid response format: $e');
      } else if (e is http.ClientException) {
        throw Exception('Network error: $e');
      } else {
        throw Exception('Error loading appointments: $e');
      }
    }
  }

  Future<Review> submitReview(String doctorId, int rating, String comment) async {
    try {
      final token = await getToken();
      final userId = await _authService.getUserId();

      if (userId == null) {
        throw Exception('User ID is not available');
      }

      final Map<String, dynamic> reviewData = {
        'userId': int.parse(userId),
        'doctorId': int.parse(doctorId),
        'rating': rating,
        'comment': comment
      };

      final response = await http.post(
          Uri.parse('$baseUrl/reviews/save'),
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json; charset=UTF-8',
            if (token != null) 'Authorization': 'Bearer $token',
          },
          body: json.encode(reviewData)
      );

      if (response.statusCode == 200) {
        final String utf8Body = utf8.decode(response.bodyBytes);
        final Map<String, dynamic> responseBody = json.decode(utf8Body);
        return Review.fromJson(responseBody);
      } else {
        throw Exception('Failed to submit review: Server returned ${response.statusCode}');
      }
    } catch (e) {
      print('Exception in submitReview: $e');
      if (e is FormatException) {
        throw Exception('Invalid response format: $e');
      } else if (e is http.ClientException) {
        throw Exception('Network error: $e');
      } else {
        rethrow;
      }
    }
  }

  // New methods for prescriptions
  Future<List<Prescription>> getPrescriptionsByAppointment(String appointmentId) async {
    try {
      final token = await getToken();
      final response = await http.get(
        Uri.parse('$baseUrl/prescriptions/by-appointment/$appointmentId'),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json; charset=UTF-8',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final String decodedBody = utf8.decode(response.bodyBytes);
        final List<dynamic> parsedJson = json.decode(decodedBody);

        final prescriptions = parsedJson
            .map((item) => Prescription.fromJson(item))
            .toList();

        return prescriptions;
      } else if (response.statusCode == 401) {
        throw Exception('Unauthorized: Please log in again');
      } else if (response.statusCode == 404) {
        return [];
      } else {
        print('Error response: ${response.body}');
        throw Exception('Failed to load prescriptions: Server returned ${response.statusCode}');
      }
    } catch (e) {
      print('Exception in getPrescriptionsByAppointment: $e');
      if (e is FormatException) {
        throw Exception('Invalid response format: $e');
      } else if (e is http.ClientException) {
        throw Exception('Network error: $e');
      } else {
        throw Exception('Error loading prescriptions: $e');
      }
    }
  }

  Future<List<Prescription>> getPrescriptionsByPatient(String patientId) async {
    try {
      final token = await getToken();
      final response = await http.get(
        Uri.parse('$baseUrl/prescriptions/by-patient/$patientId'),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json; charset=UTF-8',
          if (token != null) 'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final String decodedBody = utf8.decode(response.bodyBytes);
        final List<dynamic> parsedJson = json.decode(decodedBody);

        final prescriptions = parsedJson
            .map((item) => Prescription.fromJson(item))
            .toList();

        return prescriptions;
      } else if (response.statusCode == 401) {
        throw Exception('Unauthorized: Please log in again');
      } else if (response.statusCode == 404) {
        return [];
      } else {
        print('Error response: ${response.body}');
        throw Exception('Failed to load prescriptions: Server returned ${response.statusCode}');
      }
    } catch (e) {
      print('Exception in getPrescriptionsByPatient: $e');
      if (e is FormatException) {
        throw Exception('Invalid response format: $e');
      } else if (e is http.ClientException) {
        throw Exception('Network error: $e');
      } else {
        throw Exception('Error loading prescriptions: $e');
      }
    }
  }

  Future<bool> cancelAppointment(String? serviceBookingId) async {
    // Validate input
    if (serviceBookingId == null || serviceBookingId.isEmpty) {
      throw Exception('Invalid booking ID');
    }

    try {
      final response = await http.get(
        Uri.parse('$baseUrl/service-bookings/cancel/$serviceBookingId'),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json; charset=UTF-8',
        },
      );

      // Log response code for debugging
      print('Cancel response code: ${response.statusCode}');

      if (response.statusCode == 200) {
        return true;
      } else if (response.statusCode == 404) {
        throw Exception('Booking not found: $serviceBookingId');
      } else if (response.statusCode == 403) {
        throw Exception('Not allowed to cancel this booking');
      } else {
        // Include response body in error for better debugging
        String responseBody = utf8.decode(response.bodyBytes);
        throw Exception('Server error (${response.statusCode}): $responseBody');
      }
    } catch (e) {
      if (e is http.ClientException) {
        throw Exception('Network error: $e');
      } else if (e is Exception) {
        rethrow; // Rethrow already formatted exceptions
      } else {
        throw Exception('Error canceling appointment: $e');
      }
    }
  }

  // Helper function to get minimum of two integers
  int min(int a, int b) => a < b ? a : b;
}