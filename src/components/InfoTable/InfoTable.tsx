import React, { Component } from 'react'

import { Pagination, styled, Theme } from '@mui/material';
import PaginationItem from '@mui/material/PaginationItem';
import { DataGrid, gridPageCountSelector, gridPageSelector, GridToolbarContainer, GridToolbarExport, useGridApiContext, useGridSelector } from '@mui/x-data-grid';

type Props = {
  columns: any[]
  data: any[]
}

type State = {}

function customCheckbox(theme: Theme) {
  return {
    '& .MuiCheckbox-root svg': {
      width: 16,
      height: 16,
      backgroundColor: 'transparent',
      border: `1px solid ${
        theme.palette.mode === 'light' ? '#d9d9d9' : 'rgb(67, 67, 67)'
      }`,
      borderRadius: 2,
    },
    '& .MuiCheckbox-root svg path': {
      display: 'none',
    },
    '& .MuiCheckbox-root.Mui-checked:not(.MuiCheckbox-indeterminate) svg': {
      backgroundColor: '#00AB55',
      borderColor: '#00AB55',
    },
    '& .MuiCheckbox-root.Mui-checked .MuiIconButton-label:after': {
      position: 'absolute',
      display: 'table',
      border: '2px solid #fff',
      borderTop: 0,
      borderLeft: 0,
      transform: 'rotate(45deg) translate(-50%,-50%)',
      opacity: 1,
      transition: 'all .2s cubic-bezier(.12,.4,.29,1.46) .1s',
      content: '""',
      top: '50%',
      left: '39%',
      width: 5.71428571,
      height: 9.14285714,
    },
    '& .MuiCheckbox-root.MuiCheckbox-indeterminate .MuiIconButton-label:after': {
      width: 8,
      height: 8,
      backgroundColor: '#00AB55',
      transform: 'none',
      top: '39%',
      border: 0,
    },
  };
}

const StyledDataGrid = styled(DataGrid)(({ theme }) => ({
  border: 0,
  color:
    theme.palette.mode === 'light' ? 'rgba(0,0,0,.85)' : 'rgba(255,255,255,0.85)',
  fontFamily: [
    'Red Hat Text',
    'sans-serif'
  ].join(','),
  WebkitFontSmoothing: 'auto',
  letterSpacing: 'normal',
  '& .MuiDataGrid-columnsContainer': {
    backgroundColor: theme.palette.mode === 'light' ? '#fafafa' : '#1d1d1d',
  },
  '& .MuiDataGrid-iconSeparator': {
    display: 'none',
  },
  '& .MuiDataGrid-columnHeader, .MuiDataGrid-cell': {
    padding: '15px',
  },
  '& .MuiDataGrid-columnsContainer, .MuiDataGrid-cell': {
    borderBottom: 'none',
    minHeight: '72px',
    height: '72px'
  },
  '& .MuiDataGrid-columnHeaders': {
    backgroundColor: '#F4F6F8',
    borderRadius: '10px',
    borderBottom: 'none',
    fontSize: '10px',
  },
  '& .MuiDataGrid-columnHeaderTitle': {
    fontSize: '16px',
    color: '#84919C',
  },
  '& .MuiDataGrid-columnHeader--sorted .MuiDataGrid-columnHeaderTitle': {
    color: '#28323C',
  },
  '& .MuiDataGrid-row': {
    height: '72px !important',
    minHeight: '72px !important',
    maxHeight: '72px !important',
    borderBottom: '1px #bebebe solid'
  },
  '& .MuiDataGrid-cell': {
    color: '#28323C',
    fontSize: '15px',
    height: '72px !important',
    minHeight: '72px !important',
    maxHeight: '72px !important',
  },
  '& .MuiPaginationItem-root': {
    borderRadius: 0,
  },
  ...customCheckbox(theme),
}));

function CustomPagination() {
  const apiRef = useGridApiContext();
  const page = useGridSelector(apiRef, gridPageSelector);
  const pageCount = useGridSelector(apiRef, gridPageCountSelector);

  return (
    <Pagination
      color="primary"
      variant="outlined"
      shape="rounded"
      page={page + 1}
      count={pageCount}
      // @ts-expect-error
      renderItem={(props2) => <PaginationItem {...props2} disableRipple />}
      onChange={(event: React.ChangeEvent<unknown>, value: number) =>
        apiRef.current.setPage(value - 1)
      }
    />
  );
}

function CustomToolbar() {
  return (
    <GridToolbarContainer>
      <GridToolbarExport 
        csvOptions={{
          fileName: 'Exios-Invoices',
          utf8WithBom: true,
        }}
      />
    </GridToolbarContainer>
  )
}

class InfoTable extends Component<Props, State> {
  state = {}

  render() {
    const { columns, data } = this.props;

    return (
      <div style={{ height: 300, width: '100%' }}>
        <StyledDataGrid
          rows={data}
          columns={columns}
          pageSize={6}
          rowsPerPageOptions={[5]}
          components={{
            Pagination: CustomPagination,
            // Toolbar: CustomToolbar
          }}
          // checkboxSelection
          disableSelectionOnClick
        />
      </div>
    )
  }
}

export default InfoTable;
