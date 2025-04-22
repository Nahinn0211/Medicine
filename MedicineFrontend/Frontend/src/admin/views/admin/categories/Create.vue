<script setup>
    import { ref, computed, defineProps, defineEmits, onMounted, watch } from 'vue';
    import { useToast } from 'primevue/usetoast';
    import FormDialog from '@admin/components/FormDialog.vue';
    import Dropdown from 'primevue/dropdown';
    import InputText from 'primevue/inputtext';
    import FileUpload from 'primevue/fileupload';
    import { Categories } from '@admin/stores/admin/Categories';
    import { API_BASE_URL } from '@/config/apiConfig';
    
    const props = defineProps({
        modelValue: Boolean,
        data: {
            type: Object,
            default: () => ({
                name: '',
                parentId: null,
                image: null
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
    const parentCategories = ref([]);
    const isEditMode = computed(() => !!props.data.id);
    const selectedFile = ref(null);
    const previewImage = ref('');
    const fileUpload = ref(null);
    const uploadsBaseUrl = computed(() => `${API_BASE_URL.replace('/api', '')}/uploads/categories/`);
    
    // Watch for changes in form visibility
    watch(formVisible, (newVal) => {
        if (newVal) {
            fetchParentCategories();
            // Set preview image if editing and image exists
            if (isEditMode.value && props.data.image) {
                if (props.data.image.startsWith('http')) {
                    previewImage.value = props.data.image;
                } else {
                    previewImage.value = `${uploadsBaseUrl.value}${props.data.image}`;
                }
            } else {
                previewImage.value = '';
            }
        }
    });
    
    // Fetch parent categories for dropdown
    const fetchParentCategories = async () => {
        try {
            const response = await Categories.getCategories();
            // Filter out current category (can't be its own parent)
            const filteredCategories = isEditMode.value 
                ? response.data.filter(category => category.id !== props.data.id)
                : response.data;
                
            // Add 'No parent' option
            parentCategories.value = [
                { id: null, name: 'Không có danh mục cha' },
                ...filteredCategories
            ];
        } catch (error) {
            showToast('error', 'Lỗi', 'Không thể tải danh sách danh mục cha');
            console.error('Error fetching parent categories:', error);
        }
    };
    
    // Reset form on close
    const closeForm = () => {
        formVisible.value = false;
        selectedFile.value = null;
        previewImage.value = '';
        
        // Clear file upload component if exists
        if (fileUpload.value) {
            fileUpload.value.clear();
        }
    };
    
    // Handle file selection
    const onSelect = (event) => {
        if (event.files && event.files.length > 0) {
            const file = event.files[0];
            selectedFile.value = file;
            
            // Create preview URL
            previewImage.value = URL.createObjectURL(file);
        }
    };
    
    // Clear selected file
    const onClear = () => {
        selectedFile.value = null;
        previewImage.value = isEditMode.value && props.data.image 
            ? `${uploadsBaseUrl.value}${props.data.image}`
            : '';
    };
    
    // Save category
    const saveCategory = async () => {
        try {
            // Validate name
            if (!props.data.name?.trim()) {
                showToast('warn', 'Cảnh báo', 'Vui lòng nhập tên danh mục');
                return;
            }
    
            isSubmitting.value = true;
    
            // Create category data object
            const categoryData = {
                name: props.data.name
            };
            
            // Add parentId if set
            if (props.data.parentId !== null) {
                categoryData.parentId = props.data.parentId;
            }
    
            // Add ID if editing
            if (isEditMode.value) {
                categoryData.id = props.data.id;
            }
    
            // Create FormData
            const formData = new FormData();
            formData.append('category', JSON.stringify(categoryData));
            
            // Add file if selected
            if (selectedFile.value) {
                formData.append('file', selectedFile.value);
            }
    
            // Save category
            await Categories.saveCategory(formData);
            
            showToast(
                'success', 
                'Thành công', 
                isEditMode.value ? 'Đã cập nhật danh mục' : 'Đã thêm danh mục mới'
            );
            
            emit('refreshList');
            closeForm();
        } catch (error) {
            showToast(
                'error', 
                'Lỗi', 
                'Không thể lưu danh mục: ' + (error.response?.data || error.message)
            );
            console.error('Error saving category:', error);
        } finally {
            isSubmitting.value = false;
        }
    };
    
    // Helper for showing toast messages
    const showToast = (severity, summary, detail) => {
        toast.add({
            severity,
            summary,
            detail,
            life: 3000
        });
    };
    </script>
    
    <template>
        <FormDialog 
            :visible="formVisible" 
            :title="isEditMode ? 'Cập nhật danh mục' : 'Thêm danh mục mới'" 
            :loading="isSubmitting" 
            @save="saveCategory" 
            @cancel="closeForm" 
            @hide="closeForm"
        >
            <div class="flex flex-col gap-4">
                <!-- Tên danh mục -->
                <div class="flex flex-col gap-1 w-full">
                    <label for="categoryName" class="font-semibold">Tên danh mục:</label>
                    <InputText 
                        id="categoryName" 
                        v-model="props.data.name" 
                        placeholder="Nhập tên danh mục" 
                        class="w-full" 
                    />
                </div>
                
                <!-- Danh mục cha -->
                <div class="flex flex-col gap-1 w-full">
                    <label for="parentCategory" class="font-semibold">Danh mục cha:</label>
                    <Dropdown 
                        id="parentCategory"
                        v-model="props.data.parentId" 
                        :options="parentCategories"
                        optionLabel="name"
                        optionValue="id"
                        placeholder="Chọn danh mục cha"
                        class="w-full"
                    />
                </div>
                
                <!-- Ảnh danh mục -->
                <div class="flex flex-col gap-1 w-full">
                    <label for="image" class="font-semibold">Ảnh danh mục:</label>
                    <FileUpload 
                        ref="fileUpload" 
                        mode="basic" 
                        name="file" 
                        accept="image/*" 
                        :maxFileSize="1000000" 
                        @select="onSelect" 
                        @clear="onClear" 
                        :auto="false" 
                        chooseLabel="Chọn ảnh" 
                    />
    
                    <!-- Preview image -->
                    <div v-if="previewImage" class="mt-2">
                        <img 
                            :src="previewImage" 
                            alt="Ảnh xem trước" 
                            class="max-w-full h-auto max-h-40 rounded border" 
                            @error="$event.target.src = 'https://placehold.co/100x100/EEE/999?text=Ảnh+không+tồn+tại'" 
                        />
                    </div>
                </div>
            </div>
        </FormDialog>
    </template>