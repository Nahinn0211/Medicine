<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import WebRTCClient from '@user/services/WebRTCClient';
import { authService } from '@user/services/AuthService';
import { consultationService } from '@user/services/ConsultationService';

// Lấy thông tin route để truy cập consultationCode
const route = useRoute();
const router = useRouter();
const consultationCode = route.params.consultationCode;

// State và ref variables
const connectionStatus = ref('disconnected');
const messages = ref([]);
const newMessage = ref('');
const typing = ref(false);
const isTyping = ref({});
const error = ref(null);
const consultationData = ref(null);
const videoFitMode = ref('contain');
// WebRTC state
const remoteVideoRef = ref(null);
const localVideoRef = ref(null);
const localStream = ref(null);
const remoteStream = ref(null);
const mediaStatus = ref({
  video: true,
  audio: true,
  screenShare: false
});
const remoteMediaStatus = ref({
  video: true,
  audio: true,
  screenShare: false
});

// User data
const user = computed(() => authService.state.user);
const userId = computed(() => user.value?.id);
const userType = ref('DOCTOR'); // Mặc định là bác sĩ, sẽ cập nhật dựa trên dữ liệu

// Debug state
const debugLogs = ref([]);
const addDebugLog = (message) => {
  const timestamp = new Date().toISOString();
  debugLogs.value.push(`[${timestamp}] ${message}`);
  console.log(`[DEBUG] ${message}`);
  // Giữ nhật ký gỡ lỗi không quá dài
  if (debugLogs.value.length > 100) {
    debugLogs.value.shift();
  }
};

// Thêm các state mới để điều chỉnh video
const videoScale = ref(1); // Tỷ lệ phóng to/thu nhỏ video
const isMirrored = ref(false); // Hiệu ứng lật gương
const videoRotation = ref(0); // Góc xoay video

// Cập nhật hàm toggleVideoFitMode để hỗ trợ 3 chế độ
const toggleVideoFitMode = () => {
  // Xoay vòng giữa các chế độ: contain -> cover -> scale-down -> contain
  if (videoFitMode.value === 'contain') {
    videoFitMode.value = 'cover';
  } else if (videoFitMode.value === 'cover') {
    videoFitMode.value = 'scale-down';
  } else {
    videoFitMode.value = 'contain';
  }
  addDebugLog(`Chuyển chế độ hiển thị video sang: ${videoFitMode.value}`);
};

// Hàm lật ngược video (hiệu ứng gương)
const toggleMirror = () => {
  isMirrored.value = !isMirrored.value;
  addDebugLog(`Chuyển đổi chế độ lật gương: ${isMirrored.value}`);
};

// Hàm xoay video
const rotateVideo = (degrees) => {
  videoRotation.value = (videoRotation.value + degrees) % 360;
  addDebugLog(`Xoay video đến góc: ${videoRotation.value} độ`);
};

// Hàm phóng to/thu nhỏ video
const adjustVideoScale = (delta) => {
  // Giới hạn tỷ lệ phóng to/thu nhỏ từ 0.5 đến 2.0
  const newScale = Math.max(0.5, Math.min(2.0, videoScale.value + delta));
  videoScale.value = Math.round(newScale * 10) / 10; // Làm tròn đến 1 chữ số thập phân
  addDebugLog(`Điều chỉnh tỷ lệ phóng to/thu nhỏ video: ${videoScale.value}`);
};

// Hàm đặt lại tất cả điều chỉnh video
const resetVideoSettings = () => {
  videoFitMode.value = 'contain';
  videoScale.value = 1;
  isMirrored.value = false;
  videoRotation.value = 0;
  addDebugLog('Đặt lại tất cả cài đặt video về mặc định');
};

