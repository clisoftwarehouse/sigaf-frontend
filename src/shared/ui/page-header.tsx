import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';

import { RouterLink } from '@/app/routes/components';

// ----------------------------------------------------------------------

export type Crumb = {
  label: string;
  href?: string;
};

type Props = {
  title: string;
  subtitle?: React.ReactNode;
  crumbs?: Crumb[];
  action?: React.ReactNode;
};

export function PageHeader({ title, subtitle, crumbs, action }: Props) {
  return (
    <Box
      sx={{
        mb: 4,
        gap: 2,
        display: 'flex',
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
        flexDirection: { xs: 'column', sm: 'row' },
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        {crumbs && crumbs.length > 0 && (
          <Breadcrumbs
            separator="›"
            sx={{ mb: 0.5, '& .MuiBreadcrumbs-separator': { color: 'text.disabled' } }}
          >
            {crumbs.map((c, idx) => {
              const isLast = idx === crumbs.length - 1;
              if (isLast || !c.href) {
                return (
                  <Typography
                    key={`${c.label}-${idx}`}
                    variant="caption"
                    sx={{ color: isLast ? 'text.secondary' : 'text.disabled' }}
                  >
                    {c.label}
                  </Typography>
                );
              }
              return (
                <Link
                  key={`${c.label}-${idx}`}
                  component={RouterLink}
                  href={c.href}
                  underline="hover"
                  variant="caption"
                  sx={{ color: 'text.disabled' }}
                >
                  {c.label}
                </Link>
              );
            })}
          </Breadcrumbs>
        )}

        <Typography variant="h4">{title}</Typography>

        {subtitle && (
          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
            {subtitle}
          </Typography>
        )}
      </Box>

      {action}
    </Box>
  );
}
