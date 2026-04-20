let selectedLanguages = [];
let selectedGenres = [];
let selectedMovies = [];
let selectedCustomGenres = [];

/* =======================
   🌐 LANGUAGE MAP
   ======================= */
let LANGUAGE_MAP = {};

const langMapElement = document.getElementById("lang-map");
if (langMapElement) {
    LANGUAGE_MAP = JSON.parse(langMapElement.textContent);
}

function getLangName(code) {
    return LANGUAGE_MAP[code] || code.toUpperCase();
}

/* =======================
   TOGGLE SELECT
   ======================= */
function toggleSelect(el) {
    el.classList.toggle("selected");
}

/* =======================
   STEP NAVIGATION
   ======================= */
function goToGenres() {
    selectedLanguages = getSelected("languages");

    if (selectedLanguages.length === 0) {
        alert("Select at least one language");
        return;
    }

    switchStep(2);
}

function goToMovies() {
    selectedGenres = getSelected("genres");

    if (selectedGenres.length !== 3) {
        alert("Select exactly 3 genres");
        return;
    }

    loadMovies();
    switchStep(3);
}

function switchStep(n) {
    document.querySelectorAll(".step").forEach(s => s.classList.remove("active"));
    document.getElementById("step" + n).classList.add("active");
}

function getSelected(type) {
    return Array.from(document.querySelectorAll(`.${type}.selected`))
        .map(el => el.dataset.value);
}

/* =======================
   🎬 LOAD MOVIES
   ======================= */
function loadMovies() {
    let formData = new FormData();

    selectedLanguages.forEach(l => formData.append("languages", l));
    selectedGenres.forEach(g => formData.append("genres", g));

    fetch('/get_movies', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => renderMovieCards(data.movies, true))
    .catch(err => console.error("Movie load error:", err));
}

/* =======================
   🎬 RENDER MOVIE CARDS
   ======================= */
function renderMovieCards(movies, selectable=false) {
    let container = document.getElementById("moviesContainer");
    if (!container) return;

    container.innerHTML = "";

    movies.forEach(m => {
        let div = document.createElement("div");
        div.className = "card movie-card";

        div.innerHTML = `
            <div class="card-header">
                <span class="lang">${m.original_language.toUpperCase()}</span>
                <button class="info-btn">i</button>
            </div>

            <div class="card-body">${m.title}</div>
            <div class="card-footer">${m.genres}</div>
        `;

        if (selectable) {
            div.onclick = () => toggleMovie(div, m.title);
        }

        div.querySelector(".info-btn").onclick = (e) => {
            e.stopPropagation();
            openModal(m);
        };

        container.appendChild(div);
    });
}

/* =======================
   🪟 MODAL
   ======================= */
function openModal(movie) {
    document.getElementById("modalTitle").innerText = movie.title;

    document.getElementById("modalDetails").innerText =
`Language: ${getLangName(movie.original_language)}
Director: ${movie.director}
Cast: ${movie.cast}
Genres: ${movie.genres}

${movie.overview}`;

    document.getElementById("modal").classList.remove("hidden");
}

function closeModal() {
    document.getElementById("modal").classList.add("hidden");
}

/* =======================
   🎬 MOVIE SELECTION
   ======================= */
function toggleMovie(el, title) {
    if (!el.classList.contains("selected") && selectedMovies.length >= 3) {
        alert("Select only 3 movies");
        return;
    }

    el.classList.toggle("selected");

    if (selectedMovies.includes(title)) {
        selectedMovies = selectedMovies.filter(m => m !== title);
    } else {
        selectedMovies.push(title);
    }
}

/* =======================
   🚀 SUBMIT
   ======================= */
function submitMovies() {
    if (selectedMovies.length !== 3) {
        alert("Select exactly 3 movies");
        return;
    }

    let form = document.createElement("form");
    form.method = "POST";
    form.action = "/recommend";

    selectedMovies.forEach(m => addHidden(form, "movies", m));
    selectedLanguages.forEach(l => addHidden(form, "languages", l));
    selectedGenres.forEach(g => addHidden(form, "genres", g));

    document.body.appendChild(form);
    form.submit();
}

function addHidden(form, name, value) {
    let input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
}

/* =======================
   ⭐ LOAD RECOMMENDED PAGE
   ======================= */
function loadRecommendedMovies() {
    const data = document.getElementById("movies-data");
    if (!data) return;

    try {
        const movies = JSON.parse(data.textContent);
        renderMovieCards(movies, false);
    } catch (e) {
        console.error("JSON parse error:", e);
    }
}

/* =======================
   🔍 CUSTOM SEARCH
   ======================= */
function toggleCustomSearch() {
    document.getElementById("customSearchBox").classList.toggle("hidden");
}

/* GENRE TAG SYSTEM */
const genreSelect = document.getElementById("genreSelect");

if (genreSelect) {
    genreSelect.addEventListener("change", function() {
        const val = this.value;
        if (!val || selectedCustomGenres.includes(val)) return;

        selectedCustomGenres.push(val);
        renderTags();
        this.value = "";
    });
}

function renderTags() {
    const container = document.getElementById("genreTags");
    if (!container) return;

    container.innerHTML = "";

    selectedCustomGenres.forEach(g => {
        let tag = document.createElement("div");
        tag.className = "tag";
        tag.innerText = g + " ×";

        tag.onclick = () => {
            selectedCustomGenres = selectedCustomGenres.filter(x => x !== g);
            renderTags();
        };

        container.appendChild(tag);
    });
}

/* RUN CUSTOM SEARCH */
function runCustomSearch() {
    const language = document.getElementById("customLanguage").value;
    const cast = document.getElementById("customCast").value;
    const director = document.getElementById("customDirector").value;
    const keywords = document.getElementById("customKeywords").value;

    if (!language) {
        alert("Language is required");
        return;
    }

    if (selectedCustomGenres.length === 0) {
        alert("Select at least one genre");
        return;
    }

    let formData = new FormData();
    formData.append("language", language);
    formData.append("genres", selectedCustomGenres.join(" "));
    formData.append("cast", cast);
    formData.append("director", director);
    formData.append("keywords", keywords);

    fetch('/custom_search', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {

        if (!data.movies || data.movies.length === 0) {
            alert("No movies found. Try different filters.");
            return;
        }

        switchStep(3);

        selectedLanguages = [language];

        renderMovieCards(data.movies, true);
    })
    .catch(err => console.error("Custom search error:", err));
}

/* AUTO LOAD */
loadRecommendedMovies();
