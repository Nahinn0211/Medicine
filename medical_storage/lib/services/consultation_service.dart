import 'package:shared_preferences/shared_preferences.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:http/http.dart' as http;
import 'dart:convert';

class ConsultationService {
  final String _socketIOUrl = 'http://172.20.10.4:3001'; // Socket.IO server
  final String _apiBaseUrl = 'http://172.20.10.4:8080/api'; // REST API server - sửa lại IP
  bool peerConnectionHasRemoteDescription = false;
  Map<String, Set<Function>> _eventHandlers = {};
  IO.Socket? _socketClient;

  // Kiểm tra trạng thái kết nối WebSocket
  bool isWebSocketConnected() {
    return _socketClient != null && _socketClient!.connected;
  }

  // Thiết lập kết nối WebSocket
  Future<IO.Socket> setupWebSocketConnection(
      String consultationId,
      String userId,
      String userType,
      Function(dynamic) messageHandler) async {

    // QUAN TRỌNG: Đừng sử dụng token trong query trên Flutter
    final socket = IO.io(_socketIOUrl, <String, dynamic>{
      'transports': ['websocket', 'polling'],
      'autoConnect': false,
      'query': {
        'consultationId': consultationId,
        'userId': userId,
        'userType': userType,
      },
      // Không sử dụng withCredentials
      'withCredentials': false,
      'forceNew': true
    });

    // Đăng ký các sự kiện
    socket.onConnect((_) {
      print('Socket connected successfully');
    });

    socket.onConnectError((error) {
      print('Socket connection error: $error');
    });

    // Đăng ký các handler xử lý sự kiện
    _socketClient = socket;
    _registerSocketEvents(messageHandler);

    // Kết nối
    socket.connect();

    return socket;
  }

  // Thêm vào ConsultationService.dart
  Future<void> requestOffer(String consultationId, String patientId, String doctorId) async {
    try {
      print('📤 Gửi yêu cầu offer từ bệnh nhân');
      if (_socketClient != null && _socketClient!.connected) {
        _socketClient!.emit('request-offer', {
          'consultationId': consultationId,
          'patientId': patientId,
          'doctorId': doctorId,
          'timestamp': DateTime.now().millisecondsSinceEpoch
        });
        print('✅ Đã gửi yêu cầu offer thành công');
      } else {
        print('❌ Không thể gửi yêu cầu offer - socket không kết nối');
      }
    } catch (e) {
      print('❌ Lỗi gửi yêu cầu offer: $e');
    }
  }

