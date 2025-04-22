<script setup>
    import { ref, computed, defineProps, defineEmits, onMounted, watch } from 'vue';
    import { useToast } from 'primevue/usetoast';
    import FormDialog from '@admin/components/FormDialog.vue';
    import InputText from 'primevue/inputtext';
    import FileUpload from 'primevue/fileupload';
    import { Brands } from '@admin/stores/admin/Brands';
    
    const props = defineProps({
        modelValue: Boolean,
        data: {
            type: Object,
            default: () => ({
                name: '',
                image: ''
            })
        }
    });
    
    const emit = defineEmits(['update:modelValue', 'refreshList']);
    
    const formVisible = computed({
        get: () => props.modelValue,
        set: (value) => emit('update:modelValue', value)
    });
    
    const isSubmitting = ref(false);
    const toast = useToast();
    const selectedFile = ref(null);
    const previewImage = ref('');
    const fileUpload = ref(null);
    const isEditMode = computed(() => !!props.data.id);
    
    // Khi form mở, hiển thị ảnh hiện tại nếu có
    watch(formVisible, (newVal) => {
        if (newVal) {
            if (isEditMode.value && props.data.image) {
                previewImage.value = props.data.image;
            } else {
                previewImage.value = '';
            }
        }
    });
    
    const closeForm = () => {
        formVisible.value = false;
        selectedFile.value = null;
        previewImage.value = '';
        
        // Xóa file khỏi component upload nếu có
        if (fileUpload.value) {
            fileUpload.value.clear();
        }
    };
    
    // Khi chọn file
    const onSelect = (event) => {
        const file = event.files[0];
        if (file) {
            selectedFile.value = file;
            previewImage.value = URL.createObjectURL(file);
        }
    };
    
    // Khi xóa file
    const onClear = () => {
        selectedFile.value = null;
        previewImage.value = isEditMode.value ? props.data.image : '';
    };
    
    // Lưu thương hiệu
    const saveBrand = async () => {
        try {
            // Kiểm tra dữ liệu nhập
            if (!props.data.name || props.data.name.trim() === '') {
                toast.add({ 
                    severity: 'warn', 
                    summary: 'Cảnh báo', 
                    detail: 'Vui lòng nhập tên thương hiệu', 
                    life: 3000 
                });
                return;
            }
    
            isSubmitting.value = true;
    
            // Tạo FormData để gửi lên server
            const formData = new FormData();
            
            // Chuẩn bị dữ liệu brand
            const brandData = {
                name: props.data.name
            };
            
            // Thêm ID nếu là chế độ cập nhật
            if (isEditMode.value) {
                brandData.id = props.data.id;
            }
            
            // Thêm dữ liệu brand vào formData
            formData.append('brand', JSON.stringify(brandData));
            
            // Thêm file ảnh nếu có
            if (selectedFile.value) {
                formData.append('file', selectedFile.value);
            }
            
            // Gọi API để lưu
            const response = await Brands.saveBrand(formData);
    
            // Hiển thị thông báo thành công
            toast.add({
                severity: 'success',
                summary: 'Thành công',
                detail: isEditMode.value 
                    ? 'Đã cập nhật thương hiệu thành công' 
                    : 'Đã thêm thương hiệu mới thành công',
                life: 3000
            });
    
            // Làm mới danh sách và đóng form
            emit('refreshList');
            closeForm();
        } catch (error) {
            console.error('Lỗi khi lưu thương hiệu:', error);
            
            toast.add({ 
                severity: 'error', 
                summary: 'Lỗi', 
                detail: 'Không thể lưu thương hiệu: ' + (error.response?.data?.message || error.message), 
                life: 3000 
            });
        } finally {
            isSubmitting.value = false;
        }
    };
    </script>
    
    <template>
        <FormDialog 
            :visible="formVisible" 
            :title="isEditMode ? 'Cập nhật thương hiệu' : 'Thêm thương hiệu mới'" 
            :loading="isSubmitting" 
            @save="saveBrand" 
            @cancel="closeForm" 
            @hide="closeForm"
        >
            <div class="flex flex-col gap-4">
                <!-- Tên thương hiệu -->
                <div class="flex flex-col gap-1 w-full">
                    <label for="brandName" class="font-semibold">Tên thương hiệu:</label>
                    <InputText 
                        id="brandName" 
                        v-model="props.data.name" 
                        placeholder="Nhập tên thương hiệu" 
                        class="w-full" 
                    />
                </div>
    
                <!-- Ảnh thương hiệu -->
                <div class="flex flex-col gap-1 w-full">
                    <label for="image" class="font-semibold">Ảnh thương hiệu:</label>
                    <FileUpload 
                        ref="fileUpload"
                        mode="basic" 
                        name="file" 
                        accept="image/*" 
                        :maxFileSize="1000000" 
                        @select="onSelect" 
                        @clear="onClear" 
                        :auto="true" 
                        chooseLabel="Chọn ảnh" 
                    />
    
                    <!-- Hiển thị ảnh xem trước -->
                    <div v-if="previewImage" class="mt-2">
                        <img 
                            :src="previewImage" 
                            alt="Ảnh xem trước" 
                            class="max-w-full h-auto max-h-40 rounded border"
                            @error="$event.target.src = 'https://placehold.co/100x100/EEE/999?text=Lỗi+Ảnh'" 
                        />
                    </div>
                </div>
            </div>
        </FormDialog>
    </template>