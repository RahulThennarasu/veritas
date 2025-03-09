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
    Analyze text using the Gemini API and return a structured analysis.
    """
    model = genai.GenerativeModel('gemini-2.0-flash')
    prompt = f"""
        Analyze the following statement in a structured format. 
        
        Statement: {text}

        Please provide your analysis in the following format:
        
        Main Thesis: [Identify the central argument or main point]
        
        Key Claims: [List the key claims made in the statement]
        
        Evidence Quality: [Evaluate the quality, relevance, and sufficiency of evidence presented]
        
        Potential Biases: [Identify any potential biases, assumptions, or perspectives that might influence the statement]
        
        Counterarguments: [Provide potential counterarguments or alternative perspectives not addressed in the statement]
        
        For each section, provide a thorough analysis with specific examples from the text.
        """
    response = model.generate_content(prompt)
    
    # Parse the structured response into sections
    analysis_text = response.text
    sections = {}
    
    # Extract each section using regex or simple string parsing
    import re
    
    # Find each section in the response
    main_thesis_match = re.search(r'Main Thesis:\s*(.*?)(?=Key Claims:|$)', analysis_text, re.DOTALL)
    key_claims_match = re.search(r'Key Claims:\s*(.*?)(?=Evidence Quality:|$)', analysis_text, re.DOTALL)
    evidence_match = re.search(r'Evidence Quality:\s*(.*?)(?=Potential Biases:|$)', analysis_text, re.DOTALL)
    biases_match = re.search(r'Potential Biases:\s*(.*?)(?=Counterarguments:|$)', analysis_text, re.DOTALL)
    counter_match = re.search(r'Counterarguments:\s*(.*?)(?=$)', analysis_text, re.DOTALL)
    
    # Add sections to the dictionary if found
    if main_thesis_match: sections['main_thesis'] = main_thesis_match.group(1).strip()
    if key_claims_match: sections['key_claims'] = key_claims_match.group(1).strip()
    if evidence_match: sections['evidence_quality'] = evidence_match.group(1).strip()
    if biases_match: sections['potential_biases'] = biases_match.group(1).strip()
    if counter_match: sections['counterarguments'] = counter_match.group(1).strip()
    
    # If parsing fails, return the full text as a fallback
    if not sections:
        return analysis_text
    
    return sections

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

    # Check if the response is a dictionary or string
    is_inaccurate = False
    if isinstance(gemini_response, dict):
        # For structured responses, check each section for "inaccurate" or "false"
        response_text = str(gemini_response)
        is_inaccurate = "inaccurate" in response_text.lower() or "false" in response_text.lower()
    else:
        # For string responses, check directly
        is_inaccurate = "inaccurate" in gemini_response.lower() or "false" in gemini_response.lower()

    # Fetch URLs from Google Search if the text is flagged as inaccurate
    urls = []
    if is_inaccurate:
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
    app.run(debug=True, host='0.0.0.0', port=5005)