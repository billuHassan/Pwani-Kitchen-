import { useEffect, useMemo, useState } from 'react';
import { api, auth } from '@appdeploy/client';
import {
  ArrowRight, Check, ChevronDown, Clock3, CreditCard, Leaf, LogIn,
  LogOut, Minus, PackageCheck, Plus, Search, ShoppingBag, ShoppingCart,
  Smartphone, Store, TicketPercent, UserRound, Utensils, Waves, X
} from 'lucide-react';

type Category = 'All' | 'Breakfast' | 'Main Dishes' | 'Seafood' | 'Snacks' | 'Drinks';
type ServiceType = 'delivery' | 'pickup';
type PaymentMethod = 'mobile-money-demo' | 'card-demo' | 'pay-on-pickup';
type OrderStatus = 'Confirmed' | 'Preparing' | 'Ready for Pickup' | 'Out for Delivery' | 'Completed';
type View = 'home' | 'menu' | 'cart' | 'checkout' | 'confirmation' | 'orders' | 'account';
type Dish = { id: string; name: string; description: string; price: number; category: Exclude<Category, 'All'>; image: string; tag?: string };
type CartLine = { dish: Dish; quantity: number };
type User = { userId: string; email?: string; name?: string; picture?: string; scope: string };
type PlacedOrder = {
  id: string; reference: string; items: Array<{id: string; name: string; price: number; quantity: number; lineTotal: number}>;
  serviceType: ServiceType; deliveryAddress: string; voucherCode: string; subtotal: number;
  deliveryFee: number; discount: number; total: number; paymentMethod: PaymentMethod; paymentStatus: string;
  status: OrderStatus; createdAt: string;
};

