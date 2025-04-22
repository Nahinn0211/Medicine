<script setup>
import { useLayout } from '@admin/layout/composables/layout';
import { ref, watch, onMounted } from 'vue';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { useToast } from 'primevue/usetoast';

const { getPrimary, getSurface, isDarkTheme } = useLayout();
const toast = useToast();

// Định nghĩa các khoảng thời gian có thể chọn
const timePeriods = ref([
    {
        label: 'Tuần trước',
        value: 'LAST_WEEK',
        endpoint: '/orders/revenue/weekly?period=LAST_WEEK'
    },
    {
        label: 'Tuần này',
        value: 'THIS_WEEK',
        endpoint: '/orders/revenue/weekly?period=THIS_WEEK'
    },
    {
        label: 'Tháng trước',
        value: 'LAST_MONTH',
        endpoint: '/orders/revenue/monthly?period=LAST_MONTH'
    },
    {
        label: 'Tháng này',
        value: 'THIS_MONTH',
        endpoint: '/orders/revenue/monthly?period=THIS_MONTH'
    },
    {
        label: 'Cả năm',
        value: 'YEARLY',
        endpoint: '/orders/revenue/yearly'
    }
]);

// Các trạng thái
const selectedPeriod = ref(timePeriods.value[1]); // Mặc định là tuần này
const lineOptions = ref({});
const lineData = ref({});
const isLoading = ref(true);
const error = ref(null);
const exportLoading = ref(false);

// Dữ liệu tổng quan
const summary = ref({
    totalRevenue: 0,
    totalProfit: 0,
    totalOrders: 0
});

// Dữ liệu gốc từ API
const rawData = ref({
    labels: [],
    revenue: [],
    profit: []
});

// Hàm lấy dữ liệu từ API
async function fetchRevenueData() {
    isLoading.value = true;
    error.value = null;

    try {
        // Gọi API dựa trên period được chọn
        const response = await axios.get(selectedPeriod.value.endpoint);
        const data = response.data;

        // Lưu trữ dữ liệu gốc để xuất Excel
        rawData.value = {
            labels: data.labels,
            revenue: data.revenue,
            profit: data.profit
        };

        // Cập nhật dữ liệu tổng quan
        summary.value = {
            totalRevenue: data.totalRevenue,
            totalProfit: data.totalProfit,
            totalOrders: data.totalOrders
        };

        // Cập nhật dữ liệu biểu đồ
        updateChartData(data.labels, data.revenue, data.profit);
    } catch (err) {
        console.error('Error fetching revenue data:', err);
        error.value = 'Không thể tải dữ liệu doanh thu. Vui lòng thử lại sau.';

        // Sử dụng dữ liệu mặc định khi có lỗi
        useFallbackData();
    } finally {
        isLoading.value = false;
    }
}

// Hàm cập nhật dữ liệu khi thay đổi khoảng thời gian
function onPeriodChange() {
    fetchRevenueData();
}

// Hàm cập nhật dữ liệu biểu đồ
function updateChartData(labels, revenueData, profitData) {
    const documentStyle = getComputedStyle(document.documentElement);

    lineData.value = {
        labels: labels,
        datasets: [
            {
                label: 'Doanh thu',
                borderColor: documentStyle.getPropertyValue('--p-primary-500'),
                pointBackgroundColor: documentStyle.getPropertyValue('--p-primary-500'),
                pointBorderColor: documentStyle.getPropertyValue('--p-primary-500'),
                pointHoverBackgroundColor: documentStyle.getPropertyValue('--surface-0'),
                pointHoverBorderColor: documentStyle.getPropertyValue('--p-primary-500'),
                tension: 0.4,
                borderWidth: 2,
                fill: false,
                data: revenueData
            },
            {
                label: 'Lợi nhuận',
                borderColor: documentStyle.getPropertyValue('--p-primary-200'),
                pointBackgroundColor: documentStyle.getPropertyValue('--p-primary-200'),
                pointBorderColor: documentStyle.getPropertyValue('--p-primary-200'),
                pointHoverBackgroundColor: documentStyle.getPropertyValue('--surface-0'),
                pointHoverBorderColor: documentStyle.getPropertyValue('--p-primary-200'),
                tension: 0.4,
                borderWidth: 2,
                fill: false,
                data: profitData
            }
        ]
    };

    initChartOptions();
}

