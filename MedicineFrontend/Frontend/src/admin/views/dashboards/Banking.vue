<script setup>
import HeaderWidget from '@admin/components/dashboard/banking/HeaderWidget.vue';
import MonthlyPaymentsWidget from '@admin/components/dashboard/banking/MonthlyPaymentsWidget.vue';
import OvervieWidget from '@admin/components/dashboard/banking/OvervieWidget.vue';
import RecentTransactionsTwoWidget from '@admin/components/dashboard/banking/RecentTransactionsTwoWidget.vue';
import RecentTransactionsWidget from '@admin/components/dashboard/banking/RecentTransactionsWidget.vue';
import StatsBankingWidget from '@admin/components/dashboard/banking/StatsBankingWidget.vue';
</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <HeaderWidget />
        <StatsBankingWidget />

        <div class="col-span-12 xl:col-span-4">
            <RecentTransactionsWidget />
        </div>
        <div class="col-span-12 xl:col-span-8">
            <OvervieWidget />
        </div>

        <div class="col-span-12 lg:col-span-6">
            <RecentTransactionsTwoWidget />
        </div>

        <div class="col-span-12 lg:col-span-6">
            <MonthlyPaymentsWidget />
        </div>
    </div>
</template>
