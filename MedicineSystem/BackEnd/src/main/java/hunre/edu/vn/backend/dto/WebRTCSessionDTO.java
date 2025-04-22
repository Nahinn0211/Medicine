package hunre.edu.vn.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebRTCSessionDTO {
    private Long consultationId;
    private String sessionId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Long initiatorId;
    private String status; // "active", "ended", "scheduled"

    // Thông tin người tham gia
    private List<ParticipantDTO> participants;

    // Cấu hình ICE Server
    private List<Map<String, Object>> iceServers;

    // Các tùy chọn và cấu hình bổ sung
    private Map<String, Object> options;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParticipantDTO {
        private Long userId;
        private String userType; // "doctor", "patient"
        private String displayName;
        private Boolean videoEnabled;
        private Boolean audioEnabled;
        private Boolean screenSharingEnabled;
        private LocalDateTime joinTime;
        private LocalDateTime leaveTime;
    }
}