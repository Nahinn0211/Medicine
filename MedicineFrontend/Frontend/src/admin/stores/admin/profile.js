import { sendDelete, sendGet, sendPost, sendPut } from '@admin/services/axios';

export const Profile = {
   
  async getProfile() {
    return await sendGet("http://localhost:8080/api/profile/me");
  },
//   async updateProfile(profileData) {
//     return await axios.put("http://localhost:8080/api/profile/update", profileData, {
//       headers: this.getHeaders(),
//     });
//   },
//   async changePassword(passwordData) {
//     return await axios.post("http://localhost:8080/api/profile/change-password", passwordData, {
//       headers: this.getHeaders(),
//     });
//   }
};