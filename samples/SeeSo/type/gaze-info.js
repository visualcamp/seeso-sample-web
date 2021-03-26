export const TrackingState = Object.freeze({
  SUCCESS: 0,
  LOW_CONFIDENCE: 1,
  UNSUPPORTED: 2,
  FACE_MISSING: 3,
});

export const EyeMovementState = Object.freeze({
  FIXATION: 0,
  SACCADE: 2,
  UNKNOWN: 3,
});


class GazeInfo {
  /**
   * 
   * @param {number} timestamp 
   * @param {number} x 
   * @param {number} y 
   * @param {TrackingState} trackingState 
   * @param {EyeMovementState} eyemovementState
   */
  constructor(timestamp, x, y, trackingState, eyemovementState) {
    this.timestamp = timestamp;
    this.x = x;
    this.y = y;
    this.trackingState = trackingState;
    this.eyemovementState = eyemovementState;
  }
}

export default GazeInfo;