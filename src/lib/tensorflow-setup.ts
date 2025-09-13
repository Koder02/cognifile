import * as tf from '@tensorflow/tfjs';

// Initialize TensorFlow.js
export async function initializeTensorFlow() {
  try {
    // Set the backend to 'webgl' first (fastest)
    await tf.setBackend('webgl');
    console.log('Using WebGL backend');
  } catch (_e) {
    try {
      // Fall back to 'wasm' if webgl is not available
      await tf.setBackend('wasm');
      console.log('Using WASM backend');
    } catch (_e) {
      // Last resort: CPU
      await tf.setBackend('cpu');
      console.log('Using CPU backend');
    }
  }
}

// Call this function when the app starts
initializeTensorFlow();