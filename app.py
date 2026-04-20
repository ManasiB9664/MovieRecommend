from flask import Flask, render_template, request, jsonify
import pandas as pd

from model import get_recommendations, prepare_model
from utils.helper import filter_movies, extract_unique_genres, get_language_map

from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity

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
        lang_map=lang_map
    )


# =======================
# 🎬 Get Movies (Step 3)
# =======================
@app.route('/get_movies', methods=['POST'])
def get_movies():
    languages = request.form.getlist('languages')
    genres = request.form.getlist('genres')

    filtered = filter_movies(df, languages, genres)
    filtered = filtered.sort_values(by='popularity', ascending=False)

    movies = filtered[
        ['title', 'overview', 'director', 'cast', 'genres', 'original_language']
    ].dropna().head(15).to_dict(orient='records')

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

    for m in recs:
        m['genres'] = format_genres(m['genres'])

    return render_template(
        'result.html',
        movies=recs,
        lang_map=get_language_map()
    )


# =======================
# 🔍 CUSTOM SEARCH (FIXED)
# =======================
@app.route('/custom_search', methods=['POST'])
def custom_search():
    language = request.form.get('language')
    genres = request.form.get('genres', '')
    cast = request.form.get('cast', '')
    director = request.form.get('director', '')
    keywords = request.form.get('keywords', '')

    if not language:
        return jsonify({"movies": []})

    # 🔹 Create pseudo input text
    input_text = f"{genres} {keywords} {cast} {director}".strip()

    temp_df = df.copy()

    # 🔹 Ensure combined_features exists
    if "combined_features" not in temp_df.columns:
        temp_df["combined_features"] = (
            temp_df['genres'].fillna('') + " " +
            temp_df['keywords'].fillna('') + " " +
            temp_df['cast'].fillna('') + " " +
            temp_df['director'].fillna('')
        )

    # 🔹 Add fake row SAFELY
    fake_row = {col: "" for col in temp_df.columns}
    fake_row["combined_features"] = input_text
    fake_row["original_language"] = language

    temp_df = pd.concat([temp_df, pd.DataFrame([fake_row])], ignore_index=True)

    # 🔹 Vectorize
    cv = CountVectorizer(stop_words='english')
    matrix = cv.fit_transform(temp_df["combined_features"])

    sim = cosine_similarity(matrix)

    # 🔹 Get similarity scores (last row vs all)
    scores = sim[-1]

    temp_df["score"] = scores

    # 🔹 STRICT language filter
    temp_df = temp_df[temp_df['original_language'] == language]

    # 🔹 REMOVE FAKE ROW
    temp_df = temp_df.iloc[:-1]

    # 🔹 Sort
    temp_df = temp_df.sort_values(by="score", ascending=False)

    movies = temp_df[
        ['title', 'overview', 'director', 'cast', 'genres', 'original_language']
    ].dropna().head(12).to_dict(orient='records')

    # 🔹 Format genres
    for m in movies:
        m['genres'] = format_genres(m['genres'])

    return jsonify({"movies": movies})


# =======================
# 🚀 Run App
# =======================
if __name__ == '__main__':
    app.run(debug=True)
