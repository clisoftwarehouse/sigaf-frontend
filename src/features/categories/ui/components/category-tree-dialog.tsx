import type { TreeItemProps } from '@mui/x-tree-view/TreeItem';
import type { CategoryTreeNode } from '../../model/types';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';

import { Iconify } from '@/app/components/iconify';

// ----------------------------------------------------------------------

type TreeItemPayload = {
  id: string;
  label: string;
  code: string | null;
  isPharmaceutical: boolean;
  children?: TreeItemPayload[];
};

function toTreeItems(nodes: CategoryTreeNode[]): TreeItemPayload[] {
  return nodes.map((node) => ({
    id: node.id,
    label: node.name,
    code: node.code,
    isPharmaceutical: node.isPharmaceutical,
    children: node.children.length ? toTreeItems(node.children) : undefined,
  }));
}

function findAncestors(
  nodes: TreeItemPayload[],
  targetId: string,
  path: string[] = []
): string[] | null {
  for (const node of nodes) {
    if (node.id === targetId) return path;
    if (node.children) {
      const found = findAncestors(node.children, targetId, [...path, node.id]);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Extrae solo la rama que contiene a `targetId`: desde la raíz baja un único
 * camino visitando solo el ancestro relevante en cada nivel y muestra todas
 * las hijas del nodo target. Las ramas hermanas se ocultan para que el
 * operador vea exactamente la jerarquía de su categoría sin ruido visual.
 */
function extractBranch(
  nodes: TreeItemPayload[],
  targetId: string
): TreeItemPayload[] | null {
  for (const node of nodes) {
    if (node.id === targetId) {
      // Encontramos el nodo target: lo retornamos con TODAS sus hijas.
      return [node];
    }
    if (node.children) {
      const subBranch = extractBranch(node.children, targetId);
      if (subBranch) {
        // El target está bajo este nodo: devolvemos este nodo con solo el
        // sub-árbol que llega al target (sin las hermanas de la rama target).
        return [{ ...node, children: subBranch }];
      }
    }
  }
  return null;
}

function flattenItems(nodes: TreeItemPayload[]): TreeItemPayload[] {
  return nodes.flatMap((n) => [n, ...(n.children ? flattenItems(n.children) : [])]);
}

// ----------------------------------------------------------------------

interface Props {
  open: boolean;
  onClose: () => void;
  tree: CategoryTreeNode[];
  focusId: string | null;
}

export function CategoryTreeDialog({ open, onClose, tree, focusId }: Props) {
  const allItems = useMemo(() => toTreeItems(tree), [tree]);
  // Si hay focusId, mostramos solo la rama que llega a esa categoría
  // (raíz → ... → focused → hijas). Las hermanas se ocultan para que el
  // operador vea exactamente la jerarquía relevante sin ruido.
  const items = useMemo(() => {
    if (!focusId) return allItems;
    return extractBranch(allItems, focusId) ?? allItems;
  }, [allItems, focusId]);
  const flat = useMemo(() => flattenItems(items), [items]);
  const expandedIds = useMemo(() => {
    if (!focusId) return [];
    const ancestors = findAncestors(items, focusId) ?? [];
    return [...ancestors, focusId];
  }, [items, focusId]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{focusId ? 'Rama de la categoría' : 'Árbol de categorías'}</DialogTitle>
      <DialogContent dividers sx={{ maxHeight: 500 }}>
        {items.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            No hay categorías.
          </Typography>
        ) : (
          <RichTreeView
            items={items}
            defaultExpandedItems={expandedIds}
            selectedItems={focusId}
            slots={{
              item: (props: TreeItemProps) => {
                const node = flat.find((i) => i.id === props.itemId);
                const isFocused = props.itemId === focusId;
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
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: isFocused ? 700 : 400 }}>
                          {node?.label}
                        </Typography>
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
                          <Iconify icon="solar:heart-bold" width={16} sx={{ color: 'info.main' }} />
                        )}
                      </Box>
                    }
                  />
                );
              },
            }}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ width: '100%', justifyContent: 'space-between' }}
        >
          <Chip
            size="small"
            variant="outlined"
            label={
              focusId
                ? `${flat.length} categorías en esta rama`
                : `${flat.length} categorías en total`
            }
          />
          <Button onClick={onClose}>Cerrar</Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