// Tính toán style cho video từ xa dựa trên các cài đặt
const remoteVideoStyle = computed(() => {
  let transform = '';
  
  // Xoay video
  if (videoRotation.value !== 0) {
    transform += `rotate(${videoRotation.value}deg) `;
  }
  
  // Phóng to/thu nhỏ
  if (videoScale.value !== 1) {
    transform += `scale(${videoScale.value}) `;
  }
  
  // Lật gương
  if (isMirrored.value) {
    transform += 'scaleX(-1) ';
  }
  
  return {
    objectFit: videoFitMode.value,
    transform: transform.trim(),
    maxHeight: '100%',
    maxWidth: '100%'
  };
});

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Initialize WebRTC client
const webrtcClient = new WebRTCClient({
  serverUrl: 'http://localhost:3001',
  debug: true
});

// Setup WebRTC callbacks
const setupWebRTCCallbacks = () => {
  // Handle local stream
  webrtcClient.onLocalStream = (stream) => {
    addDebugLog('Local stream received');
    localStream.value = stream;

    // Đảm bảo local video được thiết lập
    setTimeout(() => {
      if (localVideoRef.value) {
        localVideoRef.value.srcObject = stream;
        addDebugLog('Local video element srcObject set');
      }
    }, 100);
  };

  // Handle remote stream
  webrtcClient.onRemoteStream = (stream) => {
    addDebugLog(`Remote stream received. Active: ${stream.active}, Tracks: ${stream.getTracks().length}`);

    stream.getTracks().forEach(track => {
      addDebugLog(`Remote track: ${track.kind}, enabled: ${track.enabled}, state: ${track.readyState}`);
    });

    remoteStream.value = stream;

    // Đảm bảo remote video được thiết lập trực tiếp
    setTimeout(() => {
      if (remoteVideoRef.value) {
        remoteVideoRef.value.srcObject = stream;
        addDebugLog('Remote video element srcObject set directly');

        // Thử phát video
        remoteVideoRef.value.play()
          .then(() => addDebugLog('Remote video playback started'))
          .catch(err => addDebugLog(`Error playing remote video: ${err.message}`));
      } else {
        addDebugLog('ERROR: Remote video element ref is null!');
      }
    }, 100);
  };

  // Handle connection state changes
  webrtcClient.onConnectionStateChange = (state) => {
    addDebugLog(`Connection state changed: ${state}`);

    switch (state) {
      case 'connected':
      case 'completed':
        connectionStatus.value = 'connected';
        break;
      case 'failed':
      case 'disconnected':
      case 'closed':
        connectionStatus.value = 'disconnected';
        break;
    }
  };

  // Handle various messages
  webrtcClient.onMessage = (eventName, data) => {
    addDebugLog(`Message received: ${eventName}`);

    switch (eventName) {
      case 'chat':
        messages.value.push(data);
        // Scroll to bottom
        setTimeout(() => {
          const chatContainer = document.querySelector('.chat-container');
          if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
          }
        }, 50);
        break;

      case 'typing':
        if (data.userId !== userId.value) {
          isTyping.value[data.userId] = data.isTyping;
        }
        break;

      case 'video-status':
        if (data.userId !== userId.value) {
          remoteMediaStatus.value.video = data.enabled;
        }
        break;

      case 'audio-status':
        if (data.userId !== userId.value) {
          remoteMediaStatus.value.audio = data.enabled;
        }
        break;

      case 'screen-share':
        if (data.userId !== userId.value) {
          remoteMediaStatus.value.screenShare = data.enabled;
        }
        break;
    }
  };

  // Handle errors
  webrtcClient.onError = (err) => {
    addDebugLog(`WebRTC error: ${err.message}`);
    error.value = err.message;
  };
};

// Watch cho remote stream và thiết lập video element
watch(remoteStream, async (newStream) => {
  if (newStream && remoteVideoRef.value) {
    addDebugLog('Watch triggered: Setting remote stream to video element');
    remoteVideoRef.value.srcObject = newStream;

    try {
      await remoteVideoRef.value.play();
      addDebugLog('Remote video playing successfully via watcher');
    } catch (err) {
      addDebugLog(`Error playing remote video in watcher: ${err.message}`);

      // Thử lại với autoplay muted
      remoteVideoRef.value.muted = true;
      try {
        await remoteVideoRef.value.play();
        addDebugLog('Remote video playing with muted workaround');
        // Sau khi phát thành công, bỏ chế độ muted
        setTimeout(() => {
          remoteVideoRef.value.muted = false;
          addDebugLog('Unmuted remote video after successful play');
        }, 1000);
      } catch (innerErr) {
        addDebugLog(`Still failed to play even muted: ${innerErr.message}`);
      }
    }
  }
}, { immediate: true });

