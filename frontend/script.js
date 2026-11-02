
const API_URL = "http://localhost:3000/movies";

const movieGrid = document.getElementById("movieGrid");
const movieForm = document.getElementById("movieForm");
const searchInput = document.getElementById("searchInput");
const messageBox = document.getElementById("message");

let movies = [];
let editingId = null;
let messageTimer;

// Show success or error message
function showMessage(message, isError = false) {
  clearTimeout(messageTimer);

  messageBox.textContent = message;
  messageBox.classList.toggle("error", isError);
  messageBox.hidden = false;

  messageTimer = setTimeout(() => {
    messageBox.hidden = true;
  }, 4000);
}

// Send request to backend
async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.error || "Something went wrong");
  }

  return data;
}

// Escape database values before displaying them as HTML
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

// Get all movies from database
async function loadMovies() {
  movieGrid.innerHTML = '<p class="empty">Loading movies...</p>';

  try {
    const data = await apiRequest(API_URL);
    movies = data.movies || [];

    displayMovies();
    updateStatistics();

  } catch (error) {
    movieGrid.innerHTML =
      '<p class="empty">Unable to load movies. Check your backend.</p>';

    showMessage(error.message, true);
  }
}

// Update dashboard statistics
function updateStatistics() {
  document.getElementById("totalMovies").textContent = movies.length;

  const seats = movies.reduce(
    (sum, movie) => sum + Number(movie.availableSeats || 0), 0
  );

  const average = movies.length
    ? movies.reduce(
        (sum, movie) => sum + Number(movie.ticketPrice || 0), 0
      ) / movies.length
    : 0;

  document.getElementById("totalSeats").textContent =
    seats.toLocaleString("en-IN");

  document.getElementById("averagePrice").textContent =
    average.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    });
}

// Display movie cards
function displayMovies() {
  const search = searchInput.value.trim().toLowerCase();

  const filtered = movies.filter(movie =>
    String(movie.title || "").toLowerCase().includes(search)
  );

  if (filtered.length === 0) {
    movieGrid.innerHTML =
      '<p class="empty">No movies found. Add a movie to get started.</p>';
    return;
  }

  movieGrid.innerHTML = filtered.map(movie => `
    <article class="movie-card">

      <div class="poster">🎬</div>

      <h3>${escapeHTML(movie.title)}</h3>

      <span class="tag">${escapeHTML(movie.genre)}</span>
      <span class="tag">${escapeHTML(movie.language)}</span>

      <p>Duration: ${escapeHTML(movie.duration)} minutes</p>

      <p>Available Seats: ${escapeHTML(movie.availableSeats)}</p>

      <p class="price">
        ₹${Number(movie.ticketPrice).toLocaleString("en-IN")}
      </p>

      <div class="card-buttons">

        <button class="edit-btn"
          data-action="edit"
          data-id="${escapeHTML(movie._id)}">
          Edit
        </button>

        <button class="delete-btn"
          data-action="delete"
          data-id="${escapeHTML(movie._id)}">
          Delete
        </button>

      </div>
    </article>
  `).join("");
}

// Add or update movie
movieForm.addEventListener("submit", async event => {
  event.preventDefault();

  const movieData = {
    title: document.getElementById("title").value.trim(),
    genre: document.getElementById("genre").value,
    language: document.getElementById("language").value.trim(),
    duration: Number(document.getElementById("duration").value),
    ticketPrice: Number(document.getElementById("ticketPrice").value),
    availableSeats: Number(
      document.getElementById("availableSeats").value
    )
  };

  if (
    !movieData.title ||
    !movieData.genre ||
    !movieData.language ||
    !Number.isFinite(movieData.duration) ||
    movieData.duration < 1 ||
    !Number.isFinite(movieData.ticketPrice) ||
    movieData.ticketPrice < 0 ||
    !Number.isInteger(movieData.availableSeats) ||
    movieData.availableSeats < 0
  ) {
    showMessage("Please enter valid movie details.", true);
    return;
  }

  const isEditing = Boolean(editingId);

  const url = isEditing
    ? `${API_URL}/${editingId}`
    : API_URL;

  const method = isEditing ? "PUT" : "POST";

  const submitButton = document.getElementById("submitButton");

  submitButton.disabled = true;
  submitButton.textContent = isEditing ? "Updating..." : "Adding...";

  try {
    const data = await apiRequest(url, {
      method,
      body: JSON.stringify(movieData)
    });

    showMessage(data.message || "Movie saved successfully.");

    resetForm();
    await loadMovies();

  } catch (error) {
    showMessage(error.message, true);

  } finally {
    submitButton.disabled = false;
    submitButton.textContent = editingId ? "Update Movie" : "+ Add Movie";
  }
});

// Handle Edit and Delete buttons
movieGrid.addEventListener("click", async event => {
  const button = event.target.closest("button[data-action]");

  if (!button) return;

  const id = button.dataset.id;
  const action = button.dataset.action;

  const movie = movies.find(item => item._id === id);

  if (!movie) return;

  // Edit movie
  if (action === "edit") {
    editingId = id;

    document.getElementById("title").value = movie.title;
    document.getElementById("genre").value = movie.genre;
    document.getElementById("language").value = movie.language;
    document.getElementById("duration").value = movie.duration;
    document.getElementById("ticketPrice").value = movie.ticketPrice;
    document.getElementById("availableSeats").value =
      movie.availableSeats;

    document.getElementById("formTitle").textContent = "Update Movie";
    document.getElementById("submitButton").textContent = "Update Movie";
    document.getElementById("cancelButton").hidden = false;

    document.getElementById("movieFormSection").scrollIntoView({
      behavior: "smooth"
    });
  }

  // Delete movie
  if (action === "delete") {
    const confirmed = confirm(
      `Are you sure you want to delete ${movie.title}?`
    );

    if (!confirmed) return;

    button.disabled = true;

    try {
      const data = await apiRequest(`${API_URL}/${id}`, {
        method: "DELETE"
      });

      showMessage(data.message || "Movie deleted successfully.");

      if (editingId === id) resetForm();

      await loadMovies();

    } catch (error) {
      showMessage(error.message, true);
      button.disabled = false;
    }
  }
});

// Reset form
function resetForm() {
  movieForm.reset();
  editingId = null;

  document.getElementById("formTitle").textContent = "Add New Movie";
  document.getElementById("submitButton").textContent = "+ Add Movie";
  document.getElementById("cancelButton").hidden = true;
}

// Cancel edit
document.getElementById("cancelButton").addEventListener(
  "click", resetForm
);

// Search movies
searchInput.addEventListener("input", displayMovies);

// Load movies when website opens
loadMovies();
