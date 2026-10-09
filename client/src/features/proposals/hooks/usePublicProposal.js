import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPublicProposal, generatePublicProposalPdf } from "../services/proposalService";

export function usePublicProposal() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        const { ok, status: resStatus, result } = await getPublicProposal(token);
        if (ok && result.status === "Success") {
          setData(result.data);
          setStatus(200);
        } else {
          setError(result.message || "Failed to load proposal");
          setStatus(resStatus);
        }
      } catch (err) {
        console.error("Error fetching public proposal:", err);
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchProposal();
    }
  }, [token]);

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write("<h2>Generating PDF, please wait...</h2>");
      }

      const res = await generatePublicProposalPdf(token);

      if (res.status === "Success" && res.html) {
        if (printWindow) {
          printWindow.document.open();
          printWindow.document.write(res.html);
          printWindow.document.close();

          const titleMatch = res.html.match(/<title>(.*?)<\/title>/i);
          const docTitle = titleMatch ? titleMatch[1] : "Proposal";
          printWindow.document.title = docTitle;

          printWindow.onload = () => {
            printWindow.focus();
            setTimeout(() => {
              printWindow.print();
            }, 500);
          };
        }
      } else {
        if (printWindow) printWindow.close();
        throw new Error(res.message || "Failed to generate PDF");
      }
    } catch (err) {
      console.error(err);
      alert("Error downloading PDF: " + err.message);
    } finally {
      setDownloading(false);
    }
  };

  const parseJson = (str, fallback) => {
    if (typeof str === "object" && str !== null) return str;
    if (!str) return fallback;
    try {
      return JSON.parse(str);
    } catch {
      return fallback;
    }
  };

  return {
    token,
    data,
    loading,
    error,
    status,
    downloading,
    handleDownloadPDF,
    parseJson,
  };
}