// Sử dụng dữ liệu mặc định khi có lỗi
function useFallbackData() {
    const labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const revenue = [65000000, 59000000, 80000000, 81000000, 56000000, 55000000, 40000000];
    const profit = [28000000, 48000000, 40000000, 19000000, 86000000, 27000000, 90000000];

    rawData.value = {
        labels: labels,
        revenue: revenue,
        profit: profit
    };

    summary.value = {
        totalRevenue: revenue.reduce((a, b) => a + b, 0),
        totalProfit: profit.reduce((a, b) => a + b, 0),
        totalOrders: 157
    };

    updateChartData(labels, revenue, profit);
}

// Thiết lập tùy chọn biểu đồ
function initChartOptions() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

    lineOptions.value = {
        animation: {
            duration: 0
        },
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    color: textColor,
                    usePointStyle: true,
                    font: {
                        weight: 700
                    },
                    padding: 28
                },
                position: 'bottom'
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += formatCurrency(context.parsed.y);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: textColorSecondary,
                    font: {
                        weight: 500
                    }
                },
                grid: {
                    display: false,
                    drawBorder: false
                }
            },
            y: {
                ticks: {
                    color: textColorSecondary,
                    callback: function (value) {
                        return new Intl.NumberFormat('vi-VN', {
                            notation: 'compact',
                            compactDisplay: 'short'
                        }).format(value);
                    }
                },
                grid: {
                    color: surfaceBorder,
                    drawBorder: false
                }
            }
        }
    };
}

// Định dạng tiền tệ
function formatCurrency(value) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

// CHỨC NĂNG XUẤT EXCEL
async function exportToExcel() {
    try {
        exportLoading.value = true;

        // Chuẩn bị dữ liệu cho báo cáo
        const periodName = selectedPeriod.value.label;
        const currentDate = new Date().toLocaleDateString('vi-VN');

        // Gọi API riêng để lấy dữ liệu xuất Excel
        const response = await axios.get(`${selectedPeriod.value.endpoint}/export`);
        const exportData = response.data;

        // Tạo workbook mới
        const wb = XLSX.utils.book_new();

        // Tạo sheet tổng quan
        const summaryData = [
            ['BÁO CÁO DOANH THU', '', ''],
            ['', '', ''],
            ['Khoảng thời gian:', periodName, ''],
            ['Ngày xuất báo cáo:', currentDate, ''],
            ['', '', ''],
            ['TỔNG QUAN', '', ''],
            ['Tổng đơn hàng:', exportData.totalOrders, ''],
            ['Tổng doanh thu:', formatCurrency(exportData.totalRevenue), ''],
            ['Tổng lợi nhuận:', formatCurrency(exportData.totalProfit), ''],
            ['', '', ''],
        ];

        // Tạo sheet chi tiết
        const detailsHeader = ['Thời gian', 'Doanh thu', 'Lợi nhuận'];
        const detailsData = exportData.details.map(item => [
            item.period,
            formatCurrency(item.revenue),
            formatCurrency(item.profit)
        ]);

        // Gộp dữ liệu tổng quan và chi tiết
        const combinedData = [
            ...summaryData,
            ['CHI TIẾT DOANH THU THEO ' + getPeriodType()],
            [''],
            detailsHeader,
            ...detailsData
        ];

        // Tạo worksheet từ dữ liệu đã chuẩn bị
        const ws = XLSX.utils.aoa_to_sheet(combinedData);

        // Thiết lập kiểu dữ liệu cho các ô
        setStyles(ws);

        // Thêm worksheet vào workbook
        XLSX.utils.book_append_sheet(wb, ws, "Báo cáo doanh thu");

        // Xuất file Excel
        const fileName = `Bao_cao_doanh_thu_${periodName.replace(/\s+/g, '_')}_${formatDateForFileName()}.xlsx`;
        XLSX.writeFile(wb, fileName);

        toast.add({
            severity: 'success',
            summary: 'Xuất báo cáo thành công',
            detail: `Đã xuất file ${fileName}`,
            life: 3000
        });
    } catch (err) {
        console.error('Error exporting to Excel:', err);

        // Kiểm tra lỗi từ API
        if (err.response) {
            toast.add({
                severity: 'error',
                summary: 'Lỗi xuất báo cáo',
                detail: `Không thể xuất báo cáo: ${err.response.data.message || 'Lỗi từ máy chủ'}`,
                life: 3000
            });
        } else {
            toast.add({
                severity: 'error',
                summary: 'Lỗi xuất báo cáo',
                detail: 'Không thể xuất báo cáo Excel. Vui lòng thử lại sau.',
                life: 3000
            });
        }

        // Nếu không lấy được dữ liệu từ API, sử dụng dữ liệu hiện có để xuất Excel
        const currentPeriodName = selectedPeriod.value.label; // Lấy periodName ngay tại đây
        fallbackExport(currentPeriodName);
    } finally {
        exportLoading.value = false;
    }
}

