from flask import Flask, render_template, request, jsonify
import pandas as pd

from model import get_recommendations, prepare_model
from utils.helper import filter_movies, extract_unique_genres, get_language_map

app = Flask(__name__)

# =======================
# 📦 Load dataset
# =======================
df = pd.read_csv("movie_dataset.csv")

# Prepare model once
similarity, df = prepare_model(df)


# =======================
# 🔧 Helper: Format Genres
# =======================
def format_genres(g):
    if isinstance(g, str):
        return ", ".join(g.split())
    return ""


# =======================
# 🏠 Home Route
# =======================
@app.route('/')
def home():
    lang_map = get_language_map()

    raw_langs = df['original_language'].dropna().unique()
    languages = [(code, lang_map.get(code, code.upper())) for code in raw_langs]

    genres = extract_unique_genres(df)

    return render_template(
        'index.html',
        languages=languages,
        genres=genres,
        lang_map=lang_map   # ✅ PASS THIS
    )


# =======================
# 🎬 Get Movies (Step 3)
# =======================
@app.route('/get_movies', methods=['POST'])
def get_movies():
    languages = request.form.getlist('languages')
    genres = request.form.getlist('genres')

    filtered = filter_movies(df, languages, genres)

    # Sort by popularity
    filtered = filtered.sort_values(by='popularity', ascending=False)

    movies = filtered[
        ['title', 'overview', 'director', 'cast', 'genres', 'original_language']
    ].dropna().head(15).to_dict(orient='records')

    # Format genres
    for m in movies:
        m['genres'] = format_genres(m['genres'])

    return jsonify({"movies": movies})


# =======================
# 🎯 Recommend Route
# =======================
@app.route('/recommend', methods=['POST'])
def recommend():
    selected_movies = request.form.getlist('movies')
    selected_languages = request.form.getlist('languages')
    selected_genres = request.form.getlist('genres')

    rec_titles = get_recommendations(
        selected_movies,
        df,
        similarity,
        selected_languages,
        selected_genres
    )

    recs = df[df['title'].isin(rec_titles)][
        ['title', 'overview', 'director', 'cast', 'genres', 'original_language']
    ].dropna().to_dict(orient='records')

    # Format genres
    for m in recs:
        m['genres'] = format_genres(m['genres'])

    lang_map = get_language_map()

    return render_template(
        'result.html',
        movies=recs,
        lang_map=lang_map   # ✅ PASS HERE TOO
    )


# =======================
# 🚀 Run App
# =======================
if __name__ == '__main__':
    app.run(debug=True)
