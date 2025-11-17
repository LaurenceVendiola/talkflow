/**
 * Disfluency Analyzer Service
 * Handles communication with the Python FastAPI backend for audio analysis
 */

// Use environment variable for API URL (set in Vercel), fallback to local
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
    throw new Error('Analysis server is not running. Please start the Python server first.');
  }
}

/**
 * Analyze an audio file for disfluencies
 * @param {File} audioFile - The audio file to analyze (.wav or .mp3)
 * @returns {Promise<Object>} Analysis results with disfluencies array and summary
 */
export async function analyzeAudioFile(audioFile) {
  if (!audioFile) {
    throw new Error('No audio file provided');
  }

  // Validate file type
  const validTypes = ['audio/wav', 'audio/x-wav', 'audio/mpeg', 'audio/mp3'];
  const validExtensions = ['.wav', '.mp3'];
  const fileName = audioFile.name.toLowerCase();
  const isValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
  const isValidType = validTypes.includes(audioFile.type);

  if (!isValidExtension && !isValidType) {
    throw new Error('Invalid file type. Please upload a .wav or .mp3 file.');
  }

  // Create FormData for file upload
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
      throw new Error('Cannot connect to analysis server. Please ensure the Python server is running.');
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
