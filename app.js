/* ==========================================================================
   BeatStream Premium Music Player - Application Controller
   ========================================================================== */

// Initial playlist data
let tracks = [
  {
    title: "Retro Horizon",
    artist: "Synthwave Beats",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    cover: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop",
    glow: "rgba(138, 43, 226, 0.45)"
  },
  {
    title: "Sunset Neon",
    artist: "Lofi Hour",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300&auto=format&fit=crop",
    glow: "rgba(255, 0, 127, 0.45)"
  },
  {
    title: "Midnight Ride",
    artist: "Outrun Drive",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    cover: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=300&auto=format&fit=crop",
    glow: "rgba(0, 240, 255, 0.45)"
  },
  {
    title: "Stardust Groove",
    artist: "Galaxy Funk",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300&auto=format&fit=crop",
    glow: "rgba(138, 43, 226, 0.45)"
  }
];

// Audio State
let isPlaying = false;
let currentTrackIndex = 0;
let isShuffle = false;
let repeatMode = 0; // 0: Off, 1: Repeat Playlist, 2: Repeat One
let previousVolume = 0.7;

// Create HTML5 Audio Object
const audio = new Audio();
audio.volume = 0.7;

// DOM Elements
const albumArt = document.getElementById("album-art");
const artGlow = document.getElementById("art-glow");
const trackTitle = document.getElementById("track-title");
const trackArtist = document.getElementById("track-artist");

const progressSlider = document.getElementById("progress-slider");
const progressBarFill = document.getElementById("progress-bar-fill");
const currentTimeEl = document.getElementById("current-time");
const totalDurationEl = document.getElementById("total-duration");

const playBtn = document.getElementById("play-btn");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const shuffleBtn = document.getElementById("shuffle-btn");
const repeatBtn = document.getElementById("repeat-btn");
const repeatBadge = document.getElementById("repeat-badge");

const muteBtn = document.getElementById("mute-btn");
const volumeSlider = document.getElementById("volume-slider");
const volumeBarFill = document.getElementById("volume-bar-fill");

const tracksList = document.getElementById("tracks-list");
const trackCountEl = document.getElementById("track-count");
const fileUpload = document.getElementById("file-upload");
const brandLogo = document.querySelector(".brand-logo");

// Initialize Player
window.addEventListener("DOMContentLoaded", () => {
  loadTrack(currentTrackIndex);
  renderPlaylist();
});

// Load Track Details
function loadTrack(index) {
  if (index < 0 || index >= tracks.length) return;
  
  const track = tracks[index];
  
  // Update state
  currentTrackIndex = index;
  
  // Update UI Metadata
  trackTitle.textContent = track.title;
  trackArtist.textContent = track.artist;
  albumArt.src = track.cover;
  
  // Set Album art blur glow
  artGlow.style.backgroundImage = `url(${track.cover})`;
  
  // Update audio source
  audio.src = track.src;
  audio.load();
  
  // Reset slider and times
  progressSlider.value = 0;
  progressBarFill.style.width = "0%";
  currentTimeEl.textContent = "0:00";
  totalDurationEl.textContent = "0:00";
  
  // Manage text scroll effect if title is too long
  resetTitleScroll();

  // Update Playlist selection styling
  updateActivePlaylistItem();
}

// Reset title scrolling styling
function resetTitleScroll() {
  const container = trackTitle.parentElement;
  const containerWidth = container.offsetWidth;
  const titleWidth = trackTitle.offsetWidth;
  
  trackTitle.style.animation = "none";
  trackTitle.style.transform = "translateX(0)";
  
  if (titleWidth > containerWidth) {
    // Left align container when scrolling is needed
    container.style.justifyContent = "flex-start";
    const scrollAmount = titleWidth - containerWidth + 30; // 30px padding at end
    
    // Create inline keyframe styles
    let styleSheet = document.getElementById("dynamic-scroll-styles");
    if (!styleSheet) {
      styleSheet = document.createElement("style");
      styleSheet.id = "dynamic-scroll-styles";
      document.head.appendChild(styleSheet);
    }
    
    styleSheet.innerHTML = `
      @keyframes scrollText {
        0%, 10% { transform: translateX(0); }
        90%, 100% { transform: translateX(-${scrollAmount}px); }
      }
    `;
    
    // Animate using translate
    setTimeout(() => {
      trackTitle.style.animation = `scrollText ${5 + (scrollAmount / 25)}s linear infinite alternate`;
    }, 50);
  } else {
    // Center container when title fits
    container.style.justifyContent = "center";
  }
}

