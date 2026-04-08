/* GS FOOD V4 — Food-First Dashboard Engine */

// ==========================================
// SECTION TEMPLATES
// ==========================================

const SECTIONS = {
home: () => `
<section class="content-section active" id="sec-home">
  <div class="section-header fade-in">
    <h1>Good ${getGreeting()} 👋</h1>
    <p class="subtitle">What would you like to cook today?</p>
  </div>
  <div class="hero-chat fade-in-delay-1">
    <div class="hero-chat-inner">
      <div class="hero-greeting"><span class="emoji">🍳</span> Ask GS FOOD</div>
      <p class="hero-subtext">Your AI kitchen assistant — tell me what you need</p>
      <div class="chat-input-wrap">
        <input type="text" class="chat-input" id="heroChat" placeholder="What can I cook with chicken and rice?">
        <button class="chat-action-btn" title="Voice" id="btnVoice"><svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"/></svg></button>
        <button class="chat-action-btn" title="Camera" id="btnCamera"><svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z"/></svg></button>
        <button class="chat-send-btn" title="Send" id="btnSend"><svg viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/></svg></button>
      </div>
      <div class="quick-prompts">
        <span class="quick-prompt" onclick="fillChat('What can I cook now?')">🍽️ What can I cook now?</span>
        <span class="quick-prompt" onclick="fillChat('Use what is in my fridge')">🧊 Use my fridge</span>
        <span class="quick-prompt" onclick="fillChat('Healthy dinner ideas')">🥗 Healthy dinner</span>
        <span class="quick-prompt" onclick="fillChat('Balkan cuisine recipe')">🇧🇦 Balkan cuisine</span>
        <span class="quick-prompt" onclick="fillChat('Low-carb lunch')">🥑 Low-carb lunch</span>
        <span class="quick-prompt" onclick="fillChat('Fast meal in 15 minutes')">⚡ 15 min meal</span>
      </div>
    </div>
  </div>
  <div class="prefs-row fade-in-delay-2">
    <span class="pref-chip active"><span class="pref-emoji">🌍</span> Balkan</span>
    <span class="pref-chip"><span class="pref-emoji">⏱️</span> 30 min</span>
    <span class="pref-chip"><span class="pref-emoji">👨‍👩‍👧‍👦</span> Family</span>
    <span class="pref-chip"><span class="pref-emoji">🥩</span> High Protein</span>
    <span class="pref-chip"><span class="pref-emoji">📷</span> Camera On</span>
    <span class="pref-chip"><span class="pref-emoji">🗣️</span> Voice</span>
  </div>
  <div class="two-col fade-in-delay-3">
    <div class="two-col-main">
      <div class="sec-title"><h2>🔥 Cook Now</h2><span class="sec-title-action">View all →</span></div>
      <div class="meals-grid" id="mealsGrid"></div>
      <div class="sec-title" style="margin-top:24px"><h2>⏰ Expiring Soon</h2><span class="sec-title-action">Manage pantry →</span></div>
      <div class="expiring-list" id="expiringList"></div>
    </div>
    <div class="two-col-side">
      <div class="shopping-panel">
        <div class="shopping-header"><h3>🛒 Shopping List</h3><span class="shopping-count" id="shopCount">5 items</span></div>
        <div class="shopping-items" id="shopItems"></div>
        <div class="shopping-add" onclick="addShopItem()">+ Add item</div>
      </div>
      <div class="panel">
        <div class="panel-header"><h2>💾 Saved Meals</h2></div>
        <div style="padding:12px 16px"><div class="saved-list" id="savedList"></div></div>
      </div>
    </div>
  </div>
</section>`,

chat: () => `
<section class="content-section active" id="sec-chat">
  <div class="section-header fade-in"><h1>🗨️ Food Chat</h1><p class="subtitle">Ask anything about cooking, ingredients, or meal ideas</p></div>
  <div class="hero-chat fade-in-delay-1" style="min-height:400px">
    <div class="hero-chat-inner">
      <div style="text-align:center;padding:60px 0">
        <div style="font-size:4rem;margin-bottom:16px">👨‍🍳</div>
        <h2 style="font-size:1.3rem;font-weight:700;margin-bottom:8px">Your Personal Chef is Ready</h2>
        <p class="hero-subtext">Ask me about recipes, ingredients, nutrition, cooking techniques, or meal planning</p>
      </div>
      <div class="chat-input-wrap">
        <input type="text" class="chat-input" placeholder="Ask your chef anything...">
        <button class="chat-action-btn" title="Voice"><svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"/></svg></button>
        <button class="chat-action-btn" title="Camera"><svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z"/></svg></button>
        <button class="chat-send-btn" title="Send"><svg viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/></svg></button>
      </div>
    </div>
  </div>
</section>`,

cook: () => `
<section class="content-section active" id="sec-cook">
  <div class="section-header fade-in"><h1>🔥 Cook Now</h1><p class="subtitle">Personalized suggestions based on your pantry and preferences</p></div>
  <div class="prefs-row fade-in-delay-1">
    <span class="pref-chip active"><span class="pref-emoji">🧊</span> Pantry Only</span>
    <span class="pref-chip"><span class="pref-emoji">⏱️</span> Under 30 min</span>
    <span class="pref-chip"><span class="pref-emoji">🥗</span> Healthy</span>
    <span class="pref-chip"><span class="pref-emoji">👨‍👩‍👧‍👦</span> Family Size</span>
    <span class="pref-chip"><span class="pref-emoji">💰</span> Budget</span>
  </div>
  <div class="meals-grid fade-in-delay-2" id="cookMeals"></div>
</section>`,

pantry: () => `
<section class="content-section active" id="sec-pantry">
  <div class="section-header fade-in"><h1>🥫 My Pantry</h1><p class="subtitle">Track what you have and what's expiring</p></div>
  <div class="pantry-summary fade-in-delay-1">
    <div class="pantry-stat ps-green"><span class="pantry-stat-val">24</span><span class="pantry-stat-label">Total Items</span></div>
    <div class="pantry-stat ps-orange"><span class="pantry-stat-val">5</span><span class="pantry-stat-label">Expiring This Week</span></div>
    <div class="pantry-stat ps-red"><span class="pantry-stat-val">2</span><span class="pantry-stat-label">Expired</span></div>
    <div class="pantry-stat ps-golden"><span class="pantry-stat-val">12</span><span class="pantry-stat-label">Recipes Available</span></div>
  </div>
  <div class="sec-title fade-in-delay-2"><h2>⏰ Expiring Soon</h2></div>
  <div class="expiring-list fade-in-delay-2" id="pantryExpiring"></div>
</section>`,

mealplan: () => `
<section class="content-section active" id="sec-mealplan">
  <div class="section-header fade-in"><h1>📅 Meal Plan</h1><p class="subtitle">Plan your week ahead</p></div>
  <div class="mealplan-row fade-in-delay-1" id="mealplanGrid"></div>
</section>`,

shopping: () => `
<section class="content-section active" id="sec-shopping">
  <div class="section-header fade-in"><h1>🛒 Shopping List</h1><p class="subtitle">Everything you need for your planned meals</p></div>
  <div class="shopping-panel fade-in-delay-1" style="max-width:600px">
    <div class="shopping-header"><h3>This Week</h3><span class="shopping-count" id="shopCount2">5 items</span></div>
    <div class="shopping-items" id="shopItems2"></div>
    <div class="shopping-add" onclick="addShopItem()">+ Add item</div>
  </div>
</section>`,

rescue: () => `
<section class="content-section active" id="sec-rescue">
  <div class="section-header fade-in"><h1>♻️ Save Food</h1><p class="subtitle">Reduce waste — cook it, freeze it, share it</p></div>
  <div class="rescue-grid fade-in-delay-1">
    <div class="rescue-card"><span class="rescue-emoji">🍳</span><h4>Cook Now</h4><p>Make a meal from items about to expire</p></div>
    <div class="rescue-card"><span class="rescue-emoji">❄️</span><h4>Freeze It</h4><p>Prep and freeze for later use</p></div>
    <div class="rescue-card"><span class="rescue-emoji">🥣</span><h4>Transform</h4><p>Turn into sauce, soup, or stock</p></div>
    <div class="rescue-card"><span class="rescue-emoji">🤝</span><h4>Share</h4><p>Share with neighbors or community</p></div>
    <div class="rescue-card"><span class="rescue-emoji">📦</span><h4>Preserve</h4><p>Pickle, dehydrate, or can</p></div>
  </div>
  <div class="sec-title fade-in-delay-2" style="margin-top:24px"><h2>⚠️ Items at Risk</h2></div>
  <div class="expiring-list fade-in-delay-2" id="rescueExpiring"></div>
</section>`,

cuisine: () => `
<section class="content-section active" id="sec-cuisine">
  <div class="section-header fade-in"><h1>🌍 Regions & Cuisine</h1><p class="subtitle">Explore flavors from around the world</p></div>
  <div class="cuisine-grid fade-in-delay-1">
    <div class="cuisine-card active"><span class="cuisine-flag">🇧🇦</span><span class="cuisine-name">Balkan</span><span class="cuisine-sub">Hearty & smoky</span></div>
    <div class="cuisine-card"><span class="cuisine-flag">🇮🇹</span><span class="cuisine-name">Italian</span><span class="cuisine-sub">Classic comfort</span></div>
    <div class="cuisine-card"><span class="cuisine-flag">🇬🇷</span><span class="cuisine-name">Mediterranean</span><span class="cuisine-sub">Fresh & light</span></div>
    <div class="cuisine-card"><span class="cuisine-flag">🇫🇷</span><span class="cuisine-name">French</span><span class="cuisine-sub">Refined elegance</span></div>
    <div class="cuisine-card"><span class="cuisine-flag">🇯🇵</span><span class="cuisine-name">Japanese</span><span class="cuisine-sub">Umami focused</span></div>
    <div class="cuisine-card"><span class="cuisine-flag">🇹🇭</span><span class="cuisine-name">Asian</span><span class="cuisine-sub">Bold & aromatic</span></div>
    <div class="cuisine-card"><span class="cuisine-flag">🇸🇪</span><span class="cuisine-name">Nordic</span><span class="cuisine-sub">Clean & seasonal</span></div>
    <div class="cuisine-card"><span class="cuisine-flag">🇱🇧</span><span class="cuisine-name">Middle Eastern</span><span class="cuisine-sub">Spiced & warm</span></div>
    <div class="cuisine-card"><span class="cuisine-flag">🇮🇳</span><span class="cuisine-name">Indian</span><span class="cuisine-sub">Rich & layered</span></div>
    <div class="cuisine-card"><span class="cuisine-flag">🇲🇽</span><span class="cuisine-name">Mexican</span><span class="cuisine-sub">Vibrant & bold</span></div>
    <div class="cuisine-card"><span class="cuisine-flag">🇹🇷</span><span class="cuisine-name">Turkish</span><span class="cuisine-sub">Ottoman heritage</span></div>
    <div class="cuisine-card"><span class="cuisine-flag">✨</span><span class="cuisine-name">Custom</span><span class="cuisine-sub">Mix & match</span></div>
  </div>
</section>`,

chefs: () => `
<section class="content-section active" id="sec-chefs">
  <div class="section-header fade-in"><h1>👨‍🍳 Chef Styles</h1><p class="subtitle">Choose a cooking personality that fits your taste</p></div>
  <div class="chef-grid fade-in-delay-1">
    <div class="chef-card active"><span class="chef-avatar">👵🇧🇦</span><h3>Balkan Grandma</h3><span class="chef-specialty">Hearty home cooking</span><p class="chef-desc">Traditional ćevapi, sarma, burek. Generous portions, smoky flavors.</p></div>
    <div class="chef-card"><span class="chef-avatar">⭐🇫🇷</span><h3>Michelin Light</h3><span class="chef-specialty">Refined technique</span><p class="chef-desc">Precise, butter-forward, classical French with modern plating.</p></div>
    <div class="chef-card"><span class="chef-avatar">⚡👨‍👩‍👧</span><h3>Fast Family Cook</h3><span class="chef-specialty">Quick & easy</span><p class="chef-desc">Kid-friendly meals under 30 minutes. Zero fuss, maximum flavor.</p></div>
    <div class="chef-card"><span class="chef-avatar">🫒🇬🇷</span><h3>Mediterranean Fresh</h3><span class="chef-specialty">Light & healthy</span><p class="chef-desc">Olive oil, fresh herbs, grilled fish. Sun-drenched simplicity.</p></div>
    <div class="chef-card"><span class="chef-avatar">💰🥘</span><h3>Budget Saver</h3><span class="chef-specialty">Maximum value</span><p class="chef-desc">Affordable ingredients, smart substitutions, zero waste cooking.</p></div>
    <div class="chef-card"><span class="chef-avatar">💪🥩</span><h3>High Protein Chef</h3><span class="chef-specialty">Athlete-focused</span><p class="chef-desc">Lean meats, legumes, high-protein meals for active lifestyles.</p></div>
  </div>
</section>`,

health: () => `
<section class="content-section active" id="sec-health">
  <div class="section-header fade-in"><h1>💚 Health Preferences</h1><p class="subtitle">Personalize meals to your wellness goals</p></div>
  <div class="health-grid fade-in-delay-1">
    <div class="health-card"><span class="health-icon">🥗</span><div class="health-info"><h4>Lower Carb Meals</h4><p>Reduce carbohydrates in recipes</p></div></div>
    <div class="health-card active"><span class="health-icon">💪</span><div class="health-info"><h4>Higher Protein</h4><p>Boost protein in every meal</p></div></div>
    <div class="health-card"><span class="health-icon">🧂</span><div class="health-info"><h4>Low Sodium</h4><p>Reduced salt alternatives</p></div></div>
    <div class="health-card"><span class="health-icon">🩺</span><div class="health-info"><h4>Diabetic-Friendly</h4><p>Blood sugar conscious meals</p></div></div>
    <div class="health-card"><span class="health-icon">❤️</span><div class="health-info"><h4>Heart-Conscious</h4><p>Heart-healthy ingredients</p></div></div>
    <div class="health-card"><span class="health-icon">🏃</span><div class="health-info"><h4>Athlete Mode</h4><p>Performance nutrition focus</p></div></div>
    <div class="health-card"><span class="health-icon">👶</span><div class="health-info"><h4>Family Safe</h4><p>Allergen-aware, kid-friendly</p></div></div>
    <div class="health-card"><span class="health-icon">🌱</span><div class="health-info"><h4>Plant-Based</h4><p>Vegetarian & vegan options</p></div></div>
  </div>
</section>`,

camera: () => `
<section class="content-section active" id="sec-camera">
  <div class="section-header fade-in"><h1>📸 Camera & Voice</h1><p class="subtitle">Smart input modes for hands-free cooking</p></div>
  <div class="camera-features fade-in-delay-1">
    <div class="camera-feature cf-green"><div class="camera-feature-icon">🔍</div><h4>Ingredient Recognition</h4><p>Point your camera at ingredients and let AI identify them instantly</p></div>
    <div class="camera-feature cf-orange"><div class="camera-feature-icon">🍽️</div><h4>Plating Preview</h4><p>See how your dish will look when plated before you serve</p></div>
    <div class="camera-feature cf-berry"><div class="camera-feature-icon">🔪</div><h4>Cutting Guides</h4><p>Visual overlays showing proper cutting techniques and sizes</p></div>
    <div class="camera-feature cf-ocean"><div class="camera-feature-icon">📋</div><h4>Step-by-Step Camera</h4><p>Hands-free guided cooking with real-time visual instructions</p></div>
  </div>
  <div class="sec-title fade-in-delay-2" style="margin-top:24px"><h2>Input Mode Controls</h2></div>
  <div class="toggle-grid fade-in-delay-2">
    <div class="toggle-card active" onclick="this.classList.toggle('active')"><span class="toggle-icon">📷</span><span class="toggle-label">Camera Mode</span><div class="toggle-switch"></div></div>
    <div class="toggle-card active" onclick="this.classList.toggle('active')"><span class="toggle-icon">🎙️</span><span class="toggle-label">Voice Mode</span><div class="toggle-switch"></div></div>
    <div class="toggle-card active" onclick="this.classList.toggle('active')"><span class="toggle-icon">⌨️</span><span class="toggle-label">Text Mode</span><div class="toggle-switch"></div></div>
    <div class="toggle-card" onclick="this.classList.toggle('active')"><span class="toggle-icon">🏠</span><span class="toggle-label">Smart Kitchen Sync</span><div class="toggle-switch"></div></div>
    <div class="toggle-card" onclick="this.classList.toggle('active')"><span class="toggle-icon">💚</span><span class="toggle-label">Health Context</span><div class="toggle-switch"></div></div>
    <div class="toggle-card" onclick="this.classList.toggle('active')"><span class="toggle-icon">📴</span><span class="toggle-label">Offline Mode</span><div class="toggle-switch"></div></div>
  </div>
</section>`,

settings: () => `
<section class="content-section active" id="sec-settings">
  <div class="section-header fade-in"><h1>⚙️ Settings</h1><p class="subtitle">Configure your kitchen experience</p></div>
  <div class="settings-grid fade-in-delay-1">
    <div class="settings-card">
      <h3><span class="s-icon">👤</span> Profile</h3>
      <div class="form-group"><label>Display Name</label><input type="text" value="Chef User" id="settName"></div>
      <div class="form-group"><label>Default Language</label><select><option>English</option><option>Deutsch</option><option>Shqip</option><option>Bosanski</option><option>Srpski</option><option>Türkçe</option></select></div>
      <div class="form-group"><label>Default Cuisine</label><select><option>Balkan</option><option>Italian</option><option>Mediterranean</option><option>French</option><option>Japanese</option></select></div>
      <button class="btn-primary" onclick="alert('Settings saved!')">Save Profile</button>
    </div>
    <div class="settings-card">
      <h3><span class="s-icon">🍽️</span> Cooking Preferences</h3>
      <div class="form-group"><label>Default Portion Size</label><select><option>1 person</option><option>2 people</option><option selected>4 people (family)</option><option>6+ people</option></select></div>
      <div class="form-group"><label>Max Cooking Time</label><select><option>15 minutes</option><option selected>30 minutes</option><option>60 minutes</option><option>No limit</option></select></div>
      <div class="form-group"><label>Difficulty Level</label><select><option>Beginner</option><option selected>Intermediate</option><option>Advanced</option></select></div>
    </div>
  </div>
</section>`
};

