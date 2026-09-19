(() => {
  const tracks = window.TOEFL_TRACKS || [];
  const $ = (selector) => document.querySelector(selector);
  const audio = $("#audio");
  const playlist = $("#playlist");
  const searchInput = $("#searchInput");
  const testSelect = $("#testSelect");
  const speedSelect = $("#speedSelect");
  const progress = $("#progress");
  const favorites = new Set(JSON.parse(localStorage.getItem("toefl-favorites") || "[]"));
  const state = { audience: "All", section: "All", test: "All", search: "", currentId: null, filtered: tracks };

  for (let i = 0; i < 16; i++) {
    const bar = document.createElement("i");
    bar.style.height = `${18 + (i * 17) % 48}px`;
    $("#visualizer").append(bar);
  }

  const escapeHtml = (text) => String(text).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };
  const currentTrack = () => tracks.find((track) => track.id === state.currentId);

  function populateTests() {
    const options = [...new Set(tracks.map((track) => `${track.audience}|${track.test}`))];
    options.sort().forEach((value) => {
      const [audience, number] = value.split("|");
      const option = document.createElement("option");
      option.value = value;
      option.textContent = `${audience} Test ${number}`;
      testSelect.append(option);
    });
  }

  function updateCounts() {
    $("#trackCount").textContent = tracks.length;
    $("#allCount").textContent = tracks.length;
    $("#studentCount").textContent = tracks.filter((t) => t.audience === "Student").length;
    $("#teacherCount").textContent = tracks.filter((t) => t.audience === "Teacher").length;
    $("#favoriteCount").textContent = favorites.size;
  }

  function applyFilters() {
    const query = state.search.toLowerCase();
    state.filtered = tracks.filter((track) => {
      const audienceMatch = state.audience === "All" || (state.audience === "Favorites" ? favorites.has(track.id) : track.audience === state.audience);
      const sectionMatch = state.section === "All" || track.section === state.section;
      const testMatch = state.test === "All" || `${track.audience}|${track.test}` === state.test;
      const textMatch = !query || `${track.title} ${track.category} ${track.testLabel} ${track.section}`.toLowerCase().includes(query);
      return audienceMatch && sectionMatch && testMatch && textMatch;
    });
    renderPlaylist();
    updateHeading();
  }

  function updateHeading() {
    const labels = [];
    if (state.audience !== "All") labels.push(state.audience === "Favorites" ? "Saved tracks" : `${state.audience} collection`);
    if (state.section !== "All") labels.push(state.section);
    const selected = testSelect.selectedOptions[0]?.textContent;
    if (state.test !== "All") labels.push(selected);
    $("#collectionLabel").textContent = labels.length ? labels.join(" · ") : "Complete collection";
    $("#collectionTitle").textContent = state.search ? `Results for “${state.search}”` : (state.audience === "Favorites" ? "Favorite audio" : "Practice audio");
    $("#resultCount").textContent = `${state.filtered.length} track${state.filtered.length === 1 ? "" : "s"}`;
  }

  function renderPlaylist() {
    playlist.innerHTML = state.filtered.map((track, index) => `
      <div class="track${track.id === state.currentId ? " active" : ""}" role="listitem" data-id="${track.id}">
        <button class="track-number" data-action="play" aria-label="Play ${escapeHtml(track.title)}">${track.id === state.currentId && !audio.paused ? "▶" : String(index + 1).padStart(2, "0")}</button>
        <button class="track-title" data-action="play">
          <strong>${escapeHtml(track.title)}</strong>
          <span>${escapeHtml(track.testLabel)} · ${escapeHtml(track.section)}</span>
        </button>
        <button class="track-category" data-action="play">${escapeHtml(track.category)}</button>
        <span class="format-pill">${track.format}</span>
        <button class="icon-button row-favorite${favorites.has(track.id) ? " active" : ""}" data-action="favorite" aria-label="${favorites.has(track.id) ? "Remove from" : "Add to"} favorites">
          <svg viewBox="0 0 24 24"><path d="M12 20.5S4 16 4 9.8A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 8 2.8c0 6.2-8 10.7-8 10.7Z"/></svg>
        </button>
      </div>`).join("");
    $("#emptyState").hidden = state.filtered.length > 0;
  }

  function loadTrack(track, autoplay = true) {
    if (!track) return;
    state.currentId = track.id;
    audio.src = track.src;
    audio.playbackRate = Number(speedSelect.value);
    $("#nowTitle").textContent = track.title;
    $("#nowMeta").textContent = `${track.testLabel} · ${track.section} · ${track.category}`;
    $("#nowFavorite").disabled = false;
    updateFavoriteButtons();
    renderPlaylist();
    localStorage.setItem("toefl-current-track", track.id);
    if (autoplay) audio.play().catch(() => {});
  }

  function togglePlayback() {
    if (!state.currentId) return loadTrack(state.filtered[0] || tracks[0]);
    if (audio.paused) audio.play().catch(() => {}); else audio.pause();
  }

  function moveTrack(direction) {
    const queue = state.filtered.length ? state.filtered : tracks;
    let index = queue.findIndex((track) => track.id === state.currentId);
    if (index < 0) index = 0;
    index = (index + direction + queue.length) % queue.length;
    loadTrack(queue[index]);
  }

  function toggleFavorite(id) {
    if (!id) return;
    if (favorites.has(id)) favorites.delete(id); else favorites.add(id);
    localStorage.setItem("toefl-favorites", JSON.stringify([...favorites]));
    updateCounts();
    updateFavoriteButtons();
    if (state.audience === "Favorites") applyFilters(); else renderPlaylist();
  }

  function updateFavoriteButtons() {
    const active = favorites.has(state.currentId);
    $("#nowFavorite").classList.toggle("active", active);
    $("#nowFavorite").setAttribute("aria-label", active ? "Remove current track from favorites" : "Favorite current track");
  }

  document.querySelectorAll("[data-audience]").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll("[data-audience]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    state.audience = button.dataset.audience;
    applyFilters();
  }));
  document.querySelectorAll("[data-section]").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll("[data-section]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    state.section = button.dataset.section;
    applyFilters();
  }));
  searchInput.addEventListener("input", () => { state.search = searchInput.value.trim(); applyFilters(); });
  testSelect.addEventListener("change", () => { state.test = testSelect.value; applyFilters(); });
  speedSelect.addEventListener("change", () => { audio.playbackRate = Number(speedSelect.value); localStorage.setItem("toefl-speed", speedSelect.value); });
  playlist.addEventListener("click", (event) => {
    const row = event.target.closest(".track");
    if (!row) return;
    if (event.target.closest('[data-action="favorite"]')) toggleFavorite(row.dataset.id);
    else if (event.target.closest('[data-action="play"]')) {
      if (row.dataset.id === state.currentId) togglePlayback();
      else loadTrack(tracks.find((track) => track.id === row.dataset.id));
    }
  });
  $("#playButton").addEventListener("click", togglePlayback);
  $("#previousButton").addEventListener("click", () => moveTrack(-1));
  $("#nextButton").addEventListener("click", () => moveTrack(1));
  $("#backButton").addEventListener("click", () => { audio.currentTime = Math.max(0, audio.currentTime - 10); });
  $("#forwardButton").addEventListener("click", () => { audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10); });
  $("#nowFavorite").addEventListener("click", () => toggleFavorite(state.currentId));
  progress.addEventListener("input", () => { if (audio.duration) audio.currentTime = (Number(progress.value) / 100) * audio.duration; });
  audio.addEventListener("play", () => { document.body.classList.add("playing"); $("#playButton").setAttribute("aria-label", "Pause"); renderPlaylist(); });
  audio.addEventListener("pause", () => { document.body.classList.remove("playing"); $("#playButton").setAttribute("aria-label", "Play"); renderPlaylist(); });
  audio.addEventListener("timeupdate", () => { $("#currentTime").textContent = formatTime(audio.currentTime); progress.value = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0; });
  audio.addEventListener("loadedmetadata", () => { $("#duration").textContent = formatTime(audio.duration); });
  audio.addEventListener("ended", () => { if ($("#autoplayToggle").checked) moveTrack(1); });
  document.addEventListener("keydown", (event) => {
    const typing = /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName);
    if (event.key === "/" && !typing) { event.preventDefault(); searchInput.focus(); }
    if (typing) return;
    if (event.code === "Space") { event.preventDefault(); togglePlayback(); }
    if (event.key === "ArrowLeft") audio.currentTime = Math.max(0, audio.currentTime - 10);
    if (event.key === "ArrowRight") audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10);
  });

  populateTests();
  speedSelect.value = localStorage.getItem("toefl-speed") || "1";
  updateCounts();
  applyFilters();
  const savedTrack = tracks.find((track) => track.id === localStorage.getItem("toefl-current-track"));
  if (savedTrack) loadTrack(savedTrack, false);
})();
