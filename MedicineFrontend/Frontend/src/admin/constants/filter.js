import { FilterMatchMode, FilterOperator } from '@primevue/core/api';

export const filterTypes = {
  EQUALS: { operator: FilterOperator.AND, constraints: [{value: null, matchMode: FilterMatchMode.EQUALS }]},
  CONTAINS: { value: null, matchMode: FilterMatchMode.CONTAINS },
  AND: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
  OR: { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
  DATE_IS: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }] },
  IN: { value: null, matchMode: FilterMatchMode.IN }
};
