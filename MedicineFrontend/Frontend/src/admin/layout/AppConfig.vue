<script setup>
import { useLayout } from '@admin/layout/composables/layout';
import { $t, updatePreset, updateSurfacePalette } from '@primevue/themes';
import Aura from '@primevue/themes/aura';
import Lara from '@primevue/themes/lara';
import { ref } from 'vue';
import { primaryColors as pColors, surfaces as sColors, getPresetExt } from '@admin/constants/theme';

defineProps({
    simple: {
        type: Boolean,
        default: false
    }
});

const { layoutState, layoutConfig, isDarkTheme } = useLayout();

const presets = {
    Aura,
    Lara
};
const presetOptions = ref(Object.keys(presets));
const preset = ref(layoutConfig.preset);
const themeOptions = ref([
    { name: 'Light', value: false },
    { name: 'Dark', value: true }
]);
const darkTheme = ref(layoutConfig.darkTheme);
const menuMode = ref(layoutConfig.menuMode);
const menuTheme = ref(layoutConfig.menuTheme);

const primaryColors = ref(pColors);
const surfaces = ref(sColors);

function toggleDarkMode() {
    if (!document.startViewTransition) {
        executeDarkModeToggle();

        return;
    }

    document.startViewTransition(() => executeDarkModeToggle(event));
}

function executeDarkModeToggle() {
    layoutConfig.darkTheme = !layoutConfig.darkTheme;
    document.documentElement.classList.toggle('app-dark');
}

function updateColors(type, color) {
    if (type === 'primary') {
        layoutConfig.primary = color.name;
    } else if (type === 'surface') {
        layoutConfig.surface = color.name;
    }

    applyTheme(type, color);
}

function applyTheme(type, color) {
    if (type === 'primary') {
        updatePreset(getPresetExt());
    } else if (type === 'surface') {
        updateSurfacePalette(color.palette);
    }
}

function onPresetChange() {
    layoutConfig.preset = preset.value;
    const presetValue = presets[preset.value];
    const surfacePalette = surfaces.value.find((s) => s.name === layoutConfig.surface)?.palette;

    $t().preset(presetValue).preset(getPresetExt()).surfacePalette(surfacePalette).use({ useDefaultOptions: true });
}

function setMenuMode(mode) {
    layoutConfig.menuMode = mode;

    if (layoutConfig.menuMode === 'static') {
        layoutState.staticMenuDesktopInactive = false;
    }
}
function changeMenuTheme(menuTheme) {
  layoutConfig.menuTheme = menuTheme;
}

</script>

