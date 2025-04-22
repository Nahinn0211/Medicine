package hunre.edu.vn.backend.config;

import com.corundumstudio.socketio.Configuration;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.Transport;
import com.corundumstudio.socketio.annotation.SpringAnnotationScanner;
import com.corundumstudio.socketio.protocol.JacksonJsonSupport;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import hunre.edu.vn.backend.utils.JwtTokenProvider;
import hunre.edu.vn.backend.utils.MessageSender;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;

import java.lang.reflect.Field;
import java.net.ServerSocket;

@Component
public class SocketIOConfig {
    private static final Logger logger = LoggerFactory.getLogger(SocketIOConfig.class);

    @Value("${socketio.host:0.0.0.0}")
    private String host;

    @Value("${socketio.port:9093}")
    private int port;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private MessageSender messageSender;

    private SocketIOServer socketIOServer;

    @Bean
    public SocketIOServer socketIOServer() {
        int actualPort = findAvailablePort(port);

        Configuration config = new Configuration();
        config.setHostname(host);
        config.setPort(actualPort);

        // Tăng thời gian ping timeout (mặc định là 60s)
        config.setPingTimeout(120000);
        // Tăng thời gian ping interval (mặc định là 25s)
        config.setPingInterval(25000);

        // Cấu hình CORS
        config.setOrigin("*");

        config.setTransports(Transport.WEBSOCKET, Transport.POLLING);

        // Cấu hình JSON với JavaTimeModule
        try {
            // Sử dụng JacksonJsonSupport mặc định
            JacksonJsonSupport jsonSupport = new JacksonJsonSupport();

            // Thử sửa đổi ObjectMapper bên trong JacksonJsonSupport thông qua reflection
            // Cách này không được khuyến khích nhưng có thể cần thiết nếu không có cách nào khác
            try {
                Field objectMapperField = JacksonJsonSupport.class.getDeclaredField("objectMapper");
                objectMapperField.setAccessible(true);

                ObjectMapper objectMapper = (ObjectMapper) objectMapperField.get(jsonSupport);
                objectMapper.registerModule(new JavaTimeModule());
                objectMapper.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);

                logger.info("Successfully configured ObjectMapper in JacksonJsonSupport");
            } catch (Exception e) {
                logger.warn("Failed to configure ObjectMapper in JacksonJsonSupport: " + e.getMessage());
                logger.warn("LocalDateTime serialization might not work properly");
            }

            config.setJsonSupport(jsonSupport);
        } catch (Exception e) {
            logger.error("Failed to configure JacksonJsonSupport: " + e.getMessage());
        }

        // Xác thực JWT
        config.setAuthorizationListener(data -> {
            String token = data.getSingleUrlParam("token");
            try {
                return token != null && jwtTokenProvider.validateToken(token);
            } catch (Exception e) {
                logger.error("Token validation failed", e);
                return false;
            }
        });

        socketIOServer = new SocketIOServer(config);

        // Gán server vào MessageSender
        messageSender.setSocketIOServer(socketIOServer);

        return socketIOServer;
    }

    // Tìm port trống
    private int findAvailablePort(int initialPort) {
        int port = initialPort;
        while (!isPortAvailable(port)) {
            port++;
            if (port > initialPort + 100) {
                throw new RuntimeException("No available port found");
            }
        }
        return port;
    }

    // Kiểm tra port có đang được sử dụng không
    private boolean isPortAvailable(int port) {
        try (ServerSocket serverSocket = new ServerSocket(port)) {
            serverSocket.close();
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @Bean
    public SpringAnnotationScanner springAnnotationScanner(SocketIOServer socketIOServer) {
        return new SpringAnnotationScanner(socketIOServer);
    }
}