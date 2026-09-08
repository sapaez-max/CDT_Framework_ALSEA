export const users = {
  valid: {
    username: process.env.FE_USERNAME ?? 'standard_user',
    password: process.env.FE_PASSWORD ?? 'secret_sauce'
  },
  invalid: {
    username: 'invalid_user',
    password: 'invalid_password'
  }
};
