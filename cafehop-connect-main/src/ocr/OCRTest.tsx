import { useState } from "react";
import Tesseract from "tesseract.js";

export default function OCRTest() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Idle");

  const runOCR = async (image: string | File) => {
    setLoading(true);
    setText("");
    setStatus("Starting...");

    try {
      const res = await Tesseract.recognize(image, "eng", {
        logger: (m) => {
          if (m?.status) {
            const pct =
              typeof m.progress === "number"
                ? ` (${Math.round(m.progress * 100)}%)`
                : "";
            setStatus(`${m.status}${pct}`);
          }
          console.log("[tesseract]", m);
        },
      });

      setText(res.data.text || "(no text found)");
      setStatus("Done ✅");
    } catch (err: any) {
      console.error(err);
      setStatus(`Error: ${err?.message ?? String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>OCR Test</h2>

      <button
        onClick={() =>
          runOCR("https://tesseract.projectnaptha.com/img/eng_bw.png")
        }
        disabled={loading}
      >
        {loading ? "Reading..." : "Run sample OCR"}
      </button>

      <div style={{ marginTop: 15 }}>
        <input
          type="file"
          accept="image/*"
          disabled={loading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) runOCR(file);
          }}
        />
      </div>

      <p style={{ marginTop: 15 }}>
        <strong>Status:</strong> {status}
      </p>

      <pre style={{ marginTop: 15, whiteSpace: "pre-wrap" }}>{text}</pre>
    </div>
  );
}