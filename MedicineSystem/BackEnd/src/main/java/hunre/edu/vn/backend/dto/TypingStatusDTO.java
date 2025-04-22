package hunre.edu.vn.backend.dto;

import lombok.Data;

import java.io.Serializable;

@Data
public class TypingStatusDTO implements Serializable {
    private String userId;
    private Long consultationId;
    private boolean isTyping;
}
