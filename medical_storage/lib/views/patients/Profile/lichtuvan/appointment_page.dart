import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:medical_storage/models/medicine_media.dart';
import 'package:provider/provider.dart';
import 'package:medical_storage/models/appointment.dart';
import 'package:medical_storage/models/appointment_status.dart';
import 'package:medical_storage/models/patient_profile.dart';
import 'package:medical_storage/models/prescription.dart';
import 'package:medical_storage/models/medicine.dart';
import 'package:medical_storage/models/attribute.dart';
import 'package:medical_storage/services/appointment_service.dart';
import 'package:medical_storage/services/auth_service.dart';
import 'package:medical_storage/services/user_service.dart';
import 'package:medical_storage/services/cart_service.dart';
import 'package:medical_storage/widgets/HomeWidget/bottom_bar.dart';

class AppointmentPage extends StatefulWidget {
  const AppointmentPage({Key? key}) : super(key: key);

  @override
  _AppointmentPageState createState() => _AppointmentPageState();
}

class _AppointmentPageState extends State<AppointmentPage> with SingleTickerProviderStateMixin {
  // Using dependency injection pattern for better testability
  final AppointmentService _appointmentService = AppointmentService();
  final AuthService _authService = AuthService();
  final UserService _userService = UserService();

  late TabController _tabController;
  List<Appointment> _appointments = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _fetchAppointments();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchAppointments() async {
    if (!mounted) return; // Safety check to prevent setState after dispose

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // Validate user authentication
      if (!await _authService.isLoggedIn()) {
        if (!mounted) return;
        Navigator.of(context).pushReplacementNamed('/login');
        return;
      }

      // Fetch user data with proper error handling
      final String? userId = await _userService.getUserId();
      if (userId == null) {
        throw const AppointmentException('User ID not found');
      }

      final PatientProfile? patientProfile = await _userService.getDataUser(userId);
      if (patientProfile?.id == null) {
        throw const AppointmentException('Patient profile not found');
      }

      // Get appointments for the patient
      final appointments = await _appointmentService.getAppointmentsByPatient(patientProfile!.id!);

      if (!mounted) return;
      setState(() {
        _appointments = appointments;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;

      final errorMsg = e is AppointmentException
          ? e.message
          : 'Không thể tải danh sách lịch tư vấn: $e';

      setState(() {
        _isLoading = false;
        _errorMessage = errorMsg;
      });

      _showErrorSnackBar(errorMsg);
    }
  }

  /// Shows an error message in a SnackBar
  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.redAccent,
        behavior: SnackBarBehavior.floating,
        action: SnackBarAction(
          label: 'Thử lại',
          textColor: Colors.white,
          onPressed: _fetchAppointments,
        ),
      ),
    );
  }

  void _joinConsultation(Appointment appointment) async {
    try {
      // Show loading indicator
      _showLoadingDialog('Đang kết nối...');
      // Get consultation by appointment ID
      final String? appointmentId = appointment.serviceBooking?.id;
      if (appointmentId == null) {
        throw Exception('ID của lịch đặt không tồn tại');
      }

      if (!mounted) return;
      Navigator.of(context).pop(); // Close loading dialog

      // Navigate to consultation page
      Navigator.pushNamed(
        context,
        '/consultation',
        arguments: {
          'consultationId': appointment.consultation?.id ?? "",
          'consultationCode': appointment.consultation?.consultationCode ?? "",
          'doctor': appointment.doctor,
          'patient': appointment.patient,
          'appointment': appointment,
          'userId': appointment.patient?.user.id ?? "", // Đảm bảo bạn đã truyền userId vào
        },
      );
    } catch (e) {
      if (!mounted) return;
      Navigator.of(context).pop(); // Close loading dialog
      _showErrorSnackBar('Không thể kết nối: $e');
    }
  }

  /// Builds an appointment card with responsive layout
  Widget _buildAppointmentCard(Appointment appointment) {
    final AppointmentStatus appointmentStatus = appointment.status;
    final statusColor = _getStatusColor(appointmentStatus);
    final statusText = _getStatusText(appointmentStatus);

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with doctor name and status badge
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    appointment.doctor!.user.fullName,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                _buildStatusBadge(statusText, statusColor),
              ],
            ),
            const SizedBox(height: 12),

            // Appointment details
            _buildInfoRow(Icons.medical_services_outlined, appointment.serviceBooking!.service!.name),
            _buildInfoRow(Icons.calendar_today, _formatDate(appointment.parseAppointmentDate())),
            _buildInfoRow(Icons.access_time, _formatTime(appointment.parseAppointmentTime())),
            _buildInfoRow(Icons.payment, '${_formatCurrency(appointment.serviceBooking!.service!.price)} VND'),

            const SizedBox(height: 16),

            // Action buttons section with responsive layout
            _buildActionButtons(appointment, appointmentStatus),
          ],
        ),
      ),
    );
  }

  /// Creates a status badge with appropriate styling
  Widget _buildStatusBadge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withOpacity(0.2),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  /// Builds responsive action buttons based on appointment status
  Widget _buildActionButtons(Appointment appointment, AppointmentStatus status) {
    // Collecting buttons based on status
    final List<Widget> buttons = [];

    if (status == AppointmentStatus.SCHEDULED) {
      // Check if appointment is within 30 minutes or currently active
      final DateTime now = DateTime.now();
      final DateTime appointmentDate = appointment.parseAppointmentDate();
      final TimeOfDay appointmentTime = appointment.parseAppointmentTime();
      final DateTime appointmentDateTime = DateTime(
        appointmentDate.year,
        appointmentDate.month,
        appointmentDate.day,
        appointmentTime.hour,
        appointmentTime.minute,
      );

      // Calculate time difference
      final Duration difference = appointmentDateTime.difference(now);

      // Check if appointment is within 30 minutes or currently active
      // (within 30 min before start up to 1 hour after start)
      final bool isWithin30MinBeforeOrDuring = difference.inMinutes <= 30 && difference.inMinutes > -60;

      if (isWithin30MinBeforeOrDuring) {
        buttons.add(
          ElevatedButton.icon(
            onPressed: () => _joinConsultation(appointment),
            icon: const Icon(Icons.videocam, size: 18),
            label: const Text('Vào tư vấn'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
              foregroundColor: Colors.white,
            ),
          ),
        );
      }

      // Always add Cancel button for scheduled appointments
      buttons.add(
        ElevatedButton.icon(
          onPressed: () => _showCancelDialog(appointment),
          icon: const Icon(Icons.cancel_outlined, size: 18),
          label: const Text('Hủy lịch'),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.redAccent,
            foregroundColor: Colors.white,
          ),
        ),
      );
    } else if (status == AppointmentStatus.COMPLETED) {
      // Existing code for completed appointments
      buttons.add(
        ElevatedButton.icon(
          onPressed: () => _showReviewDialog(appointment),
          icon: const Icon(Icons.rate_review, size: 18),
          label: const Text('Đánh giá'),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.amber,
            foregroundColor: Colors.white,
          ),
        ),
      );

      if (appointment.prescriptions.isNotEmpty) {
        buttons.add(
          ElevatedButton.icon(
            onPressed: () => _viewPrescription(appointment),
            icon: const Icon(Icons.medication, size: 18),
            label: const Text('Đơn thuốc'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
              foregroundColor: Colors.white,
            ),
          ),
        );
      }
    }

    // Return responsive button layout for different screen sizes
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      alignment: WrapAlignment.spaceBetween,
      children: buttons,
    );
  }

  /// Creates a consistent info row with icon and text
  Widget _buildInfoRow(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon, size: 20, color: Colors.grey[600]),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: TextStyle(fontSize: 16, color: Colors.grey[800]),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  /// Maps appointment status to appropriate color
  Color _getStatusColor(AppointmentStatus status) {
    switch (status) {
      case AppointmentStatus.SCHEDULED:
        return Colors.blue;
      case AppointmentStatus.COMPLETED:
        return Colors.green;
      case AppointmentStatus.CANCELLED:
        return Colors.red;
      case AppointmentStatus.PENDING:
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  /// Maps appointment status to localized text
  String _getStatusText(AppointmentStatus status) {
    switch (status) {
      case AppointmentStatus.SCHEDULED:
        return 'Sắp tới';
      case AppointmentStatus.COMPLETED:
        return 'Đã hoàn thành';
      case AppointmentStatus.CANCELLED:
        return 'Đã hủy';
      case AppointmentStatus.PENDING:
        return 'Đang chờ';
      default:
        return 'Không xác định';
    }
  }

  /// Formats date consistently throughout the app
  String _formatDate(DateTime date) {
    return DateFormat('dd/MM/yyyy').format(date);
  }

  /// Formats time consistently throughout the app
  String _formatTime(TimeOfDay time) {
    final hour = time.hour.toString().padLeft(2, '0');
    final minute = time.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }

  /// Formats currency according to Vietnamese locale
  String _formatCurrency(double amount) {
    final formatter = NumberFormat('#,###', 'vi_VN');
    return formatter.format(amount);
  }

  /// Builds a date/time picker for rescheduling
  Widget _buildDateTimePicker(Appointment appointment) {
    // This is a placeholder for the actual implementation
    // In a real app, you would create a date/time picker here
    return const SizedBox(
      height: 200,
      child: Center(
        child: Text(
          'Tính năng đang được phát triển',
          textAlign: TextAlign.center,
        ),
      ),
    );
  }

  /// Shows dialog for cancelling an appointment
  void _showCancelDialog(Appointment appointment) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Hủy lịch tư vấn'),
        content: const Text('Bạn có chắc chắn muốn hủy lịch tư vấn này?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Không'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.of(context).pop();
              await _cancelAppointment(appointment);
            },
            style: TextButton.styleFrom(
              foregroundColor: Colors.white,
              backgroundColor: Colors.redAccent,
            ),
            child: const Text('Hủy lịch'),
          ),
        ],
      ),
    );
  }

  /// Handles the appointment cancellation logic
  Future<void> _cancelAppointment(Appointment appointment) async {
    try {
      // Show loading indicator
      _showLoadingDialog('Đang hủy lịch...');

      if (appointment.serviceBooking?.id != null) {
        await _appointmentService.cancelAppointment(appointment.serviceBooking!.id);
      } else {
        throw Exception('ID của lịch đặt không tồn tại');
      }

      // For demo, we'll just wait to simulate network call
      await Future.delayed(const Duration(seconds: 1));

      if (!mounted) return;
      Navigator.of(context).pop(); // Close loading dialog

      // Show success message
      _showSuccessSnackBar('Hủy lịch thành công');

      // Refresh appointments list
      _fetchAppointments();
    } catch (e) {
      if (!mounted) return;
      Navigator.of(context).pop(); // Close loading dialog
      _showErrorSnackBar('Không thể hủy lịch: $e');
    }
  }

  /// Shows loading dialog with custom message
  void _showLoadingDialog(String message) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        content: Row(
          children: [
            const CircularProgressIndicator(),
            const SizedBox(width: 20),
            Text(message),
          ],
        ),
      ),
    );
  }

  /// Shows a success message in a SnackBar
  void _showSuccessSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.green,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  /// Shows dialog for reviewing a completed appointment
  void _showReviewDialog(Appointment appointment) {
    // Lấy ID bác sĩ để đánh giá
    final doctorId = appointment.doctor?.id;
    if (doctorId == null) {
      _showErrorSnackBar('Không tìm thấy thông tin bác sĩ');
      return;
    }

    final doctorName = appointment.doctor?.user.fullName ?? 'Bác sĩ';

    // Biến để lưu điểm đánh giá và nội dung nhận xét
    int rating = 5;
    final commentController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Đánh giá buổi tư vấn với $doctorName'),
        content: SizedBox(
          width: double.maxFinite,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Chất lượng tư vấn'),
              const SizedBox(height: 8),
              // Widget đánh giá sao
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(5, (index) {
                  return IconButton(
                    icon: Icon(
                      index < rating ? Icons.star : Icons.star_border,
                      color: Colors.amber,
                      size: 32,
                    ),
                    onPressed: () {
                      // Cập nhật số sao khi người dùng nhấn
                      Navigator.of(context).pop();
                      rating = index + 1;
                      _showReviewDialog(appointment); // Hiển thị lại dialog với số sao mới
                    },
                  );
                }),
              ),
              const SizedBox(height: 16),
              // Trường nhập nhận xét
              TextField(
                controller: commentController,
                decoration: const InputDecoration(
                  labelText: 'Nhận xét của bạn',
                  border: OutlineInputBorder(),
                ),
                maxLines: 3,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            onPressed: () {
              // Xử lý gửi đánh giá
              _submitReview(doctorId, rating, commentController.text);
              Navigator.of(context).pop();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blueAccent,
              foregroundColor: Colors.white,
            ),
            child: const Text('Gửi đánh giá'),
          ),
        ],
      ),
    );
  }

  Future<void> _submitReview(String doctorId, int rating, String comment) async {
    try {
      _showLoadingDialog('Đang gửi đánh giá...');

      // Call the updated submitReview method with parameters
      await _appointmentService.submitReview(doctorId, rating, comment);

      if (!mounted) return;
      Navigator.of(context).pop(); // Đóng dialog loading

      _showSuccessSnackBar('Gửi đánh giá thành công');
    } catch (e) {
      if (!mounted) return;
      Navigator.of(context).pop(); // Đóng dialog loading
      _showErrorSnackBar('Không thể gửi đánh giá: $e');
    }
  }

  void _viewPrescription(Appointment appointment) async {
    try {
      // Show loading indicator
      _showLoadingDialog('Đang tải đơn thuốc...');

      // Get patient ID from the appointment object
      final String? patientId = appointment.patient?.id;
      if (patientId == null) {
        throw Exception('ID của bệnh nhân không tồn tại');
      }

      // Fetch prescriptions by patient ID using the API
      final List<Prescription> prescriptions =
      await _appointmentService.getPrescriptionsByPatient(patientId);

      if (!mounted) return;
      Navigator.of(context).pop(); // Close loading dialog

      // Filter prescriptions for the current appointment if needed
      final List<Prescription> appointmentPrescriptions = prescriptions
          .where((prescription) => prescription.appointmentId == appointment.id)
          .toList();

      final List<Prescription> prescriptionsToShow =
      appointmentPrescriptions.isNotEmpty ? appointmentPrescriptions : prescriptions;

      if (prescriptionsToShow.isEmpty) {
        _showErrorSnackBar('Không tìm thấy đơn thuốc cho bệnh nhân này');
        return;
      }

      // Show prescriptions in a dialog
      _showPrescriptionDialog(prescriptionsToShow, appointment);
    } catch (e) {
      if (!mounted) return;
      Navigator.of(context).pop(); // Close loading dialog
      _showErrorSnackBar('Không thể tải đơn thuốc: $e');
    }
  }

  void _showPrescriptionDialog(List<Prescription> prescriptions, Appointment appointment) {
    final String doctorName = appointment.doctor?.user.fullName ?? 'Bác sĩ';
    final String patientName = appointment.patient?.user.fullName ?? 'Bệnh nhân';
    final String appointmentDate = _formatDate(appointment.parseAppointmentDate());

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Đơn thuốc từ $doctorName'),
        content: Container(
          width: double.maxFinite,
          height: 400, // Set a fixed height for the dialog content
          child: prescriptions.length == 1
              ? _buildSinglePrescriptionView(prescriptions.first, doctorName, patientName, appointmentDate)
              : _buildMultiplePrescriptionsView(prescriptions, doctorName, patientName, appointmentDate),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Đóng'),
          ),
          ElevatedButton(
            onPressed: () => _exportPrescriptionPDF(prescriptions),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blueAccent,
              foregroundColor: Colors.white,
            ),
            child: const Text('Thêm vào giỏ hàng'),
          ),
        ],
      ),
    );
  }

  Widget _buildSinglePrescriptionView(
      Prescription prescription,
      String doctorName,
      String patientName,
      String appointmentDate
      ) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          _buildPrescriptionHeader(doctorName, patientName, appointmentDate),
          const Divider(thickness: 1),
          _buildPrescriptionDetails(prescription),
          const SizedBox(height: 16),
          if (prescription.notes != null && prescription.notes!.isNotEmpty)
            _buildPrescriptionNote(prescription.notes!),
          const SizedBox(height: 16),
          _buildPrescriptionStatusInfo(prescription),
        ],
      ),
    );
  }

  /// Builds a view for multiple prescriptions
  Widget _buildMultiplePrescriptionsView(
      List<Prescription> prescriptions,
      String doctorName,
      String patientName,
      String appointmentDate
      ) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildPrescriptionHeader(doctorName, patientName, appointmentDate),
        const Divider(thickness: 1),
        const SizedBox(height: 8),
        Expanded(
          child: ListView.separated(
            shrinkWrap: true,
            itemCount: prescriptions.length,
            separatorBuilder: (context, index) => const Divider(),
            itemBuilder: (context, index) {
              final prescription = prescriptions[index];
              return _buildPrescriptionListItem(prescription, index);
            },
          ),
        ),
      ],
    );
  }

  /// Builds the header section of the prescription view
  Widget _buildPrescriptionHeader(String doctorName, String patientName, String appointmentDate) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Thông tin đơn thuốc',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        _buildInfoRow2(Icons.person, 'Bác sĩ:', doctorName),
        _buildInfoRow2(Icons.person_outline, 'Bệnh nhân:', patientName),
        _buildInfoRow2(Icons.calendar_today, 'Ngày tư vấn:', appointmentDate),
      ],
    );
  }

  /// Builds the details section of a prescription
  Widget _buildPrescriptionDetails(Prescription prescription) {
    final prescriptionDate = prescription.prescriptionDate != null
        ? DateFormat('dd/MM/yyyy HH:mm').format(prescription.prescriptionDate!)
        : 'Không có thông tin';

    final expiryDate = prescription.expiryDate != null
        ? DateFormat('dd/MM/yyyy').format(prescription.expiryDate!)
        : 'Không có thông tin';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Chi tiết thuốc',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        _buildInfoRow2(
            Icons.medication,
            'Thuốc:',
            prescription.medicine?.name ?? "Không có tên"
        ),
        _buildInfoRow2(
            Icons.medical_services_outlined,
            'Liều lượng:',
            prescription.dosage ?? 'Không có thông tin'
        ),
        _buildInfoRow2(
            Icons.date_range,
            'Ngày kê đơn:',
            prescriptionDate
        ),
        _buildInfoRow2(
            Icons.event_busy,
            'Ngày hết hạn:',
            expiryDate
        ),
      ],
    );
  }

  /// Builds status information for the prescription
  Widget _buildPrescriptionStatusInfo(Prescription prescription) {
    Color statusColor;
    String statusText;
    IconData statusIcon;

    if (prescription.status == null) {
      statusColor = Colors.grey;
      statusText = 'Không xác định';
      statusIcon = Icons.help_outline;
    } else {
      switch (prescription.status!) {
        case PrescriptionStatus.ACTIVE:
          statusColor = Colors.green;
          statusText = 'Đang hiệu lực';
          statusIcon = Icons.check_circle_outline;
          break;
        case PrescriptionStatus.COMPLETED:
          statusColor = Colors.blue;
          statusText = 'Đã hoàn thành';
          statusIcon = Icons.task_alt;
          break;
        case PrescriptionStatus.CANCELLED:
          statusColor = Colors.red;
          statusText = 'Đã hủy';
          statusIcon = Icons.cancel_outlined;
          break;
        case PrescriptionStatus.EXPIRED:
          statusColor = Colors.orange;
          statusText = 'Đã hết hạn';
          statusIcon = Icons.warning_amber_outlined;
          break;
        default:
          statusColor = Colors.grey;
          statusText = 'Không xác định';
          statusIcon = Icons.help_outline;
      }
    }

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: statusColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: statusColor.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Icon(statusIcon, color: statusColor),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Trạng thái: $statusText',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: statusColor,
                  ),
                ),
                if (prescription.isValid != null)
                  Text(
                    prescription.isValid!
                        ? 'Đơn thuốc này có hiệu lực'
                        : 'Đơn thuốc này không còn hiệu lực',
                    style: TextStyle(
                      fontSize: 12,
                      color: prescription.isValid! ? Colors.green[700] : Colors.red[700],
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// Builds a list item for a prescription in the multiple prescriptions view
  Widget _buildPrescriptionListItem(Prescription prescription, int index) {
    // Determine status color
    Color statusColor = Colors.grey;
    if (prescription.status != null) {
      switch (prescription.status!) {
        case PrescriptionStatus.ACTIVE:
          statusColor = Colors.green;
          break;
        case PrescriptionStatus.COMPLETED:
          statusColor = Colors.blue;
          break;
        case PrescriptionStatus.CANCELLED:
          statusColor = Colors.red;
          break;
        case PrescriptionStatus.EXPIRED:
          statusColor = Colors.orange;
          break;
      }
    }

    final prescriptionDate = prescription.prescriptionDate != null
        ? DateFormat('dd/MM/yyyy').format(prescription.prescriptionDate!)
        : 'N/A';

    return ListTile(
      contentPadding: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
      leading: CircleAvatar(
        backgroundColor: statusColor.withOpacity(0.2),
        child: Text(
          '${index + 1}',
          style: TextStyle(color: statusColor, fontWeight: FontWeight.bold),
        ),
      ),
      title: Text(
        prescription.medicine?.name ?? "Thuốc ${index + 1}",
        style: const TextStyle(
          fontWeight: FontWeight.bold,
        ),
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Liều lượng: ${prescription.dosage ?? "Không có thông tin"}'),
          Text('Ngày kê: $prescriptionDate'),
        ],
      ),
      trailing: Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey[400]),
      onTap: () {
        // Close the multi-prescription dialog
        Navigator.of(context).pop();

        // Show detailed view for this specific prescription
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: Text(prescription.medicine?.name ?? 'Chi tiết đơn thuốc'),
            content: Container(
              width: double.maxFinite,
              height: 400,
              child: _buildSinglePrescriptionView(
                prescription,
                prescription.doctorId != null ? 'BS. ID: ${prescription.doctorId}' : 'Không có thông tin',
                prescription.patientId != null ? 'BN. ID: ${prescription.patientId}' : 'Không có thông tin',
                prescriptionDate,
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Đóng'),
              ),
            ],
          ),
        );
      },
    );
  }

  /// Builds a note section for the prescription
  Widget _buildPrescriptionNote(String note) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Ghi chú:',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.grey[100],
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(note),
        ),
      ],
    );
  }

  /// Builds an info row with icon, label and value
  Widget _buildInfoRow2(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: Colors.grey[600]),
          const SizedBox(width: 8),
          SizedBox(
            width: 90,
            child: Text(
              label,
              style: const TextStyle(
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                color: Colors.black87,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _exportPrescriptionPDF(List<Prescription> prescriptions) async {
    try {
      _showLoadingDialog('Đang thêm vào giỏ hàng...');

      // Kiểm tra xem danh sách thuốc có trống không
      if (prescriptions.isEmpty) {
        throw Exception('Không có thuốc nào để thêm vào giỏ hàng');
      }

      // Lấy CartService từ Provider
      final cartService = Provider.of<CartService>(context, listen: false);

      // Thêm từng thuốc trong đơn vào giỏ hàng
      int addedCount = 0;
      for (var prescription in prescriptions) {
        if (prescription.medicine != null && prescription.medicine!.id != null) {
          // Lấy ảnh chính của thuốc
          MedicineMedia? mainMedia;
          if (prescription.medicine!.medias != null && prescription.medicine!.medias!.isNotEmpty) {
            // Tìm ảnh có mainImage = true
            mainMedia = prescription.medicine!.medias!.firstWhere(
                  (media) => media.mainImage == true,
              orElse: () => prescription.medicine!.medias!.first, // Nếu không có, lấy ảnh đầu tiên
            );
          }

          // Thêm vào giỏ hàng
          cartService.addToCart(
            prescription.medicine!,
            prescription.medicine!.attributes!.first,
            media: mainMedia,
            quantity: 1,
          );

          addedCount++;
        }
      }

      // Đóng dialog hiện tại
      if (!mounted) return;
      Navigator.of(context).pop(); // Đóng dialog loading
      Navigator.of(context).pop(); // Đóng dialog hiển thị đơn thuốc

      // Hiển thị thông báo thành công
      _showSuccessSnackBar('Đã thêm $addedCount loại thuốc vào giỏ hàng');

      // Chuyển hướng đến trang giỏ hàng
      Navigator.pushNamed(context, '/cart');
    } catch (e) {
      if (!mounted) return;
      Navigator.of(context).pop(); // Đóng dialog loading
      _showErrorSnackBar('Không thể thêm vào giỏ hàng: $e');
    }
  }

  /// Builds empty state widget with appropriate message
  Widget _buildEmptyState(String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.event_busy, size: 80, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Text(
              message,
              style: TextStyle(
                fontSize: 18,
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () => Navigator.pushNamed(context, '/services'),
            icon: const Icon(Icons.add),
            label: const Text('Đặt lịch tư vấn'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blueAccent,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blueAccent,
        title: const Text('Lịch tư vấn của tôi'),
        centerTitle: true,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          tabs: const [
            Tab(text: 'Sắp tới'),
            Tab(text: 'Đã hoàn thành'),
            Tab(text: 'Đã hủy'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
          ? Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(_errorMessage!),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _fetchAppointments,
              child: const Text('Thử lại'),
            ),
          ],
        ),
      )
          : TabBarView(
        controller: _tabController,
        children: [
          // Upcoming appointments
          _buildAppointmentList(AppointmentStatus.SCHEDULED),

          // Completed appointments
          _buildAppointmentList(AppointmentStatus.COMPLETED),

          // Cancelled appointments
          _buildAppointmentList(AppointmentStatus.CANCELLED),
        ],
      ),
      bottomNavigationBar: CustomBottomNavigationBar(
        selectedIndex: 3,
        bottomNavType: BottomNavigationBarType.fixed,
        onTap: (index) {
          switch (index) {
            case 0:
              Navigator.pushNamed(context, '/home');
              break;
            case 1:
              Navigator.pushNamed(context, '/services');
              break;
            case 2:
              Navigator.pushNamed(context, '/cart');
              break;
            case 3:
            // Already on appointments page, do nothing
              break;
          }
        },
        onNavTypeChanged: (_) {},
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => Navigator.pushNamed(context, '/services'),
        backgroundColor: Colors.blueAccent,
        child: const Icon(Icons.add, color: Colors.white),
        tooltip: 'Đặt lịch tư vấn mới',
      ),
    );
  }

  /// Builds appointment list for a specific status
  Widget _buildAppointmentList(AppointmentStatus status) {
    // Lấy ngày hiện tại
    final DateTime now = DateTime.now();

    // Lọc danh sách các cuộc hẹn
    final List<Appointment> filteredAppointments = _appointments
        .where((appointment) {
      // Nếu đang ở tab Sắp tới (SCHEDULED), cần kiểm tra thêm thời gian
      if (status == AppointmentStatus.SCHEDULED) {
        // Lấy thời gian đầy đủ của cuộc hẹn
        final DateTime appointmentDate = appointment.parseAppointmentDate();
        final TimeOfDay appointmentTime = appointment.parseAppointmentTime();
        final DateTime appointmentDateTime = DateTime(
          appointmentDate.year,
          appointmentDate.month,
          appointmentDate.day,
          appointmentTime.hour,
          appointmentTime.minute,
        );

        // Chỉ hiển thị lịch sắp tới nếu: đúng trạng thái VÀ thời gian trong tương lai
        return appointment.status == status && appointmentDateTime.isAfter(now);
      }

      // Với các tab khác (Đã hoàn thành, Đã hủy) chỉ cần kiểm tra trạng thái
      return appointment.status == status;
    })
        .toList();

    // Hiển thị trạng thái trống nếu không có cuộc hẹn nào
    if (filteredAppointments.isEmpty) {
      String message;
      switch (status) {
        case AppointmentStatus.SCHEDULED:
          message = 'Bạn không có lịch tư vấn nào sắp tới';
          break;
        case AppointmentStatus.COMPLETED:
          message = 'Bạn chưa có lịch tư vấn nào đã hoàn thành';
          break;
        case AppointmentStatus.CANCELLED:
          message = 'Bạn không có lịch tư vấn nào đã hủy';
          break;
        case AppointmentStatus.PENDING:
          message = 'Bạn không có lịch tư vấn nào đang chờ';
          break;
        default:
          message = 'Không có lịch tư vấn nào';
          break;
      }
      return _buildEmptyState(message);
    }

    // Sắp xếp lịch hẹn theo thời gian (nếu là tab Sắp tới)
    if (status == AppointmentStatus.SCHEDULED) {
      filteredAppointments.sort((a, b) {
        final dateA = a.parseAppointmentDate();
        final timeA = a.parseAppointmentTime();
        final dateTimeA = DateTime(dateA.year, dateA.month, dateA.day, timeA.hour, timeA.minute);

        final dateB = b.parseAppointmentDate();
        final timeB = b.parseAppointmentTime();
        final dateTimeB = DateTime(dateB.year, dateB.month, dateB.day, timeB.hour, timeB.minute);

        return dateTimeA.compareTo(dateTimeB);
      });
    }

    // Hiển thị danh sách cuộc hẹn
    return RefreshIndicator(
      onRefresh: _fetchAppointments,
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(vertical: 12),
        itemCount: filteredAppointments.length,
        itemBuilder: (context, index) {
          return _buildAppointmentCard(filteredAppointments[index]);
        },
      ),
    );
  }
}

/// Custom exception class for appointment-related errors
class AppointmentException implements Exception {
  final String message;

  const AppointmentException(this.message);

  @override
  String toString() => message;
}