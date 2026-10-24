import { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import {
  getNoteData,
  getClientNotesById,
  saveClientIdwiseNotes,
  deletePlanClientNote,
  saveClientNoteByPlan,
} from "../services/calculatorService";

const DEFAULT_NOTES = [
  {
    id: 1,
    note_name:
      "The client pays for the Meta ad budget, and ad service charges will apply only if the client wants to run the ad.",
  },
  {
    id: 2,
    note_name:
      "All amounts need to be paid in advance. Only the ad budget will be paid upon request of the client or immediately after the service is started.",
  },
  {
    id: 3,
    note_name:
      "Please note that service charges are non-refundable but may be adjusted against another service.",
  },
  {
    id: 4,
    note_name:
      "One dedicated SPOC (single point of contact) is required from the client side to approve the posts, contents, videos changes, etc.",
  },
  {
    id: 5,
    note_name:
      "Required details like credentials and other details are needed to share timely.",
  },
];

export function useGraphicCalculatorNotes({ id, proposalId, token, hideNotes, mode, quotationId }) {
  const [allClientNote, setAllClientNote] = useState([]);
  const [predefinedNotes, setPredefinedNotes] = useState([]);
  const [selectedNotes, setSelectedNotes] = useState(DEFAULT_NOTES);
  const [manualNote, setManualNote] = useState("");
  const [selectedNote, setSelectedNote] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedNotesId, setSelectedNotesId] = useState(null);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [formData, setFormData] = useState({
    note_name: "",
    plan: "Customise",
  });

  const fetchPredefinedNotes = async () => {
    if (!token) return;
    try {
      const res = await getNoteData(token);
      setPredefinedNotes(res?.data || []);
    } catch (error) {
      console.error("fetchPredefinedNotes error:", error);
    }
  };

  const getAllPlanNotes = async () => {
    if (hideNotes) return;
    if (mode === "quotation" && quotationId) {
      // Quotation mode: get notes from re_quotation.notes_json
      try {
        const API_BASE_URL = (await import("../../../config/apiBaseUrl")).default;
        const axios = (await import("axios")).default;
        const res = await axios.get(
          `${API_BASE_URL}/auth/api/re_calculator/quotation/${quotationId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.status === "Success" && res.data.data?.notes_json) {
          try {
            const notes = typeof res.data.data.notes_json === "string"
              ? JSON.parse(res.data.data.notes_json)
              : res.data.data.notes_json;
            setAllClientNote(Array.isArray(notes) ? notes.map((n, i) => ({ id: i + 1, note_name: typeof n === "string" ? n : n.note_name })) : []);
          } catch { setAllClientNote([]); }
        } else {
          setAllClientNote([]);
        }
      } catch (error) {
        console.error("getAllPlanNotes quotation error:", error);
        setAllClientNote([]);
      }
      return;
    }
    if (!id || !proposalId || !token) return;
    try {
      const res = await getClientNotesById(proposalId, id, token);
      setAllClientNote(res?.data || []);
    } catch (error) {
      console.error("getAllPlanNotes error:", error);
      setAllClientNote([]);
    }
  };

  useEffect(() => {
    fetchPredefinedNotes();
    getAllPlanNotes();
  }, [id, proposalId, token, hideNotes]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const uniquePredefinedNotes = predefinedNotes.filter(
    (p) =>
      !allClientNote.some((c) => c.note_name === p.note_text) &&
      !selectedNotes.some((s) => s.note_name === p.note_text)
  );

  const handleSelect = (note) => {
    handleAddPredefinedNote(note);
    setSelectedNote(null);
    setIsOpen(false);
  };

  const handleAddPredefinedNote = (note) => {
    if (!selectedNotes.find((n) => n.id === note.id)) {
      setSelectedNotes((prev) => [
        ...prev,
        { id: note.id, note_name: note.note_text, type: "predefined" },
      ]);
    }
  };

  const handleAddManualNote = () => {
    if (manualNote.trim() !== "") {
      setSelectedNotes((prev) => [
        ...prev,
        { id: Date.now(), note_name: manualNote.trim(), type: "manual" },
      ]);
      setManualNote("");
    }
  };

  const handleRemoveNote = (noteId) => {
    setSelectedNotes((prev) => prev.filter((note) => note.id !== noteId));
  };

  const handleSaveNotes = async () => {
    if (selectedNotes.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "No Notes",
        text: "Please add at least one note before saving.",
        showConfirmButton: false,
        timer: 1000,
      });
      return;
    }

    try {
      setLoadingNotes(true);
      const planNotes = selectedNotes.map((item) => ({
        note_name: item.note_name,
      }));

      if (mode === "quotation" && quotationId) {
        // Quotation mode: save notes to re_quotation.notes_json
        const API_BASE_URL = (await import("../../../config/apiBaseUrl")).default;
        const axios = (await import("axios")).default;
        const notesArr = planNotes.map((n) => n.note_name);
        const res = await axios.patch(
          `${API_BASE_URL}/auth/api/re_calculator/quotation/${quotationId}/notes`,
          { notes_json: planNotes },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = res.data;
        if (data?.status === "Success") {
          Swal.fire({ icon: "success", title: "Notes Saved", text: "Notes saved to quotation!", showConfirmButton: false, timer: 1000 });
          getAllPlanNotes();
          setManualNote("");
        } else {
          Swal.fire({ icon: "error", title: "Error", text: data?.message || "Failed to save notes.", showConfirmButton: false, timer: 1000 });
        }
        return;
      }

      const payload = {
        txn_id: proposalId,
        client_id: id,
        planNotes,
      };

      const res = await saveClientIdwiseNotes(payload, token);

      if (res?.status === "Success") {
        Swal.fire({
          icon: "success",
          title: "Notes Created",
          text: res.message || "Notes saved successfully!",
          showConfirmButton: false,
          timer: 1000,
        });

        getAllPlanNotes();
        setManualNote("");
        fetchPredefinedNotes();
      } else if (res?.status === "Alert") {
        Swal.fire({
          icon: "warning",
          title: "Duplicate Notes",
          text: res.message,
          showConfirmButton: false,
          timer: 1000,
        });
        getAllPlanNotes();
        setManualNote("");
        fetchPredefinedNotes();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: res?.message || "Something went wrong while saving notes.",
          showConfirmButton: false,
          timer: 1000,
        });
      }
    } catch (err) {
      console.error("Save notes error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong while saving notes.",
        showConfirmButton: false,
        timer: 1000,
      });
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleDeleteClientNote = async (noteId) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this note?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await deletePlanClientNote(noteId, token);
      if (res?.status === "Success") {
        setAllClientNote((prev) => prev.filter((item) => item.id !== noteId));
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Note has been deleted.",
          timer: 1000,
          showConfirmButton: false,
        });
        getAllPlanNotes();
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while deleting note.",
        showConfirmButton: false,
        timer: 1000,
      });
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      note_name: "",
      plan: "Customise",
    });
  };

  const handleOpenEditModal = (note) => {
    setSelectedNotesId(note);
    setFormData({
      note_name: note.note_name,
      plan: note.plan || "Customise",
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleChangeFormData = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitModal = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setLoadingNotes(true);

    try {
      const response = await saveClientNoteByPlan(
        formData,
        token,
        isEditing && selectedNotesId ? selectedNotesId.id : null
      );

      if (response?.status === "Success") {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: isEditing ? "Note updated successfully!" : "Note added successfully!",
          showConfirmButton: false,
          timer: 1000,
        }).then(() => {
          setShowModal(false);
          getAllPlanNotes();
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: response?.message || "Failed to save note.",
          showConfirmButton: false,
          timer: 1000,
        });
      }
    } catch (error) {
      console.error("Error saving note:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error?.response?.data?.message || "Failed to save note.",
        showConfirmButton: false,
        timer: 1000,
      });
    } finally {
      setLoadingNotes(false);
    }
  };

  return {
    allClientNote,
    predefinedNotes,
    selectedNotes,
    manualNote,
    setManualNote,
    selectedNote,
    isOpen,
    setIsOpen,
    dropdownRef,
    uniquePredefinedNotes,
    showModal,
    setShowModal,
    isEditing,
    setIsEditing,
    selectedNotesId,
    setSelectedNotesId,
    loadingNotes,
    formData,
    setFormData,
    handleSelect,
    handleAddManualNote,
    handleRemoveNote,
    handleSaveNotes,
    handleDeleteClientNote,
    handleCloseModal,
    handleOpenEditModal,
    handleChangeFormData,
    handleSubmitModal,
    getAllPlanNotes,
  };
}
