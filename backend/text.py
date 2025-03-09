from flask import Flask, request, jsonify
from flask_cors import CORS  # Enable CORS for React frontend
import requests
import google.generativeai as genai
from bs4 import BeautifulSoup  # For parsing HTML
import pymongo
import certifi
import json
from datetime import datetime
from bson import ObjectId, json_util

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
analysis_collection = db["analysis"]  # Collection to store Gemini responses
chats_collection = db["chats"]  # New collection for chats
messages_collection = db["messages"]  # New collection for messages

# Helper function to convert MongoDB objects to JSON
def to_json(data):
    return json.loads(json_util.dumps(data))

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
    user_id = data.get("userId")
    chat_id = data.get("chatId")
    print("Received statement: ", statement)
    print("User ID:", user_id)
    print("Chat ID:", chat_id)

    # Analyze the text with Gemini
    gemini_response = analyze_text_with_gemini(statement)

    # If there's a chat ID and user ID, save as a message
    if chat_id and user_id:
        # Store the user message first
        user_message_data = {
            "userId": user_id,
            "chatId": chat_id,
            "content": statement,
            "timestamp": datetime.now(),
            "type": "user"
        }
        messages_collection.insert_one(user_message_data)
        
        # Get URLs for inaccurate statements
        urls = []
        if "inaccurate" in gemini_response.lower() or "false" in gemini_response.lower():
            print("Fetching supporting URLs from Google Search...")
            urls = fetch_urls_from_google(statement)
            
        # Store the assistant's response
        assistant_message_data = {
            "userId": user_id,
            "chatId": chat_id,
            "content": gemini_response,
            "sources": urls,
            "timestamp": datetime.now(),
            "type": "assistant"
        }
        messages_collection.insert_one(assistant_message_data)
        
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

# Chat endpoints
@app.route("/chats", methods=["GET"])
def get_chats():
    """
    Get all chats for a user
    """
    user_id = request.args.get("userId")
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400
    
    chats = list(chats_collection.find({"userId": user_id}).sort("lastUpdated", -1))
    return jsonify(to_json(chats))

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
    
    result = chats_collection.insert_one(chat_data)
    chat_id = str(result.inserted_id)
    
    # Return the newly created chat
    chat = chats_collection.find_one({"_id": ObjectId(chat_id)})
    return jsonify(to_json(chat))

@app.route("/chats/<chat_id>", methods=["GET"])
def get_chat(chat_id):
    """
    Get a specific chat by ID
    """
    try:
        chat = chats_collection.find_one({"_id": ObjectId(chat_id)})
        if not chat:
            return jsonify({"error": "Chat not found"}), 404
        
        return jsonify(to_json(chat))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/chats/<chat_id>", methods=["PUT"])
def update_chat(chat_id):
    """
    Update a chat (e.g., change title)
    """
    data = request.get_json()
    title = data.get("title")
    
    if not title:
        return jsonify({"error": "Title is required"}), 400
    
    try:
        result = chats_collection.update_one(
            {"_id": ObjectId(chat_id)},
            {"$set": {"title": title, "lastUpdated": datetime.now()}}
        )
        
        if result.matched_count == 0:
            return jsonify({"error": "Chat not found"}), 404
        
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/chats/<chat_id>", methods=["DELETE"])
def delete_chat(chat_id):
    """
    Delete a chat and all its messages
    """
    try:
        # Delete the chat
        chat_result = chats_collection.delete_one({"_id": ObjectId(chat_id)})
        
        if chat_result.deleted_count == 0:
            return jsonify({"error": "Chat not found"}), 404
        
        # Delete all messages associated with this chat
        messages_collection.delete_many({"chatId": chat_id})
        
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/chats/<chat_id>/messages", methods=["GET"])
def get_chat_messages(chat_id):
    """
    Get all messages for a specific chat
    """
    try:
        messages = list(messages_collection.find({"chatId": chat_id}).sort("timestamp", 1))
        return jsonify(to_json(messages))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Add a simple health check endpoint
@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok"}), 200

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)