// Watch cho local video element ref
watch(localVideoRef, (newRef) => {
  if (newRef && localStream.value) {
    addDebugLog('Setting local video srcObject from watcher');
    newRef.srcObject = localStream.value;
  }
});

// Watch cho remote video element ref
watch(remoteVideoRef, (newRef) => {
  if (newRef && remoteStream.value) {
    addDebugLog('Setting remote video srcObject from element ref watcher');
    newRef.srcObject = remoteStream.value;

    newRef.onloadedmetadata = () => addDebugLog('Remote video metadata loaded');
    newRef.onplay = () => addDebugLog('Remote video playing event fired');
    newRef.onpause = () => addDebugLog('Remote video paused');
    newRef.onerror = (e) => addDebugLog(`Remote video error: ${e.target.error.message || 'unknown error'}`);

    // Thử phát video
    newRef.play()
      .then(() => addDebugLog('Remote video playing from ref watcher'))
      .catch(err => addDebugLog(`Failed to play in ref watcher: ${err.message}`));
  }
});

// Fetch consultation data by code
const fetchConsultationData = async () => {
  try {
    addDebugLog(`Fetching consultation data for code: ${consultationCode}`);
    if (!consultationCode) {
      throw new Error('Consultation code not found');
    }

    const data = await consultationService.getConsultationByCode(consultationCode);
    consultationData.value = data;

    // Xác định loại người dùng (bác sĩ hoặc bệnh nhân)
    if (userId.value === data.doctor?.user?.id) {
      userType.value = 'DOCTOR';
    } else if (userId.value === data.patient?.user?.id) {
      userType.value = 'PATIENT';
    }

    addDebugLog(`Consultation data loaded. User type: ${userType.value}`);
    return data;
  } catch (err) {
    addDebugLog(`Error fetching consultation data: ${err.message}`);
    error.value = 'Không thể lấy thông tin cuộc tư vấn. ' + err.message;
    return null;
  }
};

// Connect to WebRTC server
const connectWebRTC = async () => {
  try {
    addDebugLog('Connecting to WebRTC server...');
    error.value = null;

    // Lấy dữ liệu cuộc tư vấn
    const consultation = consultationData.value || await fetchConsultationData();
    if (!consultation) {
      throw new Error('Không thể lấy thông tin cuộc tư vấn');
    }

    // Setup callbacks
    setupWebRTCCallbacks();

    // Connect to signaling server với consultationId
    await webrtcClient.connect({
      consultationId: consultation.id,
      userId: userId.value,
      userType: userType.value
    });

    // Initialize WebRTC
    await webrtcClient.initializeWebRTC();

    // Set target user ID (người còn lại trong cuộc tư vấn)
    const patient = await consultationService.getDataUser(consultation.patientId);
    const targetUserId = patient.user.id;

    addDebugLog(`Setting target user ID: ${targetUserId}`);
    webrtcClient.setTargetUserId(targetUserId);

    // Nếu là bác sĩ, tạo offer
    if (userType.value === 'DOCTOR') {
      setTimeout(() => {
        addDebugLog('Creating offer as DOCTOR');
        webrtcClient.createOffer();
      }, 1000);
    } else {
      // Nếu là bệnh nhân, request offer
      setTimeout(() => {
        addDebugLog('Requesting offer as PATIENT');
        webrtcClient.requestOffer();
      }, 1000);
    }

    connectionStatus.value = 'connecting';
  } catch (err) {
    addDebugLog(`Error connecting to WebRTC: ${err.message}`);
    error.value = err.message;
  }
};

// Toggle video
const toggleVideo = async () => {
  try {
    mediaStatus.value.video = !mediaStatus.value.video;
    addDebugLog(`Toggling video: ${mediaStatus.value.video}`);
    webrtcClient.toggleVideo(mediaStatus.value.video);
  } catch (err) {
    addDebugLog(`Error toggling video: ${err.message}`);
  }
};

