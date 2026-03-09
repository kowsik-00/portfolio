async function test() {
    const query = encodeURIComponent(`God's Plan Drake`);
    const response = await fetch(`https://itunes.apple.com/search?term=${query}&entity=song&limit=1`);
    const data = await response.json();
    if (data.results && data.results.length > 0) {
        console.log("iTunes preview found:", data.results[0].previewUrl);
    } else {
        console.log("No preview found");
    }
}
test().catch(console.error);
