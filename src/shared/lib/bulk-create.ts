/**
 * Ejecuta una creación "masiva": corre `createOne` por cada id (ej. sucursal)
 * y junta cuántos salieron bien y cuáles fallaron, con su motivo legible. No
 * lanza: cada item se intenta independiente para que un fallo no aborte el
 * resto (típico: el código ya existe en una sucursal).
 */
export type BulkCreateResult = {
  okCount: number;
  failures: { id: string; label: string; reason: string }[];
};

function reasonOf(err: unknown): string {
  const r = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
  if (typeof r === 'string') return r;
  return (err as Error)?.message ?? 'Error desconocido';
}

export async function runBulkCreate(
  ids: string[],
  createOne: (id: string) => Promise<unknown>,
  labelOf: (id: string) => string,
): Promise<BulkCreateResult> {
  let okCount = 0;
  const failures: BulkCreateResult['failures'] = [];
  for (const id of ids) {
    try {
      await createOne(id);
      okCount += 1;
    } catch (err) {
      failures.push({ id, label: labelOf(id), reason: reasonOf(err) });
    }
  }
  return { okCount, failures };
}
