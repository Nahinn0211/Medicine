import { dataTablePagination } from '@admin/constants/app';
import { sendDelete, sendGet, sendPatch, sendPost } from '@admin/services/axios';
import { getPerPage } from '@admin/services/localStorage';
import { useAppStore } from '@admin/stores/app';
import moment from 'moment';
import { defineStore } from 'pinia';

const initAddress = () => ({
  country_id: null,
  province_id: null,
  district_id: null,
  ward_id: null,
  address: '',
  postal_code: '',
});

const initModel = () => ({
  id: null,
  name: null,
  description: null,
  phone: null,
  fax: null,
  website: null,
  twitter_profile: null,
  facebook_profile: null,
  linkedin_profile: null,
  billing_address: initAddress(),
  shipping_address: initAddress(),
  permission_type: null,
  permission_value: {
    permission_by_team: null,
    permission_by_individual_people: [],
  },
  email_domains: [],
  dates_to_remember: [],
  tags: [],
});
const initLazyParams = () => ({
  sortField: 'created_at',
  sortOrder: 'desc',
  filters: null,
});
const initFilterParams = () => ({
  owner_id: { value: null, matchMode: 'in' },
  follow: { value: null, matchMode: 'in' },
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
});
const contactChangeInitModel = () => ({
  id: null,
  full_name: null,
  title: null,
  organization: null,
  user_responsible_id: null,
  lead_status_id: null,
  lead_source_id: null,
  rating: null,
  email_address: null,
  email_opted_out: false,
  phone: null,
  mobile_phone: null,
  fax: null,
  website: null,
  industry: null,
  number_of_employees: null,
  address: initAddress(),
  description: null,
  tags: [],
  permission_type: null,
  permission_value: {
    permission_by_team: null,
    permission_by_individual_people: [],
  },
});

