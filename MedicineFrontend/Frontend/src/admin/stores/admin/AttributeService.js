import { sendDelete, sendGet, sendPost, sendPut } from '@admin/services/axios';
import { API_BASE_URL } from '@/config/apiConfig';

export const Attributes = {
  async getAttributes() {
    return await sendGet(`${API_BASE_URL}/attributes`);
  },
  
  async getAttributeById(id) {
    return await sendGet(`${API_BASE_URL}/attributes/${id}`);
  },
  
  async updateAttribute(attributeData) {
    const response = await sendPost(`${API_BASE_URL}/attributes/save`, attributeData);
    return response.data;
  },
  
  async insertAttribute(attributeData) {
    return this.updateAttribute(attributeData);
  },
  
  async deleteAttribute(id) {
    return await sendDelete(`${API_BASE_URL}/attributes/${id}`);
  },
  
  async deleteMultipleAttributes(ids) {
    return await sendDelete(`${API_BASE_URL}/attributes/delete-multiple`, { data: ids });
  },
};