import type { FC } from 'react';
import type { DataGridProps, GridFilterModel, GridToolbarContainerProps } from '@mui/x-data-grid';

import { merge } from 'lodash';
import { useState, forwardRef } from 'react';

import Box from '@mui/material/Box';
import { esES } from '@mui/x-data-grid/locales';
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarQuickFilter,
  GridToolbarFilterButton,
  GridToolbarColumnsButton,
  GridToolbarDensitySelector,
} from '@mui/x-data-grid';

const CustomToolbar: FC<GridToolbarContainerProps> = (props) => (
  <GridToolbarContainer sx={{ justifyContent: 'space-between' }} {...props}>
    <Box>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
    </Box>
    <GridToolbarQuickFilter />
  </GridToolbarContainer>
);

const DataTable = forwardRef<HTMLDivElement, DataGridProps>((props, ref) => {
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
    quickFilterValues: [''],
  });

  const mergedProps = merge({}, props, {
    filterModel,
    onFilterModelChange: setFilterModel,
    slots: {
      toolbar: CustomToolbar,
    },
    initialState: {
      pagination: {
        paginationModel: {
          pageSize: 10,
        },
      },
    },
    pageSizeOptions: [5, 10, 25, 50],
    localeText: esES.components.MuiDataGrid.defaultProps.localeText,
  });

  return <DataGrid {...mergedProps} ref={ref} />;
});

DataTable.displayName = 'DataTable';

export { DataTable };
