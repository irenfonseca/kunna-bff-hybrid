const btn = document.getElementById('btnMore');
const tbody = document.getElementById('tbody');
const statusEl = document.getElementById('status');
let { page, pageSize, total } = window.__initial;


btn.addEventListener('click', async () => {
    const nextPage = page + 1;
    statusEl.textContent = 'Cargando…';
    try {
        const r = await fetch(`/api/next?page=${nextPage}&pageSize=${pageSize}`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const json = await r.json();
        const rows = json.values || [];


        rows.forEach(row => {
            const tr = document.createElement('tr');
            row.forEach(v => {
                const td = document.createElement('td');
                td.textContent = (v && typeof v === 'object') ? JSON.stringify(v) : (v ?? '');
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });


        page = nextPage;
        const shown = Math.min(page * pageSize, total);
        statusEl.textContent = `Mostrando ${shown} de ${total}`;
        if (shown >= total) {
            btn.disabled = true;
            btn.textContent = 'No hay más';
        }
    } catch (e) {
        console.error(e);
        statusEl.textContent = 'Error cargando más';
    }
});