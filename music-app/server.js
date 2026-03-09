const express = require('express');
const cors = require('cors');
const play = require('play-dl');

const app = express();
app.use(cors());

app.get('/api/search-youtube', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.status(400).json({ error: 'Query required' });
        
        console.log(`Searching YouTube for: ${query}`);
        
        // Use play-dl to search
        const ytInfo = await play.search(query, { limit: 1 });
        if (!ytInfo || ytInfo.length === 0) return res.status(404).json({ error: 'No video found' });
        
        const video = ytInfo[0];
        console.log(`Found video: ${video.title} (${video.url})`);
        
        res.json({ videoId: video.id });
    } catch (err) {
        console.error('Server Error:', err);
        if (!res.headersSent) res.status(500).json({ error: 'Server Error' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`YouTube Search API running on http://localhost:${PORT}`);
});