  // Đăng ký các sự kiện Socket.IO
  void _registerSocketEvents(Function(dynamic) messageHandler) {
    // Sự kiện hệ thống
    _socketClient!.on('system', (data) {
      print('System event: $data');
      messageHandler(data);
    });

    // Sự kiện WebRTC với xử lý đặc biệt
    _socketClient!.on('offer', (data) {
      print('📥 WebRTC offer received raw: $data');

      // Xử lý đặc biệt cho dữ liệu offer
      if (data is Map) {
        print('📤 Chuyển tiếp offer dạng Map');
        messageHandler({
          'type': 'WEBRTC_OFFER',
          ...Map<String, dynamic>.from(data)
        });
      } else if (data is String) {
        try {
          print('📤 Chuyển tiếp offer dạng String sau khi chuyển đổi');
          var jsonData = json.decode(data);
          messageHandler({
            'type': 'WEBRTC_OFFER',
            ...jsonData is Map ? Map<String, dynamic>.from(jsonData) : {'data': jsonData}
          });
        } catch (e) {
          print('❌ Lỗi chuyển đổi offer String sang JSON: $e');
          messageHandler({
            'type': 'WEBRTC_OFFER',
            'data': data
          });
        }
      } else {
        print('📤 Chuyển tiếp offer dạng khác: ${data.runtimeType}');
        messageHandler({
          'type': 'WEBRTC_OFFER',
          'data': data
        });
      }
    });

    _socketClient!.on('answer', (data) {
      print('📥 WebRTC answer received raw: $data');

      // Xử lý tương tự như offer
      if (data is Map) {
        print('📤 Chuyển tiếp answer dạng Map');
        messageHandler({
          'type': 'WEBRTC_ANSWER',
          ...Map<String, dynamic>.from(data)
        });
        peerConnectionHasRemoteDescription = true;
      } else if (data is String) {
        try {
          print('📤 Chuyển tiếp answer dạng String sau khi chuyển đổi');
          var jsonData = json.decode(data);
          messageHandler({
            'type': 'WEBRTC_ANSWER',
            ...jsonData is Map ? Map<String, dynamic>.from(jsonData) : {'data': jsonData}
          });
          peerConnectionHasRemoteDescription = true;
        } catch (e) {
          print('❌ Lỗi chuyển đổi answer String sang JSON: $e');
          messageHandler({
            'type': 'WEBRTC_ANSWER',
            'data': data
          });
        }
      } else {
        print('📤 Chuyển tiếp answer dạng khác: ${data.runtimeType}');
        messageHandler({
          'type': 'WEBRTC_ANSWER',
          'data': data
        });
      }
    });

    _socketClient!.on('ice-candidate', (data) {
      print('📥 WebRTC ICE candidate received raw: $data');

      // Xử lý tương tự như offer và answer
      if (data is Map) {
        print('📤 Chuyển tiếp ICE candidate dạng Map');
        messageHandler({
          'type': 'WEBRTC_ICE_CANDIDATE',
          ...Map<String, dynamic>.from(data)
        });
      } else if (data is String) {
        try {
          print('📤 Chuyển tiếp ICE candidate dạng String sau khi chuyển đổi');
          var jsonData = json.decode(data);
          messageHandler({
            'type': 'WEBRTC_ICE_CANDIDATE',
            ...jsonData is Map ? Map<String, dynamic>.from(jsonData) : {'data': jsonData}
          });
        } catch (e) {
          print('❌ Lỗi chuyển đổi ICE candidate String sang JSON: $e');
          messageHandler({
            'type': 'WEBRTC_ICE_CANDIDATE',
            'data': data
          });
        }
      } else {
        print('📤 Chuyển tiếp ICE candidate dạng khác: ${data.runtimeType}');
        messageHandler({
          'type': 'WEBRTC_ICE_CANDIDATE',
          'data': data
        });
      }
    });

    // Sự kiện chat
    _socketClient!.on('chat', (data) {
      print('Chat message received: $data');
      messageHandler({
        'type': 'CHAT_MESSAGE',
        ...data is Map ? Map<String, dynamic>.from(data) : {'data': data}
      });
    });

    // Sự kiện trạng thái media
    _socketClient!.on('video-status', (data) {
      print('Video status received: $data');
      messageHandler({
        'type': 'VIDEO_STATUS',
        ...data is Map ? Map<String, dynamic>.from(data) : {'data': data}
      });
    });

    _socketClient!.on('audio-status', (data) {
      print('Audio status received: $data');
      messageHandler({
        'type': 'AUDIO_STATUS',
        ...data is Map ? Map<String, dynamic>.from(data) : {'data': data}
      });
    });

    _socketClient!.on('screen-share', (data) {
      print('Screen share status received: $data');
      messageHandler({
        'type': 'SCREEN_SHARE_STATUS',
        ...data is Map ? Map<String, dynamic>.from(data) : {'data': data}
      });
    });

    // Sự kiện đang nhập
    _socketClient!.on('typing', (data) {
      print('Typing status received: $data');
      messageHandler({
        'type': 'TYPING_STATUS',
        ...data is Map ? Map<String, dynamic>.from(data) : {'data': data}
      });
    });

    // Sự kiện trạng thái phiên tư vấn
    _socketClient!.on('consultation-status', (data) {
      print('Consultation status received: $data');
      messageHandler({
        'type': 'CONSULTATION_STATUS',
        ...data is Map ? Map<String, dynamic>.from(data) : {'data': data}
      });
    });

    // Sự kiện cập nhật trạng thái kết nối
    _socketClient!.on('connection-status', (data) {
      print('Connection status update: $data');
      messageHandler({
        'type': 'CONNECTION_STATUS',
        ...data is Map ? Map<String, dynamic>.from(data) : {'data': data}
      });
    });

    // Nhận pong từ server
    _socketClient!.on('pong', (data) {
      print('📥 Nhận pong từ server: $data');
    });
  }

