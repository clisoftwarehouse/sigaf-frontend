import type { FC } from 'react';
import type { GridColDef, DataGridProps, GridFilterModel, GridToolbarContainerProps } from '@mui/x-data-grid';

import { merge } from 'lodash';
import { useMemo, useState, forwardRef } from 'react';

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

/**
 * Aplica defaults de alineación por tipo de columna cuando el caller no lo especificó.
 * - numeric / number → derecha
 * - boolean / dateTime / date → centro
 * - actions → derecha (si no fue ya definida)
 * - texto → izquierda (default MUI, no tocamos)
 */
function applyAlignmentDefaults(columns: readonly GridColDef[]): GridColDef[] {
  return columns.map((col) => {
    if (col.align !== undefined && col.headerAlign !== undefined) return col;
    let align = col.align;
    let headerAlign = col.headerAlign;
    if (col.type === 'number') {
      align ??= 'right';
      headerAlign ??= 'right';
    } else if (col.type === 'boolean' || col.type === 'date' || col.type === 'dateTime') {
      align ??= 'center';
      headerAlign ??= 'center';
    } else if (col.type === 'actions') {
      align ??= 'right';
      headerAlign ??= 'right';
    }
    return { ...col, align, headerAlign };
  });
}

const DataTable = forwardRef<HTMLDivElement, DataGridProps>((props, ref) => {
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
    quickFilterValues: [''],
  });

  const normalizedColumns = useMemo(
    () => applyAlignmentDefaults(props.columns ?? []),
    [props.columns]
  );

  const defaults: Partial<DataGridProps> = {
    getRowHeight: () => 'auto',
    getEstimatedRowHeight: () => 60,
    sx: {
      '& .MuiDataGrid-cell': {
        py: 1,
        alignItems: 'center',
        whiteSpace: 'normal',
        lineHeight: 1.4,
      },
      '& .MuiDataGrid-cell--textRight': {
        justifyContent: 'flex-end',
      },
      '& .MuiDataGrid-cell--textCenter': {
        justifyContent: 'center',
      },
      '& .MuiDataGrid-columnHeader--alignRight .MuiDataGrid-columnHeaderTitleContainer': {
        flexDirection: 'row-reverse',
      },
    },
  };

  const mergedProps = merge({}, defaults, props, {
    columns: normalizedColumns,
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
