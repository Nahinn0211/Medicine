package hunre.edu.vn.backend.component;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;


@Component
public class WebRTCLogger {
    private static final Logger logger = LoggerFactory.getLogger(WebRTCLogger.class);

    @PostConstruct
    public void init() {
        logger.info("WebRTC Logger initialized");
    }

    public void logSignalingMessage(Long consultationId, String type, String senderId) {
        logger.info("WebRTC signaling: type={}, consultation={}, sender={}",
                type, consultationId, senderId);
    }

    public void logSdpExchange(Long consultationId, String type, String senderId, boolean hasIceCandidates) {
        logger.info("SDP exchange: type={}, consultation={}, sender={}, hasICE={}",
                type, consultationId, senderId, hasIceCandidates);
    }

    public void logError(String message, Exception e) {
        logger.error("WebRTC error: {} - {}", message, e.getMessage(), e);
    }
}