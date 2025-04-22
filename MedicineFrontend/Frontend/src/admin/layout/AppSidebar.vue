<script setup>
import { useLayout } from '@admin/layout/composables/layout';
import AppMenu from './AppMenu.vue';

const { layoutState } = useLayout();

let timeout = null;

function onMouseEnter() {
    if (!layoutState.anchored) {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
        layoutState.sidebarActive = true;
    }
}

function onMouseLeave() {
    if (!layoutState.anchored) {
        if (!timeout) {
            timeout = setTimeout(() => (layoutState.sidebarActive = false), 300);
        }
    }
}

function onAnchorToggle() {
    layoutState.anchored = !layoutState.anchored;
}
</script>

<template>
    <div class="layout-sidebar" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave">
        <div class="sidebar-header">
            <router-link :to="{ name: 'e-commerce' }" class="app-logo">
                <div class="app-logo-container">
                    <img src="/src/assets/user/images/logo.png" alt="Logo" class="app-logo-normal" 
                    style="width: 124px; height: 62px; object-fit: contain" />
                </div>

                <svg width="21" height="22" viewBox="0 0 21 22" fill="none" xmlns="http://www.w3.org/2000/svg" class="app-logo-small">
                    <path d="M10.4851 0L0 20.9465H3.53702L10.4856 6.07843L17.2944 20.9465H20.9715L10.4851 0Z" fill="var(--logo-color)" />
                    <path d="M13.8399 15.793L16.2076 21.0019H11.7681L13.8399 15.793Z" fill="var(--logo-color)" />
                    <path d="M9.04637 21.0019L6.67867 15.793L4.60693 21.0019H9.04637Z" fill="var(--logo-color)" />
                </svg>
            </router-link>
            <button class="layout-sidebar-anchor z-20 mb-2" type="button" @click="onAnchorToggle"></button>
        </div>
        <div class="layout-menu-container">
            <AppMenu />
        </div>
    </div>
</template>

 
