const clientId = 'f340e07b624c40c8a92d44e642cfce50';
const clientSecret = '9de1e99f134b4af6b7c3179fde4a8ce3';
let accessToken = '';

// Get token using Client Credentials Flow
async function getToken() {
    try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
            },
            body: 'grant_type=client_credentials'
        });

        const data = await response.json();
        
        if (data.access_token) {
            accessToken = data.access_token;
            console.log("Successfully authenticated with Spotify.");
        } else {
            console.error("Failed to get Spotify access token:", data);
        }
    } catch (error) {
        console.error("Error fetching token:", error);
    }
}

// Search tracks
async function searchTracks(query) {
    if (!accessToken) {
        await getToken();
    }

    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=24`, {
        method: 'GET',
        headers: { 
            'Authorization': 'Bearer ' + accessToken 
        }
    });

    const data = await response.json();
    return data.tracks.items;
}

// UI Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultsContainer = document.getElementById('results');

// Player Elements
const playPauseBtn = document.getElementById('playPauseBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const progressBarBg = document.getElementById('progressBarBg');
const progressBarFill = document.getElementById('progressBarFill');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl = document.getElementById('totalTime');
const volumeSlider = document.getElementById('volumeSlider');
const playerImage = document.getElementById('playerImage');
const playerTitle = document.getElementById('playerTitle');
const playerArtist = document.getElementById('playerArtist');

// State
let currentTracks = [];
let currentTrackIndex = -1;
let isPlaying = false;
let ytPlayer = null;
let progressInterval = null;

// Load YouTube IFrame API
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

window.onYouTubeIframeAPIReady = function() {
    ytPlayer = new YT.Player('ytPlayerContainer', {
        height: '0',
        width: '0',
        playerVars: {
            'autoplay': 1,
            'controls': 0,
            'playsinline': 1
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
};

function onPlayerReady(event) {
    ytPlayer.setVolume(Math.round(volumeSlider.value * 100));
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        isPlaying = true;
        playPauseBtn.textContent = '⏸';
        
        // Setup progress bar updater
        clearInterval(progressInterval);
        progressInterval = setInterval(updateProgressBar, 500);
        
        // Update total time
        const duration = ytPlayer.getDuration();
        const mins = Math.floor(duration / 60);
        const secs = Math.floor(duration % 60);
        totalTimeEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        
    } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
        isPlaying = false;
        playPauseBtn.textContent = '▶️';
        clearInterval(progressInterval);
        
        if (event.data === YT.PlayerState.ENDED) {
            playNext();
        }
    }
}

function updateProgressBar() {
    if (!ytPlayer || !isPlaying) return;
    
    const currentTime = ytPlayer.getCurrentTime();
    const duration = ytPlayer.getDuration();
    if (!duration) return;
    
    const progressPercent = (currentTime / duration) * 100;
    progressBarFill.style.width = `${progressPercent}%`;
    
    const mins = Math.floor(currentTime / 60);
    const secs = Math.floor(currentTime % 60);
    currentTimeEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Player Controls
playPauseBtn.addEventListener('click', () => {
    if (!ytPlayer || currentTrackIndex === -1) return;
    
    if (isPlaying) {
        ytPlayer.pauseVideo();
    } else {
        ytPlayer.playVideo();
    }
});

prevBtn.addEventListener('click', playPrevious);
nextBtn.addEventListener('click', playNext);

volumeSlider.addEventListener('input', (e) => {
    if (ytPlayer && ytPlayer.setVolume) {
        ytPlayer.setVolume(Math.round(e.target.value * 100));
    }
});

progressBarBg.addEventListener('click', (e) => {
    if (!ytPlayer || currentTrackIndex === -1) return;
    
    const rect = progressBarBg.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    
    const duration = ytPlayer.getDuration() || 0; 
    if (duration > 0) {
        const seekTime = (clickX / width) * duration;
        ytPlayer.seekTo(seekTime, true);
    }
});

async function getYouTubeVideoId(trackName, artistName) {
    try {
        const query = encodeURIComponent(`${trackName} ${artistName} audio`);
        const response = await fetch(`http://localhost:3000/api/search-youtube?q=${query}`);
        const data = await response.json();
        return data.videoId;
    } catch (e) {
        console.error("YouTube search error:", e);
    }
    return null;
}

