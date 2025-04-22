import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:medical_storage/models/appointment.dart';
import 'dart:async';
import 'dart:convert';

import 'package:medical_storage/services/webrtc_service.dart';  // Import WebRTCService mới

class ConsultationScreen extends StatefulWidget {
  final String consultationId;
  final String consultationCode;
  final dynamic doctor;
  final dynamic patient;
  final String userId;
  final Appointment appointment;

  const ConsultationScreen({
    Key? key,
    required this.consultationId,
    required this.consultationCode,
    required this.doctor,
    required this.patient,
    required this.userId,
    required this.appointment,
  }) : super(key: key);

  @override
  _ConsultationScreenState createState() => _ConsultationScreenState();
}

class _ConsultationScreenState extends State<ConsultationScreen> {
  // Services
  final WebRTCService _webrtcService = WebRTCService(
      serverUrl: 'http://172.20.10.4:3001',  // Thay đổi địa chỉ IP này thành server WebRTC riêng của bạn
      debug: true
  );

  // Connection states
  bool _isConnecting = true;
  bool _isConnected = false;
  String? _errorMessage;

  // WebRTC related
  final RTCVideoRenderer _localRenderer = RTCVideoRenderer();
  final RTCVideoRenderer _remoteRenderer = RTCVideoRenderer();

  // Media controls
  bool _isMicrophoneEnabled = true;
  bool _isCameraEnabled = true;
  bool _isSpeakerEnabled = true;

  // Chat related
  final TextEditingController _messageController = TextEditingController();
  final List<Map<String, dynamic>> _messages = [];
  final ScrollController _scrollController = ScrollController();
  bool _isTyping = false;
  Map<String, bool> _partnerTyping = {};
  Timer? _typingTimer;

  @override
  void initState() {
    super.initState();
    _initializeRenderers();
    _connectToSession();
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    _typingTimer?.cancel();

    // Clean up WebRTC
    _localRenderer.dispose();
    _remoteRenderer.dispose();

    // Disconnect WebRTC Service
    _webrtcService.disconnect();

    super.dispose();
  }

  // Initialize WebRTC video renderers
  Future<void> _initializeRenderers() async {
    await _localRenderer.initialize();
    await _remoteRenderer.initialize();
  }

  // Connect to consultation session using new WebRTC Service
  Future<void> _connectToSession() async {
    setState(() {
      _isConnecting = true;
      _errorMessage = null;
    });

    try {
      print('🔄 Bắt đầu kết nối đến phiên tư vấn');
      print('📋 Thông tin consultationId: ${widget.consultationId}');
      print('📋 Thông tin consultationCode: ${widget.consultationCode}');
      print('📋 Thông tin userId: ${widget.userId}');

      // Lấy thông tin bác sĩ/bệnh nhân
      if (widget.doctor != null) {
        print('📋 Thông tin bác sĩ: ${widget.doctor.user?.id}');
      } else {
        print('⚠️ Không có thông tin bác sĩ');
      }

      if (widget.patient != null) {
        print('📋 Thông tin bệnh nhân: ${widget.patient.user?.id}');
      } else {
        print('⚠️ Không có thông tin bệnh nhân');
      }

      // Thiết lập các callback
      _setupWebRTCCallbacks();

      // Xác định userType
      String userType;
      String targetUserId;

      if (widget.userId == widget.doctor?.user?.id) {
        userType = 'DOCTOR';
        targetUserId = widget.patient?.user?.id ?? '';
        print('👤 Người dùng hiện tại là BÁC SĨ, target: $targetUserId');
      } else {
        userType = 'PATIENT';
        targetUserId = widget.doctor?.user?.id ?? '';
        print('👤 Người dùng hiện tại là BỆNH NHÂN, target: $targetUserId');
      }

      // Kết nối tới server signaling
      print('🔄 Kết nối tới server signaling...');
      await _webrtcService.connect(
          consultationId: widget.consultationId,
          userId: widget.userId,
          userType: userType
      );
      print('✅ Kết nối server signaling thành công');

      // Thiết lập đối tượng mục tiêu
      if (targetUserId.isNotEmpty) {
        print('🔄 Thiết lập targetUserId: $targetUserId');
        _webrtcService.setTargetUserId(targetUserId);
      } else {
        print('⚠️ targetUserId trống');
      }

      // Khởi tạo WebRTC
      print('🔄 Khởi tạo WebRTC...');
      await _webrtcService.initializeWebRTC();
      print('✅ Khởi tạo WebRTC thành công');

      // Thực hiện quá trình signaling dựa trên vai trò
      print('🔄 Thực hiện signaling theo vai trò $userType');
      if (userType == 'DOCTOR') {
        // Nếu là bác sĩ, đợi 2s rồi tạo offer
        print('⏱️ Chờ 2 giây trước khi tạo offer...');
        await Future.delayed(Duration(seconds: 2));
        print('🔄 Tạo offer...');
        await _webrtcService.createOffer();
        print('✅ Đã tạo offer');
      } else {
        // Nếu là bệnh nhân, đợi 2s rồi request offer
        print('⏱️ Chờ 2 giây trước khi request offer...');
        await Future.delayed(Duration(seconds: 2));
        print('🔄 Request offer từ bác sĩ...');
        _webrtcService.requestOfferWithRetry();
        print('✅ Đã gửi request offer');
      }

      setState(() {
        _isConnecting = false;
        _isConnected = true;
      });

      print('✅ Kết nối phiên tư vấn thành công');
    } catch (e) {
      print('❌ Lỗi kết nối: $e');
      setState(() {
        _isConnecting = false;
        _errorMessage = 'Không thể kết nối: $e';
      });
    }
  }

