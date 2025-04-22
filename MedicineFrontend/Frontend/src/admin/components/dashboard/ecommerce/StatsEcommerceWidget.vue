<script setup>
    import { ref, onMounted } from 'vue';
    
    const totalPatients = ref(0);
    const totalDoctors = ref(0);
    const totalOrders = ref(0);
    const totalRevenue = ref(0);
    const knobValue = ref(90);
    
    const fetchData = async () => {
        try {
            // Lấy tổng số bệnh nhân
            const patientResponse = await fetch('http://localhost:8080/api/patient-profiles/total');
            if (patientResponse.ok) {
                totalPatients.value = await patientResponse.json();
            }
    
            // Lấy tổng số bác sĩ
            const doctorResponse = await fetch('http://localhost:8080/api/doctor-profiles/total');
            if (doctorResponse.ok) {
                totalDoctors.value = await doctorResponse.json();
            }
    
            // Lấy tổng số đơn hàng và doanh thu
            const orderResponse = await fetch('http://localhost:8080/api/orders/summary');
            if (orderResponse.ok) {
                const orderData = await orderResponse.json();
                totalOrders.value = orderData.totalOrders;
                totalRevenue.value = orderData.totalRevenue;
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };
    
    // Gọi API khi component được mount
    onMounted(fetchData);
    </script>

<template>
    <div class="col-span-12 md:col-span-6 xl:col-span-3">
        <div class="card h-full">
            <span class="font-semibold text-lg">Tổng số bệnh nhân</span>
            <div class="flex justify-between items-start mt-4">
                <div class="w-6/12">
                    <span class="text-4xl font-bold text-surface-900 dark:text-surface-0">{{ totalPatients }}</span>
                    <div class="text-green-500">
                        <span class="font-medium">10%</span>
                        <i class="pi pi-arrow-up text-xs ml-2"></i>
                    </div>
                </div>
                
            </div>
        </div>
    </div>
    <div class="col-span-12 md:col-span-6 xl:col-span-3">
        <div class="card h-full">
            <span class="font-semibold text-lg">Tổng số bác sĩ</span>
            <div class="flex justify-between items-start mt-4">
                <div class="w-6/12">
                    <span class="text-4xl font-bold text-surface-900 dark:text-surface-0">{{ totalDoctors }}</span>
                    <div class="text-green-500">
                        <span class="font-medium">30%</span>
                        <i class="pi pi-arrow-up text-xs ml-2"></i>
                    </div>
                </div>
                <div class="w-6/12">
                    <svg width="100%" viewBox="0 0 115 41" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M1 35.6498L2.24444 32.4319C3.48889 29.214 5.97778 22.7782 8.46667 20.3627C10.9556 17.9473 13.4444 19.5522 15.9333 21.7663C18.4222 23.9803 20.9111 26.8035 23.4 30.6606C25.8889 34.5176 28.3778 39.4085 30.8667 37.2137C33.3556 35.0189 35.8444 25.7383 38.3333 26.3765C40.8222 27.0146 43.3111 37.5714 45.8 38.9013C48.2889 40.2311 50.7778 32.3341 53.2667 31.692C55.7556 31.0499 58.2444 37.6628 60.7333 39.4617C63.2222 41.2607 65.7111 38.2458 68.2 34.9205C70.6889 31.5953 73.1778 27.9597 75.6667 23.5955C78.1556 19.2313 80.6444 14.1385 83.1333 13.8875C85.6222 13.6365 88.1111 18.2272 90.6 20.2425C93.0889 22.2578 95.5778 21.6977 98.0667 18.8159C100.556 15.9341 103.044 10.7306 105.533 7.37432C108.022 4.01806 110.511 2.50903 111.756 1.75451L113 1"
                            :style="{ strokeWidth: '1px', stroke: 'var(--primary-color)' }"
                        />
                    </svg>
                </div>
            </div>
        </div>
    </div>
    <div class="col-span-12 md:col-span-6 xl:col-span-3">
        <div class="card h-full">
            <span class="font-semibold text-lg">Tổng số đơn hàng</span>
            <div class="flex justify-between items-start mt-4">
                <div class="w-6/12">
                    <span class="text-4xl font-bold text-surface-900 dark:text-surface-0">{{ totalOrders }}</span>
                    <div class="text-green-500">
                        <span class="font-medium">3%</span>
                        <i class="pi pi-arrow-up text-xs ml-2"></i>
                    </div>
                </div>
                <div class="w-6/12">
                    <svg width="100%" viewBox="0 0 115 41" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M1 35.6498L2.24444 32.4319C3.48889 29.214 5.97778 22.7782 8.46667 20.3627C10.9556 17.9473 13.4444 19.5522 15.9333 21.7663C18.4222 23.9803 20.9111 26.8035 23.4 30.6606C25.8889 34.5176 28.3778 39.4085 30.8667 37.2137C33.3556 35.0189 35.8444 25.7383 38.3333 26.3765C40.8222 27.0146 43.3111 37.5714 45.8 38.9013C48.2889 40.2311 50.7778 32.3341 53.2667 31.692C55.7556 31.0499 58.2444 37.6628 60.7333 39.4617C63.2222 41.2607 65.7111 38.2458 68.2 34.9205C70.6889 31.5953 73.1778 27.9597 75.6667 23.5955C78.1556 19.2313 80.6444 14.1385 83.1333 13.8875C85.6222 13.6365 88.1111 18.2272 90.6 20.2425C93.0889 22.2578 95.5778 21.6977 98.0667 18.8159C100.556 15.9341 103.044 10.7306 105.533 7.37432C108.022 4.01806 110.511 2.50903 111.756 1.75451L113 1"
                            :style="{ strokeWidth: '1px', stroke: 'var(--primary-color)' }"
                        />
                    </svg>
                </div>
            </div>
        </div>
    </div>
    <div class="col-span-12 md:col-span-6 xl:col-span-3">
        <div class="card h-full">
            <span class="font-semibold text-lg">Tổng doanh thu</span>
            <div class="flex justify-between items-start mt-4">
                <div class="w-6/12">
                    <span class="text-4xl font-bold text-surface-900 dark:text-surface-0">{{ totalRevenue.toLocaleString() }}Đ</span>
                    <div class="text-green-500">
                        <span class="font-medium">20%</span>
                        <i class="pi pi-arrow-up text-xs ml-2"></i>
                    </div>
                </div>
                
            </div>
        </div>
    </div>
</template>