// Play Audio
function playTrack() {
  isPlaying = true;
  audio.play().then(() => {
    // Play success
    playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    playBtn.classList.add("playing");
    brandLogo.style.animationPlayState = "running";
    albumArt.style.transform = "scale(1.03)";
    updateActivePlaylistItem();
  }).catch(err => {
    console.warn("Autoplay blocked or stream failure:", err);
    // Revert state if play fails (e.g. user interaction required)
    isPlaying = false;
  });
}

// Pause Audio
function pauseTrack() {
  isPlaying = false;
  audio.pause();
  playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
  playBtn.classList.remove("playing");
  brandLogo.style.animationPlayState = "paused";
  albumArt.style.transform = "scale(1)";
  updateActivePlaylistItem();
}

// Toggle Play / Pause
function togglePlay() {
  if (isPlaying) {
    pauseTrack();
  } else {
    playTrack();
  }
}

// Skip to Next Track
function nextTrack() {
  let nextIndex = currentTrackIndex;
  
  if (isShuffle) {
    nextIndex = getRandomTrackIndex();
  } else {
    nextIndex = (currentTrackIndex + 1) % tracks.length;
  }
  
  loadTrack(nextIndex);
  if (isPlaying) playTrack();
}

// Skip to Previous Track
function prevTrack() {
  // If track has been playing for more than 3 seconds, reset track to start
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    progressSlider.value = 0;
    progressBarFill.style.width = "0%";
    return;
  }
  
  let prevIndex = currentTrackIndex;
  
  if (isShuffle) {
    prevIndex = getRandomTrackIndex();
  } else {
    prevIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
  }
  
  loadTrack(prevIndex);
  if (isPlaying) playTrack();
}

// Get Random Index (excluding current if possible)
function getRandomTrackIndex() {
  if (tracks.length <= 1) return 0;
  let rand;
  do {
    rand = Math.floor(Math.random() * tracks.length);
  } while (rand === currentTrackIndex);
  return rand;
}

// Repeat Mode Cycle
function cycleRepeatMode() {
  repeatMode = (repeatMode + 1) % 3;
  
  if (repeatMode === 0) {
    // Off
    repeatBtn.classList.remove("active");
    repeatBadge.style.display = "none";
  } else if (repeatMode === 1) {
    // Repeat Playlist
    repeatBtn.classList.add("active");
    repeatBadge.textContent = "All";
    repeatBadge.style.display = "flex";
  } else if (repeatMode === 2) {
    // Repeat Single Track
    repeatBtn.classList.add("active");
    repeatBadge.textContent = "1";
    repeatBadge.style.display = "flex";
  }
}

// Shuffle Toggle
function toggleShuffle() {
  isShuffle = !isShuffle;
  shuffleBtn.classList.toggle("active", isShuffle);
}

// Format duration numbers (e.g. 125s -> 2:05)
function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Audio ended handler (Autoplay)
audio.addEventListener("ended", () => {
  if (repeatMode === 2) {
    // Repeat current track
    audio.currentTime = 0;
    playTrack();
  } else if (repeatMode === 1) {
    // Repeat playlist: skip next, will loop automatically due to modular arithmetic
    nextTrack();
    playTrack();
  } else {
    // No repeat: stop at end of playlist unless shuffle is active
    if (isShuffle) {
      nextTrack();
      playTrack();
    } else if (currentTrackIndex < tracks.length - 1) {
      nextTrack();
      playTrack();
    } else {
      pauseTrack();
      loadTrack(0); // Reset to first track
    }
  }
});