export const useOrganizationStore = defineStore('organization', {
  state: () => ({
    isLoading: true,
    reLoaded: false,
    isSuccess: false,
    errors: [],
    pagination: {
      page: 1,
      total: 0,
      perPage: getPerPage() ?? dataTablePagination.perPage,
      first: 0,
    },
    showSidebar: false,
    organization: initModel(),
    organizations: [],
    allOrganizations: [],
    users: [],
    visibleColumns: {
      columns: ['avatar', 'name', 'phone', 'billing_address', 'follow', 'created_at'],
    },

    form: {
      visible: false,
      isLoading: false,
      submitted: false,
      showDialog: false,
      sortAndFilterInfos: {},
    },
    organizationDetail: {},
    contactChangeToLead: contactChangeInitModel(),
    organizationMerge: {
      master_record: null,
      full_name: null,
      mergeSelected: [],
    },
    lazyParams: initLazyParams(),
    filterParams: initFilterParams(),
  }),
  getters: {
    getFilters: (state) => {
      let owners = [];

      state.allOrganizations.forEach((item) => {
        if (item.owner?.id && !owners.find((i) => i.id === item.owner.id)) owners.push(item.owner);
      });

      return {
        owners: owners,
      };
    },
  },
  actions: {
    search(company_id, payload) {
      const appStore = useAppStore();

      this.isLoading = true;
      this.reLoaded = false;
      sendGet(`crm/${company_id}/organizations`, payload)
        .then((response) => {
          this.organizations = response.data.data;
          this.pagination.total = response.data.meta.total;
        })
        .catch((error) => {
          appStore.$patch({ toast: { detail: error.message, severity: 'error', visible: true } });
        })
        .finally(() => {
          this.isLoading = false;
        });
    },
    getFilterAndSortData(company_id, payload, option) {
      const appStore = useAppStore();
      // this.form.isLoading = true;
      sendGet(`crm/${company_id}/common/get-values-for-property`, payload)
        .then((response) => {
          const res = response.data.infos.values;
          let data = [];
          if (Array.isArray(res)) {
            data = res;
          } else {
            for (const key in res) {
              data.push(res[key]);
            }
          }
          this.form.sortAndFilterInfos = { ...this.form.sortAndFilterInfos, [option]: data };
        })
        .catch((error) => {
          appStore.$patch({ toast: { detail: error.message, severity: 'error', visible: true } });
        })
        .finally(() => {
          // this.form.isLoading = false;
        });
    },
    create(company_id, payload) {
      const appStore = useAppStore();
      this.form = { ...this.form, submitted: false, isLoading: true };
      sendGet(`crm/${company_id}/organizations/create`, payload)
        .then((response) => {
          const infos = {
            ...response.data.infos,
            tags: response.data.infos.tags.map((tag) => tag.name),
          };

          this.form = { ...this.form, infos: { ...infos, default: response.data.default } };
          this.organization = {
            ...this.organization,
            permission_type: response.data.default?.permission_type,
          };

        })
        .catch((error) => {
          appStore.$patch({ toast: { detail: error.message, severity: 'error', visible: true } });
        })
        .finally(() => {
          this.form.isLoading = false;
        });
    },
    store(company_id, payload) {
      const appStore = useAppStore();

      this.form.isLoading = true;
      sendPost(`crm/${company_id}/organizations`, payload)
        .then((response) => {
          this.form = { ...this.form, visible: payload.saveAndContinue, submitted: false };
          this.organization = { ...initModel(), ...(payload.saveAndContinue && { permission_type: this.form.infos.default?.permission_type }) };
          this.reLoaded = true;
          appStore.$patch({ toast: { detail: response.message, severity: 'success', visible: true } });
        })
        .catch((error) => {
          this.errors = error?.data?.errors ? error.data.errors : [];
          appStore.$patch({ toast: { detail: error.message, severity: 'error', visible: true } });
        })
        .finally(() => {
          this.form.isLoading = false;
        });
    },
    edit(company_id, organization_id, clone) {
      const appStore = useAppStore();
      this.form = { ...this.form, visible: true, isLoading: true };
      sendGet(`crm/${company_id}/organizations/${organization_id}/edit`)
        .then((response) => {
          const res = {
            ...response.data.model,
          };

          if (!res.billing_address) res.billing_address = initAddress();
          if (!res.shipping_address) res.shipping_address = initAddress();

          this.form = { ...this.form, infos: response.data.infos };
          const infos = {
            ...response.data.infos,
          };

          this.form = { ...this.form, infos: infos };
          if (!clone) {
            this.organization = res;
          } else {
            this.organization = { ...res, id: null, name: 'Copy of ' + res.name };
          }
        })
        .catch((error) => {
          appStore.$patch({ toast: { detail: error.message, severity: 'error', visible: true } });
        })
        .finally(() => {
          this.form.isLoading = false;
        });
    },
    update(company_id, payload) {
      const appStore = useAppStore();

      this.form.isLoading = true;
      sendPatch(`crm/${company_id}/organizations/${payload.id}`, payload)
        .then((response) => {
          appStore.$patch({ toast: { detail: response.message, severity: 'success', visible: true } });
          this.form = { ...this.form, visible: payload.saveAndContinue, submitted: false };
          this.reLoaded = false;
        })
        .catch((error) => {
          this.errors = error?.data?.errors ? error.data.errors : [];
          appStore.$patch({ toast: { detail: error.message, severity: 'error', visible: true } });
        })
        .finally(() => {
          this.form.isLoading = false;
        });
    },
    delete(company_id, payload, isReload = true) {
      const appStore = useAppStore();
      this.form.isLoading = true;
      sendDelete(`crm/${company_id}/organizations/${payload}`)
        .then((response) => {
          this.reLoaded = isReload;
          this.isSuccess = true;
          appStore.$patch({ toast: { detail: response.message, severity: 'success', visible: true } });
        })
        .catch((error) => {
          appStore.$patch({ toast: { detail: error.message, severity: 'error', visible: true } });
        })
        .finally(() => {
          this.form.isLoading = false;
        });
    },
    filterTag(tag) {
      if (tag == 'none') {
        this.organizations = this.allOrganizations.filter((i) => i.tags.length <= 0);
      } else if (tag != 'none' && tag != 'clear') {
        this.organizations = this.allOrganizations.filter((i) => i.tags.includes(tag));
      } else {
        this.organizations = this.allOrganizations;
      }
    },
    resetForm() {
      this.organization = initModel();
      this.form = {
        ...this.form,
        visible: false,
        isLoading: false,
        submitted: false,
        showDialog: false,
      };
      this.organizationMerge = {
        master_record: null,
        full_name: null,
        mergeSelected: [],
      };
    },
    resetFilterParams() {
      this.filterParams = initFilterParams();
    },
    addInfos(type) {
      const domain = {
        name: null,
      };
      const date = {
        name: null,
        date_remember: null,
        reminder: 1,
        repeat_yearly: 0,
        is_date_of_birth: 0,
      };
      if (type != 'email_domains') {
        this.organization.dates_to_remember.push(date);
      } else {
        this.organization.email_domains.push(domain);
      }
    },
    removeInfos(index, type) {
      if (type != 'email_domains') {
        this.organization = { ...this.organization, dates_to_remember: this.organization.dates_to_remember.filter((_, i) => i !== index) };
      } else {
        this.organization = { ...this.organization, email_domains: this.organization.email_domains.filter((_, i) => i !== index) };
      }
    },

    changeImage(company_id, id, payload) {
      const appStore = useAppStore();
      const dialogStore = useDialogStore();
      dialogStore.$patch({ form: { isLoading: true } });
      this.form.isLoading = true;
      sendPost(`crm/${company_id}/organizations/${id}/change-organization-field?_method=PATCH`, payload)
        .then((response) => {
          this.reLoaded = true;
          this.form = { ...this.form, submitted: false, showDialog: false };
          appStore.$patch({ toast: { detail: response.message, severity: 'success', visible: true } });
        })
        .catch((error) => {
          this.errors = error?.data?.errors ? error.data.errors : [];
          appStore.$patch({ toast: { detail: error.message, severity: 'error', visible: true } });
        })
        .finally(() => {
          this.form.isLoading = false;
          dialogStore.$patch({ form: { isLoading: false } });
        });
    },

    getUsers(company_id) {
      const appStore = useAppStore();
      this.form = { ...this.form, submitted: false, isLoading: true };
      sendGet(`crm/${company_id}/get-users`)
        .then((response) => {
          const infos = {
            ...response.data.infos,
            users: response.data,
          };

          this.form = { ...this.form, infos: infos };
        })
        .catch((error) => {
          appStore.$patch({ toast: { detail: error.message, severity: 'error', visible: true } });
        })
        .finally(() => {
          this.form.isLoading = false;
        });
    },

    changeOwner(company_id, id, entity_type, payload) {
      const dialogStore = useDialogStore();
      const appStore = useAppStore();
      dialogStore.$patch({ form: { isLoading: true } });
      this.form.isLoading = true;
      sendPatch(`crm/${company_id}/${entity_type}/${id}/change-${entity_type != 'opportunities' ? entity_type?.slice(0, entity_type?.length - 1) : 'opportunity'}-field`, payload)
        .then((response) => {
          this.reLoaded = true;
          this.form = { ...this.form, submitted: false, showDialog: false };
          appStore.$patch({ toast: { detail: response.message, severity: 'success', visible: true } });
        })
        .catch((error) => {
          this.errors = error?.data?.errors ? error.data.errors : [];
          appStore.$patch({ toast: { detail: error.message, severity: 'error', visible: true } });
        })
        .finally(() => {
          this.form.isLoading = false;
          dialogStore.$patch({ form: { isLoading: false } });
        });
    },

    getOrganizationDetail(company_id, organization_id, payload) {
      const appStore = useAppStore();
      this.isLoading = true;
      sendGet(`crm/${company_id}/organizations/${organization_id}`, payload)
        .then((response) => {
          const activities = {
            upcomings: [],
            pasts: [],
          };

          const res = {
            ...response.data,
            created_at: convertUtcToLocalDateTime(response.data.created_at, 'date'),
            dates_to_remember: response.data.dates_to_remember?.map((item) => {
              return {
                ...item,
                date_remember: item.date_remember && formatSystemToUserDateTime(item.date_remember, 'date'),
              };
            }),
            activity: {
              ...response.data.activity,
              events: response.data.activity.events?.map((e) => {
                const event = {
                  ...e,
                  ends_as_date: e.ends_as_date && formatSystemToUserDateTime(e.ends_as_date, 'date', 'date'),
                  starts_as_date: e.starts_as_date && formatSystemToUserDateTime(e.starts_as_date, 'date', 'date'),
                };
                const dueDate = e.is_all_day != 0 ? moment(e.ends_as_date)._d : moment(e.ends_as_date + ' ' + e.ends_as_time)._d;
                if (moment(dueDate).isAfter(moment()) || moment(dueDate).isSame(moment())) {
                  activities.upcomings.push({ ...event, activity_type: 'event' });
                } else {
                  activities.pasts.push({ ...event, activity_type: 'event' });
                }
                return event;
              }),
              tasks: response.data.activity.tasks?.map((e) => {
                const task = {
                  ...e,
                  start_date: e.start_date && formatSystemToUserDateTime(e.start_date, 'date', 'date'),
                  due_date: e.due_date && formatSystemToUserDateTime(e.due_date, 'date', 'date'),
                };
                if (!task.status?.key || task.status?.key != 'completed') {
                  activities.upcomings.push({ ...task, activity_type: 'task' });
                } else {
                  activities.pasts.push({ ...task, activity_type: 'task' });
                }
                return task;
              }),
              emails: response.data.activity.emails?.map((e) => {
                activities.pasts.push({ ...e, activity_type: 'email' });
                return { ...e };
              }),
            },
          };
          this.organizationDetail = { ...res, activity: { ...res.activity, ...activities } };
          this.reLoaded = false;
        })
        .catch((error) => {
          appStore.$patch({ toast: { detail: error.message, severity: 'error', visible: true } });
        })
        .finally(() => {
          this.isLoading = false;
        });
    },
  },
});
