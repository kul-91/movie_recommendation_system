import pickle
import json

print("Loading movies_df.pkl...")
movies_df = pickle.load(open('movies_df.pkl', 'rb'))
print("Loading similarity.pkl...")
similarity_matrix = pickle.load(open('similarity.pkl', 'rb'))

movies_list = []

print("Precomputing recommendations...")
for idx, row in movies_df.iterrows():
    # Find similarity indices
    distances = similarity_matrix[idx]
    # Sort and get top 10 (excluding itself)
    movie_list = sorted(list(enumerate(distances)), reverse=True, key=lambda x: x[1])[1:11]
    
    recs = []
    for i in movie_list:
        rec_idx = i[0]
        rec_row = movies_df.iloc[rec_idx]
        recs.append({
            "movie_id": int(rec_row['movie_id']),
            "title": str(rec_row['title'])
        })
        
    movies_list.append({
        "index": int(idx),
        "movie_id": int(row['movie_id']),
        "title": str(row['title']),
        "recommendations": recs
    })

print("Writing to movies_data.json...")
with open('movies_data.json', 'w') as f:
    json.dump(movies_list, f, indent=2)

print("Successfully precomputed all recommendations!")
