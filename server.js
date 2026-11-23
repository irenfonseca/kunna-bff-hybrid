
require('dotenv').config();
const express = require('express');

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));

const {
    PORT = 4000,
    KUNNA_URL,
    TOKEN,
    TIME_START,
    TIME_END,
    DEFAULT_METRIC = '',
    DEFAULT_DEVICE_ID = ''
} = process.env;

if (!KUNNA_URL || !TOKEN || !TIME_START || !TIME_END) {
    console.error('Faltan variables en .env');
    process.exit(1);
}

// Consultar la nueva API de KUNNA
async function getData() {
    const filters = [];

    if (DEFAULT_METRIC) {
        filters.push({
            field: 'magnitude',
            values: [DEFAULT_METRIC]
        });
    }

    if (DEFAULT_DEVICE_ID) {
        filters.push({
            field: 'device_id',
            values: [DEFAULT_DEVICE_ID]
        });
    }

    const body = {
        time_range: {
            start: TIME_START,
            end: TIME_END
        },
        filters,
        options: {
            limit: 4000
        }
    };

    const r = await fetch(KUNNA_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-token-open-api': TOKEN
        },
        body: JSON.stringify(body)
    });

    if (!r.ok) {
        const error = await r.text();
        throw new Error(`KUNNA HTTP ${r.status}: ${error}`);
    }

    const json = await r.json();
    const records = json?.data?.records;

    if (!Array.isArray(records)) {
        throw new Error('Formato inesperado de KUNNA');
    }

    return records;
}

// SSR inicial: trae la primera página (5 filas)
app.get('/', async (_req, res) => {
    try {
        const records = await getData();

        const pageSize = 5;
        const total = records.length;
        const columns = total ? Object.keys(records[0]) : [];

        const values = records.slice(0, pageSize)
            .map(row => columns.map(c => row[c]));

        res.render('index', {
            columns,
            values,
            total,
            initialPageSize: pageSize
        });

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

        if (!Number.isInteger(page) || page < 1 ||
            !Number.isInteger(pageSize) || pageSize < 1) {
            return res.status(400).json({ error: 'invalid_page' });
        }

        const records = await getData();

        const total = records.length;
        const columns = total ? Object.keys(records[0]) : [];

        const start = (page - 1) * pageSize;

        const values = records.slice(start, start + pageSize)
            .map(row => columns.map(c => row[c]));

        res.json({
            columns,
            values,
            total,
            page,
            pageSize
        });

    } catch (e) {
        console.error(e);
        res.status(502).json({ error: 'bff_error' });
    }
});

app.listen(PORT, () => console.log(`bff-hybrid :${PORT}`));
