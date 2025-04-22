<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { dataTablePagination, filterTypes } from '@admin/constants';
import { getPerPage, setPerPage } from "@admin/services/localStorage";
import { useOrganizationStore } from '@admin/stores/organization';
import { mapState } from 'pinia';
import { Toolbar } from 'primevue';

export default {
    setup() {   
        const columns = ref([
                {
                field: 'Id',
                label: 'Id',
                visible: true,
                disabled: true,
            },
        ]);
        const checkedAll = ref(false);
        const tableRef = ref();
        return { columns, checkedAll, tableRef };
    },
    data() {

    },
    computed: {

    },
    watch: {

    }
}
</script>
<template>
<div class="card">
    <Toolbar>
        <template #start>
            <Button label="Thêm mới" icon="pi pi-plus" severity="secondary" iconPos="left"/>
            <Button label="Xóa đã chọn" icon="pi pi-trash" severity="danger" iconPos="left"/>
        </template>
    </Toolbar>

</div>
</template>