import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:http/http.dart' as http;

class WebRTCService {
  // Configuration
  final String _serverUrl;
  final bool _debug;

  // WebRTC related
  RTCPeerConnection? _peerConnection;
  MediaStream? _localStream;
  MediaStream? _remoteStream;

  // Socket connection
  IO.Socket? _socket;
  bool _isConnected = false;
  bool _isInConsultation = false;

  // Consultation details
  String? _consultationId;
  String? _userId;
  String? _userType;
  String? _targetUserId;

  // Ping timer
  Timer? _pingTimer;
  Timer? _reconnectTimer;
  int _reconnectAttempts = 0;
  final int _maxReconnectAttempts = 5;

  // Callback functions
  Function(MediaStream)? onLocalStream;
  Function(MediaStream)? onRemoteStream;
  Function(RTCIceConnectionState)? onConnectionStateChange;
  Function(String, dynamic)? onMessage;
  Function(dynamic)? onError;

  // Constructors
  WebRTCService({
    String serverUrl = 'http://172.20.10.4:3001',
    bool debug = false
  }) : _serverUrl = serverUrl,
        _debug = debug;

  // Getters
  bool get isConnected => _isConnected;
  bool get isInConsultation => _isInConsultation;
  MediaStream? get localStream => _localStream;
  MediaStream? get remoteStream => _remoteStream;

  // Connect to signaling server
  Future<bool> connect({
    required String consultationId,
    required String userId,
    required String userType,
    String? token
  }) async {
    try {
      _log('Kết nối tới server signaling: $_serverUrl');

      // Lưu thông tin
      _consultationId = consultationId;
      _userId = userId;
      _userType = userType;

      // Đóng kết nối cũ nếu có
      if (_socket != null) {
        _socket!.disconnect();
        _socket = null;
      }

      // Tạo socket với options phù hợp cả hai nền tảng
      _socket = IO.io(_serverUrl, <String, dynamic>{
        'transports': ['websocket', 'polling'],
        'autoConnect': false,
        'query': {
          'consultationId': consultationId,
          'userId': userId,
          'userType': userType,
        },
        // Quan trọng: Không sử dụng withCredentials
        'withCredentials': false,
        'forceNew': true
      });

      // Đăng ký các sự kiện
      _registerSocketEvents();

      // Kết nối
      _socket!.connect();

      // Chờ kết nối thành công
      Completer<bool> completer = Completer<bool>();

      // Xử lý khi kết nối thành công
      _socket!.onConnect((_) {
        _log('Socket đã kết nối thành công');
        _isConnected = true;
        _reconnectAttempts = 0;

        // Bắt đầu ping
        _startPing();

        if (!completer.isCompleted) {
          completer.complete(true);
        }
      });

      // Xử lý lỗi kết nối
      _socket!.onConnectError((error) {
        _log('Lỗi kết nối socket: $error');
        if (!completer.isCompleted) {
          completer.completeError(error);
        }
      });

      // Thiết lập timeout kết nối
      Future.delayed(Duration(seconds: 10), () {
        if (!completer.isCompleted) {
          completer.completeError(Exception('Timeout kết nối'));
        }
      });

      return await completer.future;
    } catch (e) {
      _log('Lỗi khi kết nối tới server signaling: $e');
      if (onError != null) {
        onError!(e);
      }
      return false;
    }
  }