<template>
    <Drawer
        v-model:visible="layoutState.configSidebarVisible"
        position="right"
        class="layout-config-sidebar w-80"
        header="Settings"
        :pt="{
            pcCloseButton: { root: 'ml-auto' }
        }"
    >
        <div class="flex flex-col gap-4">
            <div>
                <span class="text-lg font-semibold">Primary</span>
                <div class="pt-2 flex gap-2 flex-wrap">
                    <button
                        v-for="primaryColor of primaryColors"
                        :key="primaryColor.name"
                        type="button"
                        @click="updateColors('primary', primaryColor)"
                        :class="['cursor-pointer w-6 h-6 rounded-full flex flex-shrink-0 items-center justify-center p-0 outline-none outline-offset-1', { 'outline-primary': layoutConfig.primary === primaryColor.name }]"
                        :style="{ backgroundColor: `${primaryColor.name === 'noir' ? 'var(--text-color)' : primaryColor.palette['500']}` }"
                    ></button>
                </div>
            </div>

            <div>
                <span class="text-lg font-semibold">Surface</span>
                <div class="pt-2 flex gap-2 flex-wrap">
                    <button
                        v-for="surface of surfaces"
                        :key="surface.name"
                        type="button"
                        @click="updateColors('surface', surface)"
                        :class="[
                            'cursor-pointer w-6 h-6 rounded-full flex flex-shrink-0 items-center justify-center p-0 outline-none outline-offset-1',
                            { 'outline-primary': layoutConfig.surface ? layoutConfig.surface === surface.name : isDarkTheme ? surface.name === 'zinc' : surface.name === 'slate' }
                        ]"
                        :style="{ backgroundColor: `${surface.palette['500']}` }"
                    ></button>
                </div>
            </div>

            <div>
                <div class="flex flex-col gap-2">
                    <span class="text-lg font-semibold">Presets</span>
                    <SelectButton v-model="preset" @change="onPresetChange" :options="presetOptions" :allowEmpty="false" />
                </div>
            </div>

            <div>
                <div class="flex flex-col gap-2">
                    <span class="text-lg font-semibold">Color Scheme</span>
                    <SelectButton v-model="darkTheme" @change="toggleDarkMode" :options="themeOptions" optionLabel="name" optionValue="value" :allowEmpty="false" />
                </div>
            </div>

            <template v-if="!simple">
                <div>
                    <div class="flex flex-col gap-2">
                        <span class="text-lg font-semibold">Menu Type</span>
                        <div class="flex flex-wrap flex-col gap-3">
                            <div class="flex">
                                <div class="flex items-center gap-2 w-1/2">
                                    <RadioButton name="menuMode" value="static" v-model="menuMode" @update:modelValue="setMenuMode" inputId="static"></RadioButton>
                                    <label for="static">Static</label>
                                </div>

                                <div class="flex items-center gap-2 w-1/2">
                                    <RadioButton name="menuMode" value="overlay" v-model="menuMode" @update:modelValue="setMenuMode" inputId="overlay"></RadioButton>
                                    <label for="overlay">Overlay</label>
                                </div>
                            </div>
                            <div class="flex">
                                <div class="flex items-center gap-2 w-1/2">
                                    <RadioButton name="menuMode" value="slim" v-model="menuMode" @update:modelValue="setMenuMode" inputId="slim"></RadioButton>
                                    <label for="slim">Slim</label>
                                </div>
                                <div class="flex items-center gap-2 w-1/2">
                                    <RadioButton name="menuMode" value="slim-plus" v-model="menuMode" @update:modelValue="setMenuMode" inputId="slimplus"></RadioButton>
                                    <label for="slimplus">Slim+</label>
                                </div>
                            </div>
                            <div class="flex">
                                <div class="flex items-center gap-2 w-1/2">
                                    <RadioButton name="menuMode" value="reveal" v-model="menuMode" @update:modelValue="setMenuMode" inputId="reveal"></RadioButton>
                                    <label for="reveal">Reveal</label>
                                </div>
                                <div class="flex items-center gap-2 w-1/2">
                                    <RadioButton name="menuMode" value="drawer" v-model="menuMode" @update:modelValue="setMenuMode" inputId="drawer"></RadioButton>
                                    <label for="drawer">Drawer</label>
                                </div>
                            </div>
                            <div class="flex">
                                <div class="flex items-center gap-2 w-1/2">
                                    <RadioButton name="menuMode" value="horizontal" v-model="menuMode" @update:modelValue="setMenuMode" inputId="horizontal"></RadioButton>
                                    <label for="horizontal">Horizontal</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <div class="flex flex-col gap-2">
                        <span class="text-lg font-semibold">Menu Theme</span>
                        <div class="flex flex-wrap flex-col gap-4">
                            <div class="flex items-center gap-2">
                                <RadioButton v-model="menuTheme" value="colorScheme" :checked="menuTheme === 'colorScheme'" name="menuTheme" @value-change="changeMenuTheme" inputId="scheme"></RadioButton>
                                <label for="scheme">Color Scheme</label>
                            </div>

                            <div class="flex items-center gap-2">
                                <RadioButton v-model="menuTheme" value="primaryColor" :checked="menuTheme === 'primaryColor'" name="menuTheme" @value-change="changeMenuTheme" inputId="primary"></RadioButton>
                                <label for="primary">Primary Color</label>
                            </div>
                            <div class="flex items-center gap-2">
                                <RadioButton v-model="menuTheme" value="transparent" :checked="menuTheme === 'transparent'" name="menuTheme" @value-change="changeMenuTheme" inputId="transparent"></RadioButton>
                                <label for="transparent">Transparent</label>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </div>
    </Drawer>
</template>
