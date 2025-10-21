require('dotenv').config();
const express = require('express');


const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));


const { PORT = 4000, DATA_PAGE_URL, DEFAULT_METRIC = '', DEFAULT_DEVICE_ID = '' } = process.env;
if (!DATA_PAGE_URL) { console.error('Falta DATA_PAGE_URL en .env'); process.exit(1); }


// SSR inicial: trae la primera página (5 filas)
app.get('/', async (_req, res) => {
    try {
        const url = new URL(DATA_PAGE_URL);
        url.searchParams.set('page', '1');
        url.searchParams.set('pageSize', '5');
        if (DEFAULT_METRIC) url.searchParams.set('metric', DEFAULT_METRIC);
        if (DEFAULT_DEVICE_ID) url.searchParams.set('deviceId', DEFAULT_DEVICE_ID);


        const r = await fetch(url);
        if (!r.ok) throw new Error(`acq HTTP ${r.status}`);
        const { columns, values, total, pageSize } = await r.json();


        res.render('index', { columns, values, total, initialPageSize: pageSize });
    } catch (e) {
        console.error(e);
        res.status(500).send('Error SSR');
    }
});


// BFF para CSR: siguiente página
app.get('/api/next', async (req, res) => {
    try {
        const page = parseInt(req.query.page || '2', 10);
        const pageSize = parseInt(req.query.pageSize || '5', 10);


        const url = new URL(DATA_PAGE_URL);
        url.searchParams.set('page', String(page));
        url.searchParams.set('pageSize', String(pageSize));
        if (DEFAULT_METRIC) url.searchParams.set('metric', DEFAULT_METRIC);
        if (DEFAULT_DEVICE_ID) url.searchParams.set('deviceId', DEFAULT_DEVICE_ID);


        const r = await fetch(url);
        res.status(r.status)
            .type(r.headers.get('content-type') || 'application/json')
            .send(await r.text());
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'bff_error' });
    }
});


app.listen(PORT, () => console.log(`bff-hybrid :${PORT}`));