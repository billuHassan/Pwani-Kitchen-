import { router, json, error, db, requireAuth } from '@appdeploy/sdk';
import {
  buildOrderItems,
  calculateVoucherDiscount,
  nextStatus,
  type OrderItem,
  type PaymentMethod,
  type ServiceType,
  type Status,
} from './orderLogic';

type OrderRecord = {
  ownerId: string;
  reference: string;
  items: OrderItem[];
  serviceType: ServiceType; deliveryAddress: string; voucherCode: string; subtotal: number;
  deliveryFee: number; discount: number; total: number; paymentMethod: PaymentMethod;
  paymentStatus: string; status: Status; createdAt: string;
};
const newReference = () => 'PW-'+Math.random().toString(36).slice(2,8).toUpperCase();
async function getOwnedOrder(id:string, ownerId:string) {
  const [record] = await db.get<OrderRecord>('restaurant_orders',[id]);
  return record && record.ownerId===ownerId ? record : null;
}
async function listOwnedOrders(ownerId:string) {
  let nextToken: string | undefined;
  const owned: Array<OrderRecord & { id?: string }> = [];

  do {
    const page = await db.list<OrderRecord>('restaurant_orders', nextToken ? {limit:100,nextToken} : {limit:100});
    owned.push(...page.items.filter(order=>order.ownerId===ownerId));
    nextToken = page.nextToken;
  } while (nextToken);

  return owned;
}

export const handler = router({
  'GET /api/health':[async()=>json({ok:true,mode:'demo'})],
  'GET /api/orders':[
    requireAuth(),
    async(ctx)=>{
      const owned=await listOwnedOrders(ctx.user!.userId);
      const orders=owned
        .sort((a,b)=>b.createdAt.localeCompare(a.createdAt))
        .map(({ownerId:_ownerId,...order})=>({...order,id:order.id}));
      return json({orders,hasMore:false});
    }
  ],
  'POST /api/orders':[
    requireAuth(),
    async(ctx)=>{
      const body=ctx.body as {items?:unknown;serviceType?:ServiceType;deliveryAddress?:string;voucherCode?:string;paymentMethod?:PaymentMethod;demoPaymentStatus?:string};
      if(!body) return error('Add at least one valid menu item before placing an order.',400);
      if(body.serviceType!=='delivery'&&body.serviceType!=='pickup') return error('Choose delivery or pickup.',400);
      if(body.serviceType==='delivery'&&(typeof body.deliveryAddress!=='string'||body.deliveryAddress.trim().length<8)) return error('A valid demo delivery address is required.',400);
      if(!['mobile-money-demo','card-demo','pay-on-pickup'].includes(body.paymentMethod||'')) return error('Choose a demo payment method.',400);
      if(body.paymentMethod!=='pay-on-pickup'&&body.demoPaymentStatus!=='succeeded') return error('Demo payment has not been marked successful.',400);
      const builtItems=buildOrderItems(body.items);
      if(!builtItems.ok) return error(builtItems.message,builtItems.status);
      const items=builtItems.value;
      const subtotal=items.reduce((sum,item)=>sum+item.lineTotal,0);
      const voucherCode=typeof body.voucherCode==='string'?body.voucherCode.trim().toUpperCase():'';
      const voucherDiscount=calculateVoucherDiscount(voucherCode,subtotal);
      if(!voucherDiscount.ok) return error(voucherDiscount.message,voucherDiscount.status);
      const discount=voucherDiscount.value;
      const deliveryFee=body.serviceType==='delivery'?3500:0;
      const record:OrderRecord={
        ownerId:ctx.user!.userId,reference:newReference(),items,serviceType:body.serviceType,
        // The demo validates delivery addresses but intentionally does not persist personal address data.
        deliveryAddress:'',
        voucherCode,subtotal,deliveryFee,discount,total:Math.max(0,subtotal+deliveryFee-discount),
        paymentMethod:body.paymentMethod!,paymentStatus:body.paymentMethod==='pay-on-pickup'?'Pay on pickup':'Demo payment successful — no money was charged',
        status:'Confirmed',createdAt:new Date().toISOString()
      };
      const [id]=await db.add('restaurant_orders',[record as unknown as Record<string,unknown>]);
      if(!id) return error('We could not store your demo order. Please try again.',500);
      const {ownerId:_ownerId,...publicOrder}=record;
      return json({order:{...publicOrder,id}},201);
    }
  ],
  'POST /api/orders/:id/progress':[
    requireAuth(),
    async(ctx)=>{
      const current=await getOwnedOrder(ctx.params.id,ctx.user!.userId);
      if(!current) return error('Order not found.',404);
      if(current.status==='Completed') return error('Order is already completed.',409);
      const next={...current,status:nextStatus(current.status,current.serviceType)};
      const [ok]=await db.update('restaurant_orders',[{id:ctx.params.id,record:next as unknown as Record<string,unknown>}]);
      if(!ok) return error('The demo order could not be updated.',500);
      const {ownerId:_ownerId,...publicOrder}=next;
      return json({order:{...publicOrder,id:ctx.params.id}});
    }
  ]
});
