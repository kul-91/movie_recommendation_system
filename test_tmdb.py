import requests

headers = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/137.0 Safari/537.36"
}

url = "https://api.themoviedb.org/3/movie/550?api_key=d9af0d6fb36dc88d7a5aa2ca1593ca3d"

r = requests.get(
    url,
    headers=headers,
    timeout=10
)

print(r.status_code)
print(r.text[:100])