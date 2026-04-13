import Skeleton from '@mui/material/Skeleton';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

// ----------------------------------------------------------------------

type Props = {
  rows?: number;
  columns: number;
};

export function TableSkeleton({ rows = 5, columns }: Props) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <TableRow key={rowIdx}>
          {Array.from({ length: columns }).map((__, colIdx) => (
            <TableCell key={colIdx}>
              <Skeleton variant="text" sx={{ fontSize: '0.875rem' }} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