// Toggle audio
const toggleAudio = () => {
  try {
    mediaStatus.value.audio = !mediaStatus.value.audio;
    addDebugLog(`Toggling audio: ${mediaStatus.value.audio}`);
    webrtcClient.toggleAudio(mediaStatus.value.audio);
  } catch (err) {
    addDebugLog(`Error toggling audio: ${err.message}`);
  }
};

// Toggle screen sharing
const toggleScreenShare = async () => {
  try {
    addDebugLog(`Toggling screen share from ${mediaStatus.value.screenShare} to ${!mediaStatus.value.screenShare}`);
    const success = await webrtcClient.toggleScreenShare(!mediaStatus.value.screenShare);
    if (success) {
      mediaStatus.value.screenShare = !mediaStatus.value.screenShare;
      addDebugLog(`Screen share toggle successful. New state: ${mediaStatus.value.screenShare}`);
    }
  } catch (err) {
    addDebugLog(`Error toggling screen share: ${err.message}`);
    mediaStatus.value.screenShare = false;
  }
};

// Send chat message
const sendMessage = () => {
  if (!newMessage.value.trim()) return;

  try {
    const message = newMessage.value;
    newMessage.value = '';

    // Send message via WebRTC client
    webrtcClient.sendChatMessage(message);

    // Signal no longer typing
    typing.value = false;
    webrtcClient.sendTypingStatus(false);
  } catch (err) {
    addDebugLog(`Error sending message: ${err.message}`);
  }
};

// Handle typing status
const handleInput = () => {
  if (newMessage.value.trim() && !typing.value) {
    typing.value = true;
    webrtcClient.sendTypingStatus(true);
  } else if (!newMessage.value.trim() && typing.value) {
    typing.value = false;
    webrtcClient.sendTypingStatus(false);
  }
};

const endCall = async () => {
  try {
    addDebugLog('Ending call');
    await webrtcClient.endCall('Call ended by user');
    
    // Đảm bảo dừng tất cả các thiết bị phương tiện
    if (localStream.value) {
      localStream.value.getTracks().forEach(track => {
        addDebugLog(`Stopping track: ${track.kind}`);
        track.stop();
      });
    }
    
    resetState();
    
    // Chuyển hướng đến trang prescription với consultationCode
    addDebugLog(`Redirecting to prescription page with consultationCode: ${consultationCode}`);
    router.push(`/prescription/${consultationCode}`);
  } catch (err) {
    addDebugLog(`Error ending call: ${err.message}`);
  }
};

// Reset component state
const resetState = () => {
  localStream.value = null;
  remoteStream.value = null;
  connectionStatus.value = 'disconnected';
};

// Manual reconnect function (thử kết nối lại khi có sự cố)
const tryReconnect = async () => {
  addDebugLog('Manual reconnection attempt');

  // Ngắt kết nối hiện tại trước
  try {
    webrtcClient.disconnect();
  } catch (err) {
    // Bỏ qua lỗi ngắt kết nối
  }

  // Đặt lại state
  resetState();
  error.value = null;

  // Đợi một chút trước khi kết nối lại
  setTimeout(() => {
    connectWebRTC();
  }, 1000);
};

// Lifecycle hooks
onMounted(async () => {
  addDebugLog('Component mounted');
  await fetchConsultationData();
  connectWebRTC();

  // Thiết lập sự kiện video cho cả local và remote
  setTimeout(() => {
    const setupVideoEvents = (element, name) => {
      if (!element) return;

      element.onloadedmetadata = () => addDebugLog(`${name} video metadata loaded`);
      element.onplay = () => addDebugLog(`${name} video playing event`);
      element.onpause = () => addDebugLog(`${name} video paused`);
      element.onerror = (e) => addDebugLog(`${name} video error: ${e.target.error?.message || 'unknown error'}`);
    };

    if (remoteVideoRef.value) {
      setupVideoEvents(remoteVideoRef.value, 'Remote');
    }

    if (localVideoRef.value) {
      setupVideoEvents(localVideoRef.value, 'Local');
    }
  }, 500);
});