// Update Progress bars & time stamp displays
audio.addEventListener("timeupdate", () => {
  const current = audio.currentTime;
  const duration = audio.duration;
  
  if (!duration) return;
  
  // Calculate percentage
  const pct = (current / duration) * 100;
  
  // Update visual fill and range slider
  progressSlider.value = pct;
  progressBarFill.style.width = `${pct}%`;
  
  currentTimeEl.textContent = formatTime(current);
});

// Update duration text once audio metadata finishes loading
audio.addEventListener("loadedmetadata", () => {
  totalDurationEl.textContent = formatTime(audio.duration);
});

// Seek track when user inputs/drags progress bar
progressSlider.addEventListener("input", (e) => {
  // Update visually while dragging
  const pct = e.target.value;
  progressBarFill.style.width = `${pct}%`;
  
  if (audio.duration) {
    currentTimeEl.textContent = formatTime((pct / 100) * audio.duration);
  }
});

progressSlider.addEventListener("change", (e) => {
  // Seek audio when drag ends
  const pct = e.target.value;
  if (audio.duration) {
    audio.currentTime = (pct / 100) * audio.duration;
  }
});

// Volume control handler
volumeSlider.addEventListener("input", (e) => {
  const vol = e.target.value;
  audio.volume = vol / 100;
  volumeBarFill.style.width = `${vol}%`;
  
  updateVolumeIcon(vol);
});

function updateVolumeIcon(vol) {
  const icon = muteBtn.querySelector("i");
  icon.className = "fa-solid";
  
  if (vol == 0) {
    icon.classList.add("fa-volume-xmark");
  } else if (vol < 40) {
    icon.classList.add("fa-volume-low");
  } else {
    icon.classList.add("fa-volume-high");
  }
}

// Mute button click handler
muteBtn.addEventListener("click", () => {
  if (audio.volume > 0) {
    previousVolume = audio.volume;
    audio.volume = 0;
    volumeSlider.value = 0;
    volumeBarFill.style.width = "0%";
    updateVolumeIcon(0);
  } else {
    audio.volume = previousVolume;
    volumeSlider.value = previousVolume * 100;
    volumeBarFill.style.width = `${previousVolume * 100}%`;
    updateVolumeIcon(previousVolume * 100);
  }
});

// Render Playlist tracks dynamically
function renderPlaylist() {
  tracksList.innerHTML = "";
  trackCountEl.textContent = `${tracks.length} Song${tracks.length === 1 ? '' : 's'}`;
  
  tracks.forEach((track, index) => {
    const li = document.createElement("li");
    li.className = "track-item";
    li.dataset.index = index;
    
    // We display index starting from 1
    const displayIndex = String(index + 1).padStart(2, '0');
    
    li.innerHTML = `
      <div class="track-item-left">
        <span class="track-index">${displayIndex}</span>
        <!-- Audio Equalizer Visualizer Waves -->
        <div class="equalizer-wave">
          <div class="equalizer-bar"></div>
          <div class="equalizer-bar"></div>
          <div class="equalizer-bar"></div>
          <div class="equalizer-bar"></div>
        </div>
        <img src="${track.cover}" alt="thumbnail" class="track-thumb">
        <div class="track-meta">
          <span class="track-meta-title">${track.title}</span>
          <span class="track-meta-artist">${track.artist}</span>
        </div>
      </div>
      <div class="track-item-right">
        <span class="track-item-duration">--:--</span>
      </div>
    `;
    
    // Fetch duration asynchronously in background to show in list
    const tempAudio = new Audio(track.src);
    tempAudio.addEventListener("loadedmetadata", () => {
      const durationSpan = li.querySelector(".track-item-duration");
      durationSpan.textContent = formatTime(tempAudio.duration);
    });
    
    // Double check item click handler
    li.addEventListener("click", () => {
      if (currentTrackIndex === index) {
        togglePlay();
      } else {
        loadTrack(index);
        playTrack();
      }
    });
    
    tracksList.appendChild(li);
  });
  
  updateActivePlaylistItem();
}