  // Initialize WebRTC
  Future<bool> initializeWebRTC() async {
    try {
      // Get ICE servers configuration
      final iceServers = await _fetchIceServers();

      // Configure peer connection
      final configuration = {
        'iceServers': iceServers['iceServers'],
        'iceTransportPolicy': 'all',
        'bundlePolicy': 'max-bundle',
        'rtcpMuxPolicy': 'require',
        'sdpSemantics': 'unified-plan',
        'iceCandidatePoolSize': 10
      };

      _log('Initializing WebRTC with configuration: $configuration');

      // Create peer connection
      _peerConnection = await createPeerConnection(configuration);

      // Set up event handlers
      _setupPeerConnectionHandlers();

      // Get local media stream
      _localStream = await navigator.mediaDevices.getUserMedia({
        'audio': true,
        'video': {
          'width': {'ideal': 1280},
          'height': {'ideal': 720},
          'facingMode': 'user',
        }
      });

      // Add tracks to peer connection
      _localStream!.getTracks().forEach((track) {
        _peerConnection!.addTrack(track, _localStream!);
        _log('Added ${track.kind} track to peer connection');
      });

      // Notify callback
      if (onLocalStream != null) {
        onLocalStream!(_localStream!);
      }

      return true;
    } catch (e) {
      _log('Error initializing WebRTC: $e');
      if (onError != null) {
        onError!(e);
      }
      return false;
    }
  }

  // Set up peer connection handlers
  void _setupPeerConnectionHandlers() {
    if (_peerConnection == null) return;

    // ICE candidate event
    _peerConnection!.onIceCandidate = (RTCIceCandidate candidate) {
      _log('ICE candidate generated: ${candidate.candidate}');
      _sendIceCandidate(candidate);
    };

    // ICE connection state change
    _peerConnection!.onIceConnectionState = (RTCIceConnectionState state) {
      _log('ICE connection state changed: $state');

      if (onConnectionStateChange != null) {
        onConnectionStateChange!(state);
      }

      // Auto-retry on failure
      if (state == RTCIceConnectionState.RTCIceConnectionStateFailed ||
          state == RTCIceConnectionState.RTCIceConnectionStateDisconnected) {
        _log('ICE connection failed or disconnected, trying to reconnect...');

        if (_userType == 'DOCTOR') {
          // For doctor, recreate offer
          Future.delayed(Duration(seconds: 2), () => createOffer());
        } else {
          // For patient, request offer
          Future.delayed(Duration(seconds: 2), () => requestOffer());
        }
      }
    };

    // Track event - when receiving remote stream
    _peerConnection!.onTrack = (RTCTrackEvent event) {
      _log('Received remote track: ${event.track.kind}');

      if (event.streams.isNotEmpty) {
        _remoteStream = event.streams[0];

        // Log detailed info
        _log('Remote stream received, tracks: ${_remoteStream!.getTracks().map((t) => "${t.kind}: enabled=${t.enabled}").join(", ")}');

        // Notify callback
        if (onRemoteStream != null) {
          onRemoteStream!(_remoteStream!);
        }
      } else {
        _log('WARNING: No streams in track event');
      }
    };
  }

  // Create and send offer (for doctor)
  Future<bool> createOffer() async {
    try {
      if (_peerConnection == null) {
        throw Exception('PeerConnection not initialized');
      }

      _log('Creating offer...');

      // Create SDP offer
      final RTCSessionDescription offer = await _peerConnection!.createOffer({
        'offerToReceiveAudio': true,
        'offerToReceiveVideo': true
      });

      // Set local description
      await _peerConnection!.setLocalDescription(offer);

      _log('Local description set: ${offer.type}');

      // Get target user ID
      final targetId = _targetUserId ?? _getTargetUserId();

      // Send offer
      _sendOffer(targetId, await _peerConnection!.getLocalDescription());

      return true;
    } catch (e) {
      _log('Error creating offer: $e');
      if (onError != null) {
        onError!(e);
      }
      return false;
    }
  }

  // Request offer from doctor (for patient)
  bool requestOffer() {
    if (_socket == null || !_isConnected) {
      _log('Socket not connected');
      return false;
    }

    final doctorId = _targetUserId ?? _getTargetUserId();

    _log('Requesting offer from doctor: $doctorId');

    _socket!.emit('request-offer', {
      'consultationId': _consultationId,
      'patientId': _userId,
      'doctorId': doctorId,
      'timestamp': DateTime.now().millisecondsSinceEpoch
    });

    return true;
  }

