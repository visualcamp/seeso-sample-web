import Seeso, {InitializationErrorType, CalibrationAccuracyCriteria} from './seeso';

class EasySeeso {
  constructor() {
    this.seeso = new Seeso();
    this.onGaze = null;
    this.onDebug = null;
    this.onCalibrationNextPoint = null;
    this.onCalibrationProgress = null;
    this.onCalibrationFinished = null;
  }

  async init(licenseKey, afterInitialized, afterFailed) {
    await this.seeso.initialize(licenseKey).then(function(errCode) {
      if (errCode === InitializationErrorType.ERROR_NONE) {
        afterInitialized();
        this.seeso.addCalibrationFinishCallback(
            this.onCalibrationFinished_.bind(this));
        this.seeso.addGazeCallback(this.onGaze_.bind(this));
      } else {
        afterFailed();
      }
    }.bind(this));
  }

  deinit() {
    this.seeso.removeGazeCallback(this.onGaze);
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
  }
}

export default EasySeeso;
