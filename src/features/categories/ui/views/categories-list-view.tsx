import type { CategoryTreeNode } from '../../model/types';

import { toast } from 'sonner';
import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import CircularProgress from '@mui/material/CircularProgress';
import { TreeItem, type TreeItemProps } from '@mui/x-tree-view/TreeItem';

import { paths } from '@/app/routes/paths';
import { useRouter } from '@/app/routes/hooks';
import { Iconify } from '@/app/components/iconify';
import { EmptyState } from '@/shared/ui/empty-state';
import { PageHeader } from '@/shared/ui/page-header';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';

import { useCategoriesQuery, useDeleteCategoryMutation } from '../../api/categories.queries';

// ----------------------------------------------------------------------

type TreeItemPayload = {
  id: string;
  label: string;
  isPharmaceutical: boolean;
  code: string | null;
  children?: TreeItemPayload[];
};

function toTreeItems(nodes: CategoryTreeNode[]): TreeItemPayload[] {
  return nodes.map((node) => ({
    id: node.id,
    label: node.name,
    isPharmaceutical: node.isPharmaceutical,
    code: node.code,
    children: node.children.length ? toTreeItems(node.children) : undefined,
  }));
}

export function CategoriesListView() {
  const router = useRouter();
  const { tree, isLoading, isError, error, refetch } = useCategoriesQuery();
  const deleteMutation = useDeleteCategoryMutation();
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);

  const items = useMemo(() => toTreeItems(tree), [tree]);

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteMutation.mutateAsync(toDelete.id);
      toast.success(`Categoría "${toDelete.name}" eliminada`);
      setToDelete(null);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Categorías"
        subtitle="Estructura jerárquica del catálogo de productos."
        crumbs={[{ label: 'Catálogo' }, { label: 'Categorías' }]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
            onClick={() => router.push(paths.dashboard.catalog.categories.new)}
          >
            Nueva categoría
          </Button>
        }
      />

      <Card sx={{ p: 3 }}>
        {isError && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            action={
              <Button color="inherit" size="small" onClick={() => refetch()}>
                Reintentar
              </Button>
            }
          >
            {(error as Error)?.message ?? 'Error al cargar categorías'}
          </Alert>
        )}

        {isLoading && (
          <Stack alignItems="center" sx={{ py: 6 }}>
            <CircularProgress size={28} />
          </Stack>
        )}

        {!isLoading && items.length === 0 && !isError && (
          <EmptyState icon="inbox" title="Sin categorías" description="No hay categorías registradas." />
        )}

        {items.length > 0 && (
          <RichTreeView
            items={items}
            slots={{
              item: (props: TreeItemProps) => {
                const node = items
                  .flatMap(function flatten(i: TreeItemPayload): TreeItemPayload[] {
                    return [i, ...(i.children?.flatMap(flatten) ?? [])];
                  })
                  .find((i) => i.id === props.itemId);

                return (
                  <TreeItem
                    {...props}
                    label={
                      <Box
                        sx={{
                          py: 0.5,
                          gap: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body2">{node?.label}</Typography>
                          {node?.code && (
                            <Typography
                              variant="caption"
                              sx={{
                                px: 0.75,
                                borderRadius: 0.5,
                                color: 'text.secondary',
                                bgcolor: 'action.hover',
                              }}
                            >
                              {node.code}
                            </Typography>
                          )}
                          {node?.isPharmaceutical && (
                            <Iconify
                              icon="solar:heart-bold"
                              width={16}
                              sx={{ color: 'info.main' }}
                            />
                          )}
                        </Stack>

                        <Stack direction="row" spacing={0.5}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(paths.dashboard.catalog.categories.edit(props.itemId));
                            }}
                          >
                            <Iconify icon="solar:pen-bold" width={16} />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              setToDelete({ id: props.itemId, name: node?.label ?? '' });
                            }}
                          >
                            <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                          </IconButton>
                        </Stack>
                      </Box>
                    }
                  />
                );
              },
            }}
          />
        )}
      </Card>

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar categoría"
        description={
          toDelete ? (
            <>
              ¿Seguro que deseas eliminar la categoría <strong>{toDelete.name}</strong>? Si tiene
              subcategorías o productos, la operación puede fallar.
            </>
          ) : null
        }
        confirmLabel="Eliminar"
        loading={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </Container>
  );
}
