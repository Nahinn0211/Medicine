import apiEndPoint from '@admin/constants/apiEndpoint';
import { dataTablePagination } from '@admin/constants/app';
import { sendDelete, sendGet, sendPost, sendPut } from '@admin/services/axios';
import { getPerPage } from '@admin/services/localStorage';
import { useAppStore } from '@admin/stores/app';
import { defineStore } from "pinia";
import { ref } from 'vue';

export const useRoleStore = defineStore('role', () => {
  const initModel = () => ({
    id: null,
    name: null,
    description: null,
    active: 1  // true
  })
  const initForm = () => ({
    visible: false,
    isLoading: false,
    summitted: false,
    sortAndFilterInfos: {},
  })
  const initLazyParams = () => ({
    sortField: 'created_at',
    sortOrder: 'desc',
    filters: initFilterParams(),
  })
  const initFilterParams = () => ({
    global: { value: '', matchMode: 'contains' },
    name: { value: '', matchMode: 'contains' },
    created_at: {
      operator: 'and',
      constraints: [
        {
          value: null,
          matchMode: 'dateIs',
        },
      ],
    },
    updated_at: {
      operator: 'and',
      constraints: [
        {
          value: null,
          matchMode: 'dateIs',
        },
      ],
    },
    created_by: { value: null, matchMode: 'in' },
    updated_by: { value: null, matchMode: 'in' },

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
  const visibleColumns = ref(['name', 'created_at'])
  const roles = ref([])
  const role = ref(initModel())
  const roleDetail = ref(null)
  const lazyParams = ref(initLazyParams())
  const filterParams = ref(initFilterParams())
  const form = ref(initForm())

  function search(payload) {
    const appStore = useAppStore()
    isLoading.value = true
    reLoaded.value = false
    sendGet(apiEndPoint.ADMIN.ROLE, payload)
      .then((response) => {
        roles.value = response.data.data;
        pagination.value.total = response.data.meta.total;
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
    sendPost(`${apiEndPoint.ADMIN.ROLE}`, payload)
      .then((response) => {
        appStore.$patch({ toast: { detail: response.message, severity: 'success', visible: true } });
        form.value = { ...form.value, visible: false, submitted: false };
        role.value = initModel();
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
    sendGet(`${apiEndPoint.ADMIN.ROLE}/${id}/edit`, module)
      .then((response) => {
        role.value = response.data.model;
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
    sendPut(`${apiEndPoint.ADMIN.ROLE}/${payload.id}`, payload)
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
    sendDelete(`${apiEndPoint.ADMIN.ROLE}/${payload}`)
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
    role.value = initModel()
    form.value = initForm()
  }

  return {
    isLoading, reLoaded, errors, pagination, roles, role, roleDetail, lazyParams, filterParams, form, visibleColumns,
    search, store, edit, update, remove, resetForm
  }
})