  // Request offer with retry
  void requestOfferWithRetry({int maxRetries = 3}) {
    int retryCount = 0;

    void tryRequestOffer() {
      if (retryCount >= maxRetries) {
        _log('Tried requesting offer $maxRetries times without success');
        return;
      }

      try {
        _log('Sending offer request attempt ${retryCount + 1}');
        requestOffer();

        // Check after 3 seconds
        Future.delayed(Duration(seconds: 3), () {
          // If we still don't have a remote description, retry
          if (_peerConnection != null &&
              _peerConnection!.getRemoteDescription() == null) {
            retryCount++;
            tryRequestOffer();
          }
        });
      } catch (e) {
        _log('Error requesting offer: $e');
        retryCount++;
        Future.delayed(Duration(seconds: 1), tryRequestOffer);
      }
    }

    tryRequestOffer();
  }

  // Toggle video
  bool toggleVideo(bool enabled) {
    if (_localStream == null) return false;

    final videoTracks = _localStream!.getVideoTracks();
    if (videoTracks.isEmpty) return false;

    // Update track state
    videoTracks.forEach((track) {
      track.enabled = enabled;
    });

    // Send status update
    if (_socket != null && _isConnected) {
      _socket!.emit('video-status', {
        'consultationId': _consultationId,
        'userId': _userId,
        'enabled': enabled,
        'timestamp': DateTime.now().millisecondsSinceEpoch
      });
    }

    return true;
  }

  // Toggle audio
  bool toggleAudio(bool enabled) {
    if (_localStream == null) return false;

    final audioTracks = _localStream!.getAudioTracks();
    if (audioTracks.isEmpty) return false;

    // Update track state
    audioTracks.forEach((track) {
      track.enabled = enabled;
    });

    // Send status update
    if (_socket != null && _isConnected) {
      _socket!.emit('audio-status', {
        'consultationId': _consultationId,
        'userId': _userId,
        'enabled': enabled,
        'timestamp': DateTime.now().millisecondsSinceEpoch
      });
    }

    return true;
  }

  // Send chat message
  bool sendChatMessage(String message) {
    if (_socket == null || !_isConnected) return false;

    final messageData = {
      'consultationId': _consultationId,
      'senderId': _userId,
      'senderType': _userType,
      'content': message,
      'timestamp': DateTime.now().millisecondsSinceEpoch
    };

    _socket!.emit('chat', messageData);
    return true;
  }

  // Send typing status
  bool sendTypingStatus(bool isTyping) {
    if (_socket == null || !_isConnected) return false;

    _socket!.emit('typing', {
      'consultationId': _consultationId,
      'userId': _userId,
      'isTyping': isTyping,
      'timestamp': DateTime.now().millisecondsSinceEpoch
    });

    return true;
  }

  // End call
  Future<bool> endCall({String reason = 'Call ended'}) async {
    try {
      // Stop media tracks
      if (_localStream != null) {
        _localStream!.getTracks().forEach((track) => track.stop());
        _localStream = null;
      }

      // Close peer connection
      if (_peerConnection != null) {
        await _peerConnection!.close();
        _peerConnection = null;
      }

      // Send notification
      if (_socket != null && _isConnected) {
        _socket!.emit('consultation-status', {
          'type': 'SESSION_ENDED',
          'consultationId': _consultationId,
          'terminatorId': _userId,
          'reason': reason,
          'timestamp': DateTime.now().millisecondsSinceEpoch
        });
      }

      _isInConsultation = false;

      return true;
    } catch (e) {
      _log('Error ending call: $e');
      return false;
    }
  }

  // Disconnect
  void disconnect() {
    // Stop ping and reconnect timers
    _stopPing();
    _stopReconnectTimer();

    // Close socket connection
    if (_socket != null) {
      if (_socket!.connected) {
        _socket!.disconnect();
      }
      _socket = null;
    }

    _isConnected = false;
    _isInConsultation = false;
  }

  // Set remote target user ID
  void setTargetUserId(String userId) {
    _targetUserId = userId;
  }

  // Register custom event handler
  void on(String eventName, Function(dynamic) callback) {
    if (_socket == null) {
      _log('Socket not initialized');
      return;
    }

    _socket!.on(eventName, (data) => callback(data));
  }

