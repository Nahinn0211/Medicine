import { createI18n } from 'vue-i18n';

import en from './en';
import vi from './vi';

import { LOCALE_KEYS, locales } from '@admin/constants';
import { getLocale } from '@admin/services/localStorage';

export const messages = {
  [locales.en]: en,
  [locales.vi]: vi
};

export const i18n = createI18n({
  // you must set `false`, to use Composition API. see more https://vue-i18n.intlify.dev/guide/advanced/composition.html
  legacy: false,

  // Refer a global scope Composer instance of i18n
  globalInjection: true,

  locale: getLocale() ?? locales.vi,
  fallbackLocale: locales.vi,
  availableLocales: LOCALE_KEYS,

  messages
});
