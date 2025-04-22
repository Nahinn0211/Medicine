import { sendDelete, sendGet, sendPost, sendPut } from '@admin/services/axios';

export const OrderService = {
  async getOrders() {
    return await sendGet("http://localhost:8080/api/orders");
  },

  async getOrderById(id) {
    return await sendGet(`http://localhost:8080/api/orders/${id}`);
  },

  async saveOrder(data) {
    const payload = {
      id: data.id,
      orderCode: data.orderCode,
      patientId: data.patientId,
      totalPrice: data.totalPrice,
      paymentMethod: data.paymentMethod,
      status: data.status,
      voucherCode: data.voucherCode,
      discountAmount: data.discountAmount,
      note: data.note
    };
    
    const response = await sendPost("http://localhost:8080/api/orders/save", payload);
    return response.data;
  },

  async deleteOrders(ids) {
    const response = await sendPost("http://localhost:8080/api/orders/delete", ids);
    return response.data;
  },

  async findByOrderCode(orderCode) {
    return await sendGet(`http://localhost:8080/api/orders/by-order-code/${encodeURIComponent(orderCode)}`);
  }
};