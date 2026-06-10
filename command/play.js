import yts from 'yt-search';

export default async function(sock, m, args) {
    if (!args[0]) return sock.sendMessage(m.key.remoteJid, { text: 'Usage:.play song name' }, { quoted: m });
    const search = await yts(args.join(' '));
    const video = search.videos[0];
    await sock.sendMessage(m.key.remoteJid, {
        image: { url: video.thumbnail },
        caption: `*Playing:* ${video.title}\n*Duration:* ${video.timestamp}\n\nPowered by Handsome Tech 🇿🇼`
    }, { quoted: m });
}
