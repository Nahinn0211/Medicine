<script setup>
  import { computed, defineProps, defineEmits } from 'vue';
  import Dialog from 'primevue/dialog';
  import Button from 'primevue/button';
  import TabView from 'primevue/tabview';
  import TabPanel from 'primevue/tabpanel';
  import Tag from 'primevue/tag';
  import { 
    usePatientProfileDetail,
    formatCurrency, 
    formatDate, 
    getBloodTypeLabel, 
    getUserAvatar 
  } from  '@admin/stores/admin/PatientProfile';
  
  // Define props and emits
  const props = defineProps({
    modelValue: Boolean,
    data: {
      type: Object,
      default: () => ({})
    }
  });
  
  const emit = defineEmits(['update:modelValue', 'refreshList']);
  
  // Reactive state
  const dialogVisible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  });
  
  // Hook để quản lý chi tiết hồ sơ bệnh nhân
  const { 
    isLoading, 
    patientProfile, 
    closeDialog 
  } = usePatientProfileDetail(props, emit);
  </script>
  
  <template>
    <Dialog 
      v-model:visible="dialogVisible" 
      :style="{ width: '90vw', maxWidth: '800px' }" 
      modal 
      header="Chi tiết hồ sơ bệnh nhân"
      :closable="true"
      :closeOnEscape="true"
    >
      <div v-if="isLoading" class="flex flex-col items-center justify-center p-8">
        <i class="pi pi-spin pi-spinner text-primary text-4xl mb-3"></i>
        <p>Đang tải thông tin...</p>
      </div>
      
      <div v-else-if="patientProfile" class="patient-profile-detail">
        <!-- Thông tin trạng thái -->
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold m-0">Mã hồ sơ: #{{ patientProfile.id }}</h2>
          <Tag 
            :severity="patientProfile.isDeleted ? 'danger' : 'success'" 
            :value="patientProfile.isDeleted ? 'Đã khóa' : 'Đang hoạt động'" 
          />
        </div>
        
        <TabView>
          <!-- Thông tin cơ bản -->
          <TabPanel header="Thông tin cơ bản">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Thông tin bệnh nhân -->
              <div class="bg-gray-50 p-4 rounded-lg">
                <div class="flex flex-col items-center mb-4">
                  <img 
                    :src="getUserAvatar(patientProfile.user?.avatar, 200)" 
                    :alt="patientProfile.user?.fullName"
                    class="w-24 h-24 rounded-full object-cover mb-2"
                    @error="$event.target.src='https://placehold.co/200x200/EEE/999?text=Lỗi+Ảnh'"
                  />
                  <h3 class="text-lg font-semibold mb-0">{{ patientProfile.user?.fullName }}</h3>
                  <p class="text-gray-500 mb-0">{{ patientProfile.user?.email }}</p>
                  <p class="text-gray-500">{{ patientProfile.user?.phone }}</p>
                </div>
                
                <div class="mb-3">
                  <div class="text-sm text-gray-500">Địa chỉ</div>
                  <div>{{ patientProfile.user?.address || 'Không có' }}</div>
                </div>
                
                <div class="mb-3">
                  <div class="text-sm text-gray-500">Đăng nhập lần cuối</div>
                  <div>{{ formatDate(patientProfile.user?.lastLogin) }}</div>
                </div>
                
                <div class="flex gap-2 mb-3">
                  <Tag 
                    :severity="patientProfile.user?.enabled ? 'success' : 'danger'" 
                    :value="patientProfile.user?.enabled ? 'Hoạt động' : 'Đã vô hiệu'" 
                  />
                  <Tag 
                    v-if="patientProfile.user?.locked" 
                    severity="warning" 
                    value="Đã khóa" 
                  />
                </div>
              </div>
              
              <!-- Thông tin y tế -->
              <div class="bg-gray-50 p-4 rounded-lg">
                <h3 class="text-lg font-semibold mb-3">Thông tin y tế</h3>
                
                <div class="mb-3">
                  <div class="text-sm text-gray-500">Nhóm máu</div>
                  <div class="font-semibold">{{ getBloodTypeLabel(patientProfile.bloodType) }}</div>
                </div>
                
                <div class="mb-3">
                  <div class="text-sm text-gray-500">Số dư tài khoản</div>
                  <div class="font-semibold text-green-600">{{ formatCurrency(patientProfile.accountBalance) }}</div>
                </div>
                
                <div class="mb-3">
                  <div class="text-sm text-gray-500">Thời gian tạo</div>
                  <div>{{ formatDate(patientProfile.createdAt) }}</div>
                </div>
                
                <div class="mb-3">
                  <div class="text-sm text-gray-500">Cập nhật lần cuối</div>
                  <div>{{ formatDate(patientProfile.updatedAt) }}</div>
                </div>
                
                <div class="grid grid-cols-2 gap-2 mt-4">
                  <div class="bg-blue-50 p-3 rounded">
                    <div class="text-blue-800 font-semibold">{{ patientProfile.completedAppointmentsCount || 0 }}</div>
                    <div class="text-xs text-gray-600">Cuộc hẹn đã hoàn thành</div>
                  </div>
                  <div class="bg-purple-50 p-3 rounded">
                    <div class="text-purple-800 font-semibold">{{ patientProfile.completedConsultationsCount || 0 }}</div>
                    <div class="text-xs text-gray-600">Tư vấn đã hoàn thành</div>
                  </div>
                </div>
              </div>
            </div>
          </TabPanel>
          
          <!-- Tiền sử bệnh -->
          <TabPanel header="Tiền sử bệnh">
            <div class="bg-gray-50 p-4 rounded-lg">
              <div class="flex justify-between items-center mb-2">
                <h3 class="text-lg font-semibold">Tiền sử bệnh</h3>
                <Tag v-if="patientProfile.hasMedicalHistory" severity="info" value="Có tiền sử" />
                <Tag v-else severity="secondary" value="Không có tiền sử" />
              </div>
              
              <div v-if="patientProfile.medicalHistory" class="whitespace-pre-line">
                {{ patientProfile.medicalHistory }}
              </div>
              <div v-else class="text-gray-500 italic">
                Không có thông tin về tiền sử bệnh
              </div>
            </div>
          </TabPanel>
          
          <!-- Dị ứng -->
          <TabPanel header="Dị ứng">
            <div class="bg-gray-50 p-4 rounded-lg">
              <div class="flex justify-between items-center mb-2">
                <h3 class="text-lg font-semibold">Thông tin dị ứng</h3>
                <Tag v-if="patientProfile.hasAllergies" severity="warning" value="Có dị ứng" />
                <Tag v-else severity="secondary" value="Không có dị ứng" />
              </div>
              
              <div v-if="patientProfile.allergies" class="whitespace-pre-line">
                {{ patientProfile.allergies }}
              </div>
              <div v-else class="text-gray-500 italic">
                Không có thông tin về dị ứng
              </div>
            </div>
          </TabPanel>
          
          <!-- Thông tin người dùng -->
          <TabPanel header="Thông tin người dùng">
            <div class="bg-gray-50 p-4 rounded-lg">
              <h3 class="text-lg font-semibold mb-3">Thông tin tài khoản</h3>
              
              <!-- Vai trò người dùng -->
              <div class="mb-4">
                <div class="text-sm text-gray-500 mb-1">Vai trò</div>
                <div class="flex flex-wrap gap-1">
                  <Tag 
                    v-for="role in patientProfile.user?.roles" 
                    :key="role.id" 
                    severity="info" 
                    :value="role.name" 
                  />
                  <span v-if="!patientProfile.user?.roles?.length" class="text-gray-500 italic">Không có vai trò</span>
                </div>
              </div>
              
              <!-- Tài khoản mạng xã hội -->
              <div class="mb-4">
                <div class="text-sm text-gray-500 mb-1">Tài khoản mạng xã hội</div>
                <div v-if="patientProfile.user?.socialAccounts?.length">
                  <div v-for="account in patientProfile.user.socialAccounts" :key="account.id" class="mb-2 bg-white p-2 rounded">
                    <div class="flex items-center">
                      <img 
                        :src="account.avatarUrl || 'https://placehold.co/40x40/EEE/999'" 
                        class="w-8 h-8 rounded-full mr-2"
                        @error="$event.target.src='https://placehold.co/40x40/EEE/999'"
                      />
                      <div>
                        <div class="font-medium">{{ account.provider }}: {{ account.name }}</div>
                        <div class="text-xs text-gray-500">{{ account.providerEmail }}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else class="text-gray-500 italic">
                  Không có tài khoản mạng xã hội liên kết
                </div>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="mb-3">
                  <div class="text-sm text-gray-500">Ngày tạo tài khoản</div>
                  <div>{{ formatDate(patientProfile.user?.createdAt) }}</div>
                </div>
                
                <div class="mb-3">
                  <div class="text-sm text-gray-500">Cập nhật lần cuối</div>
                  <div>{{ formatDate(patientProfile.user?.updatedAt) }}</div>
                </div>
              </div>
            </div>
          </TabPanel>
        </TabView>
        
       
      </div>
      
      <div v-else class="p-4 text-center text-gray-500">
        Không tìm thấy thông tin hồ sơ bệnh nhân
      </div>
    </Dialog>
  </template>
  
  <style scoped>
  .patient-profile-detail {
    max-height: 70vh;
    overflow-y: auto;
  }
  
  :deep(.p-tabview-nav) {
    margin-bottom: 1rem;
  }
  
  :deep(.p-tabview-panels) {
    border-radius: 0.5rem;
  }
  </style> rounded">
                    