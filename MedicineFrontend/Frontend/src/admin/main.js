import '@admin/services/axios/interceptors';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import AdminApp from '@admin/App.vue';
import { i18n } from './locales';
import router from '@/router/index.js'
import Toast from 'primevue/toast';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import InputIcon from 'primevue/inputicon';
import IconField from 'primevue/iconfield';
import PanelMenu from 'primevue/panelmenu';
import Drawer from 'primevue/drawer';
import SelectButton from 'primevue/selectbutton';
import RadioButton from 'primevue/radiobutton';
import Tooltip from 'primevue/tooltip';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Tag from 'primevue/tag';
import Rating from 'primevue/rating';
import BlockViewer from '@admin/components/BlockViewer.vue';
import Aura from '@primevue/themes/aura';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';
import Knob from 'primevue/knob';
import Select from 'primevue/select';
import Chart from 'primevue/chart';

// Thêm các import mới
import ConfirmDialog from 'primevue/confirmdialog';
import Dialog from 'primevue/dialog';
import MultiSelect from 'primevue/multiselect';
import ProgressSpinner from 'primevue/progressspinner';
import BlockUI from 'primevue/blockui';

import '@/assets/admin/styles.scss';
import '@/assets/admin/tailwind.css';

import primeVueLocale from '@admin/locales/primevue/vi';
import { definePreset } from '@primevue/themes';
import { getPresetExt } from './constants/theme';

const app = createApp(AdminApp);
app.use(router);
app.directive('tooltip', Tooltip);
const pinia = createPinia();
const myPreset = definePreset(Aura, getPresetExt());

app.use(pinia);
app.use(i18n);
app.use(PrimeVue, {
    theme: {
        preset: myPreset,
        options: {
            darkModeSelector: '.app-dark'
        }
    },
    locale: primeVueLocale
});
app.use(ToastService);
app.use(ConfirmationService);

app.component('BlockViewer', BlockViewer);
app.component('Toast', Toast);
app.component('Button', Button);
app.component('InputText', InputText);
app.component('InputIcon', InputIcon);
app.component('IconField', IconField);
app.component('PanelMenu', PanelMenu);
app.component('Drawer', Drawer);
app.component('SelectButton', SelectButton);
app.component('RadioButton', RadioButton);
app.component('Column', Column);
app.component('DataTable', DataTable);
app.component('Tag', Tag);
app.component('Rating', Rating);
app.component('Knob', Knob);
app.component('Select', Select);
app.component('Chart', Chart);

// Thêm các component mới
app.component('ConfirmDialog', ConfirmDialog);
app.component('Dialog', Dialog);
app.component('MultiSelect', MultiSelect);
app.component('ProgressSpinner', ProgressSpinner);
app.component('BlockUI', BlockUI);

app.mount('#admin-app');