import { useEffect, useMemo, useState } from 'react';
import { api, auth } from '@appdeploy/client';
import {
  DEFAULT_TOPPING,
  addCartLine,
  changeCartLineQuantity,
  normalizeDishChoice,
  restoreCartLines,
  type CartLine,
  type DishChoice,
} from './cart';
import {
  ArrowRight, Check, ChevronDown, Clock3, CreditCard, Leaf, LogIn,
  LogOut, Minus, PackageCheck, Plus, Search, ShoppingBag, ShoppingCart,
  Smartphone, Store, TicketPercent, UserRound, Utensils, Waves, X
} from 'lucide-react';

type Category = 'All' | 'Burgers' | 'Pizza' | 'Chicken' | 'Rice' | 'Sides' | 'Drinks';
type ServiceType = 'delivery' | 'pickup';
type PaymentMethod = 'mobile-money-demo' | 'card-demo' | 'pay-on-pickup';
type OrderStatus = 'Confirmed' | 'Preparing' | 'Ready for Pickup' | 'Out for Delivery' | 'Completed';
type View = 'home' | 'menu' | 'detail' | 'cart' | 'checkout' | 'confirmation' | 'orders' | 'account';
type Dish = { id: string; name: string; description: string; price: number; category: Exclude<Category, 'All'>; image: string; tag?: string; preparation: string; flavours: string[]; toppings: string[]; rating: number; ratingCount: number };
type DishReview = { dishId: string; rating: number; comment: string; createdAt: string };
type User = { userId: string; email?: string; name?: string; picture?: string; scope: string };
type PlacedOrder = {
  id: string; reference: string; items: Array<{id: string; name: string; price: number; quantity: number; lineTotal: number; flavour: string; topping: string}>;
  serviceType: ServiceType; deliveryAddress: string; voucherCode: string; subtotal: number;
  deliveryFee: number; discount: number; total: number; paymentMethod: PaymentMethod; paymentStatus: string;
  status: OrderStatus; createdAt: string;
};

