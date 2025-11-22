/**
 * Disfluency Analyzer Service
 * Handles communication with the Python FastAPI backend (AWS EC2) for audio analysis
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8001';

/**
 * Check if the analysis server is running and models are loaded
 * @returns {Promise<Object>} Health status object
 */
export async function checkServerHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error('Server health check failed');
    }
    return await response.json();
  } catch (error) {
    console.error('Health check error:', error);
    throw new Error('Cannot connect to analysis server. Please check your internet connection or contact support.');
  }
}

/**
 * Analyze an audio file for disfluencies
 * @param {File} audioFile - The audio file to analyze (.wav, .mp3, .webm, .ogg, .flac)
 * @returns {Promise<Object>} Analysis results with disfluencies array and summary
 */
export async function analyzeAudioFile(audioFile) {
  if (!audioFile) {
    throw new Error('No audio file provided');
  }

  const validTypes = ['audio/wav', 'audio/x-wav', 'audio/mpeg', 'audio/mp3', 'audio/webm', 'audio/ogg', 'audio/flac'];
  const validExtensions = ['.wav', '.mp3', '.webm', '.ogg', '.flac'];
  const fileName = (audioFile.name || 'recorded_audio.webm').toLowerCase();
  const isValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
  const isValidType = validTypes.includes(audioFile.type);

  if (!isValidExtension && !isValidType) {
    throw new Error('Invalid file type. Please upload a .wav, .mp3, .webm, .ogg, or .flac file.');
  }

  const formData = new FormData();
  formData.append('file', audioFile);

  try {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Analysis failed with status ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Analysis error:', error);
    if (error.message.includes('fetch')) {
      throw new Error('Cannot connect to analysis server. Please check your internet connection.');
    }
    throw error;
  }
}

/**
 * Format disfluency results for display
 * @param {Object} analysisResult - Raw analysis result from API
 * @returns {Object} Formatted result ready for UI display
 */
export function formatAnalysisResults(analysisResult) {
  if (!analysisResult || !analysisResult.summary) {
    return {
      disfluencies: {
        soundRepetitions: 0,
        prolongations: 0,
        interjections: 0,
        blocks: 0,
        wordRepetitions: 0,
      },
      detections: [],
    };
  }

  return {
    disfluencies: {
      soundRepetitions: analysisResult.summary.soundRepetitions || 0,
      prolongations: analysisResult.summary.prolongations || 0,
      interjections: analysisResult.summary.interjections || 0,
      blocks: analysisResult.summary.blocks || 0,
      wordRepetitions: analysisResult.summary.wordRepetitions || 0,
    },
    detections: analysisResult.disfluencies || [],
  };
}
