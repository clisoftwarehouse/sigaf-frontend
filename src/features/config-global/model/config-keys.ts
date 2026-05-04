export type ConfigKeyMeta = {
  key: string;
  label: string;
  description?: string;
  unit?: string;
  type: 'integer' | 'decimal' | 'text';
};

export type ConfigGroup = {
  title: string;
  description?: string;
  keys: ConfigKeyMeta[];
};

export const CONFIG_GROUPS: ConfigGroup[] = [
  {
    title: 'Impuestos',
    keys: [
      {
        key: 'iva_general_pct',
        label: 'IVA general',
        description: 'Alícuota general de IVA aplicada por defecto.',
        unit: '%',
        type: 'decimal',
      },
      {
        key: 'iva_reduced_pct',
        label: 'IVA reducido',
        description: 'Alícuota reducida para productos especiales.',
        unit: '%',
        type: 'decimal',
      },
      {
        key: 'igtf_pct',
        label: 'IGTF',
        description: 'Impuesto a las Grandes Transacciones Financieras.',
        unit: '%',
        type: 'decimal',
      },
    ],
  },
  {
    title: 'Compras',
    description:
      'Tolerancias permitidas en la recepción contra la orden de compra. Si se exceden, la recepción se bloquea y requiere reaprobación.',
    keys: [
      {
        key: 'purchase_tolerance_quantity_pct',
        label: 'Tolerancia de cantidad',
        description: 'Cantidad recibida vs ordenada.',
        unit: '%',
        type: 'decimal',
      },
      {
        key: 'purchase_tolerance_cost_pct',
        label: 'Tolerancia de costo',
        description: 'Costo unitario factura vs OC.',
        unit: '%',
        type: 'decimal',
      },
    ],
  },
  {
    title: 'Alertas FEFO',
    description:
      'Umbrales en días para clasificar los lotes según proximidad de vencimiento.',
    keys: [
      {
        key: 'fefo_alert_days_orange',
        label: 'Alerta naranja',
        description: 'Lotes que vencen en este horizonte (días) se marcan en naranja.',
        unit: 'días',
        type: 'integer',
      },
      {
        key: 'fefo_alert_days_yellow',
        label: 'Alerta amarilla',
        description: 'Lotes que vencen en este horizonte (días) se marcan en amarillo.',
        unit: 'días',
        type: 'integer',
      },
      {
        key: 'fefo_alert_days_red',
        label: 'Alerta roja',
        description: 'Lotes que vencen en este horizonte (días) se marcan en rojo (crítico).',
        unit: 'días',
        type: 'integer',
      },
    ],
  },
];

export const KNOWN_CONFIG_KEYS = new Set(
  CONFIG_GROUPS.flatMap((g) => g.keys.map((k) => k.key))
);