// Update Active/Playing item visual states in Playlist
function updateActivePlaylistItem() {
  const items = document.querySelectorAll(".track-item");
  
  items.forEach((item, index) => {
    item.classList.remove("active", "playing", "paused");
    
    if (index === currentTrackIndex) {
      item.classList.add("active");
      if (isPlaying) {
        item.classList.add("playing");
      } else {
        item.classList.add("paused");
      }
    }
  });
}

// File Uploader Handler
fileUpload.addEventListener("change", (e) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;
  
  // Track queue index before adding new tracks
  const previousTracksLength = tracks.length;
  
  Array.from(files).forEach(file => {
    // Only accept audio formats
    if (!file.type.startsWith("audio/")) return;
    
    // Parse Title & Artist from Filename (e.g. "Artist - Title.mp3" or just "Title.mp3")
    const filenameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const parts = filenameWithoutExt.split(" - ");
    
    let title = filenameWithoutExt;
    let artist = "Local Upload";
    
    if (parts.length > 1) {
      artist = parts[0].trim();
      title = parts.slice(1).join(" - ").trim();
    }
    
    // Create Object URL for playback
    const objectURL = URL.createObjectURL(file);
    
    // Cover art placeholders: rotate between beautiful abstract illustrations
    const fallbackCovers = [
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=300&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&auto=format&fit=crop"
    ];
    
    const randomCover = fallbackCovers[Math.floor(Math.random() * fallbackCovers.length)];
    
    const newTrack = {
      title: title,
      artist: artist,
      src: objectURL,
      cover: randomCover,
      glow: "rgba(0, 240, 255, 0.45)"
    };
    
    tracks.push(newTrack);
  });
  
  // Re-render tracks and update total count
  renderPlaylist();
  
  // If no track was playing or we were on the initial dummy loader, load the newly uploaded track
  if (previousTracksLength === 0) {
    loadTrack(0);
    playTrack();
  }
  
  // Clear file input value to allow uploading same file again if desired
  fileUpload.value = "";
});

// Drag & Drop visual state updates
const uploadLabel = document.querySelector(".upload-label");

uploadLabel.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadLabel.style.borderColor = "var(--accent-color)";
  uploadLabel.style.background = "rgba(0, 240, 255, 0.05)";
});

uploadLabel.addEventListener("dragleave", (e) => {
  e.preventDefault();
  uploadLabel.style.borderColor = "rgba(255, 255, 255, 0.12)";
  uploadLabel.style.background = "rgba(255, 255, 255, 0.015)";
});

uploadLabel.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadLabel.style.borderColor = "rgba(255, 255, 255, 0.12)";
  uploadLabel.style.background = "rgba(255, 255, 255, 0.015)";
  
  const files = e.dataTransfer.files;
  if (!files || files.length === 0) return;
  
  const fileInput = document.getElementById("file-upload");
  fileInput.files = files;
  
  // Trigger change handler
  const event = new Event('change');
  fileInput.dispatchEvent(event);
});

// Event Listeners for controls
playBtn.addEventListener("click", togglePlay);
nextBtn.addEventListener("click", nextTrack);
prevBtn.addEventListener("click", prevTrack);
shuffleBtn.addEventListener("click", toggleShuffle);
repeatBtn.addEventListener("click", cycleRepeatMode);

// Keyboard hotkeys for standard browser navigation controls (Space to play, arrows to skip/seek)
window.addEventListener("keydown", (e) => {
  // Ignore keypresses if focus is on form elements (like file uploads or text fields if any)
  if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA") {
    return;
  }
  
  if (e.code === "Space") {
    e.preventDefault();
    togglePlay();
  } else if (e.code === "ArrowRight") {
    e.preventDefault();
    audio.currentTime = Math.min(audio.currentTime + 5, audio.duration || 0);
  } else if (e.code === "ArrowLeft") {
    e.preventDefault();
    audio.currentTime = Math.max(audio.currentTime - 5, 0);
  } else if (e.code === "KeyN") {
    nextTrack();
  } else if (e.code === "KeyP") {
    prevTrack();
  }
});
