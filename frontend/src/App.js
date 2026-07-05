import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Layout from "@/components/Layout";
import Landing from "@/pages/Landing";
import Emergency from "@/pages/Emergency";
import Dashboard from "@/pages/Dashboard";
import DonorRegister from "@/pages/DonorRegister";
import Camps from "@/pages/Camps";
import DocumentAnalyzer from "@/pages/DocumentAnalyzer";
import Architecture from "@/pages/Architecture";

export default function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/emergency" element={<Emergency />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/donors/register" element={<DonorRegister />} />
            <Route path="/camps" element={<Camps />} />
            <Route path="/document" element={<DocumentAnalyzer />} />
            <Route path="/architecture" element={<Architecture />} />
          </Routes>
        </Layout>
        <Toaster position="top-right" richColors closeButton />
      </BrowserRouter>
    </div>
  );
}