  // Thiết lập các callback cho WebRTC Service
  void _setupWebRTCCallbacks() {
    // Xử lý local stream
    _webrtcService.onLocalStream = (stream) {
      print('📹 Nhận được local stream');
      setState(() {
        _localRenderer.srcObject = stream;
      });
    };

    // Xử lý remote stream
    _webrtcService.onRemoteStream = (stream) {
      print('📹 Nhận được remote stream');
      setState(() {
        _remoteRenderer.srcObject = stream;
      });
    };

    // Xử lý thay đổi trạng thái kết nối
    _webrtcService.onConnectionStateChange = (state) {
      print('🔌 Trạng thái kết nối thay đổi: $state');

      if (state == RTCIceConnectionState.RTCIceConnectionStateConnected ||
          state == RTCIceConnectionState.RTCIceConnectionStateCompleted) {
        print('✅ Kết nối WebRTC thành công');
        setState(() {
          _isConnected = true;
        });
      } else if (state == RTCIceConnectionState.RTCIceConnectionStateFailed ||
          state == RTCIceConnectionState.RTCIceConnectionStateDisconnected) {
        print('⚠️ Kết nối WebRTC bị gián đoạn');
        // Hiển thị thông báo
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Kết nối bị gián đoạn. Đang thử kết nối lại...'),
            backgroundColor: Colors.orange,
          ),
        );
      }
    };

    // Xử lý tin nhắn
    _webrtcService.onMessage = (eventName, data) {
      print('📬 Nhận tin nhắn: $eventName, dữ liệu: $data');

      if (eventName == 'chat') {
        print('💬 Nhận tin nhắn chat');
        setState(() {
          _messages.add(Map<String, dynamic>.from(data));
        });

        // Scroll to bottom
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (_scrollController.hasClients) {
            _scrollController.animateTo(
              _scrollController.position.maxScrollExtent,
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeOut,
            );
          }
        });
      } else if (eventName == 'typing') {
        if (data['userId'] != widget.userId) {
          print('⌨️ Người dùng ${data['userId']} đang nhập: ${data['isTyping']}');
          setState(() {
            _partnerTyping[data['userId']] = data['isTyping'] ?? false;
          });
        }
      } else if (eventName == 'video-status') {
        print('📹 Trạng thái video thay đổi: $data');
        // Xử lý trạng thái video của đối phương
      } else if (eventName == 'audio-status') {
        print('🎤 Trạng thái audio thay đổi: $data');
        // Xử lý trạng thái audio của đối phương
      } else if (eventName == 'consultation-status') {
        print('📊 Trạng thái phiên tư vấn thay đổi: $data');
        if (data['type'] == 'SESSION_ENDED') {
          print('🛑 Phiên tư vấn kết thúc');
          // Hiển thị dialog kết thúc
          showDialog(
            context: context,
            barrierDismissible: false,
            builder: (context) => AlertDialog(
              title: const Text('Phiên tư vấn đã kết thúc'),
              content: const Text('Phiên tư vấn đã được kết thúc.'),
              actions: [
                TextButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                    Navigator.of(context).pop(); // Return to previous screen
                  },
                  child: const Text('OK'),
                ),
              ],
            ),
          );
        }
      }
    };

    // Xử lý lỗi
    _webrtcService.onError = (error) {
      print('❌ Lỗi WebRTC: $error');
      setState(() {
        _errorMessage = error.toString();
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Lỗi: $error'),
          backgroundColor: Colors.red,
        ),
      );
    };
  }

  void _debugConnection() {
    print('📊 Thông tin kết nối:');
    print('📊 WebRTC LocalStream: ${_webrtcService.localStream != null}');
    print('📊 WebRTC RemoteStream: ${_webrtcService.remoteStream != null}');
    print('📊 WebRTC IsConnected: ${_webrtcService.isConnected}');
    print('📊 WebRTC IsInConsultation: ${_webrtcService.isInConsultation}');

    // Hiển thị thông báo debug
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Debug: kết nối ${_webrtcService.isConnected ? "đã thiết lập" : "chưa thiết lập"}'),
        backgroundColor: Colors.amber,
        duration: Duration(seconds: 5),
      ),
    );
  }

  // Lấy token xác thực - thay thế bằng phương thức lấy token của bạn
  Future<String?> _getToken() async {
    // Triển khai phương thức lấy token từ local storage
    return "your-auth-token";
  }

  // Send a chat message
  Future<void> _sendMessage() async {
    if (_messageController.text.trim().isEmpty) return;

    final message = _messageController.text;
    _messageController.clear();

    try {
      print('📤 Gửi tin nhắn: $message');

      // Gửi tin nhắn qua WebRTC Service
      _webrtcService.sendChatMessage(message);

      // Thêm tin nhắn vào danh sách local
      setState(() {
        _messages.add({
          'consultationId': widget.consultationId,
          'senderId': widget.userId,
          'senderType': widget.userId == widget.doctor?.user?.id ? 'DOCTOR' : 'PATIENT',
          'content': message,
          'timestamp': DateTime.now().millisecondsSinceEpoch
        });
      });

      // Cuộn xuống dưới
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_scrollController.hasClients) {
          _scrollController.animateTo(
            _scrollController.position.maxScrollExtent,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOut,
          );
        }
      });

      // Xóa trạng thái đang nhập
      _isTyping = false;
      _webrtcService.sendTypingStatus(false);

      print('✅ Đã gửi tin nhắn thành công');
    } catch (e) {
      print('❌ Lỗi gửi tin nhắn: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Không thể gửi tin nhắn: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }


  // Update typing status
  void _updateTypingStatus(String text) {
    bool isCurrentlyTyping = text.isNotEmpty;

    if (isCurrentlyTyping != _isTyping) {
      _isTyping = isCurrentlyTyping;
      print('⌨️ Cập nhật trạng thái đang nhập: $_isTyping');
      _webrtcService.sendTypingStatus(_isTyping);
    }

    // Reset typing timer
    _typingTimer?.cancel();
    if (_isTyping) {
      _typingTimer = Timer(const Duration(seconds: 3), () {
        if (_isTyping) {
          _isTyping = false;
          print('⌨️ Tự động reset trạng thái đang nhập sau 3s');
          _webrtcService.sendTypingStatus(false);
        }
      });
    }
  }

  // Toggle camera
  void _toggleCamera() async {
    setState(() {
      _isCameraEnabled = !_isCameraEnabled;
    });

    print('📹 Thay đổi trạng thái camera: $_isCameraEnabled');
    _webrtcService.toggleVideo(_isCameraEnabled);
  }


  // Toggle microphone
  void _toggleMicrophone() {
    setState(() {
      _isMicrophoneEnabled = !_isMicrophoneEnabled;
    });

    print('🎤 Thay đổi trạng thái microphone: $_isMicrophoneEnabled');
    _webrtcService.toggleAudio(_isMicrophoneEnabled);
  }

  // Toggle speaker
  void _toggleSpeaker() {
    setState(() {
      _isSpeakerEnabled = !_isSpeakerEnabled;
    });

    // TODO: Implement audio output switching if Flutter WebRTC supports it
  }

  // End the call
  void _endCall() {
    print('🛑 Yêu cầu kết thúc cuộc gọi');
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Kết thúc cuộc gọi'),
        content: const Text('Bạn có chắc chắn muốn kết thúc cuộc gọi này?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Hủy'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.of(context).pop();
              await _confirmEndCall();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text('Kết thúc'),
          ),
        ],
      ),
    );
  }

  // Confirm and end the call
  Future<void> _confirmEndCall() async {
    try {
      print('🛑 Đang thực hiện kết thúc cuộc gọi...');

      // Show loading
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => const AlertDialog(
          content: Row(
            children: [
              CircularProgressIndicator(),
              SizedBox(width: 20),
              Text('Đang kết thúc cuộc gọi...'),
            ],
          ),
        ),
      );

      // End call with WebRTC Service
      await _webrtcService.endCall(
          reason: widget.userId == widget.doctor?.user?.id ?
          'Bác sĩ kết thúc cuộc gọi' :
          'Bệnh nhân kết thúc cuộc gọi'
      );

      print('✅ Đã kết thúc cuộc gọi thành công');

      if (!mounted) return;

      // Close loading dialog
      Navigator.of(context).pop();

      // Return to previous screen
      Navigator.of(context).pop();
    } catch (e) {
      print('❌ Lỗi khi kết thúc cuộc gọi: $e');

      if (!mounted) return;

      // Close loading dialog
      Navigator.of(context).pop();

      // Show error
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Lỗi khi kết thúc cuộc gọi: $e'),
          backgroundColor: Colors.red,
        ),
      );

      // Still return to previous screen
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tư vấn trực tuyến'),
        backgroundColor: Colors.blueAccent,
        actions: [
          IconButton(
            icon: const Icon(Icons.call_end),
            color: Colors.red,
            onPressed: _endCall,
          ),
        ],
      ),
      body: _isConnecting
          ? _buildLoadingView()
          : _errorMessage != null
          ? _buildErrorView()
          : _buildConsultationView(),
    );
  }

  // Loading view
  Widget _buildLoadingView() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(),
          SizedBox(height: 20),
          Text('Đang kết nối tới phiên tư vấn...'),
        ],
      ),
    );
  }

  // Error view
  Widget _buildErrorView() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 80, color: Colors.red[300]),
          const SizedBox(height: 20),
          Text(
            'Không thể kết nối tới phiên tư vấn',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(_errorMessage ?? 'Lỗi không xác định'),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: _connectToSession,
            child: const Text('Thử lại'),
          ),
          const SizedBox(height: 12),
          ElevatedButton(
            onPressed: _debugConnection,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.amber,
            ),
            child: const Text('Debug Connection'),
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Quay lại'),
          ),
        ],
      ),
    );
  }

  // Main consultation view
  Widget _buildConsultationView() {
    return Column(
      children: [
        // Video area
        Expanded(
          flex: 3,
          child: _buildVideoArea(),
        ),

        // Chat area
        Expanded(
          flex: 2,
          child: _buildChatArea(),
        ),
      ],
    );
  }

  // Video area with doctor's video and self-view
  Widget _buildVideoArea() {
    return Container(
      color: Colors.black,
      child: Stack(
        children: [
          // Remote video (doctor)
          Center(
            child: RTCVideoView(
              _remoteRenderer,
              objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
            ),
          ),

          // Local video (patient) - small overlay
          Positioned(
            right: 16,
            bottom: 16,
            child: Container(
              width: 120,
              height: 160,
              decoration: BoxDecoration(
                color: Colors.black,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.white, width: 2),
              ),
              clipBehavior: Clip.hardEdge,
              child: RTCVideoView(
                _localRenderer,
                objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
                mirror: true,
              ),
            ),
          ),

          // Video controls at the bottom
          Positioned(
            left: 0,
            right: 0,
            bottom: 16,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Mic button
                CircleAvatar(
                  radius: 25,
                  backgroundColor: _isMicrophoneEnabled ? Colors.grey[800] : Colors.red,
                  child: IconButton(
                    icon: Icon(
                      _isMicrophoneEnabled ? Icons.mic : Icons.mic_off,
                      color: Colors.white,
                    ),
                    onPressed: _toggleMicrophone,
                  ),
                ),
                const SizedBox(width: 24),

                // Camera button
                CircleAvatar(
                  radius: 25,
                  backgroundColor: _isCameraEnabled ? Colors.grey[800] : Colors.red,
                  child: IconButton(
                    icon: Icon(
                      _isCameraEnabled ? Icons.videocam : Icons.videocam_off,
                      color: Colors.white,
                    ),
                    onPressed: _toggleCamera,
                  ),
                ),
                const SizedBox(width: 24),

                // Speaker button
                CircleAvatar(
                  radius: 25,
                  backgroundColor: _isSpeakerEnabled ? Colors.grey[800] : Colors.red,
                  child: IconButton(
                    icon: Icon(
                      _isSpeakerEnabled ? Icons.volume_up : Icons.volume_off,
                      color: Colors.white,
                    ),
                    onPressed: _toggleSpeaker,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Chat area with messages and input field
  Widget _buildChatArea() {
    final bool isPartnerTyping = _partnerTyping.values.any((typing) => typing);

    return Container(
      padding: const EdgeInsets.all(8),
      color: Colors.white,
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
            child: Row(
              children: [
                Icon(Icons.chat, color: Colors.blue[700]),
                const SizedBox(width: 8),
                Text(
                  'Trò chuyện với bác sĩ',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    color: Colors.blue[700],
                  ),
                ),
              ],
            ),
          ),

          // Message list
          Expanded(
            child: _messages.isEmpty
                ? Center(
              child: Text(
                'Chưa có tin nhắn nào',
                style: TextStyle(color: Colors.grey[600]),
              ),
            )
                : ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.symmetric(horizontal: 8),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final message = _messages[index];
                final bool isMe = message['senderId']?.toString() == widget.userId;

                return Align(
                  alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    decoration: BoxDecoration(
                      color: isMe ? Colors.blue[100] : Colors.grey[200],
                      borderRadius: BorderRadius.circular(16),
                    ),
                    constraints: BoxConstraints(
                      maxWidth: MediaQuery.of(context).size.width * 0.75,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          message['content'] ?? message['message'] ?? '',
                          style: const TextStyle(fontSize: 16),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _formatTimestamp(message['timestamp'] ?? message['sentAt']),
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          // Typing indicator
          if (isPartnerTyping)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              alignment: Alignment.centerLeft,
              child: Text(
                'Bác sĩ đang nhập...',
                style: TextStyle(
                  fontSize: 12,
                  fontStyle: FontStyle.italic,
                  color: Colors.grey[600],
                ),
              ),
            ),

          // Message input field
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    onChanged: _updateTypingStatus,
                    decoration: InputDecoration(
                      hintText: 'Nhập tin nhắn...',
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide(color: Colors.grey[300]!),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide(color: Colors.grey[300]!),
                      ),
                      filled: true,
                      fillColor: Colors.grey[100],
                    ),
                    minLines: 1,
                    maxLines: 4,
                    textInputAction: TextInputAction.send,
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
                const SizedBox(width: 8),
                CircleAvatar(
                  backgroundColor: Colors.blue,
                  child: IconButton(
                    icon: const Icon(Icons.send, color: Colors.white),
                    onPressed: _sendMessage,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Format timestamp for messages
  String _formatTimestamp(dynamic timestamp) {
    if (timestamp == null) return '';

    DateTime dateTime;
    if (timestamp is int) {
      dateTime = DateTime.fromMillisecondsSinceEpoch(timestamp);
    } else if (timestamp is String) {
      try {
        dateTime = DateTime.parse(timestamp);
      } catch (e) {
        return '';
      }
    } else {
      return '';
    }

    return '${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
  }
}