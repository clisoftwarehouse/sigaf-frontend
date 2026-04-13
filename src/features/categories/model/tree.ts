import type { Category, CategoryTreeNode } from './types';

type CategoryRaw = Category & { children?: CategoryRaw[] };

/**
 * Accept either a flat array or a partially-nested tree from the backend
 * and return a fully-built `CategoryTreeNode[]` rooted at the categories
 * with `parentId === null`.
 */
export function buildCategoryTree(input: CategoryRaw[]): CategoryTreeNode[] {
  const isAlreadyNested = input.some((c) => Array.isArray(c.children) && c.children.length > 0);

  if (isAlreadyNested) {
    const ensureChildren = (node: CategoryRaw): CategoryTreeNode => ({
      ...node,
      children: (node.children ?? []).map(ensureChildren),
    });
    return input.filter((c) => c.parentId === null).map(ensureChildren);
  }

  const byId = new Map<string, CategoryTreeNode>();
  input.forEach((c) => byId.set(c.id, { ...c, children: [] }));

  const roots: CategoryTreeNode[] = [];
  byId.forEach((node) => {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

export function flattenCategoryTree(tree: CategoryTreeNode[]): Category[] {
  const out: Category[] = [];
  const visit = (node: CategoryTreeNode) => {
    const { children, ...rest } = node;
    out.push(rest);
    children.forEach(visit);
  };
  tree.forEach(visit);
  return out;
}