// ==========================================
// DATA
// ==========================================
const MEALS = [
  { name:'Ćevapi with Somun', emoji:'🥩', cuisine:'Balkan', time:'25 min', diff:'Easy', cal:'480 kcal', badge:'match', have:['beef','onion','bread'], miss:['ajvar'] },
  { name:'Quick Pasta Aglio', emoji:'🍝', cuisine:'Italian', time:'12 min', diff:'Easy', cal:'390 kcal', badge:'fast', have:['pasta','garlic','olive oil'], miss:[] },
  { name:'Greek Salad Bowl', emoji:'🥗', cuisine:'Mediterranean', time:'8 min', diff:'Easy', cal:'220 kcal', badge:'healthy', have:['tomato','cucumber','feta'], miss:['olives'] },
  { name:'Spinach & Rice rescue', emoji:'🍚', cuisine:'Balkan', time:'20 min', diff:'Easy', cal:'310 kcal', badge:'expiring', have:['spinach','rice','yogurt'], miss:[] },
  { name:'Family Chicken Stew', emoji:'🍲', cuisine:'Home', time:'45 min', diff:'Medium', cal:'520 kcal', badge:'favorite', have:['chicken','potato','carrot'], miss:['celery'] },
];

const EXPIRING = [
  { name:'Tomatoes', emoji:'🍅', amount:'500g', time:'Expires tomorrow', urgency:'urgent' },
  { name:'Spinach', emoji:'🥬', amount:'200g', time:'Expires today!', urgency:'urgent' },
  { name:'Yogurt', emoji:'🥛', amount:'400g', time:'Expires in 2 days', urgency:'soon' },
  { name:'Chicken breast', emoji:'🍗', amount:'300g', time:'3 days left', urgency:'ok' },
];

