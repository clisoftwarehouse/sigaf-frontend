import type { SaleTicketDetail } from '../model/types';

import axios, { endpoints } from '@/shared/lib/axios';

// ----------------------------------------------------------------------

export async function fetchSaleTicket(id: string): Promise<SaleTicketDetail> {
  const res = await axios.get<SaleTicketDetail>(endpoints.sales.ticketById(id));
  return res.data;
}
