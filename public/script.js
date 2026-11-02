// ==========================================
// MOVIE BOOKING SYSTEM - FRONTEND JAVASCRIPT
// ==========================================

const API_URL = "/movies";

const movieForm = document.getElementById("movieForm");
const movieList = document.getElementById("movieList");
const message = document.getElementById("message");

const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEdit");
const refreshBtn = document.getElementById("refreshBtn");
const searchInput = document.getElementById("searchInput");

let editingMovieId = null;
let allMovies = [];

// Sample cinema images used as movie-card artwork.
// These are illustrative images, not official movie posters.
const posterImages = [
    "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1505685296765-3a2736de412f?auto=format&fit=crop&w=400&q=80"
];

// ==========================================
// DISPLAY MESSAGE
// ==========================================

function showMessage(text, type = "success") {
    message.textContent = text;
    message.className = `message ${type}`;

    window.scrollTo({
        top: document.getElementById("add-movie").offsetTop - 90,
        behavior: "smooth"
    });

    setTimeout(() => {
        message.className = "message";
        message.textContent = "";
    }, 4000);
}

// ==========================================
// ESCAPE HTML TO PREVENT HTML INJECTION
// ==========================================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}

// ==========================================
// GET ALL MOVIES
// ==========================================

async function getMovies() {
    movieList.innerHTML = '<p class="loading">Loading movies...</p>';
    refreshBtn.disabled = true;

    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Unable to fetch movies");
        }

        allMovies = Array.isArray(data.movies) ? data.movies : [];

        displayMovies(allMovies);
        updateStatistics(allMovies);

    } catch (error) {
        movieList.innerHTML = `
            <p class="empty">
                Unable to load movies. Please check your server connection.
                <br><br>
                ${escapeHTML(error.message)}
            </p>
        `;
    } finally {
        refreshBtn.disabled = false;
    }
}

// ==========================================
// DISPLAY MOVIES
// ==========================================

function displayMovies(movies) {

    if (!movies.length) {
        movieList.innerHTML = `
            <div class="empty">
                <h3>No Movies Found 🎬</h3>
                <p>Add your first movie using the form above.</p>
            </div>
        `;
        return;
    }

    movieList.innerHTML = movies.map((movie, index) => {

        const poster = posterImages[index % posterImages.length];

        return `
            <article class="movie-card">

                <img
                    class="movie-poster"
                    src="${poster}"
                    alt="Cinema artwork for ${escapeHTML(movie.title)}"
                    loading="lazy"
                >

                <div class="movie-info">

                    <h3>${escapeHTML(movie.title)}</h3>

                    <div class="movie-tags">
                        <span class="tag">${escapeHTML(movie.genre)}</span>
                        <span class="tag">${escapeHTML(movie.language)}</span>
                    </div>

                    <p class="movie-detail">
                        ◷ ${escapeHTML(movie.duration)} minutes
                    </p>

                    <p class="movie-detail">
                        ♧ ${escapeHTML(movie.availableSeats)} available seats
                    </p>

                    <p class="movie-price">
                        ₹${Number(movie.ticketPrice).toLocaleString("en-IN")}
                    </p>

                    <div class="card-buttons">

                        <button
                            type="button"
                            class="edit-btn"
                            data-action="edit"
                            data-id="${escapeHTML(movie._id)}"
                        >
                            ✎ Edit
                        </button>

                        <button
                            type="button"
                            class="delete-btn"
                            data-action="delete"
                            data-id="${escapeHTML(movie._id)}"
                        >
                            🗑 Delete
                        </button>

                    </div>

                </div>

            </article>
        `;
    }).join("");
}

// ==========================================
// UPDATE DASHBOARD STATISTICS
// ==========================================

function updateStatistics(movies) {

    const totalMovies = movies.length;

    const totalSeats = movies.reduce((total, movie) => {
        return total + Number(movie.availableSeats || 0);
    }, 0);

    const totalPrice = movies.reduce((total, movie) => {
        return total + Number(movie.ticketPrice || 0);
    }, 0);

    const averagePrice = totalMovies
        ? Math.round(totalPrice / totalMovies)
        : 0;

    document.getElementById("totalMovies").textContent = totalMovies;

    document.getElementById("totalSeats").textContent =
        totalSeats.toLocaleString("en-IN");

    document.getElementById("averagePrice").textContent =
        `₹${averagePrice.toLocaleString("en-IN")}`;
}

// ==========================================
// FORM VALIDATION
// ==========================================

function validateMovie(movie) {

    if (!movie.title.trim()) {
        showMessage("Please enter the movie title.", "error");
        return false;
    }

    if (!movie.genre.trim()) {
        showMessage("Please enter the movie genre.", "error");
        return false;
    }

    if (!movie.language.trim()) {
        showMessage("Please enter the movie language.", "error");
        return false;
    }

    if (!Number.isInteger(movie.duration) || movie.duration < 1) {
        showMessage("Duration must be a positive whole number.", "error");
        return false;
    }

    if (!Number.isFinite(movie.ticketPrice) || movie.ticketPrice < 0) {
        showMessage("Ticket price cannot be negative.", "error");
        return false;
    }

    if (!Number.isInteger(movie.availableSeats) || movie.availableSeats < 0) {
        showMessage("Available seats must be zero or a positive whole number.", "error");
        return false;
    }

    return true;
}

