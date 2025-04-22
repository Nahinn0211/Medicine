export default {
  locales: {
    en: 'English',
    vi: 'Tiếng Việt'
  },
  themes: {
    light: 'Light',
    dark: 'Dark',
    system: 'System'
  },

  messages: {
    required: '{name} là thông tin bắt buộc.',
    email: ''
  },
  validations: {
    required: '{name} is required.',
    requiredIf: '{name} is required.',

    // String
    length: 'Phải nhập đủ {lenght} ký tự.',
    min: 'Không nhỏ hơn {min} ký tự.',
    max: 'Không nhiều hơn {max} ký tự.',
    email: 'Địa chỉ email không hợp lệ.',
    url: 'Không phải là một đường dẫn hợp lệ.',
    regex: 'Chuỗi không hợp lệ.',
    includes: 'Phải bao gồm chuỗi {includes}.',
    startsWith: 'Phải bắt đầu với {startsWith}.',
    endsWith: 'Phải kết thúc với {endsWith}.',
    ip: 'Địa chỉ IP không hợp lệ.',

    // Numbers
    number: '{name} phải là một số.',
    isNaN: '{name} không phải là một số.',
    gt: '{name} phải lớn hơn {gt}.',
    gte: '{name} phải lớn hơn hoặc bằng {gte}.',
    lt: '{name} phải nhỏ hơn {lt}.',
    lte: '{name} phải nhỏ hơn hoặc bằng {lte}.',
    int: '{name} phải là một số nguyên.',
    positive: '{name} phải phải là một số dương.',
    nonnegative: '{name} phải phải là một số không âm.',
    nagative: '{name} phải phải là một số âm.',
    nonpositive: '{name} phải phải là một số nhỏ hơn hoặc bằng 0.',
    safe: '{name} phải phải là một số nằm trong khoảng {min} và {max}.',

    // Date
    date: 'Ngày không hợp lệ.',
    minDate: 'Ngày không nhỏ hơn {minDate}.',
    maxDate: 'Ngày không lớn hơn {maxDate}.',
    time: 'Thời gian không hợp lệ.',
    datetime: 'Thời gian không hợp lệ.',

  },

  auth: {
    login: {
      labels: {
        title: 'Login',
        welcome: 'Welcome!',
        email: 'Email',
        password: 'Password',
      },
      buttons: {
        facebook: 'Login with Facebook',
        google: 'Login with Google',
        login: 'Login',
        forgotPassword: 'Forgot password?',
      },
      texts: {
        or: 'Or',
        welcome: 'Enter email and password to login.'
      }
    }
  }
}