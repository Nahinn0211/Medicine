<script setup>
    import { ref, onMounted } from 'vue';
    import RevenueOverviewWidget from '@admin/components/dashboard/ecommerce/RevenueOverviewWidget.vue';
    import SalesByCategoryWidget from '@admin/components/dashboard/ecommerce/SalesByCategoryWidget.vue';
    import StatsEcommerceWidget from '@admin/components/dashboard/ecommerce/StatsEcommerceWidget.vue';
    
     const userRole = ref('');
    
     const getUserRole = () => {
      try {
         console.log('Các items trong localStorage:');
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          console.log(`${key}: ${localStorage.getItem(key)}`);
        }
        
         const userRole = localStorage.getItem('userRole') || localStorage.getItem('role');
        if (userRole) {
          console.log('Tìm thấy role trong localStorage:', userRole);
          return userRole;
        }
        
         const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            if (user && user.role) {
              console.log('Tìm thấy role trong user object:', user.role);
              return user.role;
            }
          } catch (e) {
            console.error('Lỗi khi parse user object:', e);
          }
        }
    
         const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
          console.log('Token được tìm thấy, kiểm tra nội dung token...');
          
           try {
             const parts = token.split('.');
            if (parts.length === 3) {
               const payload = JSON.parse(atob(parts[1]));
              console.log('Token payload:', payload);
              
               const role = payload.role || payload.roles || payload.authorities;
              if (role) {
                console.log('Tìm thấy role trong token:', role);
                return Array.isArray(role) ? role[0] : role;
              }
            }
          } catch (e) {
            console.error('Lỗi khi decode token:', e);
          }
        }
    
         console.log('Không tìm thấy role trong bất kỳ vị trí lưu trữ nào');
        return '';
        
      } catch (error) {
        console.error('Lỗi khi lấy role:', error);
        return '';
      }
    };
    
    onMounted(() => {
      const role = getUserRole();
      console.log('Role đã lấy được:', role);
      userRole.value = role;
    });
    </script>
    
    <template>
      <div>
        
         <div v-if="userRole === 'DOCTOR'" class="mb-4 p-4 bg-surface-50 rounded-lg">
          <h2 class="text-xl font-semibold">Chào bạn</h2>
        </div>
        
         <div v-if="userRole !== 'DOCTOR'" class="grid grid-cols-12 gap-8">
          <StatsEcommerceWidget />
          <div class="col-span-12 xl:col-span-12">
            <RevenueOverviewWidget />
          </div>
          <div class="col-span-12 lg:col-span-7">
            <RecentSalesWidget />
          </div>
        </div>
      </div>
    </template>