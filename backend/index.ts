import { router, json, error, db, requireAuth } from '@appdeploy/sdk';

type MenuLine = { id: string; quantity: number };
type ServiceType = 'delivery' | 'pickup';
type PaymentMethod = 'mobile-money-demo' | 'card-demo' | 'pay-on-pickup';
type Status = 'Confirmed' | 'Preparing' | 'Ready for Pickup' | 'Out for Delivery' | 'Completed';
type Dish = { id: string; name: string; price: number };
type OrderRecord = {
  ownerId: string;
  reference: string;
  items: Array<{ id: string; name: string; price: number; quantity: number; lineTotal: number }>;
  serviceType: ServiceType; deliveryAddress: string; voucherCode: string; subtotal: number;
  deliveryFee: number; discount: number; total: number; paymentMethod: PaymentMethod;
  paymentStatus: string; status: Status; createdAt: string;
};
const MENU: Dish[] = [
  {id:'coconut-fish-curry',name:'Coconut Fish Curry',price:18000},{id:'zanzibar-pilau',name:'Zanzibar Pilau Bowl',price:14000},
  {id:'chapati-coconut-beans',name:'Chapati & Coconut Beans',price:9500},{id:'grilled-lime-prawns',name:'Grilled Lime Prawns',price:22000},
  {id:'cassava-crisps',name:'Cassava Crisps',price:6500},{id:'spiced-iced-coffee',name:'Spiced Iced Coffee',price:7000},
  {id:'mango-lime-cooler',name:'Mango Lime Cooler',price:5500},{id:'banana-pancakes',name:'Sweet Banana Pancakes',price:8500},
  {id:'tropical-fruit-bowl',name:'Tropical Fruit Bowl',price:8000},{id:'spiced-chips',name:'Zanzibar Spiced Chips',price:7500},
  {id:'coconut-vegetable-rice',name:'Coconut Vegetable Rice',price:12000},{id:'passion-cooler',name:'Passion Fruit Cooler',price:6000}
];
const VOUCHERS: Record<string,{min:number;kind:'percent'|'fixed';value:number}> = {
  PWANI10:{min:20000,kind:'percent',value:10},KARIBU15:{min:30000,kind:'percent',value:15},ISLAND5000:{min:40000,kind:'fixed',value:5000}
};
const newReference = () => 'PW-'+Math.random().toString(36).slice(2,8).toUpperCase();
function nextStatus(order:OrderRecord):Status {
  if(order.status==='Confirmed') return 'Preparing';
  if(order.status==='Preparing') return order.serviceType==='pickup'?'Ready for Pickup':'Out for Delivery';
  return 'Completed';
}
async function getOwnedOrder(id:string, ownerId:string) {
  const [record] = await db.get<OrderRecord>('restaurant_orders',[id]);
  return record && record.ownerId===ownerId ? record : null;
}

export const handler = router({
  'GET /api/health':[async()=>json({ok:true,mode:'demo'})],
  'GET /api/orders':[
    requireAuth(),
    async(ctx)=>{
      const page=await db.list<OrderRecord>('restaurant_orders',{limit:100});
      const orders=page.items.filter(order=>order.ownerId===ctx.user!.userId)
        .sort((a,b)=>b.createdAt.localeCompare(a.createdAt))
        .map(({ownerId:_ownerId,...order})=>({...order,id:order.id}));
      return json({orders,hasMore:Boolean(page.nextToken)});
    }
  ],
  'POST /api/orders':[
    requireAuth(),
    async(ctx)=>{
      const body=ctx.body as {items?:MenuLine[];serviceType?:ServiceType;deliveryAddress?:string;voucherCode?:string;paymentMethod?:PaymentMethod;demoPaymentStatus?:string};
      if(!body||!Array.isArray(body.items)||body.items.length<1||body.items.length>MENU.length) return error('Add at least one valid menu item before placing an order.',400);
      if(body.serviceType!=='delivery'&&body.serviceType!=='pickup') return error('Choose delivery or pickup.',400);
      if(body.serviceType==='delivery'&&(typeof body.deliveryAddress!=='string'||body.deliveryAddress.trim().length<8)) return error('A valid demo delivery address is required.',400);
      if(!['mobile-money-demo','card-demo','pay-on-pickup'].includes(body.paymentMethod||'')) return error('Choose a demo payment method.',400);
      if(body.paymentMethod!=='pay-on-pickup'&&body.demoPaymentStatus!=='succeeded') return error('Demo payment has not been marked successful.',400);
      const quantities=new Map<string,number>();
      for(const item of body.items){
        if(!item||typeof item.id!=='string'||!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>30) return error('Each quantity must be between 1 and 30.',400);
        if(!MENU.some(dish=>dish.id===item.id)) return error('An item is not part of this sample menu.',400);
        quantities.set(item.id,(quantities.get(item.id)||0)+item.quantity);
      }
      const items=[...quantities.entries()].map(([id,quantity])=>{
        const dish=MENU.find(candidate=>candidate.id===id)!;
        return {id,name:dish.name,price:dish.price,quantity,lineTotal:dish.price*quantity};
      });
      if(items.some(item=>item.quantity>30)) return error('Each dish has a maximum demo quantity of 30.',400);
      const subtotal=items.reduce((sum,item)=>sum+item.lineTotal,0);
      const voucherCode=typeof body.voucherCode==='string'?body.voucherCode.trim().toUpperCase():'';
      const voucher=VOUCHERS[voucherCode];
      if(voucherCode&&(!voucher||subtotal<voucher.min)) return error('The voucher is invalid for this order total.',400);
      const discount=voucher?(voucher.kind==='percent'?Math.round(subtotal*voucher.value/100):Math.min(voucher.value,subtotal)):0;
      const deliveryFee=body.serviceType==='delivery'?3500:0;
      const record:OrderRecord={
        ownerId:ctx.user!.userId,reference:newReference(),items,serviceType:body.serviceType,
        deliveryAddress:body.serviceType==='delivery'?body.deliveryAddress!.trim().slice(0,500):'',
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
      const next={...current,status:nextStatus(current)};
      const [ok]=await db.update('restaurant_orders',[{id:ctx.params.id,record:next as unknown as Record<string,unknown>}]);
      if(!ok) return error('The demo order could not be updated.',500);
      const {ownerId:_ownerId,...publicOrder}=next;
      return json({order:{...publicOrder,id:ctx.params.id}});
    }
  ]
});