const restaurantName = 'TAWAKKAL RESTAURANT';
const cartStoreKey = 'tawakkal-cart-v1';
const reviewStoreKey = 'tawakkal-local-reviews-v1';
const guestOrdersStoreKey = 'tawakkal-guest-orders-v1';
const choiceStoreKey = (dishId: string) => 'tawakkal-choice-'+dishId;
const money = (value: number) => new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(value);
const menu: Dish[] = [
  {id:'classic-beef-burger',name:'Classic Beef Burger',description:'Juicy beef patty, soft bun, house sauce and crisp salad.',price:12000,category:'Burgers',image:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85',tag:'House favourite',preparation:'The beef patty is grilled to order, layered with house sauce, lettuce, tomato and a toasted bun for a familiar fast-food classic.',flavours:['Classic grill','Peri peri','Smoky BBQ'],toppings:['Cheese slice','Caramelized onions','Pickles','No extra topping'],rating:4.8,ratingCount:142},
  {id:'double-cheese-burger',name:'Double Cheese Burger',description:'Two beef patties with melted cheese and burger sauce.',price:16000,category:'Burgers',image:'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=85',tag:'Big appetite',preparation:'Two seasoned patties are stacked with melted cheese, toasted buns and a rich burger sauce.',flavours:['Classic grill','Smoky BBQ','Chilli beef'],toppings:['Extra cheese','Pickles','Crispy onions','No extra topping'],rating:4.7,ratingCount:98},
  {id:'zinger-chicken-burger',name:'Zinger Chicken Burger',description:'Crispy chicken fillet with creamy sauce and lettuce.',price:13500,category:'Chicken',image:'https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=900&q=85',preparation:'Chicken is coated, fried until crisp, then finished with lettuce and sauce in a toasted bun.',flavours:['Original crispy','Hot zinger','Garlic mayo'],toppings:['Cheese slice','Lettuce crunch','Jalapenos','No extra topping'],rating:4.8,ratingCount:121},
  {id:'margherita-pizza',name:'Margherita Pizza',description:'Tomato sauce, mozzarella and herbs on a golden crust.',price:18000,category:'Pizza',image:'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=85',preparation:'The pizza is baked with tomato sauce, mozzarella and herbs until the crust is golden and crisp at the edge.',flavours:['Classic tomato','Extra basil','Garlic crust'],toppings:['Extra mozzarella','Olives','Sweet corn','No extra topping'],rating:4.6,ratingCount:85},
  {id:'chicken-supreme-pizza',name:'Chicken Supreme Pizza',description:'Chicken, vegetables, cheese and a generous house sauce.',price:23000,category:'Pizza',image:'https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=900&q=85',tag:'Shareable',preparation:'A golden pizza base is topped with chicken, vegetables, cheese and a choice of house sauce style.',flavours:['BBQ chicken','Peri peri chicken','Creamy ranch'],toppings:['Extra chicken','Mushrooms','Green peppers','No extra topping'],rating:4.9,ratingCount:112},
  {id:'loaded-fries',name:'Loaded Fries',description:'Crisp fries with sauce options and hearty toppings.',price:9000,category:'Sides',image:'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=85',preparation:'Fries are cooked until crisp, seasoned, and finished with the selected sauce or topping.',flavours:['Salted','Masala','Peri peri'],toppings:['Cheese sauce','Garlic mayo','Chicken bits','No extra topping'],rating:4.6,ratingCount:77},
  {id:'grilled-sausage-plate',name:'Grilled Sausage Plate',description:'Grilled sausages with a quick side and sauce choice.',price:8500,category:'Sides',image:'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=900&q=85',preparation:'Sausages are grilled and served with the selected topping or side for a quick fast-food plate.',flavours:['Original','Chilli garlic','BBQ glaze'],toppings:['Kachumbari','Mustard drizzle','Chips side','No extra topping'],rating:4.5,ratingCount:56},
  {id:'crispy-chicken-pieces',name:'Crispy Chicken Pieces',description:'Golden fried chicken pieces with a sauce of your choice.',price:15000,category:'Chicken',image:'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=900&q=85',tag:'Crispy pick',preparation:'Chicken pieces are seasoned, coated and fried until golden, then served with your preferred dip.',flavours:['Original crispy','Hot and spicy','Lemon herb'],toppings:['Garlic dip','Chilli sauce','Coleslaw','No extra topping'],rating:4.8,ratingCount:134},
  {id:'chicken-biryani',name:'Chicken Biryani',description:'Aromatic biryani rice with tender chicken and spices.',price:17000,category:'Rice',image:'https://images.unsplash.com/photo-1631515242808-497c3fbd3972?auto=format&fit=crop&w=900&q=85',tag:'Rice favourite',preparation:'Rice and chicken are cooked with layered spices for a fragrant biryani plate with optional sides.',flavours:['Mild spice','House spice','Extra hot'],toppings:['Boiled egg','Kachumbari','Raita','No extra topping'],rating:4.9,ratingCount:156},
  {id:'beef-biryani',name:'Beef Biryani',description:'Spiced biryani rice with slow-cooked beef pieces.',price:18500,category:'Rice',image:'https://images.unsplash.com/photo-1599043513900-ed6fe01d3833?auto=format&fit=crop&w=900&q=85',preparation:'Beef is cooked until tender and served over aromatic biryani rice with the selected topping.',flavours:['Mild spice','House spice','Extra hot'],toppings:['Boiled egg','Kachumbari','Raita','No extra topping'],rating:4.7,ratingCount:88},
  {id:'chicken-pilau',name:'Chicken Pilau',description:'Classic pilau rice served with chicken and fresh sides.',price:15500,category:'Rice',image:'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=85',preparation:'Rice is cooked with warm pilau spices and served with chicken and your selected topping.',flavours:['Classic pilau','Extra aromatic','Chilli pilau'],toppings:['Kachumbari','Crispy onions','Lime wedge','No extra topping'],rating:4.8,ratingCount:101},
  {id:'mango-passion-juice',name:'Mango Passion Juice',description:'Cold mango and passion fruit juice for a bright finish.',price:5000,category:'Drinks',image:'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=900&q=85',preparation:'Mango and passion fruit are blended and chilled for a refreshing fast-food drink.',flavours:['Mango passion','Extra lime','Less sweet'],toppings:['Fresh mint','Ice cubes','Chia sprinkle','No extra topping'],rating:4.7,ratingCount:73}
];
const categories: Category[] = ['All','Burgers','Pizza','Chicken','Rice','Sides','Drinks'];
const vouchers = {
  TAWAKKAL10: { label:'10% off', min:20000, kind:'percent', value:10, description:'10% off orders of TZS 20,000 or more' },
  FAMILY15: { label:'15% off', min:45000, kind:'percent', value:15, description:'15% off family orders of TZS 45,000 or more' },
  FAST5000: { label:'TZS 5,000 off', min:50000, kind:'fixed', value:5000, description:'TZS 5,000 off orders of TZS 50,000 or more' }
} as const;
const gallery = [
  {src:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85',alt:'Sample burger meal'},
  {src:'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=85',alt:'Sample pizza'},
  {src:'https://images.unsplash.com/photo-1631515242808-497c3fbd3972?auto=format&fit=crop&w=900&q=85',alt:'Sample biryani rice'}
];

function readStorage<T>(key: string, fallback: T): T {
  try { if (typeof window === 'undefined') return fallback; const value = window.localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; }
  catch { return fallback; }
}
function Image({src,alt,className=''}:{src:string;alt:string;className?:string}) {
  const [failed,setFailed] = useState(false);
  return failed ? <div className={'image-fallback '+className} role="img" aria-label={alt}><Utensils size={25}/><span>Sample food image</span></div> : <img src={src} alt={alt} className={className} loading="lazy" onError={()=>setFailed(true)}/>;
}
function voucherDiscount(code:string,subtotal:number) {
  const voucher = vouchers[code.toUpperCase() as keyof typeof vouchers];
  if (!voucher || subtotal < voucher.min) return 0;
  return voucher.kind === 'percent' ? Math.round(subtotal*voucher.value/100) : Math.min(voucher.value,subtotal);
}
function advanceStatus(order:PlacedOrder):OrderStatus {
  if(order.status==='Confirmed') return 'Preparing';
  if(order.status==='Preparing') return order.serviceType==='pickup' ? 'Ready for Pickup' : 'Out for Delivery';
  return 'Completed';
}

function App() {
  const [view,setView] = useState<View>('home');
  const [selectedDishId,setSelectedDishId] = useState('coconut-fish-curry');
  const [detailFlavour,setDetailFlavour] = useState('');
  const [detailTopping,setDetailTopping] = useState(DEFAULT_TOPPING);
  const [reviews,setReviews] = useState<DishReview[]>(()=>readStorage<DishReview[]>(reviewStoreKey,[]));
  const [reviewRating,setReviewRating] = useState(5);
  const [reviewText,setReviewText] = useState('');
  const [cartDetailMessage,setCartDetailMessage] = useState('');
  const [category,setCategory] = useState<Category>('All');
  const [query,setQuery] = useState('');
  const [mobileOpen,setMobileOpen] = useState(false);
  const [cart,setCart] = useState<CartLine<Dish>[]>(()=>restoreCartLines(readStorage<unknown>(cartStoreKey,[]),menu));
  const [user,setUser] = useState<User|null>(null);
  const [orders,setOrders] = useState<PlacedOrder[]>([]);
  const [guestOrders,setGuestOrders] = useState<PlacedOrder[]>(()=>readStorage<PlacedOrder[]>(guestOrdersStoreKey,[]));
  const [latestOrder,setLatestOrder] = useState<PlacedOrder|null>(null);
  const [notice,setNotice] = useState('');
  const [noticeKind,setNoticeKind] = useState<'success'|'error'|'info'>('info');
  const [serviceType,setServiceType] = useState<ServiceType>('delivery');
  const [deliveryAddress,setDeliveryAddress] = useState('');
  const [paymentMethod,setPaymentMethod] = useState<PaymentMethod>('mobile-money-demo');
  const [voucherInput,setVoucherInput] = useState('');
  const [appliedVoucher,setAppliedVoucher] = useState('');
  const [voucherMessage,setVoucherMessage] = useState('');
  const [simulateFailure,setSimulateFailure] = useState(false);

  const subtotal = useMemo(()=>cart.reduce((sum,line)=>sum+line.dish.price*line.quantity,0),[cart]);
  const deliveryFee = serviceType==='delivery' ? 3500 : 0;
  const discount = voucherDiscount(appliedVoucher,subtotal);
  const total = Math.max(0,subtotal+deliveryFee-discount);
  const filtered = useMemo(()=>menu.filter(dish=>{
    const matchesCategory = category==='All' || dish.category===category;
    const matchesSearch = (dish.name+' '+dish.description).toLowerCase().includes(query.trim().toLowerCase());
    return matchesCategory && matchesSearch;
  }),[category,query]);
  const cartCount = cart.reduce((sum,line)=>sum+line.quantity,0);
  const selectedDish = menu.find(dish=>dish.id===selectedDishId) || menu[0];
  const selectedDishReviews = reviews.filter(review=>review.dishId===selectedDish.id);
  const customerRatingCount = selectedDish.ratingCount + selectedDishReviews.length;
  const customerRating = customerRatingCount ? ((selectedDish.rating*selectedDish.ratingCount)+selectedDishReviews.reduce((sum,review)=>sum+review.rating,0))/customerRatingCount : selectedDish.rating;

  useEffect(()=>{ window.localStorage.setItem(cartStoreKey,JSON.stringify(cart)); },[cart]);
  useEffect(()=>{ window.localStorage.setItem(reviewStoreKey,JSON.stringify(reviews)); },[reviews]);
  useEffect(()=>{
    let active = true;
    const restoreUser = async()=>{ if(auth.isSignedIn()){ const restored = await auth.getUser(); if(active) setUser(restored); } };
    void restoreUser().catch(()=>{if(active) setNotice('We could not restore your sign-in. Please sign in again.');});
    return ()=>{active=false;};
  },[]);

  const inform = (message:string,kind:'success'|'error'|'info'='info')=>{setNotice(message);setNoticeKind(kind);};
  const openDish = (dish:Dish)=>{
    setSelectedDishId(dish.id);
    const saved=normalizeDishChoice(dish,readStorage<DishChoice>(choiceStoreKey(dish.id),{flavour:dish.flavours[0],topping:DEFAULT_TOPPING}));
    setDetailFlavour(saved.flavour);setDetailTopping(saved.topping);setCartDetailMessage('');setReviewText('');setReviewRating(5);setView('detail');
    window.scrollTo({top:0,behavior:'smooth'});
  };
  const saveDishChoice = (dishId:string,choice:DishChoice)=>{
    try{window.localStorage.setItem(choiceStoreKey(dishId),JSON.stringify(choice));}
    catch{inform('Choice could not be saved in this browser.','error');}
  };
  const addToCart = (dish:Dish,choice?:DishChoice)=>{
    const chosen=normalizeDishChoice(dish,choice || readStorage<DishChoice>(choiceStoreKey(dish.id),{flavour:dish.flavours[0],topping:DEFAULT_TOPPING}));
    setCart(current=>addCartLine(current,dish,chosen));
    saveDishChoice(dish.id,chosen);
    setCartDetailMessage(dish.name+' added with '+chosen.flavour+' flavour and '+chosen.topping.toLowerCase()+'.');
    inform(dish.name+' added to your cart.','success');
  };
  const submitReview = ()=>{
    const comment=reviewText.trim();
    if(comment.length<5){inform('Please write at least 5 characters for your review.','error');return;}
    const review:DishReview={dishId:selectedDish.id,rating:reviewRating,comment:comment.slice(0,400),createdAt:new Date().toISOString()};
    setReviews(current=>[review,...current]);setReviewText('');inform('Thanks! Your demo review was saved in this browser.','success');
  };
  const changeQuantity = (lineId:string,amount:number)=>setCart(current=>changeCartLineQuantity(current,lineId,amount));
  const signIn = async()=>{
    try { const result=await auth.signIn(); setUser(result.user); setView('account'); inform('Signed in. Your orders can be saved securely to your account.','success'); }
    catch(cause){const code=(cause as {code?:string})?.code; if(code==='popup_closed') inform('Sign-in was cancelled. Try again whenever you are ready.'); else if(code==='popup_blocked') inform('Your browser blocked the sign-in popup. Allow popups for this site and try again.','error'); else inform('Sign-in did not complete. Please try again.','error');}
  };
  const signOut = async()=>{
    try { await auth.signOut(); setUser(null); setOrders([]); setView('home'); inform('You are signed out. Guest orders remain only in this browser.','success'); }
    catch {inform('We could not complete sign-out. Please try again.','error');}
  };
  const showOrders = async()=>{
    setView('orders'); setNotice('');
    if(!user){setOrders([]);return;}
    try {const response=await api.get('/api/orders');setOrders(response.data.orders as PlacedOrder[]);}
    catch {inform('We could not load saved orders. Please retry.','error');}
  };
  const applyVoucher = ()=>{
    const code=voucherInput.trim().toUpperCase();
    const voucher=vouchers[code as keyof typeof vouchers];
    if(!code){setAppliedVoucher('');setVoucherMessage('Enter a voucher code first.');return;}
    if(!voucher){setAppliedVoucher('');setVoucherMessage('That code is not recognised. Check the sample list below.');return;}
    if(subtotal<voucher.min){setAppliedVoucher('');setVoucherMessage('This voucher requires a food subtotal of '+money(voucher.min)+' or more.');return;}
    setAppliedVoucher(code);setVoucherInput(code);setVoucherMessage(voucher.label+' applied successfully.');
  };
  const placeOrder = async()=>{
    if(cart.length===0){inform('Your cart is empty. Add a dish before checkout.','error');setView('menu');return;}
    if(serviceType==='delivery'&&deliveryAddress.trim().length<8){inform('Enter a delivery address with at least 8 characters.','error');return;}
    if(paymentMethod!=='pay-on-pickup'&&simulateFailure){inform('Demo payment failed. No order was created and your cart remains available for retry.','error');return;}
    const items=cart.map(line=>({id:line.dish.id,name:line.dish.name,price:line.dish.price,quantity:line.quantity,lineTotal:line.dish.price*line.quantity,flavour:line.flavour,topping:line.topping}));
    const order:PlacedOrder={
      id:'guest-'+Date.now().toString(36),reference:'TW-'+Math.random().toString(36).slice(2,8).toUpperCase(),items,
      serviceType,deliveryAddress:'',voucherCode:appliedVoucher,
      subtotal,deliveryFee,discount,total,paymentMethod,paymentStatus:paymentMethod==='pay-on-pickup'?'Pay on pickup':'Demo payment successful — no money charged',
      status:'Confirmed',createdAt:new Date().toISOString()
    };
    try {
      let saved=order;
      if(user){
        const result=await api.post('/api/orders',{items:cart.map(line=>({id:line.dish.id,quantity:line.quantity,flavour:line.flavour,topping:line.topping})),serviceType,deliveryAddress:serviceType==='delivery'?deliveryAddress.trim():'',voucherCode:appliedVoucher,paymentMethod,demoPaymentStatus:paymentMethod==='pay-on-pickup'?'not-required':'succeeded'});
        saved=result.data.order as PlacedOrder;
        setOrders(current=>[saved,...current.filter(existing=>existing.id!==saved.id)]);
      } else {
        const next=[order,...guestOrders]; setGuestOrders(next); window.localStorage.setItem(guestOrdersStoreKey,JSON.stringify(next));
      }
      setLatestOrder(saved);setCart([]);setAppliedVoucher('');setVoucherInput('');setVoucherMessage('');setView('confirmation');inform('Your demo order has been placed.','success');
    } catch(cause) {inform((cause as {message?:string})?.message||'We could not save your order. Your cart was kept so you can retry.','error');}
  };
  const progressOrder = async(order:PlacedOrder)=>{
    try {
      let updated:PlacedOrder;
      if(user){const result=await api.post('/api/orders/'+encodeURIComponent(order.id)+'/progress',{});updated=result.data.order as PlacedOrder;setOrders(current=>current.map(item=>item.id===updated.id?updated:item));}
      else {updated={...order,status:advanceStatus(order)};const next=guestOrders.map(item=>item.id===order.id?updated:item);setGuestOrders(next);window.localStorage.setItem(guestOrdersStoreKey,JSON.stringify(next));}
      setLatestOrder(current=>current?.id===updated.id?updated:current);inform('Demo order status is now '+updated.status+'.','success');
    } catch {inform('We could not update the order status. Please retry.','error');}
  };
  const openCheckout=()=>{if(!cart.length){inform('Choose a dish to get started.');setView('menu');}else{setView('checkout');setNotice('');}};
  const displayOrders=user?orders:guestOrders;
  const formatOrderItem = (item:PlacedOrder['items'][number]) => item.name+' × '+item.quantity+' · '+item.flavour+' · '+item.topping;

  const dishCard=(dish:Dish)=>(
    <article className="order-dish-card" key={dish.id}>
      <div className="order-dish-photo dish-photo-clickable" onClick={()=>openDish(dish)} role="button" tabIndex={0} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openDish(dish);}}} aria-label={'Open details for '+dish.name}><Image src={dish.image} alt={'Sample image for '+dish.name} className="order-dish-image"/>{dish.tag&&<span className="order-dish-tag">{dish.tag}</span>}<button className="quick-add" onClick={event=>{event.stopPropagation();addToCart(dish);}} aria-label={'Quick add '+dish.name+' to cart'}><Plus size={16}/> Quick add</button></div>
      <div className="order-dish-content"><button className="dish-title-button" onClick={()=>openDish(dish)}><span className="order-dish-category">{dish.category}</span><span className="order-dish-title-row"><h3>{dish.name}</h3><strong>{money(dish.price)}</strong></span></button><div className="dish-card-rating"><span className="rating-stars" aria-label={dish.rating+' out of 5 stars'}>★★★★★</span><strong>{dish.rating.toFixed(1)}</strong><span>({dish.ratingCount} sample ratings)</span></div><p>{dish.description}</p><div className="dish-card-actions"><button className="add-inline" onClick={()=>openDish(dish)}>View details <ArrowRight size={14}/></button><button className="add-inline" onClick={()=>addToCart(dish)}><Plus size={14}/> Add</button></div></div>
    </article>
  );
  const summary=()=>(
    <aside className="order-summary"><div className="summary-heading"><h3>Order summary</h3><span>{cartCount} item{cartCount===1?'':'s'}</span></div><div className="summary-line"><span>Food subtotal</span><strong>{money(subtotal)}</strong></div><div className="summary-line"><span>Delivery fee</span><strong>{deliveryFee?money(deliveryFee):'Free'}</strong></div>{discount>0&&<div className="summary-line discount-line"><span>Voucher · {appliedVoucher}</span><strong>−{money(discount)}</strong></div>}<div className="summary-total"><span>Total</span><strong>{money(total)}</strong></div></aside>
  );
  const header=()=>(
    <>
      <div className="demo-bar"><span className="demo-dot"/> {restaurantName} ordering demo <span className="demo-divider">/</span> No real payments</div>
      <header className="order-header">
        <button className="brand order-brand" onClick={()=>{setView('home');setMobileOpen(false);}} aria-label={restaurantName+' home'}><span className="brand-mark"><Waves size={23}/></span><span className="brand-copy"><strong>Tawakkal<span>.</span></strong><small>R E S T A U R A N T</small></span></button>
        <button className="mobile-toggle" onClick={()=>setMobileOpen(!mobileOpen)} aria-label={mobileOpen?'Close navigation':'Open navigation'} aria-expanded={mobileOpen}>{mobileOpen?<X size={21}/>:<ChevronDown size={21}/>}</button>
        <nav className={'order-nav '+(mobileOpen?'order-nav-open':'')} aria-label="Main navigation">
          <button className={view==='home'?'nav-active':''} onClick={()=>{setView('home');setMobileOpen(false);}}>Home</button><button className={view==='menu'?'nav-active':''} onClick={()=>{setView('menu');setMobileOpen(false);}}>Order online</button><button onClick={()=>{void showOrders();setMobileOpen(false);}}>My orders</button><button onClick={()=>{setView('account');setMobileOpen(false);}}>{user?'My account':'Sign in'}</button><button className="nav-cart" onClick={()=>{setView('cart');setMobileOpen(false);}}><ShoppingCart size={17}/> Cart <span>{cartCount}</span></button>
        </nav>
        <button className="header-signin" onClick={()=>user?setView('account'):void signIn()}>{user?<UserRound size={17}/>:<LogIn size={17}/>} {user?(user.name||'Account'):'Sign in'}</button>
      </header>
      {mobileOpen&&<button className="order-nav-backdrop" aria-label="Close navigation" onClick={()=>setMobileOpen(false)}/>}
    </>
  );

  return <div className="pwani-app">
    {header()}
    {notice&&<div className={'app-notice notice-'+noticeKind} role="status"><span>{notice}</span><button onClick={()=>setNotice('')} aria-label="Dismiss message"><X size={16}/></button></div>}
    <main className="order-main">
      {view==='home'&&<>
        <section className="order-hero"><div className="order-hero-copy"><span className="order-eyebrow"><span/> FAST FOOD AND RICE FAVOURITES</span><h1>{restaurantName} <em>online.</em></h1><p>Burgers, pizzas, sausages, fries, crispy chicken, biryani and pilau. Explore a fictional menu and try the complete online ordering journey.</p><div className="order-hero-actions"><button className="primary-button" onClick={()=>setView('menu')}>Order food <ArrowRight size={17}/></button><button className="quiet-button" onClick={()=>setView('menu')}>Explore sample menu</button></div><div className="hero-trust-note"><Leaf size={18}/><span>Sample dishes and prices · Demo checkout · No real payments</span></div></div><div className="order-hero-visual"><Image src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1400&q=90" alt="Sample burger meal at Tawakkal Restaurant" className="order-hero-image"/><div className="hero-image-label"><span>BURGERS</span><Waves size={20}/><span>BIRYANI AND PILAU</span></div><div className="hero-roundel"><span>FAST</span><Waves size={22}/><span>FRESH</span></div></div></section>
        <section className="order-section"><div className="section-title-row"><div><span className="order-eyebrow">A FEW FAVOURITES</span><h2>Good food, <em>good mood.</em></h2></div><button className="text-action" onClick={()=>setView('menu')}>View full menu <ArrowRight size={16}/></button></div><div className="order-menu-grid">{menu.slice(0,4).map(dishCard)}</div></section>
        <section className="concept-strip"><div><span className="order-eyebrow">YOUR TABLE, YOUR WAY</span><h2>Pickup or delivery.<br/><em>You choose.</em></h2><p>Build a basket, apply a sample voucher, choose a demo payment method, then follow a simulated order status.</p></div><div className="concept-strip-actions"><button onClick={()=>{setServiceType('delivery');setView('menu');}}><ShoppingBag size={18}/> Order for delivery</button><button onClick={()=>{setServiceType('pickup');setView('menu');}}><Store size={18}/> Order for pickup</button></div></section>
        <section className="order-section voucher-section"><div className="section-title-row"><div><span className="order-eyebrow">A LITTLE SOMETHING EXTRA</span><h2>Make room for <em>a voucher.</em></h2></div></div><div className="voucher-cards">{Object.entries(vouchers).map(([code,voucher])=><article className="voucher-card" key={code}><span className="voucher-card-icon"><TicketPercent size={21}/></span><strong>{voucher.label}</strong><p>{voucher.description}</p><button onClick={()=>{setVoucherInput(code);setAppliedVoucher('');setView('cart');inform('Voucher filled in. Add items to meet its minimum, then apply it at checkout.');}}>Use {code}</button></article>)}</div></section>
        <section className="sample-story"><div className="sample-story-image-wrap"><Image src={gallery[0].src} alt={gallery[0].alt} className="sample-story-image"/></div><div><span className="order-eyebrow">A FICTIONAL FAST-FOOD RESTAURANT</span><h2>Quick meals.<br/><em>Made for sharing.</em></h2><p>{restaurantName} is a portfolio demonstration, not a real restaurant. Menu items, prices and business details are illustrative placeholders. Test accounts and orders are for demonstration only.</p><button className="quiet-button" onClick={()=>setView('menu')}>Explore all dishes <ArrowRight size={16}/></button></div></section>
      </>}

      {view==='menu'&&<section className="flow-page"><div className="flow-heading"><div><span className="order-eyebrow">THE SAMPLE MENU</span><h1>What sounds <em>good?</em></h1><p>Choose your favourites. Everything here is illustrative.</p></div><div className="search-box"><Search size={18}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search dishes..." aria-label="Search dishes"/><button onClick={()=>setQuery('')} aria-label="Clear search"><X size={15}/></button></div></div><div className="filter-list order-filter-list" role="group" aria-label="Menu categories">{categories.map(item=><button key={item} className={'filter-chip '+(category===item?'active':'')} aria-pressed={category===item} onClick={()=>setCategory(item)}>{item}</button>)}</div><p className="menu-count">{filtered.length} sample dish{filtered.length===1?'':'es'}</p>{filtered.length?<div className="order-menu-grid full-menu-grid">{filtered.map(dishCard)}</div>:<div className="empty-panel"><Search size={27}/><h2>No dishes found</h2><p>Try another search or category.</p><button className="quiet-button" onClick={()=>{setQuery('');setCategory('All');}}>Clear filters</button></div>}<p className="demo-banner">Sample menu and prices only. This is not a live restaurant menu.</p></section>}

      {view==='detail'&&<section className="flow-page item-detail-page">
        <button className="secondary-action back-to-menu" onClick={()=>{setView('menu');setCartDetailMessage('');}}><ArrowRight size={15} className="back-arrow"/> Back to menu</button>
        <div className="item-detail-layout">
          <div className="item-detail-gallery"><Image src={selectedDish.image} alt={'Sample image of '+selectedDish.name} className="item-detail-image"/><span className="detail-category-pill">{selectedDish.category}</span></div>
          <div className="item-detail-copy">
            <span className="order-eyebrow"><span/> HAND-PREPARED · SAMPLE DESCRIPTION</span>
            <h1>{selectedDish.name}</h1>
            <div className="detail-rating"><span className="rating-stars">★★★★★</span><strong>{customerRating.toFixed(1)}</strong><span>{customerRatingCount} sample ratings</span><span className="rating-disclosure">Illustrative ratings only</span></div>
            <p className="detail-short-description">{selectedDish.description}</p>
            <div className="detail-price-row"><strong>{money(selectedDish.price)}</strong><span>per serving · sample price</span></div>
            <div className="detail-info-block"><h2>How it’s made</h2><p>{selectedDish.preparation}</p></div>
            <div className="detail-choice-block"><div className="detail-choice-heading"><h2>Choose your flavour</h2><span>Pick one</span></div><div className="option-chips" role="group" aria-label="Flavour options">{selectedDish.flavours.map(flavour=><button key={flavour} className={'option-chip '+(detailFlavour===flavour?'selected':'')} aria-pressed={detailFlavour===flavour} onClick={()=>{setDetailFlavour(flavour);saveDishChoice(selectedDish.id,{flavour,topping:detailTopping});inform('Flavour set to '+flavour+'.','success');}}>{flavour}{detailFlavour===flavour&&<Check size={14}/>}</button>)}</div></div>
            <div className="detail-choice-block"><div className="detail-choice-heading"><h2>Choose a topping</h2><span>Pick one</span></div><div className="option-chips" role="group" aria-label="Topping options">{selectedDish.toppings.map(topping=><button key={topping} className={'option-chip '+(detailTopping===topping?'selected':'')} aria-pressed={detailTopping===topping} onClick={()=>{setDetailTopping(topping);saveDishChoice(selectedDish.id,{flavour:detailFlavour||selectedDish.flavours[0],topping});inform('Topping set to '+topping+'.','success');}}>{topping}{detailTopping===topping&&<Check size={14}/>}</button>)}</div></div>
            <div className="detail-add-row"><div className="detail-price-block"><span>Current sample price</span><strong>{money(selectedDish.price)}</strong></div><button className="primary-button detail-add-button" onClick={()=>addToCart(selectedDish,{flavour:detailFlavour||selectedDish.flavours[0],topping:detailTopping})}><Plus size={17}/> Add to cart <ArrowRight size={15}/></button></div>
            {cartDetailMessage&&<p className="detail-cart-feedback" role="status"><Check size={16}/>{cartDetailMessage}<button onClick={()=>setView('cart')}>View cart <ArrowRight size={13}/></button></p>}
            <p className="demo-banner">Flavours, toppings, preparation notes and ratings are illustrative sample content. No verified public ratings have been collected.</p>
          </div>
        </div>
        <section className="review-section"><div className="review-heading"><div><span className="order-eyebrow">GUEST NOTES</span><h2>Little words, <em>big flavour.</em></h2><p>Sample ratings are illustrative. Reviews you add are saved only in this browser.</p></div><div className="review-score"><strong>{customerRating.toFixed(1)}</strong><span className="rating-stars">★★★★★</span><small>{customerRatingCount} ratings shown</small></div></div>
          <div className="review-layout"><div className="review-list">{selectedDishReviews.length===0?<div className="review-empty"><PackageCheck size={24}/><h3>No browser reviews yet</h3><p>The stars above are fictional sample ratings, not verified customer feedback. Add a demo review to see how this section works.</p></div>:selectedDishReviews.map(review=><article className="review-card" key={review.createdAt+'-'+review.comment}><div className="review-card-top"><strong>Demo guest</strong><span className="rating-stars">{'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}</span></div><p>{review.comment}</p><small>{new Date(review.createdAt).toLocaleDateString()}</small></article>)}</div><form className="review-form" onSubmit={event=>{event.preventDefault();submitReview();}}><h3>Leave a demo review</h3><p>Your rating is kept locally in this browser; it is not a verified public review.</p><label htmlFor="review-rating">Your star rating</label><select id="review-rating" value={reviewRating} onChange={event=>setReviewRating(Number(event.target.value))}>{[5,4,3,2,1].map(rating=><option key={rating} value={rating}>{rating} star{rating===1?'':'s'}</option>)}</select><label htmlFor="review-comment">Your review</label><textarea id="review-comment" minLength={5} maxLength={400} value={reviewText} onChange={event=>setReviewText(event.target.value)} placeholder="What did you like about this sample dish?" required/><button className="primary-button" type="submit">Save demo review <Check size={15}/></button></form></div>
        </section>
      </section>}

      {view==='cart'&&<section className="flow-page"><div className="flow-heading"><div><span className="order-eyebrow">YOUR SELECTION</span><h1>Your <em>basket.</em></h1><p>Review your sample order before checkout.</p></div><button className="quiet-button" onClick={()=>setView('menu')}><ArrowRight size={16}/> Continue browsing</button></div>{cart.length===0?<div className="empty-panel"><ShoppingBag size={30}/><h2>Your cart is waiting</h2><p>Choose sample dishes to begin an order.</p><button className="primary-button" onClick={()=>setView('menu')}>Browse menu <ArrowRight size={16}/></button></div>:<div className="cart-layout"><div className="panel"><h2>Items in your basket</h2><p className="panel-intro">Quantities can be changed here. Remove an item by reducing its quantity to zero.</p>{cart.map(line=><div className="cart-line" key={line.id}><Image src={line.dish.image} alt={line.dish.name} className="cart-line-image"/><div><strong className="cart-line-name">{line.dish.name}</strong><div className="cart-line-meta">{money(line.dish.price)} each · {line.flavour} · {line.topping}</div><div className="quantity-control"><button onClick={()=>{changeQuantity(line.id,-1);inform(line.quantity===1?line.dish.name+' removed from cart.':'Quantity reduced.','success');}} aria-label={'Decrease '+line.dish.name+' '+line.flavour+' '+line.topping}><Minus size={13}/></button><span>{line.quantity}</span><button onClick={()=>{changeQuantity(line.id,1);inform('Quantity increased.','success');}} aria-label={'Increase '+line.dish.name+' '+line.flavour+' '+line.topping}><Plus size={13}/></button></div></div><strong className="line-total">{money(line.dish.price*line.quantity)}</strong></div>)}<div className="panel-bottom-action"><button className="secondary-action" onClick={()=>{setCart([]);inform('Your cart was cleared.');}}>Clear cart</button></div></div><div>{summary()}<button className="primary-button summary-action" onClick={openCheckout}>Continue to checkout <ArrowRight size={16}/></button><div className="voucher-widget panel"><h3>Have a voucher?</h3><p className="panel-intro">Apply the demo code to see the discount before placing your order.</p><div className="voucher-form"><input value={voucherInput} onChange={event=>setVoucherInput(event.target.value.toUpperCase())} onKeyDown={event=>{if(event.key==='Enter')applyVoucher();}} placeholder="Enter code" aria-label="Voucher code"/><button onClick={applyVoucher}>Apply</button></div>{voucherMessage&&<p className={'voucher-feedback '+(!appliedVoucher?'error':'')} role="status">{voucherMessage}</p>}<p className="voucher-help">TAWAKKAL10 · 10% from TZS 20,000<br/>FAMILY15 · 15% from TZS 45,000<br/>FAST5000 · TZS 5,000 off from TZS 50,000</p></div></div></div>}</section>}

      {view==='checkout'&&<section className="flow-page"><div className="flow-heading"><div><span className="order-eyebrow">ALMOST THERE</span><h1>Complete your <em>order.</em></h1><p>Checkout is simulated. No real payment details are collected.</p></div><button className="quiet-button" onClick={()=>setView('cart')}><ArrowRight size={16}/> Back to basket</button></div>{cart.length===0?<div className="empty-panel"><ShoppingBag size={29}/><h2>Your basket is empty</h2><button className="primary-button" onClick={()=>setView('menu')}>Choose food</button></div>:<div className="checkout-layout"><div className="panel checkout-main"><h2>How would you like it?</h2><div className="choice-grid"><button className={'choice-card '+(serviceType==='delivery'?'active':'')} onClick={()=>setServiceType('delivery')}><ShoppingBag size={21}/><span><strong>Delivery</strong><small>Sample delivery fee: TZS 3,500</small></span></button><button className={'choice-card '+(serviceType==='pickup'?'active':'')} onClick={()=>setServiceType('pickup')}><Store size={21}/><span><strong>Pickup</strong><small>Collect from a fictional location · no fee</small></span></button></div>{serviceType==='delivery'&&<div className="form-field"><label htmlFor="delivery-address">Delivery address (demo only)</label><textarea id="delivery-address" value={deliveryAddress} onChange={event=>setDeliveryAddress(event.target.value)} placeholder="Enter a sample address for this demonstration" required minLength={8}/><small>This is not sent to a real restaurant or courier.</small></div>}<h2 className="payment-heading">Choose a demo payment</h2><div className="choice-grid"><button className={'choice-card '+(paymentMethod==='mobile-money-demo'?'active':'')} onClick={()=>{setPaymentMethod('mobile-money-demo');setSimulateFailure(false);}}><Smartphone size={21}/><span><strong>Mobile money (demo)</strong><small>Simulated confirmation only</small></span></button><button className={'choice-card '+(paymentMethod==='card-demo'?'active':'')} onClick={()=>{setPaymentMethod('card-demo');setSimulateFailure(false);}}><CreditCard size={21}/><span><strong>Card (demo)</strong><small>No card number requested</small></span></button><button className={'choice-card '+(paymentMethod==='pay-on-pickup'?'active':'')} onClick={()=>{setPaymentMethod('pay-on-pickup');setSimulateFailure(false);}}><Store size={21}/><span><strong>Pay on pickup</strong><small>Demo selection only</small></span></button></div>{paymentMethod!=='pay-on-pickup'&&<><div className="demo-payment-title"><CreditCard size={18}/> Demo transaction simulator</div><p className="payment-note">No real money moves. Choose the result you want to demonstrate; never enter a real card number, PIN, OTP, or banking credential.</p><div className="demo-payment-tests"><button className={!simulateFailure?'active':''} onClick={()=>setSimulateFailure(false)}><Check size={14}/> Simulate success</button><button className={simulateFailure?'active':''} onClick={()=>setSimulateFailure(true)}><X size={14}/> Simulate failure</button></div></>}<button className="primary-button summary-action" onClick={()=>void placeOrder()}>{paymentMethod==='pay-on-pickup'?'Confirm demo order':'Complete demo payment & order'} <ArrowRight size={16}/></button></div><div>{summary()}<div className="demo-banner">This fictional ordering demo does not transmit a charge, contact a courier, or notify a restaurant.</div></div></div>}</section>}

      {view==='confirmation'&&latestOrder&&<section className="flow-page"><div className="confirmation-panel"><div className="confirmation-icon"><Check size={32}/></div><span className="order-eyebrow">ORDER RECEIVED · DEMO ONLY</span><h1>That’s a <em>wrap.</em></h1><p>Your sample order has been recorded {user?'in your account':'in this browser'}. No real payment was taken.</p><div className="reference-code">{latestOrder.reference}</div><p>Keep this fictional reference handy during the demonstration.</p><div className="confirmation-details"><div className="confirmation-detail-row"><span>Order status</span><strong>{latestOrder.status}</strong></div><div className="confirmation-detail-row"><span>Fulfilment</span><strong>{latestOrder.serviceType==='pickup'?'Pickup':'Delivery'}</strong></div><div className="confirmation-detail-row"><span>Payment</span><strong>{latestOrder.paymentStatus}</strong></div><div className="confirmation-detail-row"><span>Total</span><strong>{money(latestOrder.total)}</strong></div><div className="confirmation-detail-row"><span>Items</span><strong>{latestOrder.items.map(formatOrderItem).join(', ')}</strong></div></div><div className="confirmation-actions"><button className="primary-button" onClick={()=>void showOrders()}>View my orders <ArrowRight size={16}/></button><button className="quiet-button" onClick={()=>setView('menu')}>Order again</button></div></div></section>}

      {view==='orders'&&<section className="flow-page"><div className="flow-heading"><div><span className="order-eyebrow">ORDER HISTORY</span><h1>Your <em>orders.</em></h1><p>{user?'Saved to your signed-in account.':'Guest order history is kept only in this browser.'}</p></div><button className="quiet-button" onClick={()=>void showOrders()}><Clock3 size={16}/> Refresh orders</button></div>{!user&&<div className="demo-banner">Sign in to keep saved orders associated with your account across sessions. Guest orders in this browser are not secure account storage.</div>}{displayOrders.length===0?<div className="empty-panel"><PackageCheck size={31}/><h2>No orders yet</h2><p>Your sample orders will appear here after checkout.</p><button className="primary-button" onClick={()=>setView('menu')}>Browse menu <ArrowRight size={16}/></button>{!user&&<button className="quiet-button" onClick={()=>void signIn()}>Sign in for saved order history</button>}</div>:<div className="order-list">{displayOrders.map(order=><article className="saved-order" key={order.id}><div className="saved-order-header"><div><strong>{order.reference}</strong><span>{new Date(order.createdAt).toLocaleString()} · {order.serviceType==='pickup'?'Pickup':'Delivery'}</span></div><span className="status-pill">{order.status}</span></div><p className="order-items-mini">{order.items.map(formatOrderItem).join(' · ')}</p><div className="saved-order-bottom"><div><strong>{money(order.total)}</strong><p>{order.paymentStatus}</p></div>{order.status!=='Completed'&&<button onClick={()=>void progressOrder(order)}>Advance demo status</button>}</div></article>)}</div>}</section>}

      {view==='account'&&<section className="flow-page"><div className="flow-heading"><div><span className="order-eyebrow">YOUR CORNER</span><h1>Welcome <em>in.</em></h1><p>Account sign-in is provided by AppDeploy. This isn't an app-owned password store.</p></div></div>{user?<div className="account-layout"><div className="panel"><div className="account-top"><div className="account-avatar">{user.picture?<img src={user.picture} alt="Profile"/>:<UserRound size={29}/>}</div><div><h2>{user.name||'Signed-in customer'}</h2><p>{user.email||'Email scope not provided by identity provider'}</p></div></div><p className="panel-intro">Your account identity comes from the secure sign-in provider. Your saved orders are server-side and private to this account.</p><div className="account-actions"><button className="primary-button" onClick={()=>void showOrders()}>My orders <ArrowRight size={16}/></button><button className="secondary-button" onClick={()=>void signOut()}><LogOut size={16}/> Sign out</button></div></div><div className="panel"><h3>Demo overview</h3><div className="account-tiles"><div className="account-tile"><strong>{orders.length}</strong><span>Orders loaded</span></div><div className="account-tile"><strong>{cartCount}</strong><span>Items in basket</span></div></div><div className="demo-banner">Order history can only be loaded after sign-in; the backend scopes database access using your identity.</div></div></div>:<div className="sign-in-panel"><div className="confirmation-icon"><UserRound size={28}/></div><h2>Sign in to {restaurantName}</h2><p>Use the secure sign-in popup to save sample orders to your account. You can still try guest checkout without signing in.</p><button className="primary-button" onClick={()=>void signIn()}><LogIn size={16}/> Sign in securely</button><button className="quiet-button" onClick={()=>setView('menu')}>Continue as guest <ArrowRight size={16}/></button><div className="demo-banner">We do not create or store app-specific passwords. Guest orders are local to this browser only.</div></div>}</section>}

    </main>
    <footer className="site-footer"><div className="footer-main"><button className="brand" onClick={()=>setView('home')}><span className="brand-mark"><Waves size={21}/></span><span className="brand-copy"><strong>Tawakkal<span>.</span></strong><small>R E S T A U R A N T</small></span></button><p>A fictional fast-food restaurant concept<br/>for burgers, pizza, chicken, biryani and pilau.</p><div className="footer-links"><button onClick={()=>setView('menu')}>Order online</button><button onClick={()=>void showOrders()}>My orders</button><button onClick={()=>setView('account')}>Account</button><button onClick={()=>setView('cart')}>Cart ({cartCount})</button></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} {restaurantName} concept</span><span>UNOFFICIAL DEMONSTRATION WEBSITE</span><span>No real orders or payments</span></div></footer>
  </div>;
}
export default App;
