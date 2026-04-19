from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def combine_features(row):
    return f"{row['genres']} {row['keywords']} {row['cast']} {row['director']}"

def prepare_model(df):
    features = ['genres', 'keywords', 'cast', 'director']

    for f in features:
        df[f] = df[f].fillna('')

    df["combined_features"] = df.apply(combine_features, axis=1)

    cv = CountVectorizer(stop_words='english')
    count_matrix = cv.fit_transform(df["combined_features"])

    similarity = cosine_similarity(count_matrix)

    return similarity, df


def get_recommendations(movie_titles, df, similarity, selected_languages, selected_genres):

    # Step 1: Get indices of selected movies
    indices = df[df['title'].isin(movie_titles)].index.tolist()
    if not indices:
        return []

    # Step 2: Compute similarity score
    sim_scores = similarity[indices].mean(axis=0)

    # Step 3: Create working dataframe
    temp_df = df.copy()
    temp_df["similarity_score"] = sim_scores

    # Step 4: STRICT language filter
    temp_df = temp_df[temp_df['original_language'].isin(selected_languages)]

    # Step 5: Genre match score
    def genre_score(genres_str):
        movie_genres = set(genres_str.lower().split())
        selected = set([g.lower() for g in selected_genres])

        return len(movie_genres.intersection(selected)) / max(len(selected), 1)

    temp_df["genre_score"] = temp_df["genres"].apply(lambda x: genre_score(x) if isinstance(x, str) else 0)

    # Step 6: Final weighted score
    temp_df["final_score"] = (
        0.6 * temp_df["similarity_score"] +
        0.4 * temp_df["genre_score"]
    )

    # Step 7: Remove already selected movies
    temp_df = temp_df[~temp_df['title'].isin(movie_titles)]

    # Step 8: Sort and return
    temp_df = temp_df.sort_values(by="final_score", ascending=False)

    return temp_df.head(14)['title'].tolist()