  // --- WebRTC Signaling ---

  // Trong ConsultationService.dart, cập nhật các hàm gửi với log chi tiết
  void sendOffer(String consultationId, String senderId, String targetUserId, Map<String, dynamic> sdp) {
    if (!isWebSocketConnected()) {
      print('❌ Không thể gửi offer - Socket.IO chưa kết nối');
      return;
    }

    // Đảm bảo định dạng SDP nhất quán
    if (!sdp.containsKey('type') || !sdp.containsKey('sdp')) {
      print('⚠️ SDP định dạng không đúng: $sdp');
    }

    final offerData = {
      'type': 'OFFER',
      'consultationId': consultationId,
      'senderId': senderId,
      'targetUserId': targetUserId,
      'sdp': sdp,
      'timestamp': DateTime.now().millisecondsSinceEpoch
    };

    print('📤 Gửi WebRTC offer (${DateTime.now()}): ${json.encode(offerData)}');
    _socketClient!.emit('offer', offerData);
    print('📤 Đã gửi offer event thành công');
  }

  void pingServer() {
    if (_socketClient != null && _socketClient!.connected) {
      print('📤 Gửi ping đến server');
      _socketClient!.emit('ping', {'timestamp': DateTime.now().millisecondsSinceEpoch});
    }
  }

  // Gửi WebRTC answer
  void sendAnswer(String consultationId, String senderId, String targetUserId, Map<String, dynamic> sdp) {
    if (!isWebSocketConnected()) {
      print('❌ Không thể gửi answer - Socket.IO chưa kết nối');
      return;
    }

    // Đảm bảo định dạng SDP nhất quán
    if (!sdp.containsKey('type') || !sdp.containsKey('sdp')) {
      print('⚠️ SDP định dạng không đúng: $sdp');
    }

    final answerData = {
      'type': 'ANSWER',
      'consultationId': consultationId,
      'senderId': senderId,
      'targetUserId': targetUserId,
      'sdp': sdp,
      'timestamp': DateTime.now().millisecondsSinceEpoch
    };

    print('📤 Gửi WebRTC answer (${DateTime.now()}): ${json.encode(answerData)}');
    _socketClient!.emit('answer', answerData);
    peerConnectionHasRemoteDescription = true;
    print('📤 Đã gửi answer event thành công');
  }

  // Gửi WebRTC ICE candidate
  void sendIceCandidate(String consultationId, String senderId, String targetUserId, Map<String, dynamic> candidate) {
    if (!isWebSocketConnected()) {
      print('❌ Không thể gửi ICE candidate - Socket.IO chưa kết nối');
      return;
    }

    final candidateData = {
      'type': 'ICE_CANDIDATE',
      'consultationId': consultationId,
      'senderId': senderId,
      'targetUserId': targetUserId,
      'candidate': candidate,
      'timestamp': DateTime.now().millisecondsSinceEpoch
    };

    print('📤 Gửi ICE candidate: ${json.encode(candidateData)}');
    _socketClient!.emit('ice-candidate', candidateData);
    print('📤 Đã gửi ICE candidate thành công');
  }

  // --- API HTTP ---

  // Lấy token từ local storage
  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  // Lấy thông tin consultation bằng mã
  Future<Map<String, dynamic>> getConsultationByCode(String consultationCode) async {
    try {
      String? token = await _getToken();
      final response = await http.get(
        Uri.parse('$_apiBaseUrl/consultations/code/$consultationCode'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json'
        },
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Không thể lấy thông tin cuộc tư vấn: ${response.statusCode}');
      }
    } catch (e) {
      print('Lỗi khi lấy thông tin cuộc tư vấn: $e');
      rethrow;
    }
  }

