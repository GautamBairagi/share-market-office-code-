import { useState, useCallback } from 'react';
import api from '../utils/api';

/**
 * useVoiceHistory — Manage voice recordings (save, list, delete)
 * Uses Axios for authenticated requests (JWT auto-attached via interceptors)
 */
export const useVoiceHistory = () => {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  /**
   * Fetch recordings with optional filters
   * @param {Object} filters — {user_id, admin_id, status, search, from_date, to_date, page, limit}
   */
  const fetchRecordings = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== null && v !== undefined && v !== '') {
          params.append(k, v);
        }
      });

      const response = await api.get(`/ai/voice/recordings?${params}`);
      const data = response.data;

      setRecordings(data.data || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);

      console.log(`[useVoiceHistory] Fetched ${(data.data || []).length} recordings`);
    } catch (err) {
      console.error('[useVoiceHistory] fetchRecordings error:', err.message);
      setRecordings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Save a recording to the backend
   * @param {Object} options — {audioBlob, transcript, parsedCommand, actionTaken, actionResult, status, userId, adminId, language, duration}
   * @returns {Promise}
   */
  const saveRecording = useCallback(async ({
    audioBlob,
    transcript,
    parsedCommand,
    actionTaken,
    actionResult,
    status,
    userId,
    adminId,
    language,
    duration
  }) => {
    try {
      const formData = new FormData();

      // Add audio blob
      if (audioBlob) {
        formData.append('audio', audioBlob, 'recording.webm');
      }

      // Add metadata
      if (transcript) formData.append('transcript', transcript);
      if (parsedCommand) formData.append('parsed_command', JSON.stringify(parsedCommand));
      if (actionTaken) formData.append('action_taken', actionTaken);
      if (actionResult) formData.append('action_result', JSON.stringify(actionResult));
      if (userId) formData.append('user_id', userId);
      if (adminId) formData.append('admin_id', adminId);
      if (language) formData.append('language', language);
      if (duration) formData.append('audio_duration', duration);

      formData.append('status', status || 'saved');

      // Post to backend
      const response = await api.post(
        '/ai/voice/save-recording',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      console.log(`[useVoiceHistory] Recording saved, ID: ${response.data.id}`);
      return response.data;
    } catch (err) {
      console.error('[useVoiceHistory] saveRecording error:', err.message);
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Delete a recording
   * @param {number} id — Recording ID
   */
  const deleteRecording = useCallback(async (id) => {
    try {
      await api.delete(`/ai/voice/recordings/${id}`);
      setRecordings(prev => prev.filter(r => r.id !== id));
      console.log(`[useVoiceHistory] Deleted recording ID: ${id}`);
    } catch (err) {
      console.error('[useVoiceHistory] deleteRecording error:', err.message);
    }
  }, []);

  return {
    recordings,
    loading,
    total,
    pages,
    fetchRecordings,
    saveRecording,
    deleteRecording,
  };
};

export default useVoiceHistory;
