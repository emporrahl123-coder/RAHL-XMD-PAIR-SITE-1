const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());
let client = null;
let activeSessionData = null;
app.get('/api/generate-qr', async (req, res) => {
    try {
        if (!client) {
            client = new Client({
                authStrategy: new LocalAuth({ clientId: "RAHL-XMD" }),
                puppeteer: { headless: true, args: ['--no-sandbox'] }
            });
            client.on('qr', async (qr) => {
                const qrImageUrl = await qrcode.toDataURL(qr);
            });
            client.on('authenticated', (session) => {
                activeSessionData = Buffer.from(JSON.stringify(session)).toString('base64');
            });
            client.on('ready', () => {
            });
            await client.initialize();
        }
        const qr = await new Promise((resolve) => {
            client.once('qr', resolve);
        });
        const qrImageUrl = await qrcode.toDataURL(qr);
        res.json({ qrImage: qrImageUrl });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/request-pairing-code', async (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber || !client) {
        return res.status(400).json({ error: 'Invalid request or client not ready.' });
    }
    try {
        const pairingCode = await client.requestPairingCode(phoneNumber);
        res.json({ pairingCode });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/get-session', (req, res) => {
    if (activeSessionData) {
        res.json({ sessionId: activeSessionData });
    } else {
        res.status(404).json({ error: 'Session not yet authenticated.' });
    }
});
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
