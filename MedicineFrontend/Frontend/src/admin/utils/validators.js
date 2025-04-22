import { i18n } from '@admin/locales';
import * as validators from '@vuelidate/validators';

const { createI18nMessage } = validators;

// Create your i18n message instance. Used for vue-i18n@9
const withI18nMessage = createI18nMessage({ t: i18n.global.t.bind(i18n) });

// wrap each validator.
export const required = withI18nMessage(validators.required);
// validators that expect a parameter should have `{ withArguments: true }` passed as a second parameter, to annotate they should be wrapped
export const minLength = withI18nMessage(validators.minLength, { withArguments: true });
// or you can provide the param at definition, statically
export const maxLength = withI18nMessage(validators.maxLength, { withArguments: true });
export const minValue = withI18nMessage(validators.minValue, { withArguments: true });
export const maxValue = withI18nMessage(validators.maxValue, { withArguments: true });
export const between = withI18nMessage(validators.between, { withArguments: true });
export const email = withI18nMessage(validators.email);
export const ipAddress = withI18nMessage(validators.ipAddress);
export const emailNoSpecialChar = withI18nMessage(validators.helpers.regex(/^[a-zA-Z0-9]+(?:[._-][a-zA-Z0-9]+)*@[a-zA-Z0-9]+\.[a-zA-Z]{2,}$/));
export const url = withI18nMessage(validators.url);
export const requiredIf = withI18nMessage(validators.requiredIf, { withArguments: true });
export const requiredUnless = withI18nMessage(validators.requiredUnless, { withArguments: true });
export const numeric = withI18nMessage(validators.numeric);
export const integer = withI18nMessage(validators.integer);
export const decimal = withI18nMessage(validators.decimal);
export const sameAs = withI18nMessage(validators.sameAs, { withArguments: true });
export const or = withI18nMessage(validators.or, { withArguments: true });
export const and = withI18nMessage(validators.and, { withArguments: true });
export const not = withI18nMessage(validators.not, { withArguments: true });
export const helpers = withI18nMessage(validators.helpers);
// export const isName= withI18nMessage(validators.helpers.regex(/^[a-zA-Z 0-9]+$/));
export const isName = withI18nMessage(
  validators.helpers.regex(/^[a-zA-Z0-9ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s]+$/)
);
export const cccd = withI18nMessage(validators.helpers.regex(/^(?!0{9,})[a-zA-Z0-9]{9,20}$/));
export const phoneNumber = withI18nMessage(validators.helpers.regex(/^(?!0{8,})[0-9]{8,20}$/));
export const isString = withI18nMessage(validators.helpers.regex(/^[a-zA-Z0-9\s]+$/));