const money = (value: number) => new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(value);
const menu: Dish[] = [
  {id:'coconut-fish-curry',name:'Coconut Fish Curry',description:'Coastal spices, coconut cream, fragrant rice and fresh herbs.',price:18000,category:'Seafood',image:'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=85',tag:'House favourite'},
  {id:'zanzibar-pilau',name:'Zanzibar Pilau Bowl',description:'Spiced rice with roasted vegetables, lime and garden herbs.',price:14000,category:'Main Dishes',image:'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=85',tag:'Island classic'},
  {id:'chapati-coconut-beans',name:'Chapati & Coconut Beans',description:'Soft flatbread with gently spiced coconut beans.',price:9500,category:'Breakfast',image:'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85'},
  {id:'grilled-lime-prawns',name:'Grilled Lime Prawns',description:'Bright citrus marinade, charred lime and seasonal greens.',price:22000,category:'Seafood',image:'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=900&q=85',tag:'Coastal pick'},
  {id:'cassava-crisps',name:'Cassava Crisps',description:'Crisp golden cassava with tangy tamarind dipping sauce.',price:6500,category:'Snacks',image:'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=85'},
  {id:'spiced-iced-coffee',name:'Spiced Iced Coffee',description:'Cold coffee, a hint of cardamom and a silky finish.',price:7000,category:'Drinks',image:'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=85'},
  {id:'mango-lime-cooler',name:'Mango Lime Cooler',description:'Refreshing mango and lime cooler served over ice.',price:5500,category:'Drinks',image:'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=900&q=85'},
  {id:'banana-pancakes',name:'Sweet Banana Pancakes',description:'Golden pancakes with banana, warm spice and seasonal fruit.',price:8500,category:'Breakfast',image:'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=900&q=85'},
  {id:'tropical-fruit-bowl',name:'Tropical Fruit Bowl',description:'A colourful seasonal fruit bowl finished with lime.',price:8000,category:'Breakfast',image:'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=900&q=85'},
  {id:'spiced-chips',name:'Zanzibar Spiced Chips',description:'Golden chips tossed in a sample island spice blend.',price:7500,category:'Snacks',image:'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=85'},
  {id:'coconut-vegetable-rice',name:'Coconut Vegetable Rice',description:'Fragrant coconut rice with colourful seasonal vegetables.',price:12000,category:'Main Dishes',image:'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=85'},
  {id:'passion-cooler',name:'Passion Fruit Cooler',description:'Bright passion fruit drink with a refreshing citrus finish.',price:6000,category:'Drinks',image:'https://images.unsplash.com/photo-1513558161293-ccef3dbd8e40?auto=format&fit=crop&w=900&q=85'}
];
const categories: Category[] = ['All','Breakfast','Main Dishes','Seafood','Snacks','Drinks'];
const vouchers = {
  PWANI10: { label:'10% off', min:20000, kind:'percent', value:10, description:'10% off orders of TZS 20,000 or more' },
  KARIBU15: { label:'15% off', min:30000, kind:'percent', value:15, description:'15% off orders of TZS 30,000 or more' },
  ISLAND5000: { label:'TZS 5,000 off', min:40000, kind:'fixed', value:5000, description:'TZS 5,000 off orders of TZS 40,000 or more' }
} as const;
const gallery = [
  {src:'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85',alt:'Colourful sample meal'},
  {src:'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=900&q=85',alt:'Sample seafood plate'},
  {src:'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=900&q=85',alt:'Fresh sample ingredients'}
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
  const [category,setCategory] = useState<Category>('All');
  const [query,setQuery] = useState('');
  const [mobileOpen,setMobileOpen] = useState(false);
  const [cart,setCart] = useState<CartLine[]>(()=>readStorage<CartLine[]>('pwani-cart-v2',[]));
  const [user,setUser] = useState<User|null>(null);
  const [orders,setOrders] = useState<PlacedOrder[]>([]);
  const [guestOrders,setGuestOrders] = useState<PlacedOrder[]>(()=>readStorage<PlacedOrder[]>('pwani-guest-orders-v2',[]));
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

  useEffect(()=>{ window.localStorage.setItem('pwani-cart-v2',JSON.stringify(cart)); },[cart]);
  useEffect(()=>{
    let active = true;
    const restoreUser = async()=>{ if(auth.isSignedIn()){ const restored = await auth.getUser(); if(active) setUser(restored); } };
    void restoreUser().catch(()=>{if(active) setNotice('We could not restore your sign-in. Please sign in again.');});
    return ()=>{active=false;};
  },[]);

  const inform = (message:string,kind:'success'|'error'|'info'='info')=>{setNotice(message);setNoticeKind(kind);};
  const addToCart = (dish:Dish)=>{
    setCart(current=>{ const existing=current.find(line=>line.dish.id===dish.id); return existing ? current.map(line=>line.dish.id===dish.id?{...line,quantity:Math.min(30,line.quantity+1)}:line) : [...current,{dish,quantity:1}]; });
    inform(dish.name+' added to your cart.','success');
  };
  const changeQuantity = (dishId:string,amount:number)=>setCart(current=>current.map(line=>line.dish.id===dishId?{...line,quantity:line.quantity+amount}:line).filter(line=>line.quantity>0).map(line=>({...line,quantity:Math.min(30,line.quantity)})));
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
    const items=cart.map(line=>({id:line.dish.id,name:line.dish.name,price:line.dish.price,quantity:line.quantity,lineTotal:line.dish.price*line.quantity}));
    const order:PlacedOrder={
      id:'guest-'+Date.now().toString(36),reference:'PW-'+Math.random().toString(36).slice(2,8).toUpperCase(),items,
      serviceType,deliveryAddress:'',voucherCode:appliedVoucher,
      subtotal,deliveryFee,discount,total,paymentMethod,paymentStatus:paymentMethod==='pay-on-pickup'?'Pay on pickup':'Demo payment successful — no money charged',
      status:'Confirmed',createdAt:new Date().toISOString()
    };
    try {
      let saved=order;
      if(user){
        const result=await api.post('/api/orders',{items:cart.map(line=>({id:line.dish.id,quantity:line.quantity})),serviceType,deliveryAddress:serviceType==='delivery'?deliveryAddress.trim():'',voucherCode:appliedVoucher,paymentMethod,demoPaymentStatus:paymentMethod==='pay-on-pickup'?'not-required':'succeeded'});
        saved=result.data.order as PlacedOrder;
        setOrders(current=>[saved,...current.filter(existing=>existing.id!==saved.id)]);
      } else {
        const next=[order,...guestOrders]; setGuestOrders(next); window.localStorage.setItem('pwani-guest-orders-v2',JSON.stringify(next));
      }
      setLatestOrder(saved);setCart([]);setAppliedVoucher('');setVoucherInput('');setVoucherMessage('');setView('confirmation');inform('Your demo order has been placed.','success');
    } catch(cause) {inform((cause as {message?:string})?.message||'We could not save your order. Your cart was kept so you can retry.','error');}
  };
  const progressOrder = async(order:PlacedOrder)=>{
    try {
      let updated:PlacedOrder;
      if(user){const result=await api.post('/api/orders/'+encodeURIComponent(order.id)+'/progress',{});updated=result.data.order as PlacedOrder;setOrders(current=>current.map(item=>item.id===updated.id?updated:item));}
      else {updated={...order,status:advanceStatus(order)};const next=guestOrders.map(item=>item.id===order.id?updated:item);setGuestOrders(next);window.localStorage.setItem('pwani-guest-orders-v2',JSON.stringify(next));}
      setLatestOrder(current=>current?.id===updated.id?updated:current);inform('Demo order status is now '+updated.status+'.','success');
    } catch {inform('We could not update the order status. Please retry.','error');}
  };
  const openCheckout=()=>{if(!cart.length){inform('Choose a dish to get started.');setView('menu');}else{setView('checkout');setNotice('');}};
  const displayOrders=user?orders:guestOrders;

  const dishCard=(dish:Dish)=>(
    <article className="order-dish-card" key={dish.id}>
      <div className="order-dish-photo"><Image src={dish.image} alt={'Sample image for '+dish.name} className="order-dish-image"/>{dish.tag&&<span className="order-dish-tag">{dish.tag}</span>}<button className="quick-add" onClick={()=>addToCart(dish)} aria-label={'Add '+dish.name+' to cart'}><Plus size={16}/> Add</button></div>
      <div className="order-dish-content"><span className="order-dish-category">{dish.category}</span><div className="order-dish-title-row"><h3>{dish.name}</h3><strong>{money(dish.price)}</strong></div><p>{dish.description}</p><button className="add-inline" onClick={()=>addToCart(dish)}><Plus size={14}/> Add to order</button></div>
    </article>
  );
  const summary=()=>(
    <aside className="order-summary"><div className="summary-heading"><h3>Order summary</h3><span>{cartCount} item{cartCount===1?'':'s'}</span></div><div className="summary-line"><span>Food subtotal</span><strong>{money(subtotal)}</strong></div><div className="summary-line"><span>Delivery fee</span><strong>{deliveryFee?money(deliveryFee):'Free'}</strong></div>{discount>0&&<div className="summary-line discount-line"><span>Voucher · {appliedVoucher}</span><strong>−{money(discount)}</strong></div>}<div className="summary-total"><span>Total</span><strong>{money(total)}</strong></div></aside>
  );
  const header=()=>(
    <>
      <div className="demo-bar"><span className="demo-dot"/> Fictional restaurant ordering demo <span className="demo-divider">/</span> No real payments</div>
      <header className="order-header">
        <button className="brand order-brand" onClick={()=>{setView('home');setMobileOpen(false);}} aria-label="Pwani Kitchen home"><span className="brand-mark"><Waves size={23}/></span><span className="brand-copy"><strong>pwani<span>.</span></strong><small>K I T C H E N</small></span></button>
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
        <section className="order-hero"><div className="order-hero-copy"><span className="order-eyebrow"><span/> AN ISLAND-INSPIRED TABLE</span><h1>A taste of the <em>Zanzibar</em> coast.</h1><p>Coastal flavours, fragrant spices, and the joy of sharing. Explore a fictional menu and try the complete online ordering journey.</p><div className="order-hero-actions"><button className="primary-button" onClick={()=>setView('menu')}>Order food <ArrowRight size={17}/></button><button className="quiet-button" onClick={()=>setView('menu')}>Explore sample menu</button></div><div className="hero-trust-note"><Leaf size={18}/><span>Sample dishes and prices · Demo checkout · No real payments</span></div></div><div className="order-hero-visual"><Image src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1400&q=90" alt="Colourful sample restaurant meal" className="order-hero-image"/><div className="hero-image-label"><span>THE ISLAND TABLE</span><Waves size={20}/><span>MADE FOR SHARING</span></div><div className="hero-roundel"><span>FRESH</span><Waves size={22}/><span>LOCAL</span></div></div></section>
        <section className="order-section"><div className="section-title-row"><div><span className="order-eyebrow">A FEW FAVOURITES</span><h2>Good food, <em>good mood.</em></h2></div><button className="text-action" onClick={()=>setView('menu')}>View full menu <ArrowRight size={16}/></button></div><div className="order-menu-grid">{menu.slice(0,4).map(dishCard)}</div></section>
        <section className="concept-strip"><div><span className="order-eyebrow">YOUR TABLE, YOUR WAY</span><h2>Pickup or delivery.<br/><em>You choose.</em></h2><p>Build a basket, apply a sample voucher, choose a demo payment method, then follow a simulated order status.</p></div><div className="concept-strip-actions"><button onClick={()=>{setServiceType('delivery');setView('menu');}}><ShoppingBag size={18}/> Order for delivery</button><button onClick={()=>{setServiceType('pickup');setView('menu');}}><Store size={18}/> Order for pickup</button></div></section>
        <section className="order-section voucher-section"><div className="section-title-row"><div><span className="order-eyebrow">A LITTLE SOMETHING EXTRA</span><h2>Make room for <em>a voucher.</em></h2></div></div><div className="voucher-cards">{Object.entries(vouchers).map(([code,voucher])=><article className="voucher-card" key={code}><span className="voucher-card-icon"><TicketPercent size={21}/></span><strong>{voucher.label}</strong><p>{voucher.description}</p><button onClick={()=>{setVoucherInput(code);setAppliedVoucher('');setView('cart');inform('Voucher filled in. Add items to meet its minimum, then apply it at checkout.');}}>Use {code}</button></article>)}</div></section>
        <section className="sample-story"><div className="sample-story-image-wrap"><Image src={gallery[0].src} alt={gallery[0].alt} className="sample-story-image"/></div><div><span className="order-eyebrow">A FICTIONAL ZANZIBAR CONCEPT</span><h2>Rooted in the coast.<br/><em>Made for sharing.</em></h2><p>Pwani Kitchen is a portfolio demonstration, not a real restaurant. Menu items, prices and business details are illustrative placeholders. Test accounts and orders are for demonstration only.</p><button className="quiet-button" onClick={()=>setView('menu')}>Explore all dishes <ArrowRight size={16}/></button></div></section>
      </>}

      {view==='menu'&&<section className="flow-page"><div className="flow-heading"><div><span className="order-eyebrow">THE SAMPLE MENU</span><h1>What sounds <em>good?</em></h1><p>Choose your favourites. Everything here is illustrative.</p></div><div className="search-box"><Search size={18}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search dishes..." aria-label="Search dishes"/><button onClick={()=>setQuery('')} aria-label="Clear search"><X size={15}/></button></div></div><div className="filter-list order-filter-list" role="group" aria-label="Menu categories">{categories.map(item=><button key={item} className={'filter-chip '+(category===item?'active':'')} aria-pressed={category===item} onClick={()=>setCategory(item)}>{item}</button>)}</div><p className="menu-count">{filtered.length} sample dish{filtered.length===1?'':'es'}</p>{filtered.length?<div className="order-menu-grid full-menu-grid">{filtered.map(dishCard)}</div>:<div className="empty-panel"><Search size={27}/><h2>No dishes found</h2><p>Try another search or category.</p><button className="quiet-button" onClick={()=>{setQuery('');setCategory('All');}}>Clear filters</button></div>}<p className="demo-banner">Sample menu and prices only. This is not a live restaurant menu.</p></section>}

      {view==='cart'&&<section className="flow-page"><div className="flow-heading"><div><span className="order-eyebrow">YOUR SELECTION</span><h1>Your <em>basket.</em></h1><p>Review your sample order before checkout.</p></div><button className="quiet-button" onClick={()=>setView('menu')}><ArrowRight size={16}/> Continue browsing</button></div>{cart.length===0?<div className="empty-panel"><ShoppingBag size={30}/><h2>Your cart is waiting</h2><p>Choose sample dishes to begin an order.</p><button className="primary-button" onClick={()=>setView('menu')}>Browse menu <ArrowRight size={16}/></button></div>:<div className="cart-layout"><div className="panel"><h2>Items in your basket</h2><p className="panel-intro">Quantities can be changed here. Remove an item by reducing its quantity to zero.</p>{cart.map(line=><div className="cart-line" key={line.dish.id}><Image src={line.dish.image} alt={line.dish.name} className="cart-line-image"/><div><strong className="cart-line-name">{line.dish.name}</strong><div className="cart-line-meta">{money(line.dish.price)} each</div><div className="quantity-control"><button onClick={()=>changeQuantity(line.dish.id,-1)} aria-label={'Decrease '+line.dish.name}><Minus size={13}/></button><span>{line.quantity}</span><button onClick={()=>changeQuantity(line.dish.id,1)} aria-label={'Increase '+line.dish.name}><Plus size={13}/></button></div></div><strong className="line-total">{money(line.dish.price*line.quantity)}</strong></div>)}<div className="panel-bottom-action"><button className="secondary-action" onClick={()=>{setCart([]);inform('Your cart was cleared.');}}>Clear cart</button></div></div><div>{summary()}<button className="primary-button summary-action" onClick={openCheckout}>Continue to checkout <ArrowRight size={16}/></button><div className="voucher-widget panel"><h3>Have a voucher?</h3><p className="panel-intro">Apply the demo code to see the discount before placing your order.</p><div className="voucher-form"><input value={voucherInput} onChange={event=>setVoucherInput(event.target.value.toUpperCase())} onKeyDown={event=>{if(event.key==='Enter')applyVoucher();}} placeholder="Enter code" aria-label="Voucher code"/><button onClick={applyVoucher}>Apply</button></div>{voucherMessage&&<p className={'voucher-feedback '+(!appliedVoucher?'error':'')} role="status">{voucherMessage}</p>}<p className="voucher-help">PWANI10 · 10% from TZS 20,000<br/>KARIBU15 · 15% from TZS 30,000<br/>ISLAND5000 · TZS 5,000 off from TZS 40,000</p></div></div></div>}</section>}

      {view==='checkout'&&<section className="flow-page"><div className="flow-heading"><div><span className="order-eyebrow">ALMOST THERE</span><h1>Complete your <em>order.</em></h1><p>Checkout is simulated. No real payment details are collected.</p></div><button className="quiet-button" onClick={()=>setView('cart')}><ArrowRight size={16}/> Back to basket</button></div>{cart.length===0?<div className="empty-panel"><ShoppingBag size={29}/><h2>Your basket is empty</h2><button className="primary-button" onClick={()=>setView('menu')}>Choose food</button></div>:<div className="checkout-layout"><div className="panel checkout-main"><h2>How would you like it?</h2><div className="choice-grid"><button className={'choice-card '+(serviceType==='delivery'?'active':'')} onClick={()=>setServiceType('delivery')}><ShoppingBag size={21}/><span><strong>Delivery</strong><small>Sample delivery fee: TZS 3,500</small></span></button><button className={'choice-card '+(serviceType==='pickup'?'active':'')} onClick={()=>setServiceType('pickup')}><Store size={21}/><span><strong>Pickup</strong><small>Collect from a fictional location · no fee</small></span></button></div>{serviceType==='delivery'&&<div className="form-field"><label htmlFor="delivery-address">Delivery address (demo only)</label><textarea id="delivery-address" value={deliveryAddress} onChange={event=>setDeliveryAddress(event.target.value)} placeholder="Enter a sample address for this demonstration" required minLength={8}/><small>This is not sent to a real restaurant or courier.</small></div>}<h2 className="payment-heading">Choose a demo payment</h2><div className="choice-grid"><button className={'choice-card '+(paymentMethod==='mobile-money-demo'?'active':'')} onClick={()=>{setPaymentMethod('mobile-money-demo');setSimulateFailure(false);}}><Smartphone size={21}/><span><strong>Mobile money (demo)</strong><small>Simulated confirmation only</small></span></button><button className={'choice-card '+(paymentMethod==='card-demo'?'active':'')} onClick={()=>{setPaymentMethod('card-demo');setSimulateFailure(false);}}><CreditCard size={21}/><span><strong>Card (demo)</strong><small>No card number requested</small></span></button><button className={'choice-card '+(paymentMethod==='pay-on-pickup'?'active':'')} onClick={()=>{setPaymentMethod('pay-on-pickup');setSimulateFailure(false);}}><Store size={21}/><span><strong>Pay on pickup</strong><small>Demo selection only</small></span></button></div>{paymentMethod!=='pay-on-pickup'&&<><div className="demo-payment-title"><CreditCard size={18}/> Demo transaction simulator</div><p className="payment-note">No real money moves. Choose the result you want to demonstrate; never enter a real card number, PIN, OTP, or banking credential.</p><div className="demo-payment-tests"><button className={!simulateFailure?'active':''} onClick={()=>setSimulateFailure(false)}><Check size={14}/> Simulate success</button><button className={simulateFailure?'active':''} onClick={()=>setSimulateFailure(true)}><X size={14}/> Simulate failure</button></div></>}<button className="primary-button summary-action" onClick={()=>void placeOrder()}>{paymentMethod==='pay-on-pickup'?'Confirm demo order':'Complete demo payment & order'} <ArrowRight size={16}/></button></div><div>{summary()}<div className="demo-banner">This fictional ordering demo does not transmit a charge, contact a courier, or notify a restaurant.</div></div></div>}</section>}

      {view==='confirmation'&&latestOrder&&<section className="flow-page"><div className="confirmation-panel"><div className="confirmation-icon"><Check size={32}/></div><span className="order-eyebrow">ORDER RECEIVED · DEMO ONLY</span><h1>That’s a <em>wrap.</em></h1><p>Your sample order has been recorded {user?'in your account':'in this browser'}. No real payment was taken.</p><div className="reference-code">{latestOrder.reference}</div><p>Keep this fictional reference handy during the demonstration.</p><div className="confirmation-details"><div className="confirmation-detail-row"><span>Order status</span><strong>{latestOrder.status}</strong></div><div className="confirmation-detail-row"><span>Fulfilment</span><strong>{latestOrder.serviceType==='pickup'?'Pickup':'Delivery'}</strong></div><div className="confirmation-detail-row"><span>Payment</span><strong>{latestOrder.paymentStatus}</strong></div><div className="confirmation-detail-row"><span>Total</span><strong>{money(latestOrder.total)}</strong></div><div className="confirmation-detail-row"><span>Items</span><strong>{latestOrder.items.map(item=>item.name+' × '+item.quantity).join(', ')}</strong></div></div><div className="confirmation-actions"><button className="primary-button" onClick={()=>void showOrders()}>View my orders <ArrowRight size={16}/></button><button className="quiet-button" onClick={()=>setView('menu')}>Order again</button></div></div></section>}

      {view==='orders'&&<section className="flow-page"><div className="flow-heading"><div><span className="order-eyebrow">ORDER HISTORY</span><h1>Your <em>orders.</em></h1><p>{user?'Saved to your signed-in account.':'Guest order history is kept only in this browser.'}</p></div><button className="quiet-button" onClick={()=>void showOrders()}><Clock3 size={16}/> Refresh orders</button></div>{!user&&<div className="demo-banner">Sign in to keep saved orders associated with your account across sessions. Guest orders in this browser are not secure account storage.</div>}{displayOrders.length===0?<div className="empty-panel"><PackageCheck size={31}/><h2>No orders yet</h2><p>Your sample orders will appear here after checkout.</p><button className="primary-button" onClick={()=>setView('menu')}>Browse menu <ArrowRight size={16}/></button>{!user&&<button className="quiet-button" onClick={()=>void signIn()}>Sign in for saved order history</button>}</div>:<div className="order-list">{displayOrders.map(order=><article className="saved-order" key={order.id}><div className="saved-order-header"><div><strong>{order.reference}</strong><span>{new Date(order.createdAt).toLocaleString()} · {order.serviceType==='pickup'?'Pickup':'Delivery'}</span></div><span className="status-pill">{order.status}</span></div><p className="order-items-mini">{order.items.map(item=>item.name+' × '+item.quantity).join(' · ')}</p><div className="saved-order-bottom"><div><strong>{money(order.total)}</strong><p>{order.paymentStatus}</p></div>{order.status!=='Completed'&&<button onClick={()=>void progressOrder(order)}>Advance demo status</button>}</div></article>)}</div>}</section>}

      {view==='account'&&<section className="flow-page"><div className="flow-heading"><div><span className="order-eyebrow">YOUR CORNER</span><h1>Welcome <em>in.</em></h1><p>Account sign-in is provided by AppDeploy. This isn't an app-owned password store.</p></div></div>{user?<div className="account-layout"><div className="panel"><div className="account-top"><div className="account-avatar">{user.picture?<img src={user.picture} alt="Profile"/>:<UserRound size={29}/>}</div><div><h2>{user.name||'Signed-in customer'}</h2><p>{user.email||'Email scope not provided by identity provider'}</p></div></div><p className="panel-intro">Your account identity comes from the secure sign-in provider. Your saved orders are server-side and private to this account.</p><div className="account-actions"><button className="primary-button" onClick={()=>void showOrders()}>My orders <ArrowRight size={16}/></button><button className="secondary-button" onClick={()=>void signOut()}><LogOut size={16}/> Sign out</button></div></div><div className="panel"><h3>Demo overview</h3><div className="account-tiles"><div className="account-tile"><strong>{orders.length}</strong><span>Orders loaded</span></div><div className="account-tile"><strong>{cartCount}</strong><span>Items in basket</span></div></div><div className="demo-banner">Order history can only be loaded after sign-in; the backend scopes database access using your identity.</div></div></div>:<div className="sign-in-panel"><div className="confirmation-icon"><UserRound size={28}/></div><h2>Sign in to Pwani Kitchen</h2><p>Use the secure sign-in popup to save sample orders to your account. You can still try guest checkout without signing in.</p><button className="primary-button" onClick={()=>void signIn()}><LogIn size={16}/> Sign in securely</button><button className="quiet-button" onClick={()=>setView('menu')}>Continue as guest <ArrowRight size={16}/></button><div className="demo-banner">We do not create or store app-specific passwords. Guest orders are local to this browser only.</div></div>}</section>}

    </main>
    <footer className="site-footer"><div className="footer-main"><button className="brand" onClick={()=>setView('home')}><span className="brand-mark"><Waves size={21}/></span><span className="brand-copy"><strong>pwani<span>.</span></strong><small>K I T C H E N</small></span></button><p>A fictional coastal restaurant concept<br/>inspired by Zanzibar, Tanzania.</p><div className="footer-links"><button onClick={()=>setView('menu')}>Order online</button><button onClick={()=>void showOrders()}>My orders</button><button onClick={()=>setView('account')}>Account</button><button onClick={()=>setView('cart')}>Cart ({cartCount})</button></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Pwani Kitchen concept</span><span>UNOFFICIAL DEMONSTRATION WEBSITE</span><span>No real orders or payments</span></div></footer>
  </div>;
}
export default App;