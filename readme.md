# 🧬 PharmaGuard – AI-Powered Pharmacogenomic Risk Assessment System

## 🚀 Live Demo
### Web Application URL : https://rift-eta.vercel.app

## 🎥 LinkedIn Demo Video
### Project Walkthrough Video: 
---

## 📌 Project Overview

PharmaGuard is a full-stack pharmacogenomic analysis platform that parses patient VCF (Variant Call Format v4.2) files, analyzes genetic variants, and provides intelligent drug risk assessments such as Safe, Adjust Dosage, Toxic, and High Risk.

The system helps doctors, researchers, and healthcare professionals understand how a patient’s genetic profile affects drug response and treatment safety.

---

## 🏗️ Architecture Overview

React (Vite + JSX) Frontend  
⬇ REST API Calls  
Node.js + Express Backend  
⬇  
VCF Parser (gmod/vcf)  
Drug Risk Engine (Rule-based logic)   
⬇  
JSON Risk Assessment Response  

---

## 🛠️ Tech Stack

### Frontend
- React (Vite)
- JSX
- CSS
- Fetch API

### Backend
- Node.js
- Express.js
- gmod/vcf (VCF v4.2 Parsing)

### Development Tools
- Nodemon
- ESLint
- Git

---


## ⚙️ Installation Instructions

### 1. Clone Repository

- git clone https://github.com/your-username/PharmaGuard.git  
cd PharmaGuard  

### 2. Backend Setup

cd backend  
npm install  
npm start  

Backend runs on: http://localhost:3000  

### 3. Frontend Setup

cd frontend  
npm install  
npm run dev  

Frontend runs on: http://localhost:5173  

---

## 📡 API Documentation

### Base URL
http://localhost:3000/api

### Upload & Analyze VCF

Endpoint:  
# API Specification

## Endpoints

| Endpoint          | Method | Description                | Parameters                                |
|------------------|--------|----------------------------|-------------------------------------------|
| `/`              | GET    | API Index & Entry Point    | None                                      |
| `/api/health`    | GET    | Health & Metadata          | None                                      |
| `/api/drugs`     | GET    | Supported Drug List        | None                                      |
| `/api/analyze`   | POST   | Core Analysis              | `vcf_file` (file), `drugs` (comma-separated string) |

  

Required Fields:
- vcfFile (File)
- drugName (Text)


### Sample Response

{
  "patient_id": "PATIENT_001",
  "drug": "Warfarin",
  "timestamp": "2026-02-20T12:00:00Z",
  "risk_assessment": {
    "risk_label": "Adjust Dosage",
    "confidence_score": 0.87,
    "severity": "moderate"
  },
  "pharmacogenomic_profile": {
    "gene": "CYP2C9",
    "variant": "rs1057910",
    "impact": "Reduced metabolism"
  }
}

---

## 🧪 Usage Examples

### Safe Case
1. Upload VCF file  
2. Enter drug name  
3. System returns Safe risk label  

### Adjust Dosage Case
1. Variant detected  
2. System recommends dosage modification  
3. Moderate severity warning shown  

### Toxic Risk Case
1. High-impact mutation detected  
2. Drug flagged as high risk  
3. Suggest alternative medication  

---

## 🔥 Key Features

- VCF v4.2 Parsing
- Drug-Gene Interaction Logic
- Risk Categorization Engine
- Confidence Score Calculation
- Structured JSON Output
- Interactive Dashboard
- Scalable REST Architecture

---

## 👥 Team Members

- Anant Rai (Team Leader)
- Ujjwal Singh
- Adarsh Singh
- Pravin Rai

---

## 📈 Future Improvements

- AI/ML-based drug response prediction
- Patient history tracking
- Admin dashboard
- Database integration (MongoDB / PostgreSQL)
- PDF report generation
- make the LLM more enhanced 

---

## 📜 License

Developed for academic and hackathon purposes.