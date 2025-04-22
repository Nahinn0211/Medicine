<script>
  import { dataTablePagination, filterTypes } from '@admin/constants';
  import { getPerPage, setPerPage } from '@admin/services/localStorage';
  import { useOrganizationStore } from '@admin/stores/organization';
  import { mapState } from 'pinia';
  import { ref } from 'vue';
  import { useRouter } from 'vue-router';
  import CreateForm from './Create.vue';
  
  export default {
      components: {
          CreateForm
      },
      setup() {
          const router = useRouter();
          const organizationStore = useOrganizationStore();
          const columns = ref([
             
              { field: 'name', label: 'Khách hàng', visible: true, disabled: true },
               
              {
                  field: 'created_at',
                  label: 'Ngày tạo',
                  visible: true,
                  disabled: false
              },
              {
                  field: 'created_by',
                  label: 'Người tạo',
                  visible: false,
                  disabled: false
              },
              {
                  field: 'updated_at',
                  label: 'Ngày cập nhật',
                  visible: false,
                  disabled: false
              },
              {
                  field: 'updated_by',
                  label: 'Người cập nhật',
                  visible: false,
                  disabled: false
              },
           ]);
          
          const checkedAll = ref(false);
          const tableRef = ref();
          const perPage = ref(parseInt(getPerPage() ?? dataTablePagination.perPage)); 
  
          return {
              organizationStore,
              columns,
               checkedAll,
              perPage,
              tableRef
          };
      },
  
      data() {
          const menuItems = ref([
              {
                  label: 'Cập nhật',
                  icon: 'pi pi-pencil',
                  command: () => this.openForm(this.organizationSelected?.id)
              },
              
              
              {
                  label: 'Xoá',
                  icon: 'pi pi-trash',
                  command: () => this.deleteOrganization(this.organizationSelected?.id)
              }
          ]);
  
          return {
              dataTablePagination,
              organizationSelected: null,
              menuItems,
              filters: null
          };
      },
  
      computed: {
          ...mapState(useOrganizationStore, ['isLoading', 'organizations', 'form', 'pagination', 'reLoaded', 'lazyParams', 'visibleColumns'])
      },
  
      watch: {
          reLoaded(newValue) {
              if (newValue) {
                  this.organizationStore.search(1, { ...this.lazyParams, ...this.pagination });
              }
          }
      },
  
      created() {
          this.initFilters();
      },
  
      mounted() {
          // this.organizationStore.getFilterAndSortData(1, { entity: 'organization', property: 'crm_organizations.owner_id' }, 'owner_id');
          // this.organizationStore.getFilterAndSortData(1, { entity: 'organization', property: 'crm_organizations.created_by' }, 'created_by');
          // this.organizationStore.getFilterAndSortData(1, { entity: 'organization', property: 'crm_organizations.updated_by' }, 'updated_by');
      },
  
      methods: {
  
          initFilters() {
              // const filters = {
              //     global: filterTypes.CONTAINS,
              //     owner_id: filterTypes.IN,
              //     created_by: filterTypes.IN,
              //     updated_by: filterTypes.IN,
              //     created_at: filterTypes.DATE_IS,
              //     updated_at: filterTypes.DATE_IS,
              //     follow: filterTypes.IN
              // };
              // this.filters = filters;
              // this.organizationStore.$patch({ lazyParams: { ...this.lazyParams, filters: filters }, reLoaded: true });
          },
  
          // onFilterChange(e) {
          //     this.organizationStore.$patch({ pagination: { page: 1 }, reLoaded: true });
          // },
          clearFilter() {
              this.initFilters();
              this.filters.global.value = '';
          },
          clearSearch() {
              this.filters.global.value = '';
              this.organizationStore.$patch((state) => (state.reLoaded = true));
          },
  
          openForm(id = null, clone = false) {
              if (id) {
                  if (clone) this.organizationStore.edit(1, id, clone);
                  else this.organizationStore.edit(1, id);
              } else this.organizationStore.create(1);
  
              this.organizationStore.$patch({ form: { visible: true } });
          },
  
          hideForm() {
              this.organizationStore.$patch({ form: { visible: false } });
          },
  
          deleteOrganization(id) {
              this.$confirm.require({
                  message: 'Bạn có chắc chắn muốn xóa bản ghi này không?',
                  header: 'Xác nhận',
                  icon: 'pi pi-info-circle',
                  rejectLabel: 'Huỷ',
                  acceptLabel: 'Đồng ý',
                  rejectClass: 'p-button-secondary p-button-outlined',
                  acceptClass: 'p-button-danger',
                  accept: () => {
                      this.organizationStore.delete(1, id);
                  }
              });
          },
  
          toggleFollow(e, data) {
              e.preventDefault();
              const id = data.id;
  
              if (data.follow) {
                  this.$confirm.require({
                      message: 'Bạn có chắc chắn muốn hủy theo dõi khách hàng này không?',
                      header: 'Xác nhận',
                      icon: 'pi pi-exclamation-triangle',
                      rejectLabel: 'Không',
                      acceptLabel: 'Đồng ý',
                      rejectClass: 'p-button-secondary p-button-outlined',
                      acceptClass: 'p-button-danger',
                      accept: () => {
                          this.organizationStore.follow(1, id);
                      }
                  });
              } else {
                  this.organizationStore.follow(1, id);
              }
          },
  
          toggleColumn(event) {
              this.$refs.opColumn.toggle(event);
          },
  
          toggle(ev, data) {
              this.$refs.menuRef.toggle(ev);
              this.organizationSelected = data;
          },
          toggleSearch(event) {
              this.$refs.searchPanel.toggle(event);
          },
          handleShow(type) {
              this.dialogType = type;
              this.organizationStore.$patch({ form: { showDialog: true } });
          },
          hideDialog() {
              this.organizationStore.resetForm();
              this.dialogStore.resetForm();
          },
          handleRowClick(data) {
              this.$router.push({ name: 'OrganizationDetail', params: { id: data.id } });
          },
  
          print() {},
          exportData() {},
  
          handleSortOderChange(oder) {
              this.organizationStore.$patch({ lazyParams: { ...this.lazyParams, sortOrder: oder == -1 ? 'desc' : 'asc' }, reLoaded: true });
          },
          onPage(event) {
              const pagination = {
                  ...this.pagination,
                  first: event.first,
                  page: event.page + 1
              };
              this.organizationStore.$patch({ pagination: pagination });
              this.organizationStore.search(1, {
                  ...this.lazyParams,
                  ...pagination
              });
          },
          onSort(event) {
              const lazyParams = {
                  ...this.lazyParams,
                  ...this.pagination,
                  sortField: event.sortField,
                  sortOrder: event.sortOrder == -1 ? 'desc' : 'asc'
              };
              this.organizationStore.$patch({ lazyParams: lazyParams, reLoaded: true });
          },
          onRows(event) {
              const pagination = {
                  ...this.pagination,
                  page: 1,
                  perPage: event
              };
              setPerPage(event);
              this.organizationStore.$patch({ pagination: pagination, reLoaded: true });
          },
          handleSearchDataTable() {
              clearTimeout(this.timeoutId);
              this.timeoutId = setTimeout(() => {
                  this.organizationStore.search(1, {
                      ...this.lazyParams,
                      ...this.pagination,
                      page: 1
                  });
              }, 500);
          },
  
          randomBackground() {
              const maxColor = 17;
              const randomIndex = Math.floor(Math.random() * maxColor);
              return randomIndex;
          },
  
          onSave() {
              this.organizationStore.$patch({ form: { visible: false } });
          }
      }
  };
  </script>
  
  <template>
      <div class="card">
          <ConfirmDialog></ConfirmDialog>
          <DataTable :value="permissions" dataKey="id" :paginator="true" :rows="5" showCurrentPageReport scrollable responsiveLayout>
              <template #header>
                  <div class="flex justify-between items-center">
                      <span class="font-semibold text-xl">Permission Table</span>
                      <Button type="button" icon="pi pi-user-plus" label="Thêm mới" outlined @click="openForm(null)" />
                  </div>
              </template>
  
              <Column field="name" header="Permission name" sortable>
                  <template #body="{ data }">
                      <span class="text-primary cursor-pointer">{{ data.name }}</span>
                  </template>
              </Column>
  
              <Column field="created_by" header="Người tạo" sortable>
                  <template #body="{ data }">
                      {{ data.created_by }}
                  </template>
              </Column>
  
              <Column field="created_at" header="Ngày tạo" sortable>
                  <template #body="{ data }">
                      {{ data.created_at }}
                  </template>
              </Column>
  
              <Column field="action" header="Tác vụ">
                  <template #body="{ data }">
                      <Button icon="pi pi-pencil" outlined class="mr-2" @click="openForm(data.id)" />
                      <Button icon="pi pi-trash" outlined severity="danger" @click="deletePermission(data.id)" />
                  </template>
              </Column>
          </DataTable>
          <Menu :model="menuItems" ref="menuRef" popup class="w-20rem" />
          <CreateForm v-model:visible="form.visible" />
      </div>
  </template>
  