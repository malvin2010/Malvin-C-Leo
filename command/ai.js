import axios from 'axios';

export default async function(sock, m, args) {
    if (!args[0]) return sock.sendMessage(m.key.remoteJid, { text: 'Ask me anything. Usage:.ai your question' }, { quoted: m });
    const text = args.join(' ');
    // Add your API call here
    await sock.sendMessage(m.key.remoteJid, { text: `AI: You said "${text}"\n\nMalvin C Leo | Handsome Tech 🇿🇼` }, { quoted: m });
}
