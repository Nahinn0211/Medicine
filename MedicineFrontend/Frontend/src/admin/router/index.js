import AppLayout from '@admin/layout/AppLayout.vue';

const adminRoutes = [
  {
    path: '/admin',
    component: AppLayout,
    children: [
      {
        path: '',
        name: 'e-commerce',
        meta: {
          breadcrumb: ['Dashboard']
        },
        component: () => import('@admin/views/dashboards/Ecommerce.vue')
      },
      {
        path: 'doctor/profile',
        name: 'admin-doctor-profile',
        meta: {
          breadcrumb: ['Profile']
        },
        component: () => import('@admin/views/doctor/Index.vue')
      },
      {
        path: 'doctor/appointment',
        name: 'admin-doctor-appointment',
        meta: {
          breadcrumb: ['Appointment']
        },
        component: () => import('@admin/views/doctor/appointment.vue')
      },
      {
        path: 'order',
        name: 'admin-order',
        meta: {
          breadcrumb: ['Order']
        },
        component: () => import('@admin/views/admin/order/Index.vue')
      },
      {
        path: 'dashboard-banking',
        name: 'dashboard-banking',
        meta: {
          breadcrumb: ['Banking Dashboard']
        },
        component: () => import('@admin/views/dashboards/Banking.vue')
      },
      {
        path: 'customers',
        name: 'admin-customer',
        meta: {
          breadcrumb: ['Users'],
          permission: 'admin.users.index'
        },
        component: () => import('@admin/views/admin/user/Index.vue')
      },
      {
        path: 'roles',
        name: 'admin-roles',
        meta: {
          breadcrumb: ['Roles'],
          permission: 'admin.roles.index'
        },
        component: () => import('@admin/views/admin/role/Index.vue')
      },
      {
        path: 'listmedications',
        name: 'admin-listmedications',
        meta: {
          breadcrumb: ['List of medications'],
        },
        component: () => import('@admin/views/admin/medications/Index.vue')
      },
      {
        path: 'doctorprofiles',
        name: 'admin-doctorprofiles',
        meta: {
          breadcrumb: ['Doctor profiles'],
        },
        component: () => import('@admin/views/admin/doctorprofiles/Index.vue')
      },

      {
        path: 'brands',
        name: 'admin-brands',
        meta: {
          breadcrumb: ['Brands'],
        },
        component: () => import('@admin/views/admin/brands/Index.vue')
      },
      {
        path: 'categories',
        name: 'admin-categories',
        meta: {
          breadcrumb: ['Categories'],
        },
        component: () => import('@admin/views/admin/categories/Index.vue')
      },
      {
        path: 'consultations',
        name: 'admin-consultations',
        meta: {
          breadcrumb: ['Consultations'],
        },
        component: () => import('@admin/views/admin/consultations/Index.vue')
      },
      {
        path: 'listservice',
        name: 'admin-listservice',
        meta: {
          breadcrumb: ['List of service'],
        },
        component: () => import('@admin/views/admin/listservice/Index.vue')
      },
      {
        path: 'servicebookings',
        name: 'admin-servicebookings',
        meta: {
          breadcrumb: ['Service bookings'],
        },
        component: () => import('@admin/views/admin/servicebookings/Index.vue')
      },
      {
        path: 'vouchers',
        name: 'admin-vouchers',
        meta: {
          breadcrumb: ['Vouchers'],
        },
        component: () => import('@admin/views/admin/vouchers/Index.vue')
      },
      {
        path: 'discounts',
        name: 'admin-discounts',
        meta: {
          breadcrumb: ['Discounts'],
        },
        component: () => import('@admin/views/admin/discounts/Index.vue')
      },
      {
        path: 'role',
        name: 'admin-role',
        meta: {
          breadcrumb: ['Setting role'],
        },
        component: () => import('@admin/views/admin/role/Index.vue')
      },
      {
        path: 'user',
        name: 'admin-user',
        meta: {
          breadcrumb: ['Setting user'],
        },
        component: () => import('@admin/views/admin/user/Index.vue')
      },
      {
        path: 'customers',
        name: 'admin-customer',
        meta: {
          breadcrumb: ['Users'],
          permission: 'admin.users.index'
        },
        component: () => import('@admin/views/admin/user/Index.vue')
      },
      {
        path: 'roles',
        name: 'admin-roles',
        meta: {
          breadcrumb: ['Roles'],
          permission: 'admin.roles.index'
        },
        component: () => import('@admin/views/admin/role/Index.vue')
      },
      {
        path: 'listmedications',
        name: 'admin-listmedications',
        meta: {
          breadcrumb: ['List of medications'],
        },
        component: () => import('@admin/views/admin/medications/Index.vue')
      },
      {
        path: 'doctorprofiles',
        name: 'admin-doctorprofiles',
        meta: {
          breadcrumb: ['Doctor profiles'],
        },
        component: () => import('@admin/views/admin/doctorprofiles/Index.vue')
      },
      {
        path: 'patientprofiles',
        name: 'admin-patientprofiles',
        meta: {
          breadcrumb: ['Patient profiles'],
        },
        component: () => import('@admin/views/admin/patientprofiles/Index.vue')
      },

      {
        path: 'categories',
        name: 'admin-categories',
        meta: {
          breadcrumb: ['Categories'],
        },
        component: () => import('@admin/views/admin/categories/Index.vue')
      },
      {
        path: 'consultations',
        name: 'admin-consultations',
        meta: {
          breadcrumb: ['Consultations'],
        },
        component: () => import('@admin/views/admin/consultations/Index.vue')
      },
      {
        path: 'listservice',
        name: 'admin-listservice',
        meta: {
          breadcrumb: ['List of service'],
        },
        component: () => import('@admin/views/admin/listservice/Index.vue')
      },
      {
        path: 'servicebookings',
        name: 'admin-servicebookings',
        meta: {
          breadcrumb: ['Service bookings'],
        },
        component: () => import('@admin/views/admin/servicebookings/Index.vue')
      },
      {
        path: 'vouchers',
        name: 'admin-vouchers',
        meta: {
          breadcrumb: ['Vouchers'],
        },
        component: () => import('@admin/views/admin/vouchers/Index.vue')
      },
      {
        path: 'discounts',
        name: 'admin-discounts',
        meta: {
          breadcrumb: ['Discounts'],
        },
        component: () => import('@admin/views/admin/discounts/Index.vue')
      },
      {
        path: 'role',
        name: 'admin-role',
        meta: {
          breadcrumb: ['Setting role'],
        },
        component: () => import('@admin/views/admin/role/Index.vue')
      },
      {
        path: 'user',
        name: 'admin-user',
        meta: {
          breadcrumb: ['Setting user'],
        },
        component: () => import('@admin/views/admin/user/Index.vue')
      },
      {
        path: '/consultation/:consultationCode',
        name: 'Call',
        component: () => import('@admin/views/doctor/Call.vue'),
        meta: {
          requiresAuth: true
        }
      },
      {
        path: '/prescription/:consultationCode',
        name: 'Prescription',
        component: () => import('@admin/views/doctor/Prescription.vue'),
        meta: {
          requiresAuth: true
        }
      }
    ]
  }
];

export default adminRoutes;