  // Lấy cấu hình ICE servers (STUN/TURN)
  Future<Map<String, dynamic>> getIceServers() async {
    try {
      String? token = await _getToken();
      final response = await http.get(
        Uri.parse('$_apiBaseUrl/webrtc/ice-servers'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json'
        },
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Không thể lấy cấu hình ICE servers: ${response.statusCode}');
      }
    } catch (e) {
      print('Lỗi khi lấy cấu hình ICE servers: $e');
      // Trả về máy chủ STUN công cộng mặc định
      return {
        'iceServers': [
          {
            'urls': [
              "stun:stun.l.google.com:19302",
              "stun:stun1.l.google.com:19302",
              "stun:stun2.l.google.com:19302",
            ]
          }
        ]
      };
    }
  }

  // Bắt đầu phiên tư vấn
  Future<Map<String, dynamic>> startConsultationSession(
      String consultationId, String initiatorId, String initiatorType) async {
    try {
      String? token = await _getToken();
      final response = await http.post(
        Uri.parse('$_apiBaseUrl/consultations/start-session'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json'
        },
        body: jsonEncode({
          'consultationId': int.tryParse(consultationId) ?? consultationId,
          'initiatorId': int.tryParse(initiatorId) ?? initiatorId,
          'initiatorType': initiatorType
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        // Thông báo qua Socket.IO
        if (isWebSocketConnected()) {
          _socketClient!.emit('consultation-status', {
            'type': 'SESSION_STARTED',
            'consultationId': int.tryParse(consultationId) ?? consultationId,
            'initiatorId': int.tryParse(initiatorId) ?? initiatorId,
            'timestamp': DateTime.now().millisecondsSinceEpoch
          });
        }

        return data;
      } else {
        throw Exception('Không thể bắt đầu phiên tư vấn: ${response.statusCode}');
      }
    } catch (e) {
      print('Lỗi khi bắt đầu phiên tư vấn: $e');
      rethrow;
    }
  }

  // Kết thúc phiên tư vấn
  Future<Map<String, dynamic>> endConsultationSession(
      String consultationId, String terminatorId, String terminatorType, String terminationReason) async {
    try {
      String? token = await _getToken();
      final response = await http.post(
        Uri.parse('$_apiBaseUrl/consultations/end-session'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json'
        },
        body: jsonEncode({
          'consultationId': int.tryParse(consultationId) ?? consultationId,
          'terminatorId': int.tryParse(terminatorId) ?? terminatorId,
          'terminatorType': terminatorType,
          'terminationReason': terminationReason
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        // Thông báo qua Socket.IO
        if (isWebSocketConnected()) {
          _socketClient!.emit('consultation-status', {
            'type': 'SESSION_ENDED',
            'consultationId': int.tryParse(consultationId) ?? consultationId,
            'terminatorId': int.tryParse(terminatorId) ?? terminatorId,
            'reason': terminationReason,
            'timestamp': DateTime.now().millisecondsSinceEpoch
          });
        }

        return data;
      } else {
        throw Exception('Không thể kết thúc phiên tư vấn: ${response.statusCode}');
      }
    } catch (e) {
      print('Lỗi khi kết thúc phiên tư vấn: $e');
      rethrow;
    }
  }

  // Cập nhật trạng thái video
  Future<bool> toggleVideoStream(String consultationId, String userId, bool isEnabled) async {
    try {
      String? token = await _getToken();

      // Chuyển đổi ID sang số nếu có thể
      final consultationIdValue = int.tryParse(consultationId) ?? consultationId;
      final userIdValue = int.tryParse(userId) ?? userId;

      final response = await http.post(
        Uri.parse('$_apiBaseUrl/consultations/$consultationIdValue/toggle-video?userId=$userIdValue&isEnabled=$isEnabled'),
        headers: {
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        // Thông báo qua Socket.IO
        if (isWebSocketConnected()) {
          _socketClient!.emit('video-status', {
            'consultationId': consultationIdValue,
            'userId': userIdValue,
            'enabled': isEnabled,
            'timestamp': DateTime.now().millisecondsSinceEpoch
          });
        }

        return true;
      } else {
        throw Exception('Không thể cập nhật trạng thái video: ${response.statusCode}');
      }
    } catch (e) {
      print('Lỗi khi cập nhật trạng thái video: $e');
      rethrow;
    }
  }

  // Cập nhật trạng thái audio
  void toggleAudioStatus(String consultationId, String userId, bool isEnabled) {
    if (!isWebSocketConnected()) {
      print('Cannot update audio status - Socket.IO not connected');
      return;
    }

    final audioData = {
      'consultationId': int.tryParse(consultationId) ?? consultationId,
      'userId': int.tryParse(userId) ?? userId,
      'enabled': isEnabled,
      'timestamp': DateTime.now().millisecondsSinceEpoch
    };

    print('Sending audio status update: $audioData');
    _socketClient!.emit('audio-status', audioData);
  }

  // Cập nhật trạng thái chia sẻ màn hình
  void toggleScreenShare(String consultationId, String userId, bool isEnabled) {
    if (!isWebSocketConnected()) {
      print('Cannot update screen share status - Socket.IO not connected');
      return;
    }

    final screenData = {
      'consultationId': int.tryParse(consultationId) ?? consultationId,
      'userId': int.tryParse(userId) ?? userId,
      'enabled': isEnabled,
      'timestamp': DateTime.now().millisecondsSinceEpoch
    };

    print('Sending screen share status update: $screenData');
    _socketClient!.emit('screen-share', screenData);
  }

  // Gửi tin nhắn chat
  Future<Map<String, dynamic>> sendChatMessage(
      String consultationId, String senderId, String senderType, String content) async {
    try {
      String? token = await _getToken();
      final response = await http.post(
        Uri.parse('$_apiBaseUrl/consultations/chat'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json'
        },
        body: jsonEncode({
          'consultationId': int.tryParse(consultationId) ?? consultationId,
          'senderId': int.tryParse(senderId) ?? senderId,
          'senderType': senderType,
          'content': content,
          'messageType': "TEXT"  // Đảm bảo messageType luôn được gửi
        }),
      );

      if (response.statusCode == 200) {
        final savedMessage = jsonDecode(response.body);

        // Thông báo tin nhắn qua Socket.IO
        if (isWebSocketConnected()) {
          _socketClient!.emit('chat', savedMessage);
        }

        return savedMessage;
      } else {
        throw Exception('Không thể gửi tin nhắn: ${response.statusCode}');
      }
    } catch (e) {
      print('Lỗi khi gửi tin nhắn: $e');
      rethrow;
    }
  }

  // Cập nhật trạng thái đang nhập
  void sendTypingStatus(String consultationId, String userId, bool isTyping) {
    if (!isWebSocketConnected()) {
      print('Cannot send typing status - Socket.IO not connected');
      return;
    }

    final typingData = {
      'consultationId': int.tryParse(consultationId) ?? consultationId,
      'userId': int.tryParse(userId) ?? userId,
      'isTyping': isTyping,
      'timestamp': DateTime.now().millisecondsSinceEpoch
    };

    _socketClient!.emit('typing', typingData);
  }

  // Gửi log lỗi client
  void sendClientLog(String consultationId, String userId, String type, dynamic content) {
    if (!isWebSocketConnected()) {
      print('Cannot send client log - Socket.IO not connected');
      return;
    }

    final logData = {
      'consultationId': int.tryParse(consultationId) ?? consultationId,
      'userId': int.tryParse(userId) ?? userId,
      'type': type,
      'content': content,
      'timestamp': DateTime.now().millisecondsSinceEpoch
    };

    print('Sending client log: $logData');
    _socketClient!.emit('client-logs', logData);
  }

  // Đóng kết nối WebSocket
  void closeWebSocketConnection() {
    if (_socketClient != null) {
      if (_socketClient!.connected) {
        final options = _socketClient!.opts;
        if (options != null) {
          // Lấy giá trị từ query và đảm bảo nó là String
          final consultationId = options['query']?['consultationId']?.toString();
          final userId = options['query']?['userId']?.toString();

          if (consultationId != null && userId != null) {
            try {
              _socketClient!.emit('connection-status', {
                'consultationId': consultationId,  // Giữ nguyên String
                'userId': userId,  // Giữ nguyên String
                'status': 'disconnected',
                'timestamp': DateTime.now().millisecondsSinceEpoch
              });
            } catch (e) {
              print('Lỗi khi gửi trạng thái ngắt kết nối: $e');
            }
          }
        }
      }

      _socketClient!.dispose();
      _socketClient = null;
    }
  }

  void onEvent(String eventName, Function(Map<String, dynamic>) handler) {
    if (_socketClient != null) {
      print('📡 Đăng ký lắng nghe sự kiện: $eventName');
      _eventHandlers[eventName] ??= {};

      _eventHandlers[eventName]!.add(handler);

      if (_eventHandlers[eventName]!.length == 1) {
        _socketClient!.on(eventName, (data) {
          print('📥 Nhận sự kiện $eventName: $data');

          // Xử lý dữ liệu với nhiều kiểu
          Map<String, dynamic> processedData = {};
          if (data is Map) {
            processedData = Map<String, dynamic>.from(data);
          } else if (data is String) {
            try {
              processedData = json.decode(data);
            } catch (e) {
              print('❌ Lỗi parse dữ liệu từ sự kiện $eventName: $e');
              return;
            }
          } else {
            print(
                '❌ Định dạng dữ liệu không hỗ trợ từ sự kiện $eventName: $data');
            return;
          }

          // Đảm bảo các trường bắt buộc
          if (eventName == 'offer' && processedData['sdp'] == null) {
            print('❌ Thiếu thông tin SDP trong offer: $processedData');
            return;
          }

          for (var handler in _eventHandlers[eventName]!) {
            handler(processedData);
          }
        });
      }
    }
  }

  void offEvent(String eventName, [Function? handler]) {
    if (_eventHandlers.containsKey(eventName)) {
      if (handler != null) {
        _eventHandlers[eventName]!.remove(handler);
      } else {
        _eventHandlers.remove(eventName);
      }
    }
  }
  // Thêm vào ConsultationService.dart
  void requestOfferWithRetry(String consultationId, String patientId, String doctorId, {int maxRetries = 3}) {
    int retryCount = 0;

    void tryRequestOffer() {
      if (retryCount >= maxRetries) {
        print('⚠️ Đã thử yêu cầu offer $maxRetries lần nhưng không thành công');
        return;
      }

      try {
        print('📤 Gửi yêu cầu offer lần ${retryCount + 1}');
        requestOffer(consultationId, patientId, doctorId);

        // Đợi 3 giây và kiểm tra
        Future.delayed(Duration(seconds: 3), () {
          // Nếu vẫn chưa nhận được offer (kiểm tra qua biến toàn cục), thử lại
          if (peerConnectionHasRemoteDescription == false) {
            retryCount++;
            tryRequestOffer();
          }
        });
      } catch (e) {
        print('❌ Lỗi khi yêu cầu offer: $e');
        retryCount++;
        Future.delayed(Duration(seconds: 1), tryRequestOffer);
      }
    }

    tryRequestOffer();
  }

  bool emitSocketEvent(String eventName, dynamic data) {
    if (_socketClient != null && _socketClient!.connected) {
      print('📤 Gửi sự kiện $eventName: ${json.encode(data)}');
      _socketClient!.emit(eventName, data);
      return true;
    } else {
      print('⚠️ Không thể gửi sự kiện $eventName - socket không kết nối');
      return false;
    }
  }

  void debugSocketConnection() {
    if (_socketClient == null) {
      print('❌ Socket chưa được khởi tạo');
      return;
    }

    print('Socket ID: ${_socketClient!.id}');
    print('Socket connected: ${_socketClient!.connected}');
    print('Socket namespace: ${_socketClient!.nsp}');

    if (_socketClient!.connected) {
      // Ping server để kiểm tra kết nối
      pingServer();
    }
  }
}