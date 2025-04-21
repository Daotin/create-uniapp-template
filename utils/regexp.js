// 密码需要8~16位，且含有大小写字母、数字和特殊字符@$!%*#?&.
export const regPassword =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*#?&.])[A-Za-z\d$@$!%*#?&.]{8,16}$/;

// 手机号
export const regPhone = /(^1[3456789]\d{9}$)/;

// 电子邮箱
export const regEmail = /^\S*@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/;

// 身份证号
export const regIdCard = /^(\d{6})(\d{4})(\d{2})(\d{2})(\d{3})([0-9]|X)$/;

// 中文
export const regChinese = /[\u4E00-\u9FA5]/g;

// URL
export const regURL =
  /^((ht|f)tps?):\/\/[\w\-]+(\.[\w\-]+)+([\w\-.,@?^=%&:\/~+#]*[\w\-@?^=%&\/~+#])?$/;