  // Unregister event handler
  void off(String eventName) {
    if (_socket == null) return;

    _socket!.off(eventName);
  }

  // --- Private methods ---

  // Fetch ICE servers from server
  Future<Map<String, dynamic>> _fetchIceServers() async {
    try {
      final response = await http.get(
          Uri.parse('$_serverUrl/api/webrtc/ice-servers'),
          // Important: Don't use credentials for this request
          headers: {'Content-Type': 'application/json'}
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to get ICE servers: ${response.statusCode}');
      }
    } catch (e) {
      _log('Error fetching ICE servers, using defaults: $e');

      // Return default STUN servers
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

  // Register socket events
  void _registerSocketEvents() {
    if (_socket == null) return;

    // Handle offer
    _socket!.on('offer', (data) async {
      _log('Received offer: $data');
      await _handleOffer(data);
    });

    // Handle answer
    _socket!.on('answer', (data) async {
      _log('Received answer: $data');
      await _handleAnswer(data);
    });

    // Handle ICE candidate
    _socket!.on('ice-candidate', (data) async {
      _log('Received ICE candidate: $data');
      await _handleIceCandidate(data);
    });

    // Handle request for offer
    _socket!.on('request-offer', (data) async {
      _log('Received request for offer: $data');

      // Only doctors handle offer requests
      if (_userType == 'DOCTOR') {
        // Set target user ID
        _targetUserId = data['patientId'];

        // Create offer
        await createOffer();
      }
    });

    // Handle other events
    ['video-status', 'audio-status', 'screen-share', 'chat',
      'typing', 'consultation-status', 'connection-status'].forEach((eventName) {
      _socket!.on(eventName, (data) {
        _log('Received $eventName event: $data');
        if (onMessage != null) {
          onMessage!(eventName, data);
        }
      });
    });

    // Handle disconnection
    _socket!.onDisconnect((_) {
      _isConnected = false;
      _log('Socket disconnected');

      // Try to reconnect
      _tryReconnect();

      if (onConnectionStateChange != null) {
        onConnectionStateChange!(RTCIceConnectionState.RTCIceConnectionStateDisconnected);
      }
    });

    // Handle reconnection
    _socket!.onReconnect((_) {
      _isConnected = true;
      _log('Socket reconnected');
      _reconnectAttempts = 0;
      _stopReconnectTimer();

      if (onConnectionStateChange != null) {
        onConnectionStateChange!(RTCIceConnectionState.RTCIceConnectionStateConnected);
      }
    });

    // Handle errors
    _socket!.onError((error) {
      _log('Socket error: $error');

      if (onError != null) {
        onError!(error);
      }
    });

    // Handle pong
    _socket!.on('pong', (data) {
      if (data is Map && data.containsKey('timestamp')) {
        _log('Nhận pong từ server, latency: ${DateTime.now().millisecondsSinceEpoch - (data['timestamp'] as int)} ms');
      } else if (data is int) {
        _log('Nhận pong từ server với giá trị: $data');
      } else {
        _log('Nhận pong từ server, định dạng không xác định: $data');
      }
    });
  }

  // Handle offer
  Future<void> _handleOffer(dynamic data) async {
    try {
      print('⚡️ Bắt đầu xử lý offer: $data');

      // Initialize WebRTC if not already done
      if (_peerConnection == null) {
        print('🔄 Khởi tạo RTCPeerConnection vì chưa tồn tại');
        await initializeWebRTC();
      }

      // Check signaling state
      if (_peerConnection!.signalingState == RTCSignalingState.RTCSignalingStateClosed) {
        print('⚠️ PeerConnection đã đóng, khởi tạo lại');
        await initializeWebRTC();
      }

      print('🔎 Kiểm tra và trích xuất dữ liệu SDP từ offer');

      // Chi tiết phương thức xử lý SDP
      dynamic sdpData;
      Map<String, dynamic> parsedData = {};

      // Chuyển đổi dữ liệu sang dạng Map nếu chưa phải
      if (data is String) {
        try {
          print('🔄 Chuyển đổi dữ liệu string sang Map');
          parsedData = json.decode(data);
        } catch (e) {
          print('❌ Lỗi phân tích dữ liệu dạng string: $e');
          throw Exception('Lỗi định dạng dữ liệu offer');
        }
      } else if (data is Map) {
        print('✅ Dữ liệu đã ở dạng Map');
        parsedData = Map<String, dynamic>.from(data);
      } else {
        print('❌ Định dạng dữ liệu không hỗ trợ: ${data.runtimeType}');
        throw Exception('Định dạng dữ liệu offer không hỗ trợ');
      }

      // Lấy sdp từ cấu trúc dữ liệu
      if (parsedData.containsKey('sdp')) {
        print('🔍 Tìm thấy trường sdp trong dữ liệu');
        sdpData = parsedData['sdp'];
      } else {
        print('⚠️ Không tìm thấy trường sdp, tìm kiếm trong cấu trúc con');
        // Xử lý định dạng đặc biệt từ server signaling
        if (parsedData.containsKey('type') && parsedData['type'] == 'WEBRTC_OFFER') {
          if (parsedData.containsKey('data') && parsedData['data'] is Map) {
            var offerData = parsedData['data'];
            if (offerData.containsKey('sdp')) {
              sdpData = offerData['sdp'];
              print('✅ Đã tìm thấy sdp trong data.sdp');
            }
          } else if (parsedData.containsKey('sdp')) {
            sdpData = parsedData['sdp'];
            print('✅ Đã tìm thấy sdp trực tiếp trong dữ liệu WEBRTC_OFFER');
          }
        }
      }

      if (sdpData == null) {
        print('❌ Không tìm thấy SDP trong dữ liệu offer');
        print('📋 Dữ liệu nhận được: $parsedData');
        throw Exception('Không tìm thấy SDP trong offer');
      }

      print('🔍 Định dạng SDP: ${sdpData.runtimeType}');

      // Format SDP properly
      String sdp;
      String type = 'offer';

      if (sdpData is String) {
        print('📋 SDP là chuỗi, sử dụng trực tiếp');
        sdp = sdpData;
      } else if (sdpData is Map) {
        print('📋 SDP là Map, trích xuất sdp và type');
        sdp = sdpData['sdp'] ?? '';
        type = sdpData['type'] ?? 'offer';
      } else {
        print('❌ Định dạng SDP không hỗ trợ: ${sdpData.runtimeType}');
        throw Exception('Định dạng SDP không hợp lệ');
      }

      if (sdp.isEmpty) {
        print('❌ SDP trống');
        throw Exception('SDP trống');
      }

      // Set remote description
      print('🔄 Thiết lập Remote Description từ offer');
      await _peerConnection!.setRemoteDescription(
          RTCSessionDescription(sdp, type)
      );
      print('✅ Đã thiết lập Remote Description thành công');

      // Create answer
      print('🔄 Tạo answer...');
      RTCSessionDescription answer = await _peerConnection!.createAnswer({});
      print('✅ Đã tạo answer: ${answer.type}');

      // Set local description
      print('🔄 Thiết lập Local Description (answer)');
      await _peerConnection!.setLocalDescription(answer);
      print('✅ Đã thiết lập Local Description thành công');

      // Get sender ID
      String senderId;
      if (parsedData.containsKey('senderId')) {
        senderId = parsedData['senderId'].toString();
        print('👤 SenderId từ dữ liệu: $senderId');
      } else {
        // Default to target ID or doctor ID
        senderId = _targetUserId ?? _getTargetUserId();
        print('👤 Sử dụng SenderId mặc định: $senderId');
      }

      if (senderId.isEmpty) {
        print('⚠️ SenderId trống, không thể gửi answer');
        throw Exception('SenderId trống');
      }

      // Send answer
      print('📤 Gửi answer đến: $senderId');
      _sendAnswer(senderId, await _peerConnection!.getLocalDescription());

      // Store target user ID
      _targetUserId = senderId;
      print('👤 Đã thiết lập targetUserId: $senderId');

      // Mark as in consultation
      _isInConsultation = true;
      print('✅ Đã thiết lập trạng thái isInConsultation: true');

    } catch (e) {
      print('❌ Lỗi xử lý offer: $e');
      if (onError != null) {
        onError!(e);
      }
    }
  }

  // Handle answer
  Future<void> _handleAnswer(dynamic data) async {
    try {
      print('⚡️ Bắt đầu xử lý answer: $data');

      if (_peerConnection == null) {
        print('❌ PeerConnection chưa được khởi tạo');
        throw Exception('PeerConnection not initialized');
      }

      // Chi tiết phương thức xử lý SDP
      dynamic sdpData;
      Map<String, dynamic> parsedData = {};

      // Chuyển đổi dữ liệu sang dạng Map nếu chưa phải
      if (data is String) {
        try {
          print('🔄 Chuyển đổi dữ liệu string sang Map');
          parsedData = json.decode(data);
        } catch (e) {
          print('❌ Lỗi phân tích dữ liệu dạng string: $e');
          throw Exception('Lỗi định dạng dữ liệu answer');
        }
      } else if (data is Map) {
        print('✅ Dữ liệu đã ở dạng Map');
        parsedData = Map<String, dynamic>.from(data);
      } else {
        print('❌ Định dạng dữ liệu không hỗ trợ: ${data.runtimeType}');
        throw Exception('Định dạng dữ liệu answer không hỗ trợ');
      }

      // Lấy sdp từ cấu trúc dữ liệu
      if (parsedData.containsKey('sdp')) {
        print('🔍 Tìm thấy trường sdp trong dữ liệu');
        sdpData = parsedData['sdp'];
      } else {
        print('⚠️ Không tìm thấy trường sdp, tìm kiếm trong cấu trúc con');
        // Xử lý định dạng đặc biệt từ server signaling
        if (parsedData.containsKey('type') && parsedData['type'] == 'WEBRTC_ANSWER') {
          if (parsedData.containsKey('data') && parsedData['data'] is Map) {
            var answerData = parsedData['data'];
            if (answerData.containsKey('sdp')) {
              sdpData = answerData['sdp'];
              print('✅ Đã tìm thấy sdp trong data.sdp');
            }
          } else if (parsedData.containsKey('sdp')) {
            sdpData = parsedData['sdp'];
            print('✅ Đã tìm thấy sdp trực tiếp trong dữ liệu WEBRTC_ANSWER');
          }
        }
      }

      if (sdpData == null) {
        print('❌ Không tìm thấy SDP trong dữ liệu answer');
        print('📋 Dữ liệu nhận được: $parsedData');
        throw Exception('Không tìm thấy SDP trong answer');
      }

      print('🔍 Định dạng SDP: ${sdpData.runtimeType}');

      // Format SDP properly
      String sdp;
      String type = 'answer';

      if (sdpData is String) {
        print('📋 SDP là chuỗi, sử dụng trực tiếp');
        sdp = sdpData;
      } else if (sdpData is Map) {
        print('📋 SDP là Map, trích xuất sdp và type');
        sdp = sdpData['sdp'] ?? '';
        type = sdpData['type'] ?? 'answer';
      } else {
        print('❌ Định dạng SDP không hỗ trợ: ${sdpData.runtimeType}');
        throw Exception('Định dạng SDP không hợp lệ');
      }

      if (sdp.isEmpty) {
        print('❌ SDP trống');
        throw Exception('SDP trống');
      }

      // Set remote description
      print('🔄 Thiết lập Remote Description từ answer');
      await _peerConnection!.setRemoteDescription(
          RTCSessionDescription(sdp, type)
      );
      print('✅ Đã thiết lập Remote Description thành công');

      // Mark as in consultation
      _isInConsultation = true;
      print('✅ Đã thiết lập trạng thái isInConsultation: true');

    } catch (e) {
      print('❌ Lỗi xử lý answer: $e');
      if (onError != null) {
        onError!(e);
      }
    }
  }

  // Handle ICE candidate
  Future<void> _handleIceCandidate(dynamic data) async {
    try {
      print('⚡️ Bắt đầu xử lý ICE candidate: $data');

      if (_peerConnection == null) {
        print('❌ PeerConnection chưa được khởi tạo');
        throw Exception('PeerConnection not initialized');
      }

      // Chi tiết phương thức xử lý ICE candidate
      dynamic candidateData;
      Map<String, dynamic> parsedData = {};

      // Chuyển đổi dữ liệu sang dạng Map nếu chưa phải
      if (data is String) {
        try {
          print('🔄 Chuyển đổi dữ liệu string sang Map');
          parsedData = json.decode(data);
        } catch (e) {
          print('❌ Lỗi phân tích dữ liệu dạng string: $e');
          throw Exception('Lỗi định dạng dữ liệu ICE candidate');
        }
      } else if (data is Map) {
        print('✅ Dữ liệu đã ở dạng Map');
        parsedData = Map<String, dynamic>.from(data);
      } else {
        print('❌ Định dạng dữ liệu không hỗ trợ: ${data.runtimeType}');
        throw Exception('Định dạng dữ liệu ICE candidate không hỗ trợ');
      }

      // Lấy candidate từ cấu trúc dữ liệu
      if (parsedData.containsKey('candidate')) {
        print('🔍 Tìm thấy trường candidate trong dữ liệu');
        candidateData = parsedData['candidate'];
      } else {
        print('⚠️ Không tìm thấy trường candidate, tìm kiếm trong cấu trúc con');
        // Xử lý định dạng đặc biệt từ server signaling
        if (parsedData.containsKey('type') && parsedData['type'] == 'WEBRTC_ICE_CANDIDATE') {
          if (parsedData.containsKey('data') && parsedData['data'] is Map) {
            var iceData = parsedData['data'];
            if (iceData.containsKey('candidate')) {
              candidateData = iceData['candidate'];
              print('✅ Đã tìm thấy candidate trong data.candidate');
            }
          } else if (parsedData.containsKey('candidate')) {
            candidateData = parsedData['candidate'];
            print('✅ Đã tìm thấy candidate trực tiếp trong dữ liệu WEBRTC_ICE_CANDIDATE');
          }
        }
      }

      if (candidateData == null) {
        print('❌ Không tìm thấy Candidate trong dữ liệu ICE');
        print('📋 Dữ liệu nhận được: $parsedData');
        throw Exception('Không tìm thấy Candidate trong ICE');
      }

      print('🔍 Định dạng Candidate: ${candidateData.runtimeType}');

      // Format candidate properly
      String candidate;
      String sdpMid;
      int sdpMLineIndex;

      if (candidateData is Map) {
        print('📋 Candidate là Map, trích xuất các thông số');
        candidate = candidateData['candidate'] ?? '';
        sdpMid = candidateData['sdpMid'] ?? '0';
        sdpMLineIndex = candidateData['sdpMLineIndex'] ?? 0;
      } else if (candidateData is String) {
        print('📋 Candidate là chuỗi, sử dụng trực tiếp');
        candidate = candidateData;
        sdpMid = (parsedData['sdpMid'] ?? '0').toString();
        sdpMLineIndex = int.tryParse(parsedData['sdpMLineIndex']?.toString() ?? '0') ?? 0;
      } else {
        print('❌ Định dạng Candidate không hỗ trợ: ${candidateData.runtimeType}');
        throw Exception('Định dạng Candidate không hợp lệ');
      }

      if (candidate.isEmpty) {
        print('⚠️ Candidate trống, có thể là end-of-candidates');
        return; // Empty candidate, might be end-of-candidates
      }

      // Create and add ICE candidate
      print('🔄 Thêm ICE candidate: $candidate');
      await _peerConnection!.addCandidate(
          RTCIceCandidate(
              candidate,
              sdpMid,
              sdpMLineIndex
          )
      );
      print('✅ Đã thêm ICE candidate thành công');

    } catch (e) {
      print('❌ Lỗi xử lý ICE candidate: $e');
      if (onError != null) {
        onError!(e);
      }
    }
  }

  // Send offer
  void _sendOffer(String targetUserId, RTCSessionDescription? description) {
    if (_socket == null || !_isConnected || description == null) {
      _log('Cannot send offer: Socket not connected or description is null');
      return;
    }

    final offerData = {
      'type': 'OFFER',
      'consultationId': _consultationId,
      'senderId': _userId,
      'targetUserId': targetUserId,
      'sdp': {
        'type': description.type,
        'sdp': description.sdp,
      },
      'timestamp': DateTime.now().millisecondsSinceEpoch
    };

    _log('Sending WebRTC offer');
    _socket!.emit('offer', offerData);
  }

  // Send answer
  void _sendAnswer(String targetUserId, RTCSessionDescription? description) {
    if (_socket == null || !_isConnected || description == null) {
      _log('Cannot send answer: Socket not connected or description is null');
      return;
    }

    final answerData = {
      'type': 'ANSWER',
      'consultationId': _consultationId,
      'senderId': _userId,
      'targetUserId': targetUserId,
      'sdp': {
        'type': description.type,
        'sdp': description.sdp,
      },
      'timestamp': DateTime.now().millisecondsSinceEpoch
    };

    _log('Sending WebRTC answer');
    _socket!.emit('answer', answerData);
  }

  // Send ICE candidate
  void _sendIceCandidate(RTCIceCandidate candidate) {
    if (_socket == null || !_isConnected) {
      _log('Cannot send ICE candidate: Socket not connected');
      return;
    }

    if (_targetUserId == null) {
      _log('Cannot send ICE candidate: Target user ID not set');
      return;
    }

    final candidateData = {
      'type': 'ICE_CANDIDATE',
      'consultationId': _consultationId,
      'senderId': _userId,
      'targetUserId': _targetUserId,
      'candidate': {
        'candidate': candidate.candidate,
        'sdpMid': candidate.sdpMid,
        'sdpMLineIndex': candidate.sdpMLineIndex
      },
      'timestamp': DateTime.now().millisecondsSinceEpoch
    };

    _log('Sending ICE candidate');
    _socket!.emit('ice-candidate', candidateData);
  }

  // Get target user ID based on user type
  String _getTargetUserId() {
    // If already set, return it
    if (_targetUserId != null) {
      return _targetUserId!;
    }

    // Otherwise determine based on user type
    // This would need to be implemented based on your specific logic
    return '';
  }

  // Try to reconnect socket
  void _tryReconnect() {
    _stopReconnectTimer();

    if (_reconnectAttempts >= _maxReconnectAttempts) {
      _log('Max reconnection attempts reached');
      return;
    }

    _reconnectTimer = Timer(Duration(seconds: 2 * (_reconnectAttempts + 1)), () {
      if (_socket != null && !_socket!.connected) {
        _log('Attempting to reconnect socket (attempt ${_reconnectAttempts + 1})');
        _reconnectAttempts++;
        _socket!.connect();
      }
    });
  }

  // Stop reconnect timer
  void _stopReconnectTimer() {
    if (_reconnectTimer != null) {
      _reconnectTimer!.cancel();
      _reconnectTimer = null;
    }
  }

  // Start ping interval
  void _startPing() {
    _stopPing();

    _pingTimer = Timer.periodic(Duration(seconds: 30), (timer) {
      if (_socket != null && _isConnected) {
        _socket!.emit('ping', {'timestamp': DateTime.now().millisecondsSinceEpoch});
      } else {
        _stopPing();
      }
    });
  }

  // Stop ping interval
  void _stopPing() {
    if (_pingTimer != null) {
      _pingTimer!.cancel();
      _pingTimer = null;
    }
  }

  // Log helper
  void _log(String message, [dynamic data]) {
    if (_debug) {
      if (data != null) {
        print('[WebRTC Service] ${DateTime.now().toIso8601String()}: $message $data');
      } else {
        print('[WebRTC Service] ${DateTime.now().toIso8601String()}: $message');
      }
    }
  }
}