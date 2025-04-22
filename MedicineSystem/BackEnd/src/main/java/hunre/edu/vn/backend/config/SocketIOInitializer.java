package hunre.edu.vn.backend.config;

import com.corundumstudio.socketio.SocketIOServer;
import hunre.edu.vn.backend.handle.SocketIOEventHandler;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class SocketIOInitializer {

    @Autowired
    private SocketIOServer socketIOServer;

    @Autowired
    private SocketIOEventHandler socketIOEventHandler;

    @PostConstruct
    public void init() {
        socketIOEventHandler.registerEvents(socketIOServer);
    }
}