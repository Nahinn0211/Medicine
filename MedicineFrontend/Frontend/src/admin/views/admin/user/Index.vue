<!-- src/views/admin/users/UserList.vue -->
<script setup>
import { ref, onMounted } from "vue";
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Button from "primevue/button";
import Toast from "primevue/toast";
import ConfirmDialog from "primevue/confirmdialog";
import InputText from "primevue/inputtext";
import Dropdown from "primevue/dropdown";
import Tag from "primevue/tag";
import CreateUser from "./Create.vue";
import { UserService } from "@admin/stores/admin/User";
import { UserRoleService } from "@admin/stores/admin/UserRole";
import { RoleService } from "@admin/stores/admin/Role";

const confirm = useConfirm();
const toast = useToast();
const users = ref([]);
const selectedUsers = ref([]);
const isLoading = ref(false);
const userRoles = ref({});
const roles = ref([]);

// Trạng thái tìm kiếm
const searchQuery = ref("");
const searchType = ref("fullName");
const searchTypes = [
  { label: "Tên", value: "fullName" },
  { label: "Email", value: "email" },
  { label: "SĐT", value: "phone" },
  { label: "Địa chỉ", value: "address" },
];

// Trạng thái form
const form = ref({
  visible: false,
  data: {
    id: 0,
    fullName: "",
    phone: "",
    address: "",
    email: "",
    password: "",
    enabled: true,
    locked: false,
    countLock: 0,
    avatar: null,
    createdAt: null,
    updatedAt: null,
  },
});

// Format ngày tháng
const formatDate = (dateString) => {
  if (!dateString) return "---";
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Xử lý URL avatar
const getAvatarUrl = (avatar) => {
  if (!avatar) return null;

  if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
    return avatar;
  }

  return `http://localhost:8080/uploads/users/${avatar}`;
};

// Hàm lấy danh sách vai trò
const fetchRoles = async () => {
  try {
    const response = await RoleService.getRoles();
    roles.value = response.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách vai trò:", error);
  }
};

// Hàm lấy vai trò của người dùng
const fetchUserRoles = async () => {
  for (const user of users.value) {
    try {
      const response = await UserRoleService.getUserRolesByUserId(user.id);
      userRoles.value[user.id] = response.data.map((userRole) => {
        const role = roles.value.find((r) => r.id === userRole.roleId);
        return role ? role.name : `Vai trò #${userRole.roleId}`;
      });
    } catch (error) {
      console.error(`Lỗi khi lấy vai trò cho người dùng ${user.id}:`, error);
      userRoles.value[user.id] = [];
    }
  }
};

// Hàm lấy danh sách người dùng
const fetchUsers = async () => {
  try {
    isLoading.value = true;
    const response = await UserService.getUsers();

    if (Array.isArray(response.data)) {
      users.value = response.data;
      await fetchUserRoles();
    } else {
      console.error("Dữ liệu người dùng không phải là mảng:", response.data);
      users.value = [];
      toast.add({
        severity: "warn",
        summary: "Cảnh báo",
        detail: "Dữ liệu người dùng không đúng định dạng",
        life: 3000,
      });
    }
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu người dùng:", error);
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: "Không thể tải danh sách người dùng",
      life: 3000,
    });
  } finally {
    isLoading.value = false;
  }
};

// Hàm tìm kiếm người dùng
const searchUsers = async () => {
  if (!searchQuery.value) {
    fetchUsers();
    return;
  }

  try {
    isLoading.value = true;
    const params = {};
    params[searchType.value] = searchQuery.value;

    const response = await UserService.searchUsers(params);

    if (Array.isArray(response.data)) {
      users.value = response.data;
      await fetchUserRoles();
    } else {
      users.value = [];
    }
  } catch (error) {
    console.error("Lỗi khi tìm kiếm người dùng:", error);
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: "Không thể tìm kiếm người dùng",
      life: 3000,
    });
  } finally {
    isLoading.value = false;
  }
};

// Gọi API khi component được tạo
onMounted(() => {
  fetchRoles();
  fetchUsers();
});