// ==========================================
// GET FORM DATA
// ==========================================

function getFormData() {

    return {
        title: document.getElementById("title").value.trim(),
        genre: document.getElementById("genre").value.trim(),
        language: document.getElementById("language").value.trim(),
        duration: Number(document.getElementById("duration").value),
        ticketPrice: Number(document.getElementById("ticketPrice").value),
        availableSeats: Number(document.getElementById("availableSeats").value)
    };
}

// ==========================================
// ADD OR UPDATE MOVIE
// ==========================================

movieForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const movieData = getFormData();

    if (!validateMovie(movieData)) {
        return;
    }

    const isEditing = Boolean(editingMovieId);

    const url = isEditing
        ? `${API_URL}/${encodeURIComponent(editingMovieId)}`
        : API_URL;

    const method = isEditing ? "PUT" : "POST";

    submitBtn.disabled = true;
    submitBtn.textContent = isEditing ? "Updating..." : "Adding...";

    try {

        const response = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(movieData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || data.message || "Operation failed");
        }

        movieForm.reset();
        resetEditMode();

        await getMovies();

        showMessage(
            isEditing
                ? "Movie updated successfully!"
                : "Movie added successfully!",
            "success"
        );

    } catch (error) {

        showMessage(error.message, "error");

    } finally {

        submitBtn.disabled = false;

        if (!editingMovieId) {
            submitBtn.textContent = "+ Add Movie";
        }
    }
});

// ==========================================
// EDIT MOVIE
// ==========================================

function editMovie(id) {

    const movie = allMovies.find(item => item._id === id);

    if (!movie) {
        showMessage("Movie not found.", "error");
        return;
    }

    editingMovieId = id;

    document.getElementById("title").value = movie.title;
    document.getElementById("genre").value = movie.genre;
    document.getElementById("language").value = movie.language;
    document.getElementById("duration").value = movie.duration;
    document.getElementById("ticketPrice").value = movie.ticketPrice;
    document.getElementById("availableSeats").value = movie.availableSeats;

    submitBtn.textContent = "Update Movie";
    cancelEditBtn.hidden = false;

    document.getElementById("add-movie").scrollIntoView({
        behavior: "smooth"
    });
}

// ==========================================
// RESET EDIT MODE
// ==========================================

function resetEditMode() {

    editingMovieId = null;

    movieForm.reset();

    document.getElementById("availableSeats").value = 100;

    submitBtn.textContent = "+ Add Movie";
    cancelEditBtn.hidden = true;
}

// ==========================================
// CANCEL EDIT
// ==========================================

cancelEditBtn.addEventListener("click", function () {

    resetEditMode();

    showMessage("Edit cancelled.", "success");

});

// ==========================================
// DELETE MOVIE
// ==========================================

async function deleteMovie(id) {

    const movie = allMovies.find(item => item._id === id);

    if (!movie) {
        showMessage("Movie not found.", "error");
        return;
    }

    const confirmDelete = confirm(
        `Are you sure you want to delete "${movie.title}"?`
    );

    if (!confirmDelete) {
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/${encodeURIComponent(id)}`,
            {
                method: "DELETE"
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || data.message || "Unable to delete movie");
        }

        if (editingMovieId === id) {
            resetEditMode();
        }

        await getMovies();

        showMessage("Movie deleted successfully!", "success");

    } catch (error) {

        showMessage(error.message, "error");

    }
}

// ==========================================
// MOVIE CARD BUTTON EVENTS
// ==========================================

movieList.addEventListener("click", function (event) {

    const button = event.target.closest("button[data-action]");

    if (!button) {
        return;
    }

    const id = button.dataset.id;
    const action = button.dataset.action;

    if (action === "edit") {
        editMovie(id);
    }

    if (action === "delete") {
        deleteMovie(id);
    }
});

// ==========================================
// SEARCH MOVIES
// ==========================================

searchInput.addEventListener("input", function () {

    const searchText = searchInput.value.toLowerCase().trim();

    const filteredMovies = allMovies.filter(movie => {

        return (
            movie.title.toLowerCase().includes(searchText) ||
            movie.genre.toLowerCase().includes(searchText) ||
            movie.language.toLowerCase().includes(searchText)
        );

    });

    displayMovies(filteredMovies);

});

// ==========================================
// REFRESH MOVIES
// ==========================================

refreshBtn.addEventListener("click", getMovies);

// ==========================================
// LOAD MOVIES WHEN PAGE OPENS
// ==========================================

document.addEventListener("DOMContentLoaded", getMovies);