const SHOPPING = [
  { text:'Ajvar (1 jar)', done:false },
  { text:'Olives, Kalamata', done:false },
  { text:'Celery (1 bunch)', done:false },
  { text:'Olive oil, extra virgin', done:true },
  { text:'Feta cheese 200g', done:false },
];

const SAVED = [
  { name:'Grandma\'s Burek', emoji:'🥧', time:'Last week' },
  { name:'Quick Sunday Soup', emoji:'🍜', time:'3 days ago' },
  { name:'Grilled Chicken Salad', emoji:'🥗', time:'5 days ago' },
];

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const DAYMEALS = [
  ['🍳 Omelette','🥗 Salad'],['🥞 Pancakes','🍲 Stew'],['🍳 Eggs','🍝 Pasta'],
  ['🥣 Oatmeal','🍗 Chicken'],['🥐 Pastry','🐟 Fish'],['🥞 Brunch','🍕 Pizza'],['🍳 Full breakfast','🥘 Roast']
];

// ==========================================
// RENDER FUNCTIONS
// ==========================================
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function renderMeals(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = MEALS.map(m => `
    <div class="meal-card">
      <div class="meal-img">${m.emoji}<span class="meal-badge meal-badge-${m.badge}">${m.badge}</span></div>
      <div class="meal-body">
        <div class="meal-name">${m.name}</div>
        <div class="meal-cuisine">${m.cuisine}</div>
        <div class="meal-meta">
          <span class="meal-meta-item"><svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"/></svg>${m.time}</span>
          <span class="meal-meta-item">${m.diff}</span>
          <span class="meal-meta-item">${m.cal}</span>
        </div>
        <div class="meal-ingredients">
          <div class="meal-ingredients-label">Ingredients</div>
          <div class="ing-list">
            ${m.have.map(i=>`<span class="ing-chip ing-have">✓ ${i}</span>`).join('')}
            ${m.miss.map(i=>`<span class="ing-chip ing-miss">✗ ${i}</span>`).join('')}
          </div>
        </div>
      </div>
    </div>`).join('');
}

