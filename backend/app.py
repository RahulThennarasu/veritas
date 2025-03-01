from flask import Flask, request, jsonify
from flask_cors import CORS  # Enable CORS for React frontend
import requests
import google.generativeai as genai
from bs4 import BeautifulSoup  # For parsing HTML

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

# Configure Gemini API
GEMINI_API_KEY = "AIzaSyCikf9gNf-dWLn9PDm-ob5Q3CfdOPnewhw"
genai.configure(api_key=GEMINI_API_KEY)

# Configure YOU API
YOU_API_KEY = "c204523e-2ff3-4615-affb-dcd34a67817c<__>1QwTY6ETU8N2v5f4i5nbzSyT"

def get_ai_snippets_for_query(query, retries=3):
    """
    Fetch AI-generated snippets from YOU API for a given query.
    Retry the request if it fails or returns no URLs.
    """
    headers = {"X-API-Key": YOU_API_KEY}
    params = {"query": query}
    for attempt in range(retries):
        try:
            response = requests.get(
                "https://api.ydc-index.io/search",
                params=params,
                headers=headers,
            )
            response.raise_for_status()  # Raise an exception for HTTP errors
            data = response.json()
            urls = extract_urls_from_response(data)
            if urls:  # If URLs are found, return them
                return urls
            print(f"Attempt {attempt + 1}: No URLs found in YOU API response.")
        except requests.exceptions.RequestException as e:
            print(f"Attempt {attempt + 1}: Error fetching data from YOU API: {e}")
    return None  # Return None if all retries fail

def extract_urls_from_response(response):
    """Extract URLs from the YOU API response."""
    urls = []
    if response and "hits" in response:
        for hit in response["hits"]:
            if "url" in hit:
                urls.append(hit["url"])
    return urls

def fetch_fallback_urls(query):
    """
    Fetch URLs from Google Search as a fallback if YOU API fails.
    Uses BeautifulSoup to parse Google Search results.
    """
    print("Fetching fallback URLs from Google Search...")
    try:
        # Send a request to Google Search
        response = requests.get(
            "https://www.google.com/search",
            params={"q": query},
            headers={"User-Agent": "Mozilla/5.0"}
        )
        response.raise_for_status()

        # Parse the HTML response using BeautifulSoup
        soup = BeautifulSoup(response.text, "html.parser")
        urls = []

        # Extract URLs from search results
        for link in soup.find_all("a", href=True):
            href = link["href"]
            if href.startswith("/url?q="):
                # Extract the actual URL from the Google redirect link
                url = href.split("/url?q=")[1].split("&")[0]
                urls.append(url)

        # Return the first 5 URLs (or fewer if not enough are found)
        return urls[:5]
    except requests.exceptions.RequestException as e:
        print(f"Error fetching fallback URLs from Google: {e}")
        return []

def analyze_text_with_gemini(text):
    """Analyze text for accuracy using the Gemini API."""
    model = genai.GenerativeModel('gemini-2.0-flash')
    prompt = f"""
            Analyze the following statement and identify any false claims. For each false claim, explicitly state that it is "inaccurate" and provide a brief explanation. Ensure that you address each claim individually before moving on to the next part of the statement.

            Statement: {text}

            Instructions:
            1. Break the statement into individual claims or sentences.
            2. For each claim, determine if it is accurate or inaccurate.
            3. If a claim is inaccurate, explicitly state "This claim is inaccurate:" followed by a brief explanation.
            4. If a claim is accurate, state "This claim is accurate:" followed by a brief explanation.
            5. Do not proceed to the next claim until you have explicitly labeled the current claim as accurate or inaccurate.

            Example:
            Statement: "The Earth is flat, and the moon is made of cheese."
            Analysis:
            - This claim is inaccurate: The Earth is not flat; it is an oblate spheroid.
            - This claim is inaccurate: The moon is not made of cheese; it is composed of rock and minerals.
            """
    response = model.generate_content(prompt)
    return response.text

@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json()
    user_input = data.get("statement")

    # Analyze the text with Gemini
    gemini_response = analyze_text_with_gemini(user_input)

    # Fetch sources with YOU API if the text is flagged as inaccurate
    urls = []
    if "not accurate" in gemini_response.lower() or "false" in gemini_response.lower():
        print("Fetching sources from YOU API...")  # Debugging log
        urls = get_ai_snippets_for_query(f"Provide sources for: {user_input}")
        
        # If YOU API fails or returns no URLs, use Google Search as a fallback
        if not urls:
            print("YOU API failed or returned no URLs. Using Google Search fallback...")
            urls = fetch_fallback_urls(user_input)

        print("Final URLs:", urls)  # Debugging log

    return jsonify({
        "statement": user_input,
        "analysis": gemini_response,
        "sources": urls
    })

if __name__ == "__main__":
    app.run(debug=True)