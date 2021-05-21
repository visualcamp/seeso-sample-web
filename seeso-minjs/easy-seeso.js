import Seeso, {InitializationErrorType, CalibrationAccuracyCriteria} from './seeso.min.js';

class EasySeeso {
  constructor() {
    this.seeso = new Seeso();
    this.onGaze = null;
    this.onDebug = null;
    // calibration
    this.onCalibrationNextPoint = null;
    this.onCalibrationProgress = null;
    this.onCalibrationFinished = null;
    // user status
    this.onAttention = null;
    this.onBlink = null;
    this.onDrowsiness = null;

    this.onGazeBind = null;
    this.onCalibrationFinishedBind = null;
  }

  async init(licenseKey, afterInitialized, afterFailed, userStatusOption) {
    await this.seeso.initialize(licenseKey, userStatusOption).then(function(errCode) {
      if (errCode === InitializationErrorType.ERROR_NONE) {
        afterInitialized();
        this.onCalibrationFinishedBind = this.onCalibrationFinished_.bind(this);
        this.seeso.addCalibrationFinishCallback(this.onCalibrationFinishedBind);
        this.onGazeBind = this.onGaze_.bind(this);
        this.seeso.addGazeCallback(this.onGazeBind);
      } else {
        afterFailed();
      }
    }.bind(this));
  }

  deinit() {
    this.removeUserStatusCallback();
    this.seeso.removeGazeCallback(this.onGazeBind);
    this.seeso.removeCalibrationFinishCallback(this.onCalibrationFinishedBind);
    this.seeso.removeDebugCallback(this.onDebug);
    this.seeso.deinitialize();
  }

  async startTracking(onGaze, onDebug) {
    const stream = await navigator.mediaDevices.getUserMedia({'video': true});
    this.seeso.addDebugCallback(onDebug);
    if (this.seeso.startTracking(stream)) {
      this.onGaze = onGaze;
      this.onDebug = onDebug;
      return true;
    } else {
      this.seeso.removeDebugCallback(this.onDebug);
      return false;
    }
  }

  stopTracking() {
    this.seeso.stopTracking();
    this.seeso.removeDebugCallback(this.onDebug);
    this.onGaze = null;
    this.onDebug = null;
  }
  
  setUserStatusCallback(onAttention, onBlink, onDrowsiness) {
    this.seeso.addAttentionCallback(onAttention);
    this.seeso.addBlinkCallback(onBlink);
    this.seeso.addDrowsinessCallback(onDrowsiness);
    this.onAttention = onAttention;
    this.onBlink = onBlink;
    this.onDrowsiness = onDrowsiness;
  }

  removeUserStatusCallback() {
    this.seeso.removeAttentionCallback(this.onAttention);
    this.seeso.removeBlinkCallback(this.onBlink);
    this.seeso.removeDrowsinessCallback(this.onDrowsiness);
  }

  startCalibration(onCalibrationNextPoint, onCalibrationProgress, onCalibrationFinished, calibrationPoints=5) {
    this.seeso.addCalibrationNextPointCallback(onCalibrationNextPoint);
    this.seeso.addCalibrationProgressCallback(onCalibrationProgress);
    const isStart = this.seeso.startCalibration(calibrationPoints, CalibrationAccuracyCriteria.Default);
    if (isStart) {
      this.onCalibrationNextPoint = onCalibrationNextPoint;
      this.onCalibrationProgress = onCalibrationProgress;
      this.onCalibrationFinished = onCalibrationFinished;
    } else {
      this.seeso.removeCalibrationNextPointCallback(this.onCalibrationNextPoint);
      this.seeso.removeCalibrationProgressCallback(this.onCalibrationProgress);
    }
    return isStart;
  }

  stopCalibration() {
    return this.seeso.stopCalibration();
  }

  setTrackingFps(fps) {
    this.seeso.setTrackingFps(fps);
  }

  async fetchCalibrationData(userId) {
    return this.seeso.fetchCalibrationData(userId);
  }

  async uploadCalibrationData(userId) {
    return this.seeso.uploadCalibrationData(userId);
  }

  showImage() {
    this.seeso.showImage();
  }

  hideImage() {
    this.seeso.hideImage();
  }

  startCollectSamples() {
    this.seeso.startCollectSamples();
  }

  setMonitorSize(monitorInch) {
    this.seeso.setMonitorSize(monitorInch);
  }

  setFaceDistance(faceDistance) {
    this.seeso.setFaceDistance(faceDistance);
  }

  setCameraPosition(cameraX, cameraOnTop) {
    this.seeso.setCameraPosition(cameraX, cameraOnTop);
  }

  getCameraPosition () {
    return this.seeso.getCameraPosition();
  }

  getFaceDistance() {
    return this.seeso.getFaceDistance();
  }

  getMonitorSize () {
    return this.seeso.getMonitorSize();
  }

  async setCalibrationData(calibrationDataString) {
    await this.seeso.setCalibrationData(calibrationDataString);
  }

  static openCalibrationPage(licenseKey, userId, redirectUrl, calibraitonPoint) {
    Seeso.openCalibrationPage(licenseKey, userId, redirectUrl, calibraitonPoint)
  }

  static openCalibrationPageQuickStart(licenseKey, userId, redirectUrl, calibraitonPoint) {
    Seeso.openCalibrationPageQuickStart(licenseKey, userId, redirectUrl, calibraitonPoint);
  }

  setAttentionInterval(interval) {
    this.seeso.setAttentionInterval(interval);
  }

  getAttentionScore() {
    return this.seeso.getAttentionScore();
  }

  static getVersionName () {
    return Seeso.getVersionName();
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
    this.seeso.removeCalibrationNextPointCallback(this.onCalibrationNextPoint);
    this.seeso.removeCalibrationProgressCallback(this.onCalibrationProgress);
    this.onCalibrationFinished = null;
    this.onCalibrationProgress = null;
    this.onCalibrationNextPoint = null;
  }
}

export default EasySeeso;
