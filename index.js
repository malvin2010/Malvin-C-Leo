import express from 'express';
import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import qrcode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

let sock;
let qrCodeData = '';

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if(qr) {
            qrCodeData = await qrcode.toDataURL(qr);
        }
        if(connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode!== DisconnectReason.loggedOut;
            if(shouldReconnect) connectToWhatsApp();
        } else if(connection === 'open') {
            console.log('Malvin C Leo Bot Connected');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // Load commands
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;

        const body = m.message.conversation || m.message.extendedTextMessage?.text || '';
        if (!body.startsWith('.')) return;

        const args = body.slice(1).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        const commandPath = path.join(__dirname, 'commands', `${command}.js`);
        if (fs.existsSync(commandPath)) {
            try {
                const { default: cmd } = await import(`file://${commandPath}`);
                await cmd(sock, m, args);
            } catch (err) {
                console.log(err);
            }
        }
    });
}

app.get('/qr', (req, res) => {
    res.json({ qr: qrCodeData });
});

app.post('/pair', async (req, res) => {
    const { number } = req.body;
    if (!sock) await connectToWhatsApp();
    try {
        const code = await sock.requestPairingCode(number.replace(/[^0-9]/g, ''));
        res.json({ code });
    } catch (e) {
        res.status(500).json({ error: 'Failed to get pairing code' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
    connectToWhatsApp();
});
