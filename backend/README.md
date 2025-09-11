# 🌊 Flood Detection Backend API

A simple and powerful Python FastAPI backend for flood risk assessment using Google's Gemini AI.

## Features

- **Gemini AI Integration**: Uses Google's Gemini 2.5 Flash for intelligent analysis
- **Coordinate Analysis**: Analyze flood risk based on latitude/longitude coordinates
- **Image Analysis**: AI-powered terrain analysis using Gemini Vision
- **Combined Analysis**: Merge coordinate and image data for comprehensive assessment
- **Simple & Fast**: No complex computer vision libraries, just pure AI analysis

## Quick Start

### 1. Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Copy the API key

### 2. Install Dependencies

```bash
# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Environment Setup

Create a `.env` file in the backend directory:

```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 4. Run the Server

```bash
# Using the startup script
python start.py

# Or directly with uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Access the API

- **API Base URL**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc Documentation**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## API Endpoints

### Health & Status
- `GET /` - Root endpoint with API info
- `GET /health` - Detailed health check

### Analysis Endpoints
- `POST /api/analyze/coordinates` - Analyze flood risk by coordinates
- `POST /api/analyze/image` - Analyze flood risk by image upload
- `POST /api/analyze/combined` - Combined coordinate + image analysis
- `GET /api/sample-coordinates` - Get sample coordinates for testing

## Usage Examples

### Coordinate Analysis

```bash
curl -X POST "http://localhost:8000/api/analyze/coordinates" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 40.7128,
    "longitude": -74.0060
  }'
```

### Image Analysis

```bash
curl -X POST "http://localhost:8000/api/analyze/image" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@terrain_image.jpg"
```

### Combined Analysis

```bash
curl -X POST "http://localhost:8000/api/analyze/combined" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@terrain_image.jpg" \
  -F "latitude=40.7128" \
  -F "longitude=-74.0060"
```

## How It Works

### Gemini AI Integration

The backend uses Google's Gemini 2.5 Flash model for intelligent analysis:

1. **Coordinate Analysis**: Sends coordinates to Gemini with a prompt asking for flood risk assessment
2. **Image Analysis**: Sends terrain images to Gemini Vision for visual analysis
3. **Combined Analysis**: Sends both coordinates and images for comprehensive assessment

### AI Prompts

The system uses carefully crafted prompts to get structured responses from Gemini:

```python
prompt = """
Analyze this terrain image for flood risk assessment.

Please provide:
1. Risk Level (Low/Medium/High/Very High)
2. Description of the risk based on what you see
3. 3-5 specific recommendations
4. Estimated elevation in meters
5. Estimated distance from water bodies in meters
6. What water bodies or flood risks you can identify in the image
"""
```

## Response Format

All endpoints return a consistent response format:

```json
{
  "success": true,
  "risk_level": "High",
  "description": "This area has a high risk of flooding...",
  "recommendations": [
    "Install flood monitoring systems",
    "Purchase flood insurance",
    "Create emergency response plan"
  ],
  "elevation": 45.2,
  "distance_from_water": 850.0,
  "message": "Analysis completed successfully using Gemini AI",
  "ai_analysis": "Gemini AI's detailed analysis of the image..."
}
```

## Project Structure

```
backend/
├── main.py                 # FastAPI application with Gemini AI
├── start.py               # Startup script
├── requirements.txt       # Python dependencies
└── README.md             # This file
```

## Dependencies

- **FastAPI**: Modern web framework
- **google-genai**: Google's Gemini AI SDK
- **uvicorn**: ASGI server
- **python-multipart**: File upload handling
- **pydantic**: Data validation

## Advantages of Gemini AI Approach

1. **Simplicity**: No complex computer vision setup
2. **Intelligence**: AI understands context and provides natural language analysis
3. **Flexibility**: Easy to modify prompts for different analysis types
4. **Accuracy**: State-of-the-art AI model for analysis
5. **Vision Capabilities**: Can analyze images without complex CV libraries

## Testing

```bash
# Test coordinate analysis
curl -X POST "http://localhost:8000/api/analyze/coordinates" \
  -H "Content-Type: application/json" \
  -d '{"latitude": 25.7617, "longitude": -80.1918}'

# Test with sample coordinates
curl http://localhost:8000/api/sample-coordinates
```

## Production Deployment

### Environment Variables
```env
GEMINI_API_KEY=your_production_gemini_key
HOST=0.0.0.0
PORT=8000
```

### Docker Deployment
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## API Documentation

The API includes automatic OpenAPI documentation:

- **Swagger UI**: Interactive API explorer
- **ReDoc**: Alternative documentation view
- **OpenAPI JSON**: Machine-readable API specification

Access these at:
- http://localhost:8000/docs
- http://localhost:8000/redoc
- http://localhost:8000/openapi.json

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - feel free to use for educational or commercial purposes. 