// Mở form thêm hoặc sửa người dùng
const openForm = async (data = null) => {
  if (data && data.id) {
    try {
      // Nếu có id, gọi API lấy chi tiết người dùng để edit
      const response = await UserService.getUserById(data.id);
      form.value = {
        visible: true,
        data: { ...response.data, password: "" }, // Đặt password thành rỗng khi edit
      };
    } catch (error) {
      console.error("Lỗi khi lấy thông tin người dùng:", error);
      toast.add({
        severity: "error",
        summary: "Lỗi",
        detail: "Không thể tải thông tin người dùng",
        life: 3000,
      });
    }
  } else {
    form.value = {
      visible: true,
      data: {
        id: 0,
        fullName: "",
        phone: "",
        address: "",
        email: "",
        password: "",
        enabled: true,
        locked: false,
        countLock: 0,
        avatar: null,
        createdAt: null,
        updatedAt: null,
      },
    };
  }
};
// Hàm xóa người dùng - xử lý cả trường hợp xóa một hoặc nhiều người dùng
const deleteUsers = (userInput) => {
  // Kiểm tra xem đầu vào là một người dùng hay một mảng người dùng được chọn
  const isMultipleUsers = Array.isArray(userInput);

  // Nếu là nhiều người dùng và không có người dùng nào được chọn, hiển thị cảnh báo
  if (isMultipleUsers && userInput.length === 0) {
    toast.add({
      severity: "warn",
      summary: "Cảnh báo",
      detail: "Chưa chọn người dùng để xóa",
      life: 3000,
    });
    return;
  }

  // Xác định thông báo xác nhận và dữ liệu dựa trên loại đầu vào
  const message = isMultipleUsers
    ? "Bạn có chắc chắn muốn xóa các người dùng đã chọn không?"
    : "Bạn có chắc chắn muốn xóa người dùng này không?";

  // Lấy ID hoặc danh sách ID cần xóa
  const ids = isMultipleUsers ? userInput.map((user) => user.id) : userInput;

  confirm.require({
    message,
    header: "Xác nhận",
    icon: "pi pi-info-circle",
    acceptLabel: "Đồng ý",
    rejectLabel: "Hủy",
    acceptClass: "p-button-danger",
    accept: async () => {
      try {
        // Gọi API xóa người dùng
        await UserService.deleteUsers(ids);

        // Hiển thị thông báo thành công
        toast.add({
          severity: "success",
          summary: "Thành công",
          detail: isMultipleUsers
            ? `Đã xóa ${userInput.length} người dùng`
            : "Đã xóa người dùng",
          life: 3000,
        });

        // Cập nhật danh sách người dùng
        fetchUsers();

        // Nếu là xóa nhiều người dùng, reset danh sách đã chọn
        if (isMultipleUsers) {
          selectedUsers.value = [];
        }
      } catch (error) {
        console.error("Lỗi khi xóa người dùng:", error);
        toast.add({
          severity: "error",
          summary: "Lỗi",
          detail:
            "Không thể xóa người dùng: " +
            (error.response?.data || error.message),
          life: 3000,
        });
      }
    },
  });
};
// Chuyển đổi trạng thái kích hoạt của người dùng
const toggleUserStatus = async (user) => {
  try {
    const updatedUser = { ...user, enabled: !user.enabled };
    await UserService.saveUser(updatedUser);

    toast.add({
      severity: "success",
      summary: "Thành công",
      detail: updatedUser.enabled
        ? "Đã kích hoạt người dùng"
        : "Đã vô hiệu hóa người dùng",
      life: 3000,
    });

    fetchUsers();
  } catch (error) {
    console.error("Lỗi khi thay đổi trạng thái người dùng:", error);
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: "Không thể thay đổi trạng thái người dùng",
      life: 3000,
    });
  }
};

// Chuyển đổi trạng thái khóa của người dùng
const toggleUserLock = async (user) => {
  try {
    const updatedUser = { ...user, locked: !user.locked };
    await UserService.saveUser(updatedUser);

    toast.add({
      severity: "success",
      summary: "Thành công",
      detail: updatedUser.locked
        ? "Đã khóa người dùng"
        : "Đã mở khóa người dùng",
      life: 3000,
    });

    fetchUsers();
  } catch (error) {
    console.error("Lỗi khi thay đổi trạng thái khóa của người dùng:", error);
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: "Không thể thay đổi trạng thái khóa của người dùng",
      life: 3000,
    });
  }
};
</script>

