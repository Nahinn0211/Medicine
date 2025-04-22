import apiEndPoint from '@admin/constants/apiEndpoint';
import { dataTablePagination } from '@admin/constants/app';
import { sendDelete, sendGet, sendPost, sendPut } from '@admin/services/axios';
import { getPerPage } from '@admin/services/localStorage';
import { useAppStore } from '@admin/stores/app';
import { email } from '@vuelidate/validators';
import { defineStore } from "pinia";
import { ref } from 'vue';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
export const useTicketPriceStore = defineStore('ticketPrice', () => {
    const initModel = () => ({
        id: null,
        tenBangGia: null,
        giaVeDetails: [],
        giaVeApDungs: [],
    })
    

    const initForm = () => ({
        visible: false,
        isLoading: false,
        summitted: false,
        sortAndFilterInfos: {},
    })
    const initLazyParams = () => ({
        sortField: 'Id',
        sortOrder: 'DESC',
        filters: initFilterParams(),
      })

      const initFilterParams = () => ({
        global: { value: '', matchMode: FilterMatchMode.CONTAINS },
        Id: { value: '', matchMode: FilterMatchMode.EQUALS },
        TenBangGia: { value: '', matchMode: FilterMatchMode.CONTAINS },
        ListMacTau: { value: '', matchMode: FilterMatchMode.CONTAINS },      
      KhoangThoiGianTu: {
        operator: FilterOperator.AND,
        constraints: [
          {
            value: null,
            matchMode: FilterMatchMode.DATE_IS,
          },
        ],
      },
      KhoangThoiGianDen: {
        operator:FilterOperator.AND,
        constraints: [
          {
            value: null,
            matchMode: FilterMatchMode.DATE_IS,
          },
        ],
      },
      CreatedBy: { value: null, matchMode: FilterMatchMode.IN },
      UpdatedBy: { value: null, matchMode: FilterMatchMode.IN },
  
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
    const visibleColumns = ref(['Id','NgayApDungTu','NgayApDungDen','MacTau','MaGaDi','MaGaDen','LoaiCho','DichVuId','GiaVe','CreatedBy', 'CreatedDate','UpdatedBy','UpdatedDate'])
    const giaVes = ref([]);
    const loaiChoItems = ref([]);
    const gaDiItems = ref([]);
    const gaDenItems = ref([]);
    const giaVe = ref(initModel());
    
    //const userDetail = ref(null)
    const lazyParams = ref(initLazyParams())
    const filterParams = ref(initFilterParams())
    const form = ref(initForm())
    function getLoaiChoItems(payload){
        const appStore = useAppStore();
        sendGet(apiEndPoint.ADMIN.COMMON+'/get-list-loai-cho', payload)
          .then((response) => {
              //console.log('payload',payload);
              console.log('response',response);
            loaiChoItems.value = response.data;
          
            //console.log('users', users.value);
          })
          .catch((error) => {
            appStore.$patch({ toast: { detail: error.message, severity: 'error', visible: true } });
          })
          .finally(() => {
            isLoading.value = false;
          });
    }
    function getGaDiItems(payload){
        const appStore = useAppStore();
        sendGet(apiEndPoint.ADMIN.COMMON+'/get-list-ga', payload)
          .then((response) => {
              //console.log('payload',payload);
              console.log('response',response);
            gaDiItems.value = response.data;
          
            //console.log('users', users.value);
          })
          .catch((error) => {
            appStore.$patch({ toast: { detail: error.message, severity: 'error', visible: true } });
          })
          .finally(() => {
            isLoading.value = false;
          });
    }
    function getGaDenItems(payload){
        const appStore = useAppStore();
        sendGet(apiEndPoint.ADMIN.COMMON+'/get-list-ga', payload)
          .then((response) => {
              //console.log('payload',payload);
              console.log('response',response);
            gaDenItems.value = response.data;
          
            //console.log('users', users.value);
          })
          .catch((error) => {
            appStore.$patch({ toast: { detail: error.message, severity: 'error', visible: true } });
          })
          .finally(() => {
            isLoading.value = false;
          });
    }
    function search(payload) {
        const appStore = useAppStore()
        isLoading.value = true
        reLoaded.value = false
        
        sendGet(apiEndPoint.ADMIN.GIAVE+'/search-giave', payload)
          .then((response) => {
              //console.log('payload',payload);
              console.log('response',response);
            giaVes.value = response.data.data.data;
            if(response.data) {
              pagination.value.total = response.data.data.totalCount;
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
    function create() {
        const appStore = useAppStore();
    
        form.value.isLoading = true;
        form.value.visible = true;
        sendGet(`${apiEndPoint.ADMIN.GIAVE}/create-giave`)
          .then((response) => {
            console.log('hello',response);
           // giaVe.value = response.data.model;
           loaiChoItems.value = response.data.data.listLoaiChoItems;
           gaDiItems.value = response.data.data.listGaItems;
           gaDenItems.value = response.data.data.listGaItems;
          })
          .catch((error) => {
            //console.log(error);
            appStore.$patch({ toast: { detail: error.message, severity: 'error', visible: true } });
          })
          .finally(() => {
            form.value.isLoading = false;
          });
    }
    function store(payload) {
        const appStore = useAppStore();
        form.value.isLoading = true;
        sendPost(`${apiEndPoint.ADMIN.GIAVE}/store-giave`, payload)
          .then((response) => {
            appStore.$patch({ toast: { detail: response.message, severity: 'success', visible: true } });
            form.value = { ...form.value, visible: false, submitted: false };
            giaVe.value = initModel();
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
        sendGet(`${apiEndPoint.ADMIN.GIAVE}/${id}/edit`, module)
          .then((response) => {
            giaVe.value = response.data.model;
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
        sendPut(`${apiEndPoint.ADMIN.GIAVE}/${payload.id}`, payload)
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
        sendDelete(`${apiEndPoint.ADMIN.GIAVE}/${payload}`)
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
        giaVe.value = initModel()
        form.value = initForm()
    }
    const addDetail = () => {
        giaVe.value.giaVeDetails.push({
          id: 0,
          macTau: "",
          maGaDi: "",
          maGaDen: "",
          loaiCho: "",
          giaVe: null,
          isEditing: true,
          errors: {},
        });
      };
      function validateDetail (row) {
        let errors = {};
        if (!row.macTau) errors.macTau = "Bắt buộc nhập!";
        if (!row.maGaDi) errors.maGaDi = "Bắt buộc nhập!";
        if (!row.maGaDen) errors.maGaDen = "Bắt buộc nhập!";
        if (!row.loaiCho) errors.loaiCho = "Bắt buộc nhập!";
    if (row.giaVe === null || row.giaVe === undefined || isNaN(row.giaVe) || !Number.isInteger(row.giaVe)) {
      errors.giaVe = "Phải nhập số nguyên!";
    }

    row.errors = errors;
    return Object.keys(errors).length === 0;
      }
      const saveDetail = (index) => {
        if (validateDetail(giaVe.value.giaVeDetails[index])) {
            giaVe.value.giaVeDetails[index].isEditing = false;
        }
      };
      const addApDung = () => {
        const lastRow = giaVe.value.giaVeApDungs[giaVe.value.giaVeApDungs.length - 1];
    
        giaVe.value.giaVeApDungs.push({
          id: 0,
          ngayDiTu: lastRow ? new Date(lastRow.ngayDiDen) : null,
          ngayDiDen: null,
          isEditing: true,
          errors: {},
        });
      };
      const validateApDung = (index) => {
        let errors = {};
        let row = giaVe.value.giaVeApDungs[index];
    
        if (!row.ngayDiTu) errors.ngayDiTu = "Bắt buộc nhập!";
        if (!row.ngayDiDen) errors.ngayDiDen = "Bắt buộc nhập!";
        if (row.ngayDiTu && row.ngayDiDen && new Date(row.ngayDiDen) < new Date(row.ngayDiTu)) {
          errors.ngayDiDen = "Ngày đi đến phải lớn hơn hoặc bằng ngày đi từ!";
        }
        if (index > 0) {
          let prevRow = giaVe.value.giaVeApDungs[index - 1];
          if (row.ngayDiTu && prevRow.ngayDiDen && new Date(row.ngayDiTu) <= new Date(prevRow.ngayDiDen)) {
            errors.ngayDiTu = "Ngày đi từ phải lớn hơn ngày đi đến của dòng trước!";
          }
        }
    
        row.errors = errors;
        return Object.keys(errors).length === 0;
      };
      const saveApDung = (index) => {
        if (validateApDung(index)) {
            giaVe.value.giaVeApDungs[index].isEditing = false;
        }
      };
    return {
        isLoading, reLoaded, errors, pagination, giaVes, giaVe, lazyParams, filterParams, loaiChoItems, gaDenItems, gaDiItems, form, visibleColumns,
        search, create, store, edit, update, remove, resetForm, getLoaiChoItems, getGaDenItems, getGaDiItems, addDetail, saveDetail, addApDung, saveApDung
      }
});