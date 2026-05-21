from flask import Flask, render_template, request, jsonify
from pymongo import MongoClient
from bson import ObjectId
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

app = Flask(__name__)

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client["portfolio_db"]
projects_collection = db["projects"]
messages_collection = db["messages"]

# ──────────────── ROUTES ────────────────

@app.route("/")
def index():
    return render_template("index.html")

# ──────────────── PROJECTS API ────────────────

@app.route("/api/projects", methods=["GET"])
def get_projects():
    projects = list(projects_collection.find())
    for p in projects:
        p["_id"] = str(p["_id"])
    return jsonify(projects)

@app.route("/api/projects", methods=["POST"])
def add_project():
    data = request.json
    project = {
        "title": data.get("title", ""),
        "description": data.get("description", ""),
        "tech_stack": data.get("tech_stack", []),
        "github_url": data.get("github_url", ""),
        "live_url": data.get("live_url", ""),
        "image_url": data.get("image_url", ""),
        "category": data.get("category", "Other"),
        "featured": data.get("featured", False),
        "created_at": datetime.utcnow().isoformat()
    }
    result = projects_collection.insert_one(project)
    project["_id"] = str(result.inserted_id)
    return jsonify({"message": "Project added!", "project": project}), 201

@app.route("/api/projects/<project_id>", methods=["DELETE"])
def delete_project(project_id):
    result = projects_collection.delete_one({"_id": ObjectId(project_id)})
    if result.deleted_count:
        return jsonify({"message": "Project deleted!"})
    return jsonify({"error": "Not found"}), 404

# ──────────────── CONTACT API ────────────────

@app.route("/api/contact", methods=["POST"])
def contact():
    data = request.json
    message = {
        "name": data.get("name", ""),
        "email": data.get("email", ""),
        "subject": data.get("subject", ""),
        "message": data.get("message", ""),
        "received_at": datetime.utcnow().isoformat()
    }
    messages_collection.insert_one(message)
    return jsonify({"message": "Message received! I'll get back to you soon."}), 201

# ──────────────── SEED DATA ────────────────

@app.route("/api/seed", methods=["POST"])
def seed():
    if projects_collection.count_documents({}) > 0:
        return jsonify({"message": "Already seeded"})
    sample_projects = [
        {
            "title": "AI Chat Assistant",
            "description": "A real-time conversational AI assistant powered by LLMs with streaming responses, conversation history, and multi-modal support.",
            "tech_stack": ["Python", "FastAPI", "React", "WebSocket", "OpenAI API"],
            "github_url": "https://github.com",
            "live_url": "https://example.com",
            "image_url": "",
            "category": "AI/ML",
            "featured": True,
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "title": "E-Commerce Platform",
            "description": "Full-stack e-commerce platform with product management, cart, payment integration via Stripe, and admin dashboard.",
            "tech_stack": ["Django", "PostgreSQL", "React", "Stripe", "Redis"],
            "github_url": "https://github.com",
            "live_url": "https://example.com",
            "image_url": "",
            "category": "Web App",
            "featured": True,
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "title": "Data Dashboard",
            "description": "Interactive analytics dashboard for visualizing large datasets with real-time filters, drill-down charts, and export features.",
            "tech_stack": ["Flask", "MongoDB", "D3.js", "Pandas", "Chart.js"],
            "github_url": "https://github.com",
            "live_url": "https://example.com",
            "image_url": "",
            "category": "Data",
            "featured": False,
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "title": "DevOps Pipeline Tool",
            "description": "Automated CI/CD pipeline manager with Docker orchestration, GitHub Actions integration, and deployment monitoring.",
            "tech_stack": ["Python", "Docker", "GitHub Actions", "Kubernetes", "PostgreSQL"],
            "github_url": "https://github.com",
            "live_url": "https://example.com",
            "image_url": "",
            "category": "DevOps",
            "featured": False,
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "title": "Mobile Fitness App",
            "description": "Cross-platform fitness tracking app with workout plans, progress analytics, nutrition logging, and social challenges.",
            "tech_stack": ["React Native", "Node.js", "MongoDB", "Express", "Firebase"],
            "github_url": "https://github.com",
            "live_url": "https://example.com",
            "image_url": "",
            "category": "Mobile",
            "featured": True,
            "created_at": datetime.utcnow().isoformat()
        },
        {
            "title": "Blockchain Wallet",
            "description": "Decentralized crypto wallet with multi-chain support, NFT gallery, DeFi integrations, and hardware wallet compatibility.",
            "tech_stack": ["Solidity", "Web3.js", "React", "Node.js", "Ethereum"],
            "github_url": "https://github.com",
            "live_url": "https://example.com",
            "image_url": "",
            "category": "Web3",
            "featured": False,
            "created_at": datetime.utcnow().isoformat()
        }
    ]
    projects_collection.insert_many(sample_projects)
    return jsonify({"message": f"Seeded {len(sample_projects)} projects!"})

if __name__ == "__main__":
    app.run(debug=True, port=5000)