async function playTrack(index) {
    if (index < 0 || index >= currentTracks.length) return;
    if (!ytPlayer) {
        alert("YouTube player is still loading. Please try again in a moment.");
        return;
    }
    
    const track = currentTracks[index];
    currentTrackIndex = index;
    
    // Update player UI
    const images = track.album.images;
    playerImage.src = images.length > 0 ? images[0].url : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    playerTitle.textContent = track.name + " (Loading...)";
    playerArtist.textContent = track.artists.map(a => a.name).join(', ');
    
    // Update document title
    document.title = `${track.name} - ${track.artists[0].name}`;
    
    // Get YouTube Video ID
    const videoId = await getYouTubeVideoId(track.name, track.artists[0].name);
    
    playerTitle.textContent = track.name; // reset title
    
    if (!videoId) {
        alert("Sorry, could not find audio for this track.");
        return;
    }
    
    // Play via YouTube iframe
    ytPlayer.loadVideoById(videoId);
}

function playNext() {
    let nextIndex = currentTrackIndex + 1;
    if (nextIndex < currentTracks.length) {
        playTrack(nextIndex);
    } else {
        // Loop back to start if at end
        if (currentTracks.length > 0) {
            playTrack(0);
        }
    }
}

function playPrevious() {
    let prevIndex = currentTrackIndex - 1;
    if (prevIndex >= 0) {
        // Option to restart current track if more than 3 sec in
        if (ytPlayer && ytPlayer.getCurrentTime() > 3) {
            ytPlayer.seekTo(0, true);
        } else {
            playTrack(prevIndex);
        }
    } else {
        if (ytPlayer && ytPlayer.getCurrentTime() > 3) {
            ytPlayer.seekTo(0, true);
        } else if (currentTracks.length > 0) {
            playTrack(currentTracks.length - 1); // Loop to end
        }
    }
}

async function handleSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    // Show loading state
    resultsContainer.innerHTML = '<div class="placeholder-text">Searching Spotify for "' + query + '"...</div>';
    
    try {
        currentTracks = await searchTracks(query);
        displayTracks(currentTracks);
    } catch (error) {
        console.error('Error searching tracks:', error);
        resultsContainer.innerHTML = '<div class="placeholder-text" style="color: #ff5555;">Error loading results. Please try again or check console.</div>';
    }
}

// Event Listeners
searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

function displayTracks(tracks) {
    resultsContainer.innerHTML = '';
    
    if (!tracks || tracks.length === 0) {
        resultsContainer.innerHTML = '<div class="placeholder-text">No tracks found. Try a different search!</div>';
        return;
    }

    tracks.forEach((track, index) => {
        // Find best image size, or use placeholder
        const images = track.album.images;
        const imageUrl = images.length > 0 ? images[0].url : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
        
        const card = document.createElement('div');
        card.className = 'track-card';
        card.style.cursor = 'pointer';
        
        let actionsHtml = `
            <div class="track-actions">
                <button class="play-on-card-btn" aria-label="Play ${track.name}">▶️</button>
            </div>
        `;

        const artists = track.artists.map(a => a.name).join(', ');

        card.innerHTML = `
            <div class="track-image-container">
                <img src="${imageUrl}" class="track-image" alt="${track.name} Album Art" loading="lazy">
            </div>
            <h3 class="track-title" title="${track.name}">${track.name}</h3>
            <p class="track-artist" title="${artists}">${artists}</p>
            ${actionsHtml}
        `;
        
        // Always add click listener to play since we now use fallback logic
        card.addEventListener('click', () => playTrack(index));
        
        resultsContainer.appendChild(card);
    });
}

// Initialize token on page load
window.addEventListener('load', getToken);
