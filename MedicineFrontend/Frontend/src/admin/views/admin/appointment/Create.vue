<script>
  import { useOrganizationStore } from '@admin/stores/organization';
  import { required } from '@admin/utils/validators';
  import { useVuelidate } from '@vuelidate/core';
  import { mapState } from 'pinia';
  import FormDialog from '@admin/components/FormDialog.vue';
  
  export default {
    props: {
      visible: { type: Boolean, default: false },
    },
    components: [FormDialog],
    setup() {
      const organizationStore = useOrganizationStore();
      const v$ = useVuelidate({ $externalResults: organizationStore.errors });
  
      return { organizationStore, v$ };
    },
    computed: {
      formVisible() {
        return this.visible;
      },
      title() {
        return this.organization.id ? 'Cập nhật permission' : 'Tạo mới permission';
      },
      ...mapState(useOrganizationStore, ['organization', 'form']),
    },
    methods: {
      async onSave() {
        this.organizationStore.$patch({ form: { submitted: true } });
  
        if (!await this.v$.$validate()) {
          document.querySelector('.p-invalid')?.scrollIntoView({ behavior: 'smooth' });
          return;
        }
  
        const payload = { ...this.organization, permission_type: 1, company_id: 1 };
        this.organization.id ? this.organizationStore.update(1, payload) : this.organizationStore.store(1, payload);
      },
    },
    validations() {
      return { organization: { name: { required, $autoDirty: true } } };
    }
  };
  </script>
  
  <template>
    <FormDialog :visible="formVisible" :title="title" :loading="form.isLoading" @save="onSave"
      @cancel="() => organizationStore.$patch({ form: { visible: false } })"
      @hide="organizationStore.resetForm()">
      <div class="flex flex-col md:flex-col gap-4">
        <div class="flex flex-col gap-1 w-full">
          <label for="name">Permission name:</label>
          <InputText id="name" v-model="organization.name" placeholder="Nhập permission name" class="w-full"
            :invalid="v$.organization.name.$invalid && form.submitted" />
          <Message v-if="v$.organization.name.$error && form.submitted"
            v-for="(error, index) of v$.organization.name.$errors" :key="index" severity="error" size="small"
            variant="simple">
            {{ error.$message }}
          </Message>
        </div>
      </div>
    </FormDialog>
  </template>
  