<template>
  <div class="doctor-profile-edit-container max-w-6xl mx-auto px-4 py-8">
    <form @submit.prevent="saveProfile" class="space-y-6">
      <!-- Thông Tin Cá Nhân -->
      <div class="bg-white shadow-xl rounded-2xl p-6">
        <h2 class="text-xl font-semibold mb-4 text-gray-800">Thông Tin Cá Nhân</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Ảnh Đại Diện -->
          <div class="col-span-full flex justify-center mb-4">
            <div class="relative">
              <img 
                :src="formData.user?.avatar || defaultAvatar" 
                alt="Profile Avatar" 
                class="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
              />
              <label 
                class="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-2 cursor-pointer hover:bg-blue-600"
              >
                <i class="pi pi-pencil"></i>
                <input 
                  type="file" 
                  class="hidden" 
                  @change="handleAvatarUpload"
                  accept="image/*"
                />
              </label>
            </div>
          </div>

          <!-- Tên Đầy Đủ -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">Tên Đầy Đủ</label>
            <input 
              v-model="formData.user.fullName" 
              type="text" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập tên đầy đủ"
              required
            />
          </div>

          <!-- Email -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">Email</label>
            <input 
              v-model="formData.user.email" 
              type="email" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
              placeholder="Nhập email"
              required
              disabled
              readonly
            />
          </div>

          <!-- Số Điện Thoại -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">Số Điện Thoại</label>
            <input 
              v-model="formData.user.phone" 
              type="tel" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập số điện thoại"
              required
            />
          </div>
        </div>
      </div>

      <!-- Thông Tin Chuyên Môn -->
      <div class="bg-white shadow-xl rounded-2xl p-6">
        <h2 class="text-xl font-semibold mb-4 text-gray-800">Thông Tin Chuyên Môn</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Chuyên Khoa -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">Chuyên Khoa</label>
            <select 
              v-model="formData.specialization" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Chọn chuyên khoa</option>
              <option value="Nội Khoa">Nội Khoa</option>
              <option value="Ngoại Khoa">Ngoại Khoa</option>
              <option value="Nhi Khoa">Nhi Khoa</option>
              <option value="Sản Phụ Khoa">Sản Phụ Khoa</option>
              <option value="Tim Mạch">Tim Mạch</option>
              <option value="Thần Kinh">Thần Kinh</option>
            </select>
          </div>

          <!-- Nơi Làm Việc -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">Nơi Làm Việc</label>
            <input 
              v-model="formData.workplace" 
              type="text" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập nơi làm việc"
            />
          </div>

          <!-- Kinh Nghiệm -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">Kinh Nghiệm</label>
            <input 
              v-model="formData.experience" 
              type="text" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Số năm kinh nghiệm"
            />
          </div>

          <!-- Chứng Chỉ -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">Chứng Chỉ</label>
            <input 
              v-model="formData.certifications" 
              type="text" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập các chứng chỉ"
            />
          </div>
        </div>

        <!-- Tiểu Sử -->
        <div class="mt-6 space-y-2">
          <label class="block text-sm font-medium text-gray-700">Tiểu Sử</label>
          <textarea 
            v-model="formData.biography" 
            rows="4" 
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="Giới thiệu về bản thân"
          ></textarea>
        </div>
      </div>

      <!-- Nút Lưu -->
      <div class="flex justify-end space-x-4 mt-6">
        <button 
          v-if="hasChanges"
          type="submit" 
          :disabled="isSubmitting"
          class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition 
                 flex items-center justify-center 
                 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="!isSubmitting">Lưu Thay Đổi</span>
          <div v-else class="flex items-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Đang lưu...
          </div>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';
import { DoctorProfileService } from '@admin/stores/admin/DoctorProfile';
import { UserService } from '@admin/stores/admin/User';

import { authService } from '@user/services/AuthService';
import { useAuthStore } from '@user/stores/auth/useAuthStore';

