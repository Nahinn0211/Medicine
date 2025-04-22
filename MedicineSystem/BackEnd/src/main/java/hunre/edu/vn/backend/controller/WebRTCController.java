package hunre.edu.vn.backend.controller;

import hunre.edu.vn.backend.dto.ChatMessageDTO;
import hunre.edu.vn.backend.dto.ConsultationDTO;
import hunre.edu.vn.backend.entity.ChatMessage;
import hunre.edu.vn.backend.service.ChatMessageService;
import hunre.edu.vn.backend.service.ConsultationService;
import com.corundumstudio.socketio.SocketIOServer;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.util.*;

@RestController
@RequestMapping("/api/webrtc")
@RequiredArgsConstructor
public class WebRTCController {
    private static final Logger logger = LoggerFactory.getLogger(WebRTCController.class);

    private final ConsultationService consultationService;
    private final ChatMessageService chatMessageService;

    @Autowired(required = false)
    private SocketIOServer socketIOServer; // Đây là bean từ Socket.IO Config của bạn

    @Value("${webrtc.stun.urls:stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302}")
    private String stunUrls;

    @Value("${webrtc.turn.enabled:false}")
    private boolean turnEnabled;

    @Value("${webrtc.turn.url:}")
    private String turnUrl;

    @Value("${webrtc.turn.username:}")
    private String turnUsername;

    @Value("${webrtc.turn.credential:}")
    private String turnCredential;

