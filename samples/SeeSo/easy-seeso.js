import Gaze, {InitializationErrorType, CalibrationAccuracyCriteria} from './gaze';

class Seeso {
  constructor() {
    this.gaze = new Gaze();
    this.onGaze = null;
    this.onDebug = null;
    this.onCalibrationNextPoint = null;
    this.onCalibrationProgress = null;
    this.onCalibrationFinished = null;
  }

  async init(licenseKey, afterInitialized, afterFailed) {
    await this.gaze.initialize(licenseKey).then(function(errCode) {
      if (errCode === InitializationErrorType.ERROR_NONE) {
        afterInitialized();
        this.gaze.addCalibrationFinishCallback(
            this.onCalibrationFinished_.bind(this));
        this.gaze.addGazeCallback(this.onGaze_.bind(this));
      } else {
        afterFailed();
      }
    }.bind(this));
  }

  deinit() {
    this.gaze.removeGazeCallback(this.onGaze);
    this.gaze.deinitialize();
  }

  async startTracking(onGaze, onDebug) {
    const stream = await navigator.mediaDevices.getUserMedia({'video': true});
    this.gaze.addDebugCallback(onDebug);
    if (this.gaze.startTracking(stream)) {
      this.onGaze = onGaze;
      this.onDebug = onDebug;
      return true;
    } else {
      this.gaze.removeDebugCallback(this.onDebug);
      return false;
    }
  }

  stopTracking() {
    this.gaze.stopTracking();
    this.gaze.removeDebugCallback(this.onDebug);
    this.onGaze = null;
    this.onDebug = null;
  }

  startCalibration(onCalibrationNextPoint, onCalibrationProgress, onCalibrationFinished, calibrationPoints=5) {
    this.gaze.addCalibrationNextPointCallback(onCalibrationNextPoint);
    this.gaze.addCalibrationProgressCallback(onCalibrationProgress);
    const isStart = this.gaze.startCalibration(calibrationPoints, CalibrationAccuracyCriteria.Default);
    if (isStart) {
      this.onCalibrationNextPoint = onCalibrationNextPoint;
      this.onCalibrationProgress = onCalibrationProgress;
      this.onCalibrationFinished = onCalibrationFinished;
    } else {
      this.gaze.removeCalibrationNextPointCallback(this.onCalibrationNextPoint);
      this.gaze.removeCalibrationProgressCallback(this.onCalibrationProgress);
    }
    return isStart;
  }

  stopCalibration() {
    return this.gaze.stopCalibration();
  }

  setTrackingFps(fps) {
    this.gaze.setTrackingFps(fps);
  }

  async fetchCalibrationData(userId) {
    return this.gaze.fetchCalibrationData(userId);
  }

  async uploadCalibrationData(userId) {
    return this.gaze.uploadCalibrationData(userId);
  }

  showImage() {
    this.gaze.showImage();
  }

  hideImage() {
    this.gaze.hideImage();
  }

  startCollectSamples() {
    this.gaze.startCollectSamples();
  }

  setMonitorSize(monitorInch) {
    this.gaze.setMonitorSize(monitorInch);
  }

  setFaceDistance(faceDistance) {
    this.gaze.setFaceDistance(faceDistance);
  }

  setCameraPosition(cameraX, cameraOnTop) {
    this.gaze.setCameraPosition(cameraX, cameraOnTop);
  }

  getCameraPosition () {
    return this.gaze.getCameraPosition();
  }

  getFaceDistance() {
    return this.gaze.getFaceDistance();
  }

  getMonitorSize () {
    return this.gaze.getMonitorSize();
  }

  async setCalibrationData(calibrationDataString) {
    await this.gaze.setCalibrationData(calibrationDataString);
  }

  static openCalibrationPage(licenseKey, userId, redirectUrl, calibraitonPoint) {
    Gaze.openCalibrationPage(licenseKey, userId, redirectUrl, calibraitonPoint)
  }

  static openCalibrationPageQuickStart(licenseKey, userId, redirectUrl, calibraitonPoint) {
    Gaze.openCalibrationPageQuickStart(licenseKey, userId, redirectUrl, calibraitonPoint);
  }
  /**
   * For type hinting
   * @private
   * @param {GazeInfo} gazeInfo
   */
  onGaze_(gazeInfo) {
    if (this.onGaze) this.onGaze(gazeInfo);
  }

  /**
   * For remove callback
   * @private
   */
  onCalibrationFinished_(calibrationData) {
    if (this.onCalibrationFinished) {
      this.onCalibrationFinished(calibrationData);
    }
    this.gaze.removeCalibrationNextPointCallback(this.onCalibrationNextPoint);
    this.gaze.removeCalibrationProgressCallback(this.onCalibrationProgress);
    this.onCalibrationFinished = null;
    this.onCalibrationProgress = null;
  }
}

export default Seeso;
