package hunre.edu.vn.backend.utils;

import com.corundumstudio.socketio.SocketIOServer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class MessageSender {
    private final Logger logger = LoggerFactory.getLogger(MessageSender.class);

    private SocketIOServer socketIOServer;

    public void setSocketIOServer(SocketIOServer server) {
        this.socketIOServer = server;
    }

    public void sendToRoom(String room, String event, Object data) {
        if (socketIOServer != null) {
            try {
                socketIOServer.getRoomOperations(room).sendEvent(event, data);
                logger.debug("Sent message to room {}, event: {}", room, event);
            } catch (Exception e) {
                logger.error("Error sending message to room {}: {}", room, e.getMessage());
            }
        } else {
            logger.warn("SocketIOServer not available for sending event: {}", event);
        }
    }
}