const defaultAvatar = '/default-avatar.png';
const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

// Biến lưu trữ dữ liệu ban đầu để so sánh
const initialFormData = ref(null);

// File upload state
const uploadedFile = ref(null);

// Dữ liệu form
const formData = ref({
  user: {
    id: 0,
    fullName: '',
    email: '',
    phone: '',
    avatar: ''
  },
  specialization: '',
  workplace: '',
  experience: '',
  certifications: '',
  biography: '',
  availableFrom: '',
  availableTo: '',
});

// Kiểm tra sự thay đổi của form
const hasChanges = computed(() => {
  if (!initialFormData.value) return false;

  // So sánh từng trường của form
  const userFields = ['fullName', 'email', 'phone', 'avatar'];
  const profileFields = ['specialization', 'workplace', 'experience', 'certifications', 'biography'];

  // Kiểm tra thay đổi ở thông tin người dùng
  const userChanged = userFields.some(field => 
    initialFormData.value.user[field] !== formData.value.user[field]
  );

  // Kiểm tra thay đổi ở thông tin hồ sơ
  const profileChanged = profileFields.some(field => 
    initialFormData.value[field] !== formData.value[field]
  );

  // Kiểm tra file upload
  const fileChanged = !!uploadedFile.value;

  return userChanged || profileChanged || fileChanged;
});

// Tải dữ liệu hồ sơ hiện tại
const loadCurrentProfile = async () => {
  try {
    if (!authStore.user?.id) {
      throw new Error('Không tìm thấy thông tin người dùng');
    }

    const doctorData = await DoctorProfileService.getDoctorProfileByUserId(authStore.user.id);
    
    if (doctorData) {
      formData.value = { ...doctorData };
      // Lưu trữ dữ liệu ban đầu để so sánh
      initialFormData.value = JSON.parse(JSON.stringify(doctorData));
    } else {
      throw new Error('Không tìm thấy thông tin bác sĩ');
    }
  } catch (error) {
    console.error("Lỗi khi tải hồ sơ:", error);
  }
};

const handleAvatarUpload = async (event) => {
  const file = event.target.files[0];
  if (file) {
    uploadedFile.value = file;
    
    // Tạo URL preview
    const reader = new FileReader();
    reader.onload = (e) => {
      formData.value.user.avatar = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

// Lưu hồ sơ
const saveProfile = async () => {
  try {
    // Chuẩn bị dữ liệu người dùng
    const userData = {
      id: formData.value.user.id,
      fullName: formData.value.user.fullName,
      email: formData.value.user.email,
      phone: formData.value.user.phone,
      avatar: formData.value.user.avatar,
      enabled: true
    };

    let response;
    // Nếu có file upload, sử dụng FormData
    if (uploadedFile.value) {
      const formDataUpload = new FormData();
      formDataUpload.append('user', JSON.stringify(userData));
      formDataUpload.append('file', uploadedFile.value);

      response = await UserService.saveUserWithAvatar(formDataUpload);
    } else {
       response = await UserService.saveUser({
        user: userData,
        roleIds: []  
      });
    }

    // Cập nhật doctor profile
    const updatedProfile = await DoctorProfileService.saveDoctorProfile({
      ...formData.value,
      userId: response.data.id // Đảm bảo userId được cập nhật
    });
    
    toast.add({
      severity: "success",
      summary: "Thành Công",
      detail: "Cập nhật hồ sơ thành công",
      life: 3000,
    });

    // Cập nhật lại initial data sau khi lưu thành công
    initialFormData.value = JSON.parse(JSON.stringify(formData.value));
    uploadedFile.value = null;
  
  } catch (error) {
    console.error("Lỗi khi lưu hồ sơ:", error);
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: error.message || "Không thể lưu hồ sơ",
      life: 3000,
    });
  }
};

onMounted(loadCurrentProfile);
</script>