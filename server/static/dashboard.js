function switchSection(name, el) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('sec-' + name).classList.add('active');
    if (el) el.classList.add('active');
    // Close mobile sidebar
    document.getElementById('sidebar').classList.remove('open');
}

// Animate KPI counters
function animateValue(el, start, end, duration, suffix) {
    let startTime = null;
    suffix = suffix || '';
    function step(ts) {
        if (!startTime) startTime = ts;
        const progress = Math.min((ts - startTime) / duration, 1);
        const val = Math.floor(progress * (end - start) + start);
        el.textContent = val.toLocaleString() + suffix;
        if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

document.addEventListener('DOMContentLoaded', () => {
    animateValue(document.getElementById('kpiRecipes'), 0, 2847, 1200, '');
    animateValue(document.getElementById('kpiChefs'), 0, 14, 800, '');

    // Animate skill bars
    document.querySelectorAll('.skill-fill').forEach(bar => {
        const width = bar.style.width;
        bar.style.width = '0%';
        setTimeout(() => { bar.style.width = width; }, 400);
    });

    // Notification bell
    document.getElementById('notifBell').addEventListener('click', () => {
        alert('Notifications:\n\n• Tomatoes nearing spoilage (36h)\n• Chef Kyoto package pending review\n• Health freshness threshold OK');
    });

    // Fetch live API status
    fetch('/health')
        .then(r => r.json())
        .then(d => {
            if (d.status === 'ok') {
                document.querySelector('.system-status span:last-child').textContent = 'V4 Cybernetic OS Online';
            }
        })
        .catch(() => {
            document.querySelector('.system-status').classList.remove('pulse-green');
            document.querySelector('.status-dot').style.background = '#f87171';
            document.querySelector('.system-status span:last-child').textContent = 'API Offline';
        });
});
