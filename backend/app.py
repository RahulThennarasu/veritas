from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import google.generativeai as genai
from bs4 import BeautifulSoup
import pymongo
import certifi
import json
from datetime import datetime
from bson import ObjectId, json_util

# MongoDB JSON Encoder to handle ObjectId and dates
class MongoJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime, ObjectId)):
            return str(obj)
        return json.JSONEncoder.default(self, obj)

app = Flask(__name__)
# Enable CORS for all routes with explicit configuration
CORS(app, origins=["http://localhost:3000"], supports_credentials=True)

# Configure Gemini API
GEMINI_API_KEY = "AIzaSyCikf9gNf-dWLn9PDm-ob5Q3CfdOPnewhw"
genai.configure(api_key=GEMINI_API_KEY)

# SerpAPI configuration
SERPAPI_API_KEY = "10473f787cb84b7646999ae3493fd494b5fcf9a6f88303adc95ec59ce15b0dea"  # Replace with your SerpAPI key

# MongoDB configuration
client = pymongo.MongoClient('mongodb+srv://rahulthennarasu07:lego3011@veritascluster.fog1e.mongodb.net/?retryWrites=true&w=majority&appName=veritascluster', tlsCAFile=certifi.where())
db = client["veritas"]
urls_collection = db["urls"]
analysis_collection = db["analysis"]
chats_collection = db["chats"]
messages_collection = db["messages"]

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
    user_id = data.get("userId")
    chat_id = data.get("chatId")
    print("Received statement: ", statement)

    # Analyze the text with Gemini
    gemini_response = analyze_text_with_gemini(statement)

    # Check if this is part of an existing chat
    if chat_id and user_id:
        # Store the message in the messages collection
        message_data = {
            "userId": user_id,
            "chatId": chat_id,
            "content": statement,
            "timestamp": datetime.now(),
            "type": "user"
        }
        message_id = messages_collection.insert_one(message_data).inserted_id
        
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
        
        # Store the assistant's response in the messages collection
        assistant_message = {
            "userId": user_id,
            "chatId": chat_id,
            "content": gemini_response,
            "sources": urls,
            "timestamp": datetime.now(),
            "type": "assistant"
        }
        assistant_message_id = messages_collection.insert_one(assistant_message).inserted_id
        
        # Update the chat's lastUpdated field
        chats_collection.update_one(
            {"_id": ObjectId(chat_id)},
            {"$set": {"lastUpdated": datetime.now()}}
        )
    else:
        # Save analysis result to MongoDB without chat association
        analysis_collection.insert_one({
            "statement": statement,
            "analysis": gemini_response,
            "timestamp": datetime.now(),
            "userId": user_id
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

@app.route("/chats", methods=["GET"])
def get_chats():
    """
    Get all chats for a user
    """
    user_id = request.args.get("userId")
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400
    
    chats = list(chats_collection.find({"userId": user_id}).sort("lastUpdated", -1))
    return json.loads(json_util.dumps(chats))

@app.route("/chats", methods=["POST"])
def create_chat():
    """
    Create a new chat for a user
    """
    data = request.get_json()
    user_id = data.get("userId")
    title = data.get("title", "New Chat")
    
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400
    
    chat_data = {
        "userId": user_id,
        "title": title,
        "created": datetime.now(),
        "lastUpdated": datetime.now()
    }
    
    chat_id = chats_collection.insert_one(chat_data).inserted_id
    return json.loads(json_util.dumps({"_id": chat_id, **chat_data}))

@app.route("/chats/<chat_id>", methods=["GET"])
def get_chat(chat_id):
    """
    Get a specific chat by ID
    """
    chat = chats_collection.find_one({"_id": ObjectId(chat_id)})
    if not chat:
        return jsonify({"error": "Chat not found"}), 404
    
    return json.loads(json_util.dumps(chat))

@app.route("/chats/<chat_id>", methods=["PUT"])
def update_chat(chat_id):
    """
    Update a chat (e.g., change title)
    """
    data = request.get_json()
    title = data.get("title")
    
    if not title:
        return jsonify({"error": "Title is required"}), 400
    
    result = chats_collection.update_one(
        {"_id": ObjectId(chat_id)},
        {"$set": {"title": title, "lastUpdated": datetime.now()}}
    )
    
    if result.matched_count == 0:
        return jsonify({"error": "Chat not found"}), 404
    
    return jsonify({"success": True})

@app.route("/chats/<chat_id>", methods=["DELETE"])
def delete_chat(chat_id):
    """
    Delete a chat and all its messages
    """
    # Delete the chat
    chat_result = chats_collection.delete_one({"_id": ObjectId(chat_id)})
    
    if chat_result.deleted_count == 0:
        return jsonify({"error": "Chat not found"}), 404
    
    # Delete all messages associated with this chat
    messages_collection.delete_many({"chatId": chat_id})
    
    return jsonify({"success": True})

@app.route("/chats/<chat_id>/messages", methods=["GET"])
def get_chat_messages(chat_id):
    """
    Get all messages for a specific chat
    """
    messages = list(messages_collection.find({"chatId": chat_id}).sort("timestamp", 1))
    return json.loads(json_util.dumps(messages))

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok"}), 200

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5005)