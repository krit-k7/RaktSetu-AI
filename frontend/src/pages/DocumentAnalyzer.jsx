import { useRef, useState } from "react";
import { Upload, FileScan, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { API_BASE } from "@/lib/api";
import { TEST_IDS } from "@/constants/testIds";

export default function DocumentAnalyzer() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  const pick = (f) => {
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      return toast.error("Please upload a JPEG, PNG, or WEBP image.");
    }
    setFile(f);
    setResult(null);
    setPreview(URL.createObjectURL(f));
  };

  const upload = async () => {
    if (!file) return;
    setBusy(true);
    setResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const resp = await fetch(`${API_BASE}/document/analyze`, { method: "POST", body: form });
      if (!resp.ok) throw new Error(`Analysis failed (${resp.status})`);
      const data = await resp.json();
      setResult(data.extracted);
      toast.success("Document parsed by AI vision");
    } catch (e) {
      toast.error(e.message || "Failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="overline">Medical Document Vision</p>
        <h1 className="h-section mt-2">Upload a prescription. Extract in seconds.</h1>
        <p className="mt-3 text-[color:var(--text-secondary)] max-w-2xl">
          Gemma 4 reads doctor prescriptions, blood-requirement slips, or hospital forms and returns structured fields &mdash; blood group, units, hospital, urgency, doctor.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card-flat">
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files?.[0]); }}
            className="border-2 border-dashed border-[color:var(--border-default)] rounded-xl p-8 text-center hover:bg-[color:var(--bg-secondary)] transition-colors cursor-pointer">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              data-testid={TEST_IDS.doc.fileInput}
              onChange={(e) => pick(e.target.files?.[0])}
            />
            <Upload className="w-10 h-10 mx-auto text-[color:var(--text-tertiary)]"/>
            <p className="mt-3 font-medium">Drop a prescription image, or click to browse</p>
            <p className="text-xs text-[color:var(--text-tertiary)] mt-1 font-mono">JPEG · PNG · WEBP · max 8 MB</p>
          </div>

          {preview && (
            <div className="mt-5 relative rounded-lg overflow-hidden border border-[color:var(--border-default)]">
              <img src={preview} alt="preview" className="w-full max-h-[380px] object-contain bg-[color:var(--bg-secondary)]"/>
              {busy && <div className="scan-line"/>}
            </div>
          )}

          <button
            onClick={upload}
            disabled={!file || busy}
            data-testid={TEST_IDS.doc.uploadBtn}
            className="btn-urgent w-full mt-5 disabled:opacity-50">
            {busy ? <><Loader2 className="w-4 h-4 animate-spin"/> Analyzing with Gemma 4 Vision…</> : <><FileScan className="w-4 h-4"/> Extract Fields</>}
          </button>
        </div>

        <div className="card-flat" data-testid={TEST_IDS.doc.result}>
          <p className="overline">Extracted Structure</p>
          {result ? (
            <div className="mt-4 space-y-3">
              <Row label="Patient" value={result.patient_name}/>
              <Row label="Blood group" value={result.blood_group} pill="pill-urgent"/>
              <Row label="Units needed" value={result.units_needed}/>
              <Row label="Hospital" value={result.hospital}/>
              <Row label="City" value={result.city}/>
              <Row label="Urgency" value={result.urgency} pill={result.urgency === "critical" ? "pill-urgent" : "pill-warn"}/>
              <Row label="Doctor" value={result.doctor_name}/>
              <Row label="Notes" value={result.notes}/>
              {typeof result.confidence === "number" && (
                <div className="pt-3 mt-3 border-t border-[color:var(--border-subtle)] flex items-center justify-between">
                  <span className="text-xs text-[color:var(--text-tertiary)] uppercase tracking-wider font-medium">AI confidence</span>
                  <span className="pill pill-info">{Math.round(result.confidence * 100)}%</span>
                </div>
              )}
              <div className="mt-4 flex items-center gap-2 text-sm text-[color:var(--success)]">
                <CheckCircle2 className="w-4 h-4"/> Ready to file as an emergency request.
              </div>
            </div>
          ) : (
            <div className="mt-6 text-sm text-[color:var(--text-tertiary)]">
              Upload a document to see the extracted fields here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, pill }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span className="text-xs text-[color:var(--text-tertiary)] uppercase tracking-wider font-medium">{label}</span>
      {value ? (pill ? <span className={`pill ${pill}`}>{String(value)}</span> : <span className="text-sm font-medium text-right">{String(value)}</span>)
             : <span className="text-sm text-[color:var(--text-tertiary)] italic">—</span>}
    </div>
  );
}