onBeforeUnmount(() => {
  addDebugLog('Component unmounting, disconnecting');
  webrtcClient.disconnect();
});
</script>

<template>
  <div class="video-call-container">
    <!-- Error alert -->
    <div v-if="error" class="error-alert">
      <p>{{ error }}</p>
      <button @click="tryReconnect">Kết nối lại</button>
    </div>

    <!-- Main content -->
    <div v-else class="main-content">
      <!-- Video area -->
      <div class="video-area">
        <!-- Remote video -->
        <div class="remote-video-container">
          <video 
            ref="remoteVideoRef" 
            autoplay 
            playsinline 
            :style="remoteVideoStyle" 
            class="remote-video">
          </video>

          <!-- Menu điều chỉnh video đơn giản -->
          <div class="video-controls-panel">
            <div class="control-button-small" @click="toggleVideoFitMode">
              <span>{{ videoFitMode === 'contain' ? 'Vừa' : videoFitMode === 'cover' ? 'Lấp' : 'Thu' }}</span>
            </div>
            
            <div class="control-button-small" @click="rotateVideo(90)">
              <span>Xoay</span>
            </div>
            
            <div class="control-button-small" @click="toggleMirror">
              <span>{{ isMirrored ? 'Bỏ lật' : 'Lật' }}</span>
            </div>
            
            <div class="control-group">
              <div class="control-button-icon" @click="adjustVideoScale(-0.1)">-</div>
              <div class="scale-display">{{ videoScale.toFixed(1) }}x</div>
              <div class="control-button-icon" @click="adjustVideoScale(0.1)">+</div>
            </div>
            
            <div class="control-button-small" @click="resetVideoSettings">
              <span>Đặt lại</span>
            </div>
          </div>

          <!-- Hiển thị trạng thái kết nối -->
          <div class="connection-status-indicator">
            <span>{{ connectionStatus }}</span>
          </div>

          <!-- Overlay when remote video is off -->
          <div v-if="!remoteMediaStatus.video" class="video-off-overlay">
            <div class="video-off-message">
              <span>Video đã tắt</span>
            </div>
          </div>

          <!-- Indicators -->
          <div class="remote-indicators">
            <div v-if="remoteMediaStatus.screenShare" class="indicator screen-share-indicator">
              <span>Đang chia sẻ màn hình</span>
            </div>
            <div v-if="!remoteMediaStatus.audio" class="indicator audio-off-indicator">
              <span>Âm thanh đã tắt</span>
            </div>
          </div>
        </div>

        <!-- Local video (small) -->
        <div class="local-video-container">
          <video ref="localVideoRef" autoplay playsinline muted class="local-video">
          </video>
        </div>

        <!-- Controls -->
        <div class="video-controls">
          <button @click="toggleAudio" :class="['control-button', { 'active': mediaStatus.audio }]">
            {{ mediaStatus.audio ? 'Tắt mic' : 'Bật mic' }}
          </button>

          <button @click="toggleVideo" :class="['control-button', { 'active': mediaStatus.video }]">
            {{ mediaStatus.video ? 'Tắt camera' : 'Bật camera' }}
          </button>

          <button @click="toggleScreenShare" :class="['control-button', { 'active': mediaStatus.screenShare }]">
            {{ mediaStatus.screenShare ? 'Dừng chia sẻ' : 'Chia sẻ màn hình' }}
          </button>

          <button @click="endCall" class="control-button end-call">
            Kết thúc cuộc gọi
          </button>
        </div>
      </div>

      <!-- Chat area -->
      <div class="chat-area">
        <h3>Tin nhắn</h3>

        <!-- Messages -->
        <div class="chat-container">
          <div v-if="messages.length === 0" class="no-messages">
            <p>Chưa có tin nhắn</p>
          </div>

          <div v-else class="message-list">
            <div v-for="(msg, index) in messages" :key="index"
              :class="['message', msg.senderId === userId ? 'outgoing' : 'incoming']">
              <div class="message-content">{{ msg.content }}</div>
              <div class="message-time">{{ formatTime(msg.timestamp) }}</div>
            </div>
          </div>
        </div>

        <!-- Typing indicator -->
        <div v-if="Object.values(isTyping).some(Boolean)" class="typing-indicator">
          Đang nhập tin nhắn...
        </div>

        <!-- Message input -->
        <div class="message-input">
          <input v-model="newMessage" placeholder="Nhập tin nhắn..." @input="handleInput" @keyup.enter="sendMessage" />
          <button @click="sendMessage" :disabled="!newMessage.trim()">Gửi</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.video-call-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

