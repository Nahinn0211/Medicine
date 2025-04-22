export default {
  locales: {
    en: 'English',
    vi: 'Tiếng Việt'
  },
  themes: {
    light: 'Sáng',
    dark: 'Tối',
    system: 'Hệ thống'
  },
  attributes: {
    name: 'Tên',
    fullName: 'Họ và tên',
    email: 'Email',
    phone: 'Điện thoại',
    address: 'Địa chỉ',
    city: 'Tỉnh/Thành phố',
    district: 'Quận/Huyện',
    country: 'Quốc gia',
  },
  buttons: {
    save: 'Lưu',
    saveAndContinue: 'Lưu và tiếp tục',
    continue: 'Tiếp tục',
    send: 'Gửi',
    submit: 'Thực hiện',
    filter: 'Lọc',
    search: 'Tìm kiếm',
    ok: 'Ok',
    cancel: 'Huỷ',
    approve: 'Phê duyệt',
    reject: 'Không chấp nhận',
    accept: 'Chấp nhận',
    back: 'Quay lại'
  },
  messages: {
    required: '{name} là thông tin bắt buộc.',
    email: ''
  },
  validations: {
    required: 'Trường này không thể để trống. ',
    requiredIf: 'Trường này không thể để trống. ',
    email: 'Giá trị không phải là một địa chỉ email hợp lệ. ',
    between: 'Giá trị phải nằm trong khoảng {min} đến {max}',
    numeric: 'Giá trị phải là số. ',
    phone_min_length: 'Trường này phải dài ít nhất 11 ký tự. ',
    phone_max_length: 'Chiều dài tối đa cho phép là 11. ',
    url: 'Giá trị không phải là một đường dẫn hợp lệ',
    minValue: 'Trường này phải lớn hơn {min}',
    maxValue: 'Trường này phải nhỏ hơn {max}',
    minLength: 'Trường này không nhỏ hơn {min} ký tự',
    maxLength: 'Trường này không nhiều hơn {max} ký tự',
    sameAs: 'Các mật khẩu đã nhập không khớp. Hãy thử lại.',
    minLengthGroup: 'Tối thiểu 2 thành viên',
    cccd: 'CCCD không hợp lệ',
    phoneNumber: 'Số điện thoại không hợp lệ.',
    isName: 'Họ và tên không đúng định dạng',
    emailNoSpecialChar: 'Email không hợp lệ.',
    maxDuration: 'Vượt quá khoảng thời gian cho phép',
    ipAddress: 'Địa chỉ IP phải là một địa chỉ IPv4',
    employeeFormat: 'Mã nhân viên không đúng định dạng',
    bankNameFormat: 'Tên ngân hàng không đúng định dạng',
    checkOutTime: 'Trường thời gian ra phải lớn hơn thời gian vào',
    notSameAsCurrentPass: 'Mật khẩu mới không được phép trùng với mật khẩu cũ',

  },

  auth: {
    login: {
      labels: {
        title: 'ĐĂNG NHẬP',
        welcome: 'Xin chào!',
        email: 'Email',
        password: 'Mật khẩu',
        promptLabel: 'Nhập mật khẩu',
        weakLabel: 'Mật khẩu yếu',
        mediumLabel: 'Mật khẩu mức trung bình',
        strongLabel: 'Mật khẩu mạnh',
      },
      buttons: {
        facebook: 'Đăng nhập với Facebook',
        google: 'Đăng nhập với Google',
        login: 'Đăng nhập',
        forgotPassword: 'Quên mật khẩu?',
      },
      texts: {
        or: 'hoặc',
        welcome: 'Vui lòng nhập thông tin để đăng nhập vào hệ thống'
      }
    },
    register: {
      labels: {
        title: 'ĐĂNG KÝ',
        name: 'Tên công ty',
      },
      buttons: {
        register: 'ĐĂNG KÝ',
        backToLogin: 'Quay lại Đăng nhập',
      },
      texts: {
        welcome: 'Xin chào quý khách!',
        sub_welcome: 'Vui lòng nhập thông tin để dăng ký mới doanh nghiệp.'
      }
    },
    newPassword: {
      labels: {
        title: 'MẬT KHẨU MỚI',
        confirmPassword: 'Xác nhận mật khẩu',
        password: 'Mật khẩu',
        promptLabel: 'Nhập mật khẩu',
        weakLabel: 'Mật khẩu yếu',
        mediumLabel: 'Mật khẩu mức trung bình',
        strongLabel: 'Mật khẩu mạnh',
      },
      buttons: {
        saveNewPassword: 'LƯU MẬT KHẨU MỚI',
        backToLogin: 'Quay lại Đăng nhập',
      },
      texts: {
        chooseNewPassword: 'Chọn một mật khẩu mới!',
        enterNewPassword: 'Nhập mật khẩu mới'
      }
    },
    forgotPassword: {
      labels: {
        title: 'QUÊN MẬT KHẨU',
      },
      buttons: {
        forgotPassword: 'GỬI ĐI',
        backToLogin: 'Quay lại Đăng nhập',
      },
      texts: {
        text1: 'Để khôi phục tài khoản, hãy nhập email đăng nhập của bạn.',
      }
    },
    verification: {
      labels: {
        title: 'XÁC THỰC',
      },
      buttons: {
        verify: 'XÁC THỰC',
        resend: 'Gửi lại',
      },
      texts: {
        text1: 'Nhập mã xác thực.',
      }
    },
    errors: {
      labels: {
        title: 'LỖI',
      },
      texts: {
        error: 'Có lỗi xảy ra. Vui lòng liên hệ với quản trị hệ thống.',
        error404: 'Không tìm thấy đường dẫn hoặc dữ liệu.',
        access: 'Không có quyền truy cập.'
      }
    },
  }
    
}