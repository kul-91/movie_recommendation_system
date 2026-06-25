from requests import request
# pyrefly: ignore [missing-import]
from fastapi import FastAPI, HTTPException
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from huggingface_hub import hf_hub_download
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

import os
import pickle
import requests


load_dotenv()

HF_TOKEN = os.environ.get("HF_TOKEN")
HF_REPO = "kul-91/movie_recommendation_artifacts"
FRONTEND_URL = os.environ.get("FRONTEND_URL")

movies_df = None
similarity_matrix = None
movies_title = None

def download_artifacts():
    files = [
        'movies_df.pkl',
        'similarity_matrix.pkl'
    ]
    for file in files:
        if not os.path.exists(file):
            print(f"Downloading {file}...")
            hf_hub_download(
                repo_id=HF_REPO,
                filename=file,
                repo_type="dataset",
                local_dir=".",     # saves in current directory
                token=HF_TOKEN,
            )
            print(f"{file} ready")

def load_artifacts():
    global movies_df, similarity_matrix
    movies_df = pickle.load(open('movies_df.pkl', 'rb'))
    similarity_matrix = pickle.load(open('similarity_matrix.pkl', 'rb'))
    movies_title = movies_df['title'].values
    print("Artifacts loaded")



app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    download_artifacts()
    load_artifacts()


@app.get("/api/movies")
def get_movies():
    return list(movies_df['title'].values)


def fetch_poster(movie_id):
    try:
        url = f"https://api.themoviedb.org/3/movie/{movie_id}?api_key=d9af0d6fb36dc88d7a5aa2ca1593ca3d"

        print(f"Fetching movie_id={movie_id}")

        response = requests.get(
            url,
            timeout=5,
            headers={
                "User-Agent": "Mozilla/5.0"
            }
        )   

        print("Status:", response.status_code)

        response.raise_for_status()

        data = response.json()

        poster_path = data.get("poster_path")

        if not poster_path:
            print("No poster found:", movie_id)
            return None

        return "https://image.tmdb.org/t/p/w500" + poster_path

    except Exception as e:
        print(f"Error for movie_id={movie_id}: {e}")
        return None


@app.get("/api/recommend")
def recommend(movie_title):
    try:
        movie_idx = movies_df[movies_df['title'] == movie_title].index[0]
        
        distance = sorted(list(enumerate(similarity_matrix[movie_idx] + 0.01*movies_df['weighted_rate'] + 0.01*movies_df['popularity_scaled'])), reverse=True, key = lambda x: x[1])[1:6]

        movies_id_list = []
        movies_list = []
        movies_poster = []

        searched_id = int(movies_df[movies_df['title'] == movie_title]['movie_id'].values[0])
        searched_title = movies_df[movies_df['title'] == movie_title]['title'].values[0]
        searched_movie_poster = fetch_poster(movies_df[movies_df['title'] == movie_title]['movie_id'].values[0])

        for i in distance:
            movies_id_list.append(int(movies_df.iloc[i[0]]['movie_id']))
            movies_list.append(movies_df.iloc[i[0]]['title'])
            movies_poster.append(fetch_poster(movies_df.iloc[i[0]]['movie_id']))

        return{"searched_movie": {
                                  "movie_id": searched_id,
                                  "title": searched_title,
                                  "poster": searched_movie_poster},
              "recommendations": [movies_id_list, movies_list, movies_poster]
              }

    except Exception as e:
        raise HTTPException(status_code=404, detail="Movie not found")


            