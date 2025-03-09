from flask import Flask, request, jsonify
from flask_cors import CORS  # Enable CORS for React frontend
import requests
import google.generativeai as genai
from bs4 import BeautifulSoup  # For parsing HTML
import pymongo
import certifi

app = Flask(__name__)
# Enable CORS for all routes with explicit configuration
CORS(app, origins=["http://localhost:3000"], supports_credentials=True)

# Configure Gemini API
GEMINI_API_KEY = "AIzaSyCikf9gNf-dWLn9PDm-ob5Q3CfdOPnewhw"
genai.configure(api_key=GEMINI_API_KEY)

# SerpAPI configuration
SERPAPI_API_KEY = ""  # Replace with your SerpAPI key

# MongoDB configuration
client = pymongo.MongoClient('mongodb+srv://rahulthennarasu07:lego3011@veritascluster.fog1e.mongodb.net/?retryWrites=true&w=majority&appName=veritascluster', tlsCAFile=certifi.where())
db = client["veritas"]
urls_collection = db["urls"]
analysis_collection = db["analysis"]  # New collection to store Gemini responses

def fetch_urls_from_google(query):
    """
    Fetch URLs from Google Search using SerpAPI and store in MongoDB.
    """
    print("Fetching URLs from Google Search using SerpAPI...")
    try:
        params = {
            "q": query,
            "api_key": SERPAPI_API_KEY
        }
        response = requests.get("https://serpapi.com/search", params=params)
        response.raise_for_status()
        data = response.json()

        # Extract URLs from the search results
        urls = [result.get("link") for result in data.get("organic_results", [])]
        print("Fetched URLs:", urls)  # Debugging

        # Store URLs in MongoDB
        urls_collection.insert_one({"query": query, "urls": urls[:5]})
        return urls[:5]  # Return the first 5 URLs
    except requests.exceptions.RequestException as e:
        print(f"Error fetching URLs from SerpAPI: {e}")
        return []

def analyze_text_with_gemini(text):
    """
    Analyze text for accuracy using the Gemini API.
    """
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
    """
    Endpoint to analyze a statement using Gemini and fetch supporting URLs from Google Search via SerpAPI.
    """
    data = request.get_json()
    statement = data.get("statement")
    print("Received statement: ", statement)

    # Analyze the text with Gemini
    gemini_response = analyze_text_with_gemini(statement)

    # Save analysis result to MongoDB
    analysis_collection.insert_one({
        "statement": statement,
        "analysis": gemini_response
    })

    # Fetch URLs from Google Search if the text is flagged as inaccurate
    urls = []
    if "inaccurate" in gemini_response.lower() or "false" in gemini_response.lower():
        print("Fetching supporting URLs from Google Search...")
        urls = fetch_urls_from_google(statement)

    return jsonify({
        "statement": statement,
        "analysis": gemini_response,
        "sources": urls
    })
    
    # Add explicit CORS headers to the response
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.add('Access-Control-Allow-Methods', 'POST')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    
    return response

# Add a simple health check endpoint
@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok"}), 200

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)