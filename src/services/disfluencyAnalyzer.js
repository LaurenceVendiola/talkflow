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
 * @param {Function} onProgress - Optional callback for progress updates
 * @returns {Promise<Object>} Analysis results with disfluencies array and summary
 */
export async function analyzeAudioFile(audioFile, onProgress = null) {
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

  // Check file size (50MB limit - approximately 10 minutes of audio)
  const fileSizeMB = audioFile.size / (1024 * 1024);
  const MAX_FILE_SIZE_MB = 50;
  
  if (fileSizeMB > MAX_FILE_SIZE_MB) {
    throw new Error(`File too large (${fileSizeMB.toFixed(1)}MB). Maximum size: ${MAX_FILE_SIZE_MB}MB. Try a shorter audio clip.`);
  }

  const formData = new FormData();
  formData.append('file', audioFile);

  try {
    // Create an AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes timeout

    if (onProgress) {
      onProgress('Uploading audio file...');
    }

    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle specific error codes
      if (response.status === 413) {
        throw new Error('Audio file too long. Maximum duration: 5 minutes. Please upload a shorter clip.');
      } else if (response.status === 400) {
        throw new Error(errorData.detail || 'Invalid audio file format or corrupted file.');
      } else if (response.status === 503) {
        throw new Error('Analysis server is starting up. Please wait a moment and try again.');
      } else if (response.status === 500) {
        throw new Error('Server error during analysis. The audio might be too long or corrupted.');
      }
      
      throw new Error(errorData.detail || `Analysis failed with status ${response.status}`);
    }

    if (onProgress) {
      onProgress('Processing analysis results...');
    }

    const result = await response.json();
    return result;
    
  } catch (error) {
    console.error('Analysis error:', error);
    
    // Handle different error types with specific messages
    if (error.name === 'AbortError') {
      throw new Error('Analysis timeout: Audio file is too long (>2 min processing time). Try a shorter clip or contact support.');
    }
    
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('Cannot connect to analysis server. Please check:\n1. Your internet connection\n2. Server status at ' + API_BASE_URL);
    }
    
    if (error.message.includes('fetch')) {
      throw new Error('Network error during analysis. The audio might be too large or your connection was interrupted.');
    }
    
    // Re-throw custom errors as-is
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
