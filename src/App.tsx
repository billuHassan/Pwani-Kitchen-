import { useMemo, useState } from 'react';
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, Clock3, Coffee, Fish,
  Instagram, MapPin, Menu as MenuIcon, MessageCircle, Utensils,
  Waves, X, Leaf
} from 'lucide-react';

type Category = 'All' | 'Breakfast' | 'Main Dishes' | 'Seafood' | 'Snacks' | 'Drinks';
type Dish = { name: string; description: string; price: number; category: Exclude<Category, 'All'>; image: string; tag?: string };

const money = (value: number) => new Intl.NumberFormat('en-TZ', {
  style: 'currency', currency: 'TZS', maximumFractionDigits: 0
}).format(value);

const menu: Dish[] = [
  { name: 'Coconut Fish Curry', description: 'Coastal spices, coconut cream, fragrant rice and fresh herbs.', price: 18000, category: 'Seafood', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=85', tag: 'House favourite' },
  { name: 'Zanzibar Pilau Bowl', description: 'Spiced rice with roasted vegetables, lime and garden herbs.', price: 14000, category: 'Main Dishes', image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=85' },
  { name: 'Chapati & Coconut Beans', description: 'Soft handmade-style flatbread with gently spiced coconut beans.', price: 9500, category: 'Breakfast', image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85' },
  { name: 'Grilled Lime Prawns', description: 'A bright citrus marinade, charred lime and seasonal greens.', price: 22000, category: 'Seafood', image: 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=900&q=85', tag: 'Coastal pick' },
  { name: 'Cassava Crisps', description: 'Crisp golden cassava with a tangy tamarind dipping sauce.', price: 6500, category: 'Snacks', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=85' },
  { name: 'Spiced Iced Coffee', description: 'Cold coffee, a hint of cardamom and a silky finish.', price: 7000, category: 'Drinks', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=900&q=85' },
  { name: 'Mango Lime Cooler', description: 'A refreshing mango and lime cooler served over ice.', price: 5500, category: 'Drinks', image: 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=900&q=85' },
  { name: 'Sweet Banana Pancakes', description: 'Golden pancakes with banana, warm spice and seasonal fruit.', price: 8500, category: 'Breakfast', image: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=900&q=85' },
];

const categories: Category[] = ['All', 'Breakfast', 'Main Dishes', 'Seafood', 'Snacks', 'Drinks'];
const gallery = [
  { src: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85', alt: 'A colourful spread of fresh dishes' },
  { src: 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?auto=format&fit=crop&w=900&q=85', alt: 'Freshly prepared seafood on a plate' },
  { src: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=900&q=85', alt: 'Fresh vegetables and ingredients' },
  { src: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=900&q=85', alt: 'A breakfast table with coffee and food' },
  { src: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=900&q=85', alt: 'A fresh bowl with colourful ingredients' },
];

function Image({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  return failed
    ? <div className={`image-fallback ${className}`} role="img" aria-label={alt}><Utensils size={28} /><span>Food photography</span></div>
    : <img src={src} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} />;
}

function App() {
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [mobileOpen, setMobileOpen] = useState(false);
  const filtered = useMemo(() => activeCategory === 'All' ? menu : menu.filter((dish) => dish.category === activeCategory), [activeCategory]);
  const featured = menu.slice(0, 4);
  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="site-shell">
      <div className="demo-bar"><span className="demo-dot" />Unofficial website concept <span className="demo-divider">/</span> Created for demonstration purposes</div>
      <header className="site-header">
        <a href="#home" className="brand" aria-label="Pwani Kitchen home" onClick={closeMobile}>
          <span className="brand-mark"><Waves size={23} strokeWidth={1.7} /></span>
          <span className="brand-copy"><strong>pwani<span>.</span></strong><small>K I T C H E N</small></span>
        </a>
        <nav className={`desktop-nav ${mobileOpen ? 'mobile-visible' : ''}`} aria-label="Main navigation">
          <a href="#home" onClick={closeMobile}>Home</a><a href="#menu" onClick={closeMobile}>Menu</a><a href="#story" onClick={closeMobile}>Our Story</a><a href="#gallery" onClick={closeMobile}>Gallery</a><a href="#contact" onClick={closeMobile}>Contact</a>
          <a className="nav-cta mobile-cta" href="#menu" onClick={closeMobile}>Explore menu <ArrowUpRight size={15} /></a>
        </nav>
        <a className="nav-cta desktop-cta" href="#menu">Explore menu <ArrowUpRight size={15} /></a>
        <button className="mobile-toggle" aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileOpen} aria-controls="mobile-navigation" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X size={22} /> : <MenuIcon size={22} />}</button>
      </header>
      {mobileOpen && <div id="mobile-navigation" className="mobile-backdrop" onClick={closeMobile} aria-hidden="true" />}
      <main>
        <section id="home" className="hero section-wrap">
          <div className="hero-copy">
            <p className="eyebrow"><span /> A COASTAL FOOD CONCEPT FROM ZANZIBAR</p>
            <h1>A taste of<br />the <em>Zanzibar</em><br />coast.</h1>
            <p className="hero-description">Island-inspired flavours, sun-warmed spices, and the simple pleasure of sharing a good meal.</p>
            <div className="hero-actions"><a className="button button-dark" href="#menu">Explore the menu <ArrowRight size={17} /></a><a className="text-link" href="#location">Find your way <ArrowDownRight size={16} /></a></div>
            <div className="hero-note"><span className="note-icon"><Leaf size={18} /></span><p><strong>Rooted in the coast.</strong><br />A sample concept celebrating island food culture.</p></div>
          </div>
          <div className="hero-visual">
            <div className="hero-image-frame"><Image src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1400&q=90" alt="A colourful island-inspired meal with fresh ingredients" className="hero-image" /><div className="image-caption"><span>THE ISLAND TABLE</span><span>01 — 04</span></div></div>
            <div className="hero-stamp"><span>FRESH</span><Waves size={22} /><span>LOCAL</span></div><div className="hero-side-note">A LITTLE ISLAND<br />ON EVERY PLATE</div>
          </div>
          <a href="#featured" className="scroll-cue" aria-label="Scroll to featured dishes"><span /> SCROLL TO SAVOR</a>
        </section>

        <section id="featured" className="featured-section section-wrap">
          <div className="section-heading"><div><p className="eyebrow">MADE FOR SLOW MOMENTS</p><h2>Good food, <em>good mood.</em></h2></div><p className="section-intro">A taste of what an island-inspired menu could look like. Sample dishes and prices are for demonstration only.</p></div>
          <div className="dish-grid">{featured.map((dish, index) => <DishCard key={dish.name} dish={dish} index={index} />)}</div>
          <div className="centered-action"><a href="#menu" className="button button-outline">View the full menu <ArrowRight size={16} /></a></div>
        </section>

        <section id="story" className="story-section"><div className="story-inner section-wrap">
          <div className="story-photo"><Image src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1100&q=85" alt="Fresh herbs, vegetables, and colourful ingredients on a table" className="story-image" /><div className="photo-index">A CONCEPT <span>•</span> MADE WITH CARE</div></div>
          <div className="story-copy"><p className="eyebrow"><span /> A STORY STILL BEING WRITTEN</p><h2>Inspired by the island.<br /><em>Made for sharing.</em></h2>
            <p>This fictional restaurant concept takes its cues from Zanzibar's vibrant food culture: bright citrus, fragrant spices, fresh-from-the-coast ingredients, and tables that invite you to stay a little longer.</p>
            <p>It's a starting point for a real story — one that would be shaped together with the restaurant owner, their menu, and their community.</p>
            <a className="text-link link-dark" href="#contact">Let's shape the story <ArrowRight size={16} /></a><div className="story-signature"><span className="signature-wave"><Waves size={29} /></span><span>Inspired by the Indian Ocean</span></div>
          </div>
        </div></section>

        <section id="menu" className="menu-section section-wrap">
          <div className="section-heading menu-heading"><div><p className="eyebrow">SOMETHING FOR EVERY CRAVING</p><h2>From our imagined<br /><em>island kitchen.</em></h2></div><p className="section-intro">Explore the sample menu. Every dish and price is illustrative and should be replaced with owner-approved details before launch.</p></div>
          <div className="menu-controls" aria-label="Filter menu by category"><div className="filter-list" role="group" aria-label="Menu categories">{categories.map((category) => <button key={category} className={`filter-chip ${activeCategory === category ? 'active' : ''}`} aria-pressed={activeCategory === category} onClick={() => setActiveCategory(category)}>{category}</button>)}</div><span className="menu-count">{filtered.length} sample {filtered.length === 1 ? 'dish' : 'dishes'}</span></div>
          <div className="menu-grid">{filtered.map((dish, index) => <DishCard key={dish.name} dish={dish} index={index} compact />)}</div>
          {filtered.length === 0 && <p className="empty-state">No sample dishes in this category yet. Choose another filter to explore the concept menu.</p>}
          <p className="sample-note"><span>NOTE</span> Prices and dishes shown here are fictional examples, not a live restaurant menu.</p>
        </section>

        <section id="gallery" className="gallery-section"><div className="section-wrap"><div className="section-heading gallery-heading"><div><p className="eyebrow">A FEAST FOR THE EYES</p><h2>Gather around<br /><em>the table.</em></h2></div><p className="section-intro">A visual moodboard for a coastal dining experience — sample imagery only.</p></div>
          <div className="gallery-grid">{gallery.map((item, index) => <div key={item.src} className={`gallery-item gallery-item-${index + 1}`}><Image src={item.src} alt={item.alt} className="gallery-image" /><span className="gallery-label">ISLAND MOOD / 0{index + 1}</span></div>)}</div>
        </div></section>

        <section className="values-section section-wrap" aria-labelledby="values-title"><p className="eyebrow centered-eyebrow">THE FEELING WE'RE GOING FOR</p><h2 id="values-title" className="values-title">Simple things, <em>done thoughtfully.</em></h2>
          <div className="values-grid"><article className="value-card"><span className="value-number">01</span><div className="value-icon"><Fish size={23} /></div><h3>Coastal inspiration</h3><p>Bright, vibrant ideas inspired by the flavours and ingredients of an island kitchen.</p></article>
            <article className="value-card"><span className="value-number">02</span><div className="value-icon"><Coffee size={23} /></div><h3>A welcoming table</h3><p>A warm, relaxed atmosphere designed around good conversation and shared plates.</p></article>
            <article className="value-card"><span className="value-number">03</span><div className="value-icon"><MapPin size={23} /></div><h3>Easy to find</h3><p>Clear location and contact information would help guests plan a visit with ease.</p></article></div>
        </section>

        <section id="location" className="visit-section"><div className="visit-inner section-wrap"><div className="visit-copy"><p className="eyebrow"><span /> YOUR NEXT STOP, PERHAPS</p><h2>A place to<br /><em>come together.</em></h2>
          <p>This location panel is a placeholder for a future restaurant partner. Verified directions, opening hours and contact details will be added with the owner's approval.</p>
          <div className="visit-details"><div className="visit-detail"><MapPin size={19} /><div><strong>Find us</strong><span>Location to be confirmed</span></div></div><div className="visit-detail"><Clock3 size={19} /><div><strong>Opening hours</strong><span>To be confirmed by the owner</span></div></div></div>
          <a href="#contact" className="button button-light">Contact about this concept <ArrowRight size={16} /></a></div>
          <div className="visit-art" aria-label="Decorative ocean-inspired illustration"><div className="sun-disc" /><div className="ocean-line line-one" /><div className="ocean-line line-two" /><div className="ocean-line line-three" /><div className="visit-art-note"><Waves size={28} /><span>INDIAN OCEAN<br />INSPIRED</span></div><p>ISLAND<br />TIME.</p></div>
        </div></section>

        <section id="contact" className="contact-section section-wrap"><div className="contact-left"><p className="eyebrow">A DEMO WITH POSSIBILITY</p><h2>Let's make it<br /><em>your story.</em></h2><p>This concept is ready to be tailored to a real restaurant — with its own voice, menu, photographs, and details.</p></div>
          <div className="contact-right"><div className="contact-card"><span className="contact-card-icon"><MessageCircle size={22} /></span><div><strong>Start a conversation</strong><p>Contact options will be configured after the business owner approves the project.</p></div><span className="placeholder-pill">NOT CONFIGURED</span></div>
            <div className="contact-card"><span className="contact-card-icon"><Instagram size={22} /></span><div><strong>Social channels</strong><p>Official social media links can be added with permission.</p></div><span className="placeholder-pill">PLACEHOLDER</span></div><p className="contact-disclaimer">This is an unofficial concept website and is not associated with any existing restaurant. No enquiries or orders are collected through this demo.</p></div>
        </section>
      </main>
      <footer className="site-footer"><div className="footer-main section-wrap"><a href="#home" className="brand footer-brand"><span className="brand-mark"><Waves size={22} /></span><span className="brand-copy"><strong>pwani<span>.</span></strong><small>K I T C H E N</small></span></a><p>A fictional coastal restaurant concept<br />inspired by Zanzibar, Tanzania.</p><div className="footer-links"><a href="#menu">Menu</a><a href="#story">Our story</a><a href="#gallery">Gallery</a><a href="#contact">Contact</a></div><a href="#home" className="back-top" aria-label="Back to top"><ArrowUpRight size={20} /></a></div>
        <div className="footer-bottom section-wrap"><span>© {new Date().getFullYear()} Pwani Kitchen concept</span><span>UNOFFICIAL DEMONSTRATION WEBSITE</span><span>Made as a portfolio concept</span></div>
      </footer>
    </div>
  );
}

function DishCard({ dish, index, compact = false }: { dish: Dish; index: number; compact?: boolean }) {
  return <article className={`dish-card ${compact ? 'dish-card-compact' : ''}`} style={{ animationDelay: `${index * 55}ms` }}>
    <div className="dish-image-wrap"><Image src={dish.image} alt={`Sample image for ${dish.name}`} className="dish-image" />{dish.tag && <span className="dish-tag">{dish.tag}</span>}<span className="dish-index">0{index + 1}</span></div>
    <div className="dish-info"><div className="dish-title-row"><h3>{dish.name}</h3><span className="dish-price">{money(dish.price)}</span></div><p>{dish.description}</p>{compact && <span className="dish-category">{dish.category}</span>}</div>
  </article>;
}

export default App;