function renderExpiring(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = EXPIRING.map(e => `
    <div class="expiring-item">
      <span class="expiring-icon">${e.emoji}</span>
      <div class="expiring-info">
        <div class="expiring-name">${e.name} — ${e.amount}</div>
        <div class="expiring-time ${e.urgency}">${e.time}</div>
      </div>
      <div class="expiring-actions">
        <button class="exp-action-btn primary-action">Cook now</button>
        <button class="exp-action-btn">Save</button>
      </div>
    </div>`).join('');
}

function renderShopping(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = SHOPPING.map((s,i) => `
    <div class="shopping-item${s.done?' done':''}">
      <div class="shopping-check${s.done?' checked':''}" onclick="toggleShop(${i})">
        <svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
      </div>
      <span class="shopping-item-text">${s.text}</span>
    </div>`).join('');
}

function renderSaved(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = SAVED.map(s => `
    <div class="saved-item">
      <span class="saved-emoji">${s.emoji}</span>
      <div class="saved-info"><div class="saved-name">${s.name}</div><div class="saved-meta">${s.time}</div></div>
    </div>`).join('');
}

function renderMealplan() {
  const el = document.getElementById('mealplanGrid');
  if (!el) return;
  const today = new Date().getDay();
  const todayIdx = today === 0 ? 6 : today - 1;
  el.innerHTML = DAYS.map((d,i) => `
    <div class="mealplan-day${i===todayIdx?' today':''}">
      <div class="mp-day-name">${d}</div>
      <div class="mp-day-num">${8+i}</div>
      ${DAYMEALS[i].map(m=>`<div class="mp-meal">${m}</div>`).join('')}
    </div>`).join('');
}

