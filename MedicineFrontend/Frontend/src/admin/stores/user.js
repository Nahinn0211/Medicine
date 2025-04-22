import apiEndPoint from '@admin/constants/apiEndpoint';
import { dataTablePagination } from '@admin/constants/app';
import { sendDelete, sendGet, sendPost, sendPut } from '@admin/services/axios';
import { getPerPage } from '@admin/services/localStorage';
import { useAppStore } from '@admin/stores/app';
import { email } from '@vuelidate/validators';
import { defineStore } from "pinia";
import { ref } from 'vue';

export const useUserStore = defineStore('user', () => {
    const initModel = () => ({
        Id: null,
        FullName: null,
        Mobile: null,
        Email: null,
        Address: null,
        Type: null,
        Status: 1  // true
    })
    const initForm = () => ({
      visible: false,
      isLoading: false,
      summitted: false,
      sortAndFilterInfos: {},
    })
    const initLazyParams = () => ({
      sortField: 'Created_at',
      sortOrder: 'DESC',
      filters: initFilterParams(),
    })
    const initFilterParams = () => ({
        global: { value: '', matchMode: 'contains' },
      FullName: { value: '', matchMode: 'contains' },
      Mobile: { value: '', matchMode: 'contains' },
      Email: { value: '', matchMode: 'contains' },
      Address: { value: '', matchMode: 'contains' },
      Created_at: {
        operator: 'and',
        constraints: [
          {
            value: null,
            matchMode: 'dateIs',
          },
        ],
      },
      Updated_at: {
        operator: 'and',
        constraints: [
          {
            value: null,
            matchMode: 'dateIs',
          },
        ],
      },
      Created_by: { value: null, matchMode: 'in' },
      Updated_by: { value: null, matchMode: 'in' },
  
    })
    const perPage = getPerPage() ?? dataTablePagination.perPage;
  
    const isLoading = ref(false)
    const reLoaded = ref(false)
    const errors = ref([])
    const pagination = ref({
      page: 1,
      total: 0,
      perPage: perPage,
      first: 0,
    })
    const visibleColumns = ref(['Id','FullName', 'Created_at'])
    const users = ref([])
    const user = ref(initModel())
    const userDetail = ref(null)
    const lazyParams = ref(initLazyParams())
    const filterParams = ref(initFilterParams())
    const form = ref(initForm())
  
    function search(payload) {
      const appStore = useAppStore()
      isLoading.value = true
      reLoaded.value = false
      
      sendGet(apiEndPoint.ADMIN.USER, payload)
        .then((response) => {
            //console.log('payload',payload);
            console.log('response',response.totalCount);
          users.value = response.data;
          if(response.data) {
            pagination.value.total = response.totalCount;
          } else {
            pagination.value.total = 0;
          }
          //console.log('users', users.value);
        })
        .catch((error) => {
          appStore.$patch({ toast: { detail: error.message, severity: 'error', visible: true } });
        })
        .finally(() => {
          isLoading.value = false;
        });
    }
    function store(payload) {
      const appStore = useAppStore();
      form.value.isLoading = true;
      sendPost(`${apiEndPoint.ADMIN.USER}`, payload)
        .then((response) => {
          appStore.$patch({ toast: { detail: response.message, severity: 'success', visible: true } });
          form.value = { ...form.value, visible: false, submitted: false };
          user.value = initModel();
          reLoaded.value = true;
        })
        .catch((error) => {
          errors.value = error?.data?.errors ? error.data.errors : [];
          appStore.$patch({ toast: { detail: error.message, severity: 'error', visible: true } });
        })
        .finally(() => {
          form.value.isLoading = false;
        });
    }
    function edit(id, module) {
      const appStore = useAppStore();
  
      form.value.isLoading = true;
      form.value.visible = true;
      sendGet(`${apiEndPoint.ADMIN.USER}/${id}/edit`, module)
        .then((response) => {
          user.value = response.data.model;
        })
        .catch((error) => {
          appStore.$patch({ toast: { detail: error.message, severity: 'error', visible: true } });
        })
        .finally(() => {
          form.value.isLoading = false;
        });
    }
    function update(payload) {
      const appStore = useAppStore();
  
      form.value.isLoading = true;
      sendPut(`${apiEndPoint.ADMIN.USER}/${payload.id}`, payload)
        .then((response) => {
          appStore.$patch({ toast: { detail: response.message, severity: 'success', visible: true } });
          form.value = { ...form.value, visible: false, submitted: false };
          reLoaded.value = true;
        })
        .catch((error) => {
          errors.value = error?.data?.errors ? error.data.errors : [];
          appStore.$patch({ toast: { detail: error.message, severity: 'error', visible: true } });
        })
        .finally(() => {
          form.value.isLoading = false;
        });
    }
    function remove(payload) {
      const appStore = useAppStore();
  
      isLoading.value = true;
      sendDelete(`${apiEndPoint.ADMIN.USER}/${payload}`)
        .then((response) => {
          appStore.$patch({ toast: { detail: response.message, severity: 'success', visible: true } });
          reLoaded.value = true;
        })
        .catch((error) => {
          appStore.$patch({ toast: { detail: error.message, severity: 'error', visible: true } });
        })
        .finally(() => {
          isLoading.value = false;
        });
    }
    function resetForm() {
      user.value = initModel()
      form.value = initForm()
    }
  
    return {
      isLoading, reLoaded, errors, pagination, users, user, userDetail, lazyParams, filterParams, form, visibleColumns,
      search, store, edit, update, remove, resetForm
    }
  })