// Xuất Excel từ dữ liệu biểu đồ hiện tại (dự phòng)
function fallbackExport(periodName) {
    try {
        const currentDate = new Date().toLocaleDateString('vi-VN');

        // Tạo workbook mới
        const wb = XLSX.utils.book_new();

        // Tạo sheet tổng quan từ dữ liệu hiện có
        const summaryData = [
            ['BÁO CÁO DOANH THU (Từ dữ liệu hiện có)', '', ''],
            ['', '', ''],
            ['Khoảng thời gian:', periodName, ''],
            ['Ngày xuất báo cáo:', currentDate, ''],
            ['', '', ''],
            ['TỔNG QUAN', '', ''],
            ['Tổng đơn hàng:', summary.value.totalOrders, ''],
            ['Tổng doanh thu:', formatCurrency(summary.value.totalRevenue), ''],
            ['Tổng lợi nhuận:', formatCurrency(summary.value.totalProfit), ''],
            ['', '', ''],
        ];

        // Tạo sheet chi tiết từ dữ liệu biểu đồ hiện có
        const detailsHeader = ['Thời gian', 'Doanh thu', 'Lợi nhuận'];
        const detailsData = rawData.value.labels.map((label, index) => [
            label,
            formatCurrency(rawData.value.revenue[index]),
            formatCurrency(rawData.value.profit[index])
        ]);

        // Gộp dữ liệu tổng quan và chi tiết
        const combinedData = [
            ...summaryData,
            ['CHI TIẾT DOANH THU THEO ' + getPeriodType()],
            [''],
            detailsHeader,
            ...detailsData
        ];

        // Tạo worksheet từ dữ liệu đã chuẩn bị
        const ws = XLSX.utils.aoa_to_sheet(combinedData);

        // Thiết lập kiểu dữ liệu cho các ô
        setStyles(ws);

        // Thêm worksheet vào workbook
        XLSX.utils.book_append_sheet(wb, ws, "Báo cáo doanh thu");

        // Xuất file Excel
        const fileName = `Bao_cao_doanh_thu_${periodName.replace(/\s+/g, '_')}_${formatDateForFileName()}_local.xlsx`;
        XLSX.writeFile(wb, fileName);

        toast.add({
            severity: 'warn',
            summary: 'Đã xuất báo cáo với dữ liệu hiện có',
            detail: `Do không thể lấy dữ liệu từ máy chủ, báo cáo được tạo từ dữ liệu hiện tại.`,
            life: 5000
        });
    } catch (err) {
        console.error('Error in fallback export:', err);
        toast.add({
            severity: 'error',
            summary: 'Lỗi xuất báo cáo',
            detail: 'Không thể xuất báo cáo Excel. Vui lòng thử lại sau.',
            life: 3000
        });
    }
}

// Lấy loại khoảng thời gian cho tiêu đề báo cáo
function getPeriodType() {
    const periodValue = selectedPeriod.value.value;
    if (periodValue.includes('WEEK')) {
        return 'NGÀY';
    } else if (periodValue.includes('MONTH')) {
        return 'NGÀY';
    } else if (periodValue === 'YEARLY') {
        return 'THÁNG';
    }
    return 'THỜI GIAN';
}

