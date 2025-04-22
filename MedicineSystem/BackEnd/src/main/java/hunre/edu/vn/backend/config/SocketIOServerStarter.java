package hunre.edu.vn.backend.config;

import com.corundumstudio.socketio.SocketIOServer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class SocketIOServerStarter implements CommandLineRunner {

    @Autowired
    private SocketIOServer socketIOServer;

    @Override
    public void run(String... args) {
        // Khởi động server ngay khi ứng dụng bắt đầu
        socketIOServer.start();
        System.out.println("Socket.IO server started on port: " +
                socketIOServer.getConfiguration().getPort());
    }
}