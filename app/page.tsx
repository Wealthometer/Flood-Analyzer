"use client";

import { useState, useEffect, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  AlertTriangle,
  CheckCircle,
  Info,
  Loader2,
  Globe,
  Shield,
  TrendingUp,
  Map,
  Upload,
  Image,
  Camera,
} from "lucide-react";

interface FloodRiskData {
  riskLevel: "Low" | "Medium" | "High" | "Very High";
  description: string;
  recommendations: string[];
  elevation: number;
  distanceFromWater: number;
}

export default function FloodDetectionSystem() {
  const [inputLat, setInputLat] = useState("");
  const [inputLng, setInputLng] = useState("");
  const [floodRisk, setFloodRisk] = useState<FloodRiskData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisType, setAnalysisType] = useState<"coordinates" | "image">(
    "coordinates"
  );

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [mapError, setMapError] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const mapRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_BASE_URL = "https://flood-analyser.onrender.com";

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
        setMapError(true);
        return;
      }

      try {
        const google = await new Loader({
          apiKey,
          version: "weekly",
          libraries: ["places"],
        }).load();
        if (mapRef.current) {
          setMap(
            new google.maps.Map(mapRef.current, {
              center: { lat: 40.7128, lng: -74.006 },
              zoom: 10,
              mapTypeId: google.maps.MapTypeId.TERRAIN,
            })
          );
        }
      } catch (error) {
        console.error("Error loading Google Maps:", error);
        setMapError(true);
      }
    };
    initMap();
  }, []);

  // API calls
  const callAPI = async (endpoint: string, data: any) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: endpoint.includes("coordinates")
        ? { "Content-Type": "application/json" }
        : {},
      body: endpoint.includes("coordinates") ? JSON.stringify(data) : data,
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  };

  // Analysis handlers
  const handleCoordinateSubmit = async () => {
    if (!inputLat || !inputLng) {
      setAlertMessage("Please enter both latitude and longitude");
      setShowAlert(true);
      return;
    }

    const lat = parseFloat(inputLat);
    const lng = parseFloat(inputLng);

    if (
      isNaN(lat) ||
      isNaN(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      setAlertMessage(
        "Please enter valid coordinates (Lat: -90 to 90, Lng: -180 to 180)"
      );
      setShowAlert(true);
      return;
    }

    setIsLoading(true);
    try {
      const apiResponse = await callAPI("/api/analyze/coordinates", {
        latitude: lat,
        longitude: lng,
      });
      const riskData: FloodRiskData = {
        riskLevel: apiResponse.risk_level,
        description: apiResponse.description,
        recommendations: apiResponse.recommendations,
        elevation: apiResponse.elevation,
        distanceFromWater: apiResponse.distance_from_water,
      };
      setFloodRisk(riskData);
      setAiAnalysis(apiResponse.ai_analysis || "");

      // Update map
      if (map) {
        map.setCenter({ lat, lng });
        map.setZoom(15);
        map.data.forEach((feature) => map.data.remove(feature));
        new google.maps.Marker({
          position: { lat, lng },
          map,
          title: "Selected Location",
        });
        const riskColor =
          riskData.riskLevel === "Very High"
            ? "#FF0000"
            : riskData.riskLevel === "High"
            ? "#FF6600"
            : riskData.riskLevel === "Medium"
            ? "#FFCC00"
            : "#00FF00";
        new google.maps.Circle({
          strokeColor: riskColor,
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: riskColor,
          fillOpacity: 0.35,
          map,
          center: { lat, lng },
          radius: 1000,
        });
      }
    } catch (error) {
      console.error("Error analyzing coordinates:", error);
      setAlertMessage(
        "Error analyzing coordinates. Please check if the backend server is running."
      );
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024 || !file.type.startsWith("image/")) {
        setAlertMessage(
          file.size > 10 * 1024 * 1024
            ? "Image size must be less than 10MB"
            : "Please select a valid image file"
        );
        setShowAlert(true);
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleImageAnalysis = async () => {
    if (!selectedImage) {
      setAlertMessage("Please select an image first");
      setShowAlert(true);
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedImage);
      const apiResponse = await callAPI("/api/analyze/image", formData);
      const riskData: FloodRiskData = {
        riskLevel: apiResponse.risk_level,
        description: apiResponse.description,
        recommendations: apiResponse.recommendations,
        elevation: apiResponse.elevation,
        distanceFromWater: apiResponse.distance_from_water,
      };
      setFloodRisk(riskData);
      setAiAnalysis(apiResponse.ai_analysis || "");
    } catch (error) {
      console.error("Error analyzing image:", error);
      setAlertMessage(
        "Error analyzing image. Please check if the backend server is running."
      );
      setShowAlert(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions
  const getRiskVariant = (riskLevel: string) =>
    riskLevel === "Very High" || riskLevel === "High"
      ? "destructive"
      : riskLevel === "Medium"
      ? "secondary"
      : "default";
  const getRiskIcon = (riskLevel: string) =>
    riskLevel === "Very High" || riskLevel === "High" ? (
      <AlertTriangle className="h-4 w-4" />
    ) : riskLevel === "Medium" ? (
      <Info className="h-4 w-4" />
    ) : (
      <CheckCircle className="h-4 w-4" />
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full mr-4">
              <Globe className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">
              Flood Detection System
            </h1>
          </div>
          <p className="text-slate-600">
            Analyze flood risk using coordinates or upload images for AI-powered
            terrain analysis
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Input Section */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Analysis Methods
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs
                value={analysisType}
                onValueChange={(value) =>
                  setAnalysisType(value as "coordinates" | "image")
                }
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger
                    value="coordinates"
                    className="flex items-center gap-2"
                  >
                    <MapPin className="h-4 w-4" />
                    Coordinates
                  </TabsTrigger>
                  <TabsTrigger
                    value="image"
                    className="flex items-center gap-2"
                  >
                    <Image className="h-4 w-4" />
                    Image Analysis
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="coordinates" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="any"
                        placeholder="40.7128"
                        value={inputLat}
                        onChange={(e) => setInputLat(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="any"
                        placeholder="-74.0060"
                        value={inputLng}
                        onChange={(e) => setInputLng(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleCoordinateSubmit}
                    disabled={isLoading}
                    className="w-full"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <MapPin className="mr-2 h-4 w-4" />
                        Analyze Coordinates
                      </>
                    )}
                  </Button>
                </TabsContent>

                <TabsContent value="image" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      {!imagePreview ? (
                        <div className="space-y-4">
                          <Upload className="h-12 w-12 mx-auto text-slate-400" />
                          <div>
                            <p className="text-sm font-medium text-slate-700">
                              Upload terrain image
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              JPG, PNG, or GIF up to 10MB
                            </p>
                          </div>
                          <Button
                            onClick={() => fileInputRef.current?.click()}
                            variant="outline"
                            size="sm"
                          >
                            <Camera className="mr-2 h-4 w-4" />
                            Choose Image
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="max-h-48 mx-auto rounded-lg shadow-sm"
                          />
                          <div className="flex gap-2 justify-center">
                            <Button
                              onClick={() => fileInputRef.current?.click()}
                              variant="outline"
                              size="sm"
                            >
                              <Camera className="mr-2 h-4 w-4" />
                              Change Image
                            </Button>
                            <Button
                              onClick={() => {
                                setSelectedImage(null);
                                setImagePreview("");
                              }}
                              variant="outline"
                              size="sm"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={handleImageAnalysis}
                      disabled={isLoading || !selectedImage}
                      className="w-full"
                      size="lg"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Image className="mr-2 h-4 w-4" />
                          Analyze Image
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                  <p className="text-slate-600">
                    {analysisType === "coordinates"
                      ? "Analyzing coordinates..."
                      : "Analyzing image..."}
                  </p>
                </div>
              )}

              {floodRisk && !isLoading && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getRiskIcon(floodRisk.riskLevel)}
                      <span className="font-semibold">Risk Level</span>
                    </div>
                    <Badge
                      variant={getRiskVariant(floodRisk.riskLevel)}
                      className="text-sm"
                    >
                      {floodRisk.riskLevel}
                    </Badge>
                  </div>

                  <p className="text-slate-600 text-sm leading-relaxed">
                    {floodRisk.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {floodRisk.elevation}m
                      </div>
                      <div className="text-xs text-slate-500">Elevation</div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {floodRisk.distanceFromWater}m
                      </div>
                      <div className="text-xs text-slate-500">From Water</div>
                    </div>
                  </div>

                  {aiAnalysis && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium text-slate-700 mb-3">
                          AI Analysis
                        </h4>
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-600 whitespace-pre-wrap">
                            {aiAnalysis}
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <h4 className="font-medium text-slate-700 mb-3">
                      Recommendations
                    </h4>
                    <ul className="space-y-2">
                      {floodRisk.recommendations.map((rec, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-sm text-slate-600"
                        >
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {!floodRisk && !isLoading && (
                <div className="text-center py-12 text-slate-500">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>Choose an analysis method to see flood risk assessment</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Map Section */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-green-600" />
              Interactive Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mapError ? (
              <div className="w-full h-80 rounded-lg border border-slate-200 bg-slate-50 flex flex-col items-center justify-center">
                <Map className="h-16 w-16 text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                  Map Not Available
                </h3>
                <p className="text-slate-500 text-center max-w-md">
                  To enable the interactive map, set up a Google Maps API key in
                  .env.local
                </p>
              </div>
            ) : (
              <div
                ref={mapRef}
                className="w-full h-80 rounded-lg border border-slate-200"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alert Dialog */}
      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Input Error</AlertDialogTitle>
            <AlertDialogDescription>{alertMessage}</AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
