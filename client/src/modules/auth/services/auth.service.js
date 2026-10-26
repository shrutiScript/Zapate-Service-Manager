import api from '../../../services/api.js';

export const authService = {
  /**
   * Request password reset OTP for registered account identifier
   */
  async forgotPassword(identifier) {
    return await api.post('/auth/forgot-password', { identifier });
  },

  /**
   * Verify 6-digit OTP code
   */
  async verifyResetOtp(identifier, otp) {
    return await api.post('/auth/verify-reset-otp', { identifier, otp });
  },

  /**
   * Set new password with verified resetToken / OTP
   */
  async resetPassword({ identifier, otp, resetToken, newPassword }) {
    return await api.post('/auth/reset-password', {
      identifier,
      otp,
      resetToken,
      newPassword,
    });
  },
};

export default authService;
