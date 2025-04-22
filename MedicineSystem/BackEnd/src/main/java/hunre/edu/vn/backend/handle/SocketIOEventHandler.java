package hunre.edu.vn.backend.handle;

import com.corundumstudio.socketio.AckRequest;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.annotation.OnConnect;
import com.corundumstudio.socketio.annotation.OnDisconnect;
import com.corundumstudio.socketio.annotation.OnEvent;
import hunre.edu.vn.backend.dto.ConsultationDTO;
import hunre.edu.vn.backend.entity.ChatMessage;
import hunre.edu.vn.backend.service.ConsultationService;
import hunre.edu.vn.backend.dto.ChatMessageDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class SocketIOEventHandler {
    private static final Logger logger = LoggerFactory.getLogger(SocketIOEventHandler.class);

    @Autowired
    @Lazy
    private ConsultationService consultationService;

    @Autowired
    private SocketIOServer socketServer;

    // Theo dõi các client đang kết nối theo ID tư vấn
    private final ConcurrentHashMap<String, ConcurrentHashMap<String, SocketIOClient>> consultationRooms =
            new ConcurrentHashMap<>();

    // Đăng ký các event handler khi khởi động
    public void registerEvents(SocketIOServer server) {
        logger.info("Socket.IO event handlers registered");
    }

    // Hàm tiện ích để chuyển đổi Object thành Long
    private Long toLong(Object obj) {
        if (obj == null) return null;
        if (obj instanceof Number) {
            return ((Number) obj).longValue();
        } else if (obj instanceof String) {
            try {
                return Long.parseLong((String) obj);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    @OnConnect
    public void onConnect(SocketIOClient client) {
        String consultationId = client.getHandshakeData().getSingleUrlParam("consultationId");
        String userId = client.getHandshakeData().getSingleUrlParam("userId");
        String userType = client.getHandshakeData().getSingleUrlParam("userType"); // doctor, patient...

        if (consultationId == null || userId == null) {
            logger.warn("Client connection rejected - missing parameters");
            client.disconnect();
            return;
        }

        // Thêm client vào room
        client.joinRoom(consultationId);

        // Lưu trữ thông tin client
        consultationRooms.computeIfAbsent(consultationId, k -> new ConcurrentHashMap<>())
                .put(userId, client);

        logger.info("Client {} connected to consultation: {}", userId, consultationId);

        // Thông báo cho tất cả client trong phòng về việc kết nối mới
        Map<String, Object> connectData = Map.of(
                "type", "USER_CONNECTED",
                "userId", userId,
                "userType", userType != null ? userType : "unknown",
                "consultationId", consultationId,
                "timestamp", System.currentTimeMillis()
        );

        // Gửi thông báo đến tất cả người dùng trong phòng
        socketServer.getRoomOperations(consultationId).sendEvent("system", connectData);
    }

    @OnDisconnect
    public void onDisconnect(SocketIOClient client) {
        String consultationId = client.getHandshakeData().getSingleUrlParam("consultationId");
        String userId = client.getHandshakeData().getSingleUrlParam("userId");

        if (consultationId != null && userId != null) {
            // Xóa client khỏi danh sách theo dõi
            ConcurrentHashMap<String, SocketIOClient> roomClients = consultationRooms.get(consultationId);
            if (roomClients != null) {
                roomClients.remove(userId);
                if (roomClients.isEmpty()) {
                    consultationRooms.remove(consultationId);
                }
            }

            // Thông báo cho tất cả client trong phòng về việc ngắt kết nối
            Map<String, Object> disconnectData = Map.of(
                    "type", "USER_DISCONNECTED",
                    "userId", userId,
                    "consultationId", consultationId,
                    "timestamp", System.currentTimeMillis()
            );

            socketServer.getRoomOperations(consultationId).sendEvent("system", disconnectData);
            logger.info("Client {} disconnected from consultation: {}", userId, consultationId);
        }
    }

    // === WebRTC Signaling Events ===

    @OnEvent("offer")
    public void handleOffer(SocketIOClient client, Map<String, Object> data, AckRequest ackRequest) {
        Object consultationIdObj = data.get("consultationId");
        Object targetUserIdObj = data.get("targetUserId");

        String consultationId = consultationIdObj != null ? consultationIdObj.toString() : null;
        String targetUserId = targetUserIdObj != null ? targetUserIdObj.toString() : null;

        if (consultationId == null) {
            logger.error("Missing consultationId in offer data");
            return;
        }

        logger.debug("Received WebRTC OFFER in consultation: {}", consultationId);

        // Broadcast to room or send to specific user if targetUserId is provided
        if (targetUserId != null) {
            ConcurrentHashMap<String, SocketIOClient> roomClients = consultationRooms.get(consultationId);
            if (roomClients != null && roomClients.containsKey(targetUserId)) {
                roomClients.get(targetUserId).sendEvent("offer", data);
            }
        } else {
            // Broadcast to all except sender
            socketServer.getRoomOperations(consultationId).sendEvent("offer", data);
        }

        if (ackRequest.isAckRequested()) {
            ackRequest.sendAckData(Map.of("status", "delivered"));
        }
    }

    @OnEvent("answer")
    public void handleAnswer(SocketIOClient client, Map<String, Object> data, AckRequest ackRequest) {
        Object consultationIdObj = data.get("consultationId");
        Object targetUserIdObj = data.get("targetUserId");

        String consultationId = consultationIdObj != null ? consultationIdObj.toString() : null;
        String targetUserId = targetUserIdObj != null ? targetUserIdObj.toString() : null;

        if (consultationId == null) {
            logger.error("Missing consultationId in answer data");
            return;
        }

        logger.debug("Received WebRTC ANSWER in consultation: {}", consultationId);

        // Send to specific user if targetUserId is provided
        if (targetUserId != null) {
            ConcurrentHashMap<String, SocketIOClient> roomClients = consultationRooms.get(consultationId);
            if (roomClients != null && roomClients.containsKey(targetUserId)) {
                roomClients.get(targetUserId).sendEvent("answer", data);
            }
        } else {
            // Broadcast to all except sender
            socketServer.getRoomOperations(consultationId).sendEvent("answer", data);
        }

        if (ackRequest.isAckRequested()) {
            ackRequest.sendAckData(Map.of("status", "delivered"));
        }
    }

    @OnEvent("ice-candidate")
    public void handleIceCandidate(SocketIOClient client, Map<String, Object> data, AckRequest ackRequest) {
        Object consultationIdObj = data.get("consultationId");
        Object targetUserIdObj = data.get("targetUserId");

        String consultationId = consultationIdObj != null ? consultationIdObj.toString() : null;
        String targetUserId = targetUserIdObj != null ? targetUserIdObj.toString() : null;

        if (consultationId == null) {
            logger.error("Missing consultationId in ice-candidate data");
            return;
        }

        logger.debug("Received ICE candidate in consultation: {}", consultationId);

        // Send to specific user if targetUserId is provided
        if (targetUserId != null) {
            ConcurrentHashMap<String, SocketIOClient> roomClients = consultationRooms.get(consultationId);
            if (roomClients != null && roomClients.containsKey(targetUserId)) {
                roomClients.get(targetUserId).sendEvent("ice-candidate", data);
            }
        } else {
            // Broadcast to all except sender
            socketServer.getRoomOperations(consultationId).sendEvent("ice-candidate", data);
        }

        if (ackRequest.isAckRequested()) {
            ackRequest.sendAckData(Map.of("status", "delivered"));
        }
    }

    // === Tin nhắn và trạng thái media ===

    @OnEvent("chat")
    public void handleChatMessage(SocketIOClient client, Map<String, Object> data, AckRequest ackRequest) {
        Long consultationId = toLong(data.get("consultationId"));
        Long senderId = toLong(data.get("senderId"));
        Object senderTypeObj = data.get("senderType");
        Object messageObj = data.get("message");
        Object messageTypeObj = data.get("messageType");

        if (messageObj == null) {
            messageObj = data.get("content"); // Thử lấy từ trường content nếu message không có
        }

        String message = messageObj != null ? messageObj.toString() : null;

        // Xác định messageType, mặc định là TEXT nếu không được chỉ định
        ChatMessage.MessageType messageType = ChatMessage.MessageType.TEXT;
        if (messageTypeObj != null) {
            try {
                messageType = ChatMessage.MessageType.valueOf(messageTypeObj.toString());
            } catch (IllegalArgumentException e) {
                logger.warn("Invalid message type: {}, using default TEXT", messageTypeObj);
            }
        }

        // Xác định senderType nếu có
        ChatMessage.SenderType senderType = null;
        if (senderTypeObj != null) {
            try {
                senderType = ChatMessage.SenderType.valueOf(senderTypeObj.toString());
            } catch (IllegalArgumentException e) {
                logger.warn("Invalid sender type: {}", senderTypeObj);
            }
        }

        if (consultationId == null || senderId == null || message == null) {
            logger.error("Missing required parameters for chat message");
            return;
        }

        logger.debug("Received chat message in consultation: {}", consultationId);

        // Lưu tin nhắn vào database
        try {
            ChatMessageDTO.SaveChatMessageDTO chatMessageDTO = new ChatMessageDTO.SaveChatMessageDTO();
            chatMessageDTO.setConsultationId(consultationId);
            chatMessageDTO.setSenderId(senderId);
            chatMessageDTO.setContent(message);
            chatMessageDTO.setMessageType(messageType); // Thêm message type

            if (senderType != null) {
                chatMessageDTO.setSenderType(senderType);
            }

            // Lưu tin nhắn và nhận kết quả
            ChatMessageDTO.GetChatMessageDTO savedMessage = consultationService.sendChatMessage(chatMessageDTO);

            // Thêm ID của tin nhắn đã lưu vào dữ liệu gửi đi
            data.put("messageId", savedMessage.getId());
            data.put("timestamp", savedMessage.getSentAt());
        } catch (Exception e) {
            logger.error("Error saving chat message", e);
            // Vẫn gửi tin nhắn ngay cả khi có lỗi khi lưu
            if (!data.containsKey("timestamp")) {
                data.put("timestamp", System.currentTimeMillis());
            }
        }

        // Gửi tin nhắn đến tất cả clients trong phòng
        socketServer.getRoomOperations(consultationId.toString()).sendEvent("chat", data);

        if (ackRequest.isAckRequested()) {
            ackRequest.sendAckData(Map.of("status", "delivered"));
        }
    }

    @OnEvent("video-status")
    public void handleVideoStatus(SocketIOClient client, Map<String, Object> data, AckRequest ackRequest) {
        Long consultationId = toLong(data.get("consultationId"));
        Long userId = toLong(data.get("userId"));
        Boolean enabled = (Boolean) data.get("enabled");

        if (consultationId == null || userId == null || enabled == null) {
            logger.error("Missing required parameters for video status");
            return;
        }

        logger.debug("Received video status in consultation {}: user {} - enabled: {}",
                consultationId, userId, enabled);

        // Cập nhật trạng thái video trong database (nếu cần)
        try {
            consultationService.toggleVideoStream(consultationId, userId, enabled);
        } catch (Exception e) {
            logger.error("Error updating video status", e);
        }

        // Gửi thông báo trạng thái đến tất cả clients trong phòng
        socketServer.getRoomOperations(consultationId.toString()).sendEvent("video-status", data);

        if (ackRequest.isAckRequested()) {
            ackRequest.sendAckData(Map.of("status", "delivered"));
        }
    }

    @OnEvent("audio-status")
    public void handleAudioStatus(SocketIOClient client, Map<String, Object> data, AckRequest ackRequest) {
        Long consultationId = toLong(data.get("consultationId"));

        if (consultationId == null) {
            logger.error("Missing consultationId for audio status");
            return;
        }

        logger.debug("Received audio status update for consultation: {}", consultationId);

        // Gửi thông báo trạng thái đến tất cả clients trong phòng
        socketServer.getRoomOperations(consultationId.toString()).sendEvent("audio-status", data);

        if (ackRequest.isAckRequested()) {
            ackRequest.sendAckData(Map.of("status", "delivered"));
        }
    }

    @OnEvent("screen-share")
    public void handleScreenShare(SocketIOClient client, Map<String, Object> data, AckRequest ackRequest) {
        Long consultationId = toLong(data.get("consultationId"));

        if (consultationId == null) {
            logger.error("Missing consultationId for screen share");
            return;
        }

        logger.debug("Received screen sharing update for consultation: {}", consultationId);

        // Gửi thông báo chia sẻ màn hình đến tất cả clients trong phòng
        socketServer.getRoomOperations(consultationId.toString()).sendEvent("screen-share", data);

        if (ackRequest.isAckRequested()) {
            ackRequest.sendAckData(Map.of("status", "delivered"));
        }
    }

    @OnEvent("typing")
    public void handleTypingStatus(SocketIOClient client, Map<String, Object> data, AckRequest ackRequest) {
        Long consultationId = toLong(data.get("consultationId"));

        if (consultationId == null) {
            logger.error("Missing consultationId for typing status");
            return;
        }

        // Gửi thông báo đang nhập tin nhắn đến tất cả clients trong phòng
        socketServer.getRoomOperations(consultationId.toString()).sendEvent("typing", data);

        if (ackRequest.isAckRequested()) {
            ackRequest.sendAckData(Map.of("status", "delivered"));
        }
    }

    @OnEvent("consultation-status")
    public void handleConsultationStatus(SocketIOClient client, Map<String, Object> data, AckRequest ackRequest) {
        Long consultationId = toLong(data.get("consultationId"));
        Object statusObj = data.get("status");
        String status = statusObj != null ? statusObj.toString() : null;

        if (consultationId == null || status == null) {
            logger.error("Missing required parameters for consultation status");
            return;
        }

        logger.debug("Received consultation status update: {} - {}", consultationId, status);

        // Cập nhật trạng thái cuộc tư vấn nếu cần
        if ("started".equals(status)) {
            try {
                ConsultationDTO.StartSessionDto startSessionDto = new ConsultationDTO.StartSessionDto();
                startSessionDto.setConsultationId(consultationId);
                consultationService.startConsultationSession(startSessionDto);
            } catch (Exception e) {
                logger.error("Error starting consultation session", e);
            }
        } else if ("ended".equals(status)) {
            try {
                ConsultationDTO.EndSessionDto endSessionDto = new ConsultationDTO.EndSessionDto();
                endSessionDto.setConsultationId(consultationId);
                consultationService.endConsultationSession(endSessionDto);
            } catch (Exception e) {
                logger.error("Error ending consultation session", e);
            }
        }

        // Gửi thông báo trạng thái đến tất cả clients trong phòng
        socketServer.getRoomOperations(consultationId.toString()).sendEvent("consultation-status", data);

        if (ackRequest.isAckRequested()) {
            ackRequest.sendAckData(Map.of("status", "delivered"));
        }
    }
}