let selectedLanguages = [];
let selectedGenres = [];
let selectedMovies = [];

/* =======================
   🌐 LANGUAGE MAP (FROM BACKEND)
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
   🎬 LOAD MOVIES (STEP 3)
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
    .then(data => {
        renderMovieCards(data.movies, true);
    })
    .catch(err => console.error("Movie load error:", err));
}


/* =======================
   🎯 RENDER MOVIE CARDS
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

        /* Select movie */
        if (selectable) {
            div.onclick = () => toggleMovie(div, m.title);
        }

        /* Info button */
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
   ⭐ LOAD RECOMMENDATIONS
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

/* Auto run for result page */
loadRecommendedMovies();