.error-alert {
  padding: 1rem;
  background-color: #f8d7da;
  color: #721c24;
  margin: 1rem;
  border-radius: 4px;
  text-align: center;
}

.main-content {
  display: flex;
  flex-direction: row;
  height: 100%;
}

@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
  }
}

.video-area {
  flex: 3;
  display: flex;
  flex-direction: column;
  position: relative;
  background-color: #000;
  min-height: 400px;
}

.remote-video-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.remote-video {
  width: 100%;
  height: 100%;
  background-color: #000;
  transition: transform 0.3s ease; /* Thêm transition cho transform */
}

.connection-status-indicator {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 10;
}

.video-off-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-off-message {
  color: white;
  font-size: 1.5rem;
}

.remote-indicators {
  position: absolute;
  top: 1rem;
  left: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.indicator {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  color: white;
}

.screen-share-indicator {
  background-color: #dc3545;
}

.audio-off-indicator {
  background-color: #dc3545;
}

.local-video-container {
  position: absolute;
  width: 25%;
  max-width: 200px;
  min-width: 120px;
  bottom: 1rem;
  right: 1rem;
  border-radius: 4px;
  overflow: hidden;
  border: 2px solid white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.local-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background-color: #000;
}

.video-controls {
  display: flex;
  justify-content: center;
  gap: 1rem;
  padding: 1rem;
  background-color: #fff;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.control-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background-color: #f8f9fa;
  cursor: pointer;
  font-weight: bold;
}

.control-button:hover {
  background-color: #e9ecef;
}

.control-button.active {
  background-color: #007bff;
  color: white;
}

.control-button.end-call {
  background-color: #dc3545;
  color: white;
}

.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: white;
  border-left: 1px solid #dee2e6;
  padding: 1rem;
  min-width: 300px;
}

.chat-container {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  margin-bottom: 1rem;
  min-height: 300px;
}

.no-messages {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6c757d;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.message {
  max-width: 75%;
  padding: 0.5rem;
  border-radius: 4px;
}

.message.outgoing {
  align-self: flex-end;
  background-color: #007bff;
  color: white;
}

.message.incoming {
  align-self: flex-start;
  background-color: #e9ecef;
  color: #212529;
}

.message-content {
  word-break: break-word;
}

.message-time {
  font-size: 0.75rem;
  opacity: 0.8;
  text-align: right;
  margin-top: 0.25rem;
}

.typing-indicator {
  font-size: 0.8rem;
  color: #6c757d;
  margin-bottom: 0.5rem;
  font-style: italic;
}

.message-input {
  display: flex;
  gap: 0.5rem;
}

.message-input input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
}

.message-input button {
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.message-input button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

/* Styles mới cho các điều khiển video */
.video-controls-panel {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  z-index: 10;
  max-width: 320px;
}

.control-button-small {
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  backdrop-filter: blur(2px);
  text-align: center;
}

.control-button-small:hover {
  background-color: rgba(0, 0, 0, 0.8);
}

.control-button-icon {
  width: 24px;
  height: 24px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s;
  backdrop-filter: blur(2px);
}

.control-button-icon:hover {
  background-color: rgba(0, 0, 0, 0.8);
}

.control-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.scale-display {
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 5px 8px;
  border-radius: 4px;
  font-size: 12px;
  min-width: 36px;
  text-align: center;
  backdrop-filter: blur(2px);
}
</style>