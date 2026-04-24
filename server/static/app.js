document.addEventListener('DOMContentLoaded', () => {
    const tabs = ['home', 'pantry', 'cook', 'plan', 'shop'];
    
    // Select nav icons and text spans to change styles appropriately
    tabs.forEach(tab => {
        const navEl = document.getElementById(`nav-${tab}`);
        if (!navEl) return;
        
        navEl.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(tab);
        });
    });

    function switchTab(activeTab) {
        tabs.forEach(tab => {
            const pageEl = document.getElementById(`page-${tab}`);
            const navEl = document.getElementById(`nav-${tab}`);
            
            if (pageEl && navEl) {
                // Determine icons inside navEl
                const icon = navEl.querySelector('.material-symbols-outlined');
                const text = navEl.querySelector('span:not(.material-symbols-outlined)');
                
                if (tab === activeTab) {
                    // Show page
                    pageEl.classList.remove('hidden');
                    pageEl.classList.add('block');
                    
                    // Set active nav styles
                    navEl.className = "flex flex-col items-center justify-center text-orange-500 scale-105 transition-transform tab-active";
                    if (icon) icon.style.fontVariationSettings = "'FILL' 1";
                } else {
                    // Hide page
                    pageEl.classList.add('hidden');
                    pageEl.classList.remove('block');
                    
                    // Set inactive nav styles
                    navEl.className = "flex flex-col items-center justify-center text-neutral-500 hover:text-orange-400 transition-colors tab-inactive";
                    if (icon) icon.style.fontVariationSettings = "'FILL' 0";
                }
            }
        });
    }
});