    /**
     * Lấy cấu hình ICE server (STUN/TURN) để thiết lập kết nối WebRTC
     */
    @GetMapping("/ice-servers")
    public ResponseEntity<Map<String, Object>> getIceServers() {
        List<Map<String, Object>> iceServers = new ArrayList<>();

        // STUN servers
        Map<String, Object> stunServer = new HashMap<>();
        List<String> stunServerUrls = Arrays.asList(stunUrls.split(","));
        stunServer.put("urls", stunServerUrls);
        iceServers.add(stunServer);

        // TURN server (nếu được cấu hình)
        if (turnEnabled && !turnUrl.isEmpty()) {
            Map<String, Object> turnServer = new HashMap<>();
            turnServer.put("urls", turnUrl);
            if (!turnUsername.isEmpty()) {
                turnServer.put("username", turnUsername);
            }
            if (!turnCredential.isEmpty()) {
                turnServer.put("credential", turnCredential);
            }
            iceServers.add(turnServer);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("iceServers", iceServers);

        logger.debug("Returning ICE servers configuration");
        return ResponseEntity.ok(response);
    }

    /**
     * Lấy thông tin cuộc tư vấn
     */
    @GetMapping("/consultation/{consultationId}")
    public ResponseEntity<ConsultationDTO.GetConsultationDTO> getConsultationInfo(@PathVariable Long consultationId) {
        logger.debug("Fetching consultation info for ID: {}", consultationId);

        return consultationService.findById(consultationId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Bắt đầu phiên WebRTC / cuộc tư vấn
     */
    @PostMapping("/session/start")
    public ResponseEntity<ConsultationDTO.GetConsultationDTO> startConsultationSession(
            @RequestBody ConsultationDTO.StartSessionDto startSessionDto) {
        logger.debug("Starting consultation session: {}", startSessionDto.getConsultationId());

        try {
            ConsultationDTO.GetConsultationDTO result = consultationService.startConsultationSession(startSessionDto);

            // Gửi thông báo WebRTC bắt đầu qua Socket.IO
            notifyWebRTCStatus(startSessionDto.getConsultationId(), "started", startSessionDto.getInitiatorId());

            // Gửi sự kiện qua Socket.IO nếu có thể
            if (socketIOServer != null) {
                Map<String, Object> eventData = new HashMap<>();
                eventData.put("type", "SESSION_STARTED");
                eventData.put("consultationId", startSessionDto.getConsultationId());
                eventData.put("initiatorId", startSessionDto.getInitiatorId());
                eventData.put("timestamp", System.currentTimeMillis());

                socketIOServer.getRoomOperations(startSessionDto.getConsultationId().toString())
                        .sendEvent("consultation-status", eventData);
            }

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Error starting consultation session", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Kết thúc phiên WebRTC / cuộc tư vấn
     */
    @PostMapping("/session/end")
    public ResponseEntity<ConsultationDTO.GetConsultationDTO> endConsultationSession(
            @RequestBody ConsultationDTO.EndSessionDto endSessionDto) {
        logger.debug("Ending consultation session: {}", endSessionDto.getConsultationId());

        try {
            ConsultationDTO.GetConsultationDTO result = consultationService.endConsultationSession(endSessionDto);

            // Gửi thông báo WebRTC kết thúc qua Socket.IO
            notifyWebRTCStatus(endSessionDto.getConsultationId(), "ended", endSessionDto.getTerminatorId());

            // Gửi sự kiện qua Socket.IO nếu có thể
            if (socketIOServer != null) {
                Map<String, Object> eventData = new HashMap<>();
                eventData.put("type", "SESSION_ENDED");
                eventData.put("consultationId", endSessionDto.getConsultationId());
                eventData.put("terminatorId", endSessionDto.getTerminatorId());
                eventData.put("reason", endSessionDto.getTerminationReason());
                eventData.put("timestamp", System.currentTimeMillis());

                socketIOServer.getRoomOperations(endSessionDto.getConsultationId().toString())
                        .sendEvent("consultation-status", eventData);
            }

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Error ending consultation session", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Ghi log vào hệ thống khi có thông báo thay đổi trạng thái WebRTC
     */
    private void notifyWebRTCStatus(Long consultationId, String status, Long userId) {
        String message = "WebRTC session " + status;
        logger.info("WebRTC Status: {}, Consultation: {}, User: {}", status, consultationId, userId);

        // Gửi tin nhắn hệ thống thông báo về trạng thái WebRTC
        ChatMessageDTO.SaveChatMessageDTO systemMessage = ChatMessageDTO.SaveChatMessageDTO.builder()
                .consultationId(consultationId)
                .senderId(userId)
                .senderType(ChatMessage.SenderType.SYSTEM)
                .content(message)
                .messageType(ChatMessage.MessageType.SYSTEM)
                .build();

        chatMessageService.save(systemMessage);
    }

    /**
     * Cập nhật trạng thái video
     */
    @PostMapping("/video-status")
    public ResponseEntity<Map<String, Object>> updateVideoStatus(@RequestBody Map<String, Object> requestData) {
        Long consultationId = Long.valueOf(requestData.get("consultationId").toString());
        Long userId = Long.valueOf(requestData.get("userId").toString());
        Boolean enabled = (Boolean) requestData.get("enabled");

        logger.debug("Updating video status for consultation: {}, user: {}, enabled: {}",
                consultationId, userId, enabled);

        try {
            consultationService.toggleVideoStream(consultationId, userId, enabled);

            // Gửi thông báo qua Socket.IO nếu có thể
            if (socketIOServer != null) {
                socketIOServer.getRoomOperations(consultationId.toString())
                        .sendEvent("video-status", requestData);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error updating video status", e);

            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Cập nhật trạng thái audio
     */
    @PostMapping("/audio-status")
    public ResponseEntity<Map<String, Object>> updateAudioStatus(@RequestBody Map<String, Object> requestData) {
        Long consultationId = Long.valueOf(requestData.get("consultationId").toString());
        Long userId = Long.valueOf(requestData.get("userId").toString());
        Boolean enabled = (Boolean) requestData.get("enabled");

        logger.debug("Updating audio status for consultation: {}, user: {}, enabled: {}",
                consultationId, userId, enabled);

        try {
            // Ghi log trạng thái audio
            logger.info("Audio status updated: consultationId={}, userId={}, enabled={}",
                    consultationId, userId, enabled);

            // Gửi thông báo qua Socket.IO nếu có thể
            if (socketIOServer != null) {
                socketIOServer.getRoomOperations(consultationId.toString())
                        .sendEvent("audio-status", requestData);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error updating audio status", e);

            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Cập nhật trạng thái chia sẻ màn hình
     */
    @PostMapping("/screen-share")
    public ResponseEntity<Map<String, Object>> updateScreenShareStatus(@RequestBody Map<String, Object> requestData) {
        Long consultationId = Long.valueOf(requestData.get("consultationId").toString());
        Long userId = Long.valueOf(requestData.get("userId").toString());
        Boolean enabled = (Boolean) requestData.get("enabled");

        logger.debug("Updating screen sharing for consultation: {}, user: {}, enabled: {}",
                consultationId, userId, enabled);

        try {
            // Ghi log trạng thái chia sẻ màn hình
            logger.info("Screen sharing updated: consultationId={}, userId={}, enabled={}",
                    consultationId, userId, enabled);

            // Gửi tin nhắn thông báo chia sẻ màn hình
            String message = enabled ? "đã bắt đầu chia sẻ màn hình" : "đã dừng chia sẻ màn hình";
            ChatMessageDTO.SaveChatMessageDTO systemMessage = ChatMessageDTO.SaveChatMessageDTO.builder()
                    .consultationId(consultationId)
                    .senderId(userId)
                    .senderType(ChatMessage.SenderType.SYSTEM)
                    .content(message)
                    .messageType(ChatMessage.MessageType.SYSTEM)
                    .build();

            chatMessageService.save(systemMessage);

            // Gửi thông báo qua Socket.IO nếu có thể
            if (socketIOServer != null) {
                socketIOServer.getRoomOperations(consultationId.toString())
                        .sendEvent("screen-share", requestData);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error updating screen share status", e);

            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Kiểm tra khả năng kết nối WebRTC (diagnostics)
     */
    @GetMapping("/connectivity-check")
    public ResponseEntity<Map<String, Object>> checkConnectivity() {
        logger.debug("Performing WebRTC connectivity check");

        Map<String, Object> result = new HashMap<>();

        // Kiểm tra STUN/TURN
        boolean stunAvailable = checkStunServerAvailability();
        result.put("stunAvailable", stunAvailable);

        if (turnEnabled) {
            boolean turnAvailable = checkTurnServerAvailability();
            result.put("turnAvailable", turnAvailable);
        } else {
            result.put("turnAvailable", false);
            result.put("turnEnabled", false);
        }

        // Thông tin khuyến nghị
        List<String> recommendations = new ArrayList<>();
        if (!stunAvailable) {
            recommendations.add("STUN server không khả dụng. Kiểm tra kết nối mạng hoặc cấu hình STUN.");
        }

        if (turnEnabled && !checkTurnServerAvailability()) {
            recommendations.add("TURN server không khả dụng. Kiểm tra kết nối và thông tin xác thực TURN.");
        }

        if (!turnEnabled) {
            recommendations.add("TURN server chưa được cấu hình. Điều này có thể gây ra vấn đề cho người dùng ở sau NAT nghiêm ngặt.");
        }

        result.put("recommendations", recommendations);
        result.put("success", stunAvailable || (turnEnabled && checkTurnServerAvailability()));

        return ResponseEntity.ok(result);
    }

    /**
     * Kiểm tra khả năng kết nối STUN server
     */
    private boolean checkStunServerAvailability() {
        // Lấy URL STUN đầu tiên để kiểm tra
        String stunUrl = stunUrls.split(",")[0].trim();
        if (stunUrl.startsWith("stun:")) {
            stunUrl = stunUrl.substring(5);
        }

        String[] parts = stunUrl.split(":");
        String host = parts[0];
        int port = parts.length > 1 ? Integer.parseInt(parts[1]) : 3478;

        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(host, port), 5000);
            return true;
        } catch (IOException e) {
            logger.warn("STUN server unavailable: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Kiểm tra khả năng kết nối TURN server
     */
    private boolean checkTurnServerAvailability() {
        if (!turnEnabled || turnUrl.isEmpty()) {
            return false;
        }

        // Lấy thông tin TURN server
        String turnServerUrl = turnUrl;
        if (turnServerUrl.startsWith("turn:")) {
            turnServerUrl = turnServerUrl.substring(5);
        }

        String[] parts = turnServerUrl.split(":");
        String host = parts[0];
        int port = parts.length > 1 ? Integer.parseInt(parts[1]) : 3478;

        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(host, port), 5000);
            return true;
        } catch (IOException e) {
            logger.warn("TURN server unavailable: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Lưu trữ log WebRTC từ client
     */
    @PostMapping("/client-logs")
    public ResponseEntity<Map<String, Object>> saveClientLogs(@RequestBody Map<String, Object> logData) {
        Long consultationId = Long.valueOf(logData.get("consultationId").toString());
        Long userId = Long.valueOf(logData.get("userId").toString());
        String logType = (String) logData.get("type");

        logger.debug("Received client logs for consultation: {}, user: {}, type: {}",
                consultationId, userId, logType);

        // Lưu log vào hệ thống
        if ("error".equals(logType)) {
            logger.error("WebRTC Client Error: consultation={}, user={}, content={}",
                    consultationId, userId, logData.get("content"));

            // Nếu là lỗi nghiêm trọng, thêm tin nhắn hệ thống
            ChatMessageDTO.SaveChatMessageDTO errorMessage = ChatMessageDTO.SaveChatMessageDTO.builder()
                    .consultationId(consultationId)
                    .senderId(userId)
                    .senderType(ChatMessage.SenderType.SYSTEM)
                    .content("Phát hiện lỗi kết nối. Vui lòng làm mới trang nếu gặp vấn đề về video/audio.")
                    .messageType(ChatMessage.MessageType.SYSTEM)
                    .build();

            chatMessageService.save(errorMessage);
        } else {
            logger.info("WebRTC Client Log: consultation={}, user={}, type={}, content={}",
                    consultationId, userId, logType, logData.get("content"));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    /**
     * Cập nhật trạng thái RTC session
     */
    @PostMapping("/rtc-session-id")
    public ResponseEntity<Map<String, Object>> updateRtcSessionId(@RequestBody Map<String, Object> sessionData) {
        Long consultationId = Long.valueOf(sessionData.get("consultationId").toString());
        String rtcSessionId = (String) sessionData.get("rtcSessionId");

        logger.debug("Updating RTC session ID for consultation: {}, sessionId: {}",
                consultationId, rtcSessionId);

        // Gửi thông báo qua Socket.IO nếu có thể
        if (socketIOServer != null) {
            socketIOServer.getRoomOperations(consultationId.toString())
                    .sendEvent("session-update", sessionData);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    /**
     * Tạo tin nhắn thông báo trạng thái kết nối
     */
    @PostMapping("/connection-status")
    public ResponseEntity<Map<String, Object>> updateConnectionStatus(@RequestBody Map<String, Object> statusData) {
        Long consultationId = Long.valueOf(statusData.get("consultationId").toString());
        Long userId = Long.valueOf(statusData.get("userId").toString());
        String status = (String) statusData.get("status"); // "connected", "disconnected", "reconnecting"

        logger.debug("Connection status update for consultation: {}, user: {}, status: {}",
                consultationId, userId, status);

        // Gửi thông báo qua Socket.IO nếu có thể
        if (socketIOServer != null) {
            socketIOServer.getRoomOperations(consultationId.toString())
                    .sendEvent("connection-status", statusData);
        }

        // Nếu có thay đổi trạng thái quan trọng, tạo tin nhắn hệ thống
        if ("disconnected".equals(status)) {
            ChatMessageDTO.SaveChatMessageDTO message = ChatMessageDTO.SaveChatMessageDTO.builder()
                    .consultationId(consultationId)
                    .senderId(userId)
                    .senderType(ChatMessage.SenderType.SYSTEM)
                    .content("Người dùng đã ngắt kết nối")
                    .messageType(ChatMessage.MessageType.SYSTEM)
                    .build();

            chatMessageService.save(message);
        } else if ("reconnecting".equals(status)) {
            ChatMessageDTO.SaveChatMessageDTO message = ChatMessageDTO.SaveChatMessageDTO.builder()
                    .consultationId(consultationId)
                    .senderId(userId)
                    .senderType(ChatMessage.SenderType.SYSTEM)
                    .content("Đang kết nối lại...")
                    .messageType(ChatMessage.MessageType.SYSTEM)
                    .build();

            chatMessageService.save(message);
        } else if ("connected".equals(status)) {
            ChatMessageDTO.SaveChatMessageDTO message = ChatMessageDTO.SaveChatMessageDTO.builder()
                    .consultationId(consultationId)
                    .senderId(userId)
                    .senderType(ChatMessage.SenderType.SYSTEM)
                    .content("Người dùng đã kết nối")
                    .messageType(ChatMessage.MessageType.SYSTEM)
                    .build();

            chatMessageService.save(message);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    /**
     * Ghi lại đánh giá chất lượng cuộc gọi
     */
    @PostMapping("/call-quality")
    public ResponseEntity<Map<String, Object>> reportCallQuality(@RequestBody Map<String, Object> qualityData) {
        Long consultationId = Long.valueOf(qualityData.get("consultationId").toString());
        Long userId = Long.valueOf(qualityData.get("userId").toString());
        Integer rating = (Integer) qualityData.get("rating"); // 1-5
        String feedback = (String) qualityData.get("feedback");

        logger.info("Call quality report: consultationId={}, userId={}, rating={}, feedback={}",
                consultationId, userId, rating, feedback);

        // Lưu đánh giá vào log
        String message = "Đánh giá chất lượng cuộc gọi: " + rating + "/5";
        if (feedback != null && !feedback.isEmpty()) {
            message += " - " + feedback;
        }

        // Lưu tin nhắn hệ thống về đánh giá cuộc gọi (tùy chọn)
        if (rating <= 3) { // Nếu đánh giá thấp, tạo tin nhắn hệ thống
            ChatMessageDTO.SaveChatMessageDTO systemMessage = ChatMessageDTO.SaveChatMessageDTO.builder()
                    .consultationId(consultationId)
                    .senderId(userId)
                    .senderType(ChatMessage.SenderType.SYSTEM)
                    .content(message)
                    .messageType(ChatMessage.MessageType.SYSTEM)
                    .build();

            chatMessageService.save(systemMessage);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Đã ghi nhận đánh giá của bạn");
        return ResponseEntity.ok(response);
    }
}