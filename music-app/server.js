const express = require('express');
const cors = require('cors');
const ytSearch = require('yt-search');

const app = express();
app.use(cors());

app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.status(400).json({ error: 'Query required' });
        
        console.log(`Searching YouTube for: ${query}`);
        
        // Use yt-search to search securely
        const r = await ytSearch(query);
        const ytInfo = r.videos;
        if (!ytInfo || ytInfo.length === 0) return res.status(404).json({ error: 'No videos found' });
        
        // Limit to 24 results to match the UI grid
        const limitedVideos = ytInfo.slice(0, 24);
        console.log(`Found ${limitedVideos.length} videos`);
        
        const results = limitedVideos.map(v => ({
            id: v.videoId,
            name: v.title,
            artist: v.author ? v.author.name : 'Unknown Artist',
            image: v.thumbnail || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
        }));
        
        res.json(results);
    } catch (err) {
        console.error('Server Error:', err);
        if (!res.headersSent) res.status(500).json({ error: 'Server Error' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`YouTube Search API running on http://localhost:${PORT}`);
});
