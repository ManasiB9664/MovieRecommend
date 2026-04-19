def filter_movies(df, languages, genres):
    filtered = df.copy()

    if languages:
        filtered = filtered[filtered['original_language'].isin(languages)]

    if genres:
        pattern = '|'.join(genres)
        filtered = filtered[filtered['genres'].str.contains(pattern, case=False, na=False)]


    return filtered


def extract_unique_genres(df):
    genre_set = set()

    for g in df['genres'].dropna():
        for item in g.split('|'):   # dataset uses '|'
            genre_set.add(item.strip())

    return sorted(list(genre_set))
def get_language_map():
    return {
        "en": "English",
        "hi": "Hindi",
        "fr": "French",
        "es": "Spanish",
        "de": "German",
        "it": "Italian",
        "ja": "Japanese",
        "ko": "Korean",
        "zh": "Chinese",
        "ru": "Russian",
        "pt": "Portuguese",
        "ar": "Arabic",
        "tr": "Turkish",
        "nl": "Dutch",
        "sv": "Swedish",
        "no": "Norwegian",
        "da": "Danish",
        "fi": "Finnish",
        "pl": "Polish",
        "cs": "Czech",
        "el": "Greek",
        "he": "Hebrew",
        "th": "Thai",
        "id": "Indonesian",
        "vi": "Vietnamese",
        "fa": "Persian",
        "ta": "Tamil",
        "te": "Telugu"
    }
def extract_unique_genres(df):
    genre_set = set()

    for g in df['genres'].dropna():
        parts = g.split('|') if '|' in g else g.split()
        for item in parts:
            genre_set.add(item.strip())

    return sorted(list(genre_set))