// Định dạng ngày tháng cho tên file
function formatDateForFileName() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}${month}${year}`;
}

// Thiết lập kiểu dữ liệu cho các ô trong Excel
function setStyles(worksheet) {
    // Tạo các kiểu định dạng
    const titleStyle = { font: { bold: true, sz: 16 }, alignment: { horizontal: 'center' } };
    const headerStyle = { font: { bold: true }, fill: { fgColor: { rgb: "DDEBF7" } } };
    const subHeaderStyle = { font: { bold: true } };

    // Thiết lập chiều rộng cột
    const colWidths = [{ wch: 25 }, { wch: 20 }, { wch: 20 }];
    worksheet['!cols'] = colWidths;

    // Áp dụng kiểu
    worksheet['A1'] = { ...worksheet['A1'], s: titleStyle };

    // Gộp ô cho tiêu đề
    worksheet['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },  // Gộp A1:C1 cho tiêu đề
        { s: { r: 10, c: 0 }, e: { r: 10, c: 2 } } // Gộp A11:C11 cho tiêu đề chi tiết
    ];
}

// Theo dõi thay đổi theme
watch(
    [getPrimary, getSurface, isDarkTheme],
    () => {
        initChartOptions();
    }
);

// Tải dữ liệu khi component được mount
onMounted(() => {
    fetchRevenueData();
});
</script>

<template>
    <div class="card w-full h-full">
        <div class="flex flex-wrap items-start justify-between mb-6 gap-3">
            <span class="text-surface-900 dark:text-surface-0 text-xl font-semibold">Tổng quan doanh thu</span>
            <div class="flex gap-3">
                <Select :options="timePeriods" v-model="selectedPeriod" class="w-40" optionLabel="label"
                    @change="onPeriodChange"></Select>
                <Button icon="pi pi-file-excel" label="Xuất Excel" severity="success" :loading="exportLoading"
                    @click="exportToExcel" class="p-button-sm" v-tooltip.top="'Xuất báo cáo doanh thu sang Excel'" />
            </div>
        </div>

        <!-- Thông tin tổng quan -->
        <div class="grid grid-cols-3 gap-4 mb-6">
            <div class="bg-surface-50 dark:bg-surface-800 p-4 rounded-lg">
                <div class="text-surface-600 dark:text-surface-400 text-sm mb-1">Tổng đơn hàng</div>
                <div class="text-surface-900 dark:text-surface-0 text-xl font-semibold">
                    {{ summary.totalOrders }}
                </div>
            </div>
            <div class="bg-surface-50 dark:bg-surface-800 p-4 rounded-lg">
                <div class="text-surface-600 dark:text-surface-400 text-sm mb-1">Tổng doanh thu</div>
                <div class="text-surface-900 dark:text-surface-0 text-xl font-semibold">
                    {{ formatCurrency(summary.totalRevenue) }}
                </div>
            </div>
            <div class="bg-surface-50 dark:bg-surface-800 p-4 rounded-lg">
                <div class="text-surface-600 dark:text-surface-400 text-sm mb-1">Tổng lợi nhuận</div>
                <div class="text-surface-900 dark:text-surface-0 text-xl font-semibold">
                    {{ formatCurrency(summary.totalProfit) }}
                </div>
            </div>
        </div>

        <!-- Hiển thị trạng thái loading -->
        <div v-if="isLoading" class="flex justify-center items-center h-64">
            <ProgressSpinner strokeWidth="4" class="w-12 h-12" />
        </div>

        <!-- Hiển thị lỗi -->
        <div v-else-if="error" class="flex justify-center items-center h-64">
            <Message severity="error" :closable="false">{{ error }}</Message>
        </div>

        <!-- Hiển thị biểu đồ dạng đường thay vì cột -->
        <div v-else class="w-full">
            <Chart type="line" :height="300" :data="lineData" :options="lineOptions" class="w-full"></Chart>
        </div>

        <!-- Toast messages -->
        <Toast position="bottom-right" />
    </div>
</template>