// ==========================================
// INTERACTIONS
// ==========================================
function switchSection(name, el) {
  document.getElementById('mainContent').innerHTML = SECTIONS[name]();
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');
  document.getElementById('sidebar').classList.remove('open');
  hydrate();
}

function hydrate() {
  renderMeals('mealsGrid');
  renderMeals('cookMeals');
  renderExpiring('expiringList');
  renderExpiring('pantryExpiring');
  renderExpiring('rescueExpiring');
  renderShopping('shopItems');
  renderShopping('shopItems2');
  renderSaved('savedList');
  renderMealplan();

  // Cuisine card toggle
  document.querySelectorAll('.cuisine-card').forEach(c => {
    c.addEventListener('click', () => {
      document.querySelectorAll('.cuisine-card').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
    });
  });
  // Chef card toggle
  document.querySelectorAll('.chef-card').forEach(c => {
    c.addEventListener('click', () => {
      document.querySelectorAll('.chef-card').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
    });
  });
  // Health card toggle
  document.querySelectorAll('.health-card').forEach(c => {
    c.addEventListener('click', () => c.classList.toggle('active'));
  });
  // Pref chips toggle
  document.querySelectorAll('.pref-chip').forEach(c => {
    c.addEventListener('click', () => c.classList.toggle('active'));
  });
}

function fillChat(text) {
  const input = document.getElementById('heroChat');
  if (input) input.value = text;
}

function toggleShop(idx) {
  SHOPPING[idx].done = !SHOPPING[idx].done;
  renderShopping('shopItems');
  renderShopping('shopItems2');
}

function addShopItem() {
  const item = prompt('Add item to shopping list:');
  if (item) { SHOPPING.push({ text: item, done: false }); renderShopping('shopItems'); renderShopping('shopItems2'); }
}

// ==========================================
// INIT
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  switchSection('home', document.querySelector('.nav-item[data-section="home"]'));

  // Healthcheck
  fetch('/health').then(r=>r.json()).then(d=>{
    if(d.status==='ok') document.querySelector('.system-status span:last-child').textContent='Online — Ready to cook';
  }).catch(()=>{
    const s=document.querySelector('.system-status');
    if(s){s.classList.remove('pulse-green');s.querySelector('.status-dot').style.background='#e85d5d';s.querySelector('span:last-child').textContent='Offline Mode';}
  });
});
