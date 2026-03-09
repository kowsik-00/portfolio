const clientId = 'f340e07b624c40c8a92d44e642cfce50';
const clientSecret = '9de1e99f134b4af6b7c3179fde4a8ce3';

async function test() {
    console.log("Fetching token...");
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
        },
        body: 'grant_type=client_credentials'
    });
    const tokenData = await tokenRes.json();
    const token = tokenData.access_token;
    
    console.log("Searching tracks...");
    const searchRes = await fetch(`https://api.spotify.com/v1/search?q=drake&type=track&limit=5`, {
        headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await searchRes.json();
    const tracks = data.tracks.items;
    
    console.log(`Found ${tracks.length} tracks.`);
    let previews = 0;
    tracks.forEach(t => {
        console.log(`- ${t.name}: preview_url=${t.preview_url ? 'YES' : 'NO'}`);
        if(t.preview_url) previews++;
    });
    console.log(`Tracks with preview: ${previews}/${tracks.length}`);
}
test().catch(console.error);