<template>
  <div class="card">
    <Toast />
    <ConfirmDialog />
    <

    <DataTable
      v-model:selection="selectedUsers"
      :value="users"
      dataKey="id"
      :paginator="true"
      :rows="10"
      :loading="isLoading"
      showCurrentPageReport
      currentPageReportTemplate="Hiển thị {first} đến {last} của {totalRecords} bản ghi"
      :rowsPerPageOptions="[5, 10, 20, 50]"
      responsiveLayout="scroll"
    >
      <template #header>
        <div class="flex justify-between items-center">
          <span class="font-semibold text-xl">Danh sách dịch vụ</span>
          <div class="flex gap-2">
            
            <Button
              label="Thêm dịch vụ"
              icon="pi pi-plus"
              @click="openForm()"
            />
          </div>
        </div>
      </template>
       
      <!-- Cột ID -->
      <Column field="id" header="ID" sortable style="min-width: 5rem"></Column>

      <!-- Cột họ tên và avatar -->
      <Column
        field="fullName"
        header="Họ tên"
        sortable
        style="min-width: 14rem"
      >
        <template #body="{ data }">
          <div class="flex items-center">
            <img
              :src="
                getAvatarUrl(data.avatar) ||
                'https://placehold.co/100x100/EEE/999?text=No+Avatar'
              "
              :alt="data.fullName"
              class="w-10 h-10 mr-2 object-cover rounded-full"
              @error="
                $event.target.src =
                  'https://placehold.co/100x100/EEE/999?text=Lỗi+Ảnh'
              "
            />
            <span class="font-semibold">{{ data.fullName }}</span>
          </div>
        </template>
      </Column>

      <!-- Cột thông tin liên hệ -->
      <Column header="Thông tin liên hệ" style="min-width: 14rem">
        <template #body="{ data }">
          <div class="flex flex-col">
            <div><i class="pi pi-envelope mr-2"></i>{{ data.email }}</div>
            <div><i class="pi pi-phone mr-2"></i>{{ data.phone }}</div>
            <div v-if="data.address">
              <i class="pi pi-map-marker mr-2"></i>{{ data.address }}
            </div>
          </div>
        </template>
      </Column>

      <!-- Cột vai trò -->
      <Column header="Vai trò" style="min-width: 12rem">
        <template #body="{ data }">
          <div class="flex flex-wrap gap-1">
            <span
              v-for="(role, index) in userRoles[data.id] || []"
              :key="index"
              class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
            >
              {{ role }}
            </span>
            <span
              v-if="!userRoles[data.id] || userRoles[data.id].length === 0"
              class="text-gray-500"
            >
              Không có vai trò
            </span>
          </div>
        </template>
      </Column>

      <!-- Cột trạng thái -->
      <Column header="Trạng thái" style="min-width: 10rem">
        <template #body="{ data }">
          <div class="flex flex-col gap-1">
            <div>
              <Tag
                :severity="data.enabled ? 'success' : 'danger'"
                :value="data.enabled ? 'Đã kích hoạt' : 'Vô hiệu hóa'"
              />
            </div>
            <div>
              <Tag
                :severity="data.locked ? 'danger' : 'success'"
                :value="data.locked ? 'Đã khóa' : 'Hoạt động'"
              />
            </div>
          </div>
        </template>
      </Column>

      <!-- Cột thời gian -->
      <Column header="Thời gian" style="min-width: 14rem">
        <template #body="{ data }">
          <div class="flex flex-col">
            <div>
              <span class="font-semibold">Tạo:</span>
              {{ formatDate(data.createdAt) }}
            </div>
            <div>
              <span class="font-semibold">Cập nhật:</span>
              {{ formatDate(data.updatedAt) }}
            </div>
          </div>
        </template>
      </Column>

      <!-- Cột tác vụ -->
      <Column header="Tác vụ" :exportable="false" style="min-width: 12rem">
        <template #body="{ data }">
          <div class="flex gap-2">
            <Button
              icon="pi pi-pencil"
              rounded
              outlined
              @click="openForm(data)"
            />
            <Button
              :icon="data.enabled ? 'pi pi-times' : 'pi pi-check'"
              :severity="data.enabled ? 'warning' : 'success'"
              rounded
              outlined
              @click="toggleUserStatus(data)"
              :title="data.enabled ? 'Vô hiệu hóa' : 'Kích hoạt'"
            />
            <Button
              :icon="data.locked ? 'pi pi-unlock' : 'pi pi-lock'"
              :severity="data.locked ? 'success' : 'warning'"
              rounded
              outlined
              @click="toggleUserLock(data)"
              :title="data.locked ? 'Mở khóa' : 'Khóa'"
            />
            <Button
              icon="pi pi-trash"
              rounded
              outlined
              severity="danger"
              @click="deleteUsers(data.id)"
            />
          </div>
        </template>
      </Column>

      <!-- Template khi không có dữ liệu -->
      <template #empty>
        <div class="text-center py-4">
          <i class="pi pi-search text-gray-400 text-3xl mb-2"></i>
          <p>Không tìm thấy người dùng nào.</p>
        </div>
      </template>

      <!-- Template loading -->
      <template #loading>
        <div class="text-center py-4">
          <i class="pi pi-spin pi-spinner text-primary text-3xl mb-2"></i>
          <p>Đang tải dữ liệu...</p>
        </div>
      </template>
    </DataTable>
    <CreateUser
      v-model:modelValue="form.visible"
      :data="form.data"
      @refreshList="fetchUsers"
    />
  </div>
</template>

<style scoped>
.card {
  padding: 1.5rem;
  border-radius: 0.5rem;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.search-container {
  margin-bottom: 1rem;
}

:deep(.p-inputgroup .p-dropdown) {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

:deep(.p-inputgroup .p-dropdown .p-dropdown-label) {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

:deep(.p-datatable-wrapper) {
  overflow-x: auto;
}

:deep(.p-datatable .p-datatable-header) {
  background: transparent;
  border: none;
  padding: 0 0 1rem 0;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
  background: #f8f9fa;
  color: #343a40;
  font-weight: 600;
}

:deep(.p-datatable .p-datatable-tbody > tr) {
  transition: background-color 0.2s;
}

:deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background: #f1f5f9;
}
</style>
