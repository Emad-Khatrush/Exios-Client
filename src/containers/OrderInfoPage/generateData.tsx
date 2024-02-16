import { GridColDef } from '@mui/x-data-grid';
import moment from 'moment-timezone';
import { OrderActivity } from '../../models';

export const defaultColumns = (): GridColDef[] => ([
  {
    field: 'createdAt',
    headerName: 'تاريخ',
    width: 200,
    sortable: false,
    disableColumnMenu: true
  },
  {
    field: 'placedAt',
    headerName: 'مكان الحركة',
    width: 150,
    sortable: false,
    disableColumnMenu: true
  },
  {
    field: 'description',
    headerName: 'تفاصيل',
    width: 600,
    sortable: false,
    disableColumnMenu: true
  }
]);

export const generateDataToListType = (list: OrderActivity[]) => {
  return list.map((data: OrderActivity, i)=> ({
    id: i + 1,
    description: data.description,
    placedAt: data.country,
    createdAt: moment(data.createdAt).format('DD-MM-YYYY hh:mm A')
  }));
}
