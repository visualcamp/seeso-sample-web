/* eslint-disable */
import {
  CALIBRATION_REGION_RATIO,
  DEBUG_INTERVAL_TIME_MS,
  INTERVAL_TIME_MS,
  getServerUrl,
  getCalibrationServiceUrl
} from './setting';

import {ImageCapture} from './polyfil/ImageCapture-polyfil';
import GazeInfo from './type/gaze-info';
import { CalibrationData } from "./type/calibration-data";

import InstantThread from './utils/InstantThread';
import * as check from './utils/wasm-check.min';
import axios from './utils/axios.min';
import MonitorSizeConveter from './utils/MonitorSizeConverter';
import makeUrl from './utils/make-url'


export const InitializationErrorType = Object.freeze({
  ERROR_NONE: 0,
  ERROR_INIT: 1,
  ERROR_CAMERA_PERMISSION: 2,

  AUTH_INVALID_KEY: 3,                  /* 3 */  // 잘못된 키(없는 키)
  AUTH_INVALID_ENV_USED_DEV_IN_PROD: 4, /* 4 */  // dev 키를 prod 에서 사용함
  AUTH_INVALID_ENV_USED_PROD_IN_DEV: 5, /* 5 */  // prod 키를 dev 에서 사용함
  AUTH_INVALID_PACKAGE_NAME: 6,         /* 6 */  // 잘못된 패키지 이름
  AUTH_INVALID_APP_SIGNATURE: 7,        /* 7 */  // 잘못된 앱 서명
  AUTH_EXCEEDED_FREE_TIER: 8,           /* 8 */  // 무료 사용량 초과
  AUTH_DEACTIVATED_KEY: 9,              /* 9 */  // 비 활성화 된 키
  AUTH_INVALID_ACCESS: 10,              /* 10 */ // 잘못된 접근(ip 차단, 암호화/복호화 실패, 검증 무시 등); 상세한 정보 제공 하지 않음
  AUTH_UNKNOWN_ERROR: 11,               /* 11 */ // 서버 에서 처리해 주지 못 한 에러
  AUTH_SERVER_ERROR: 12,                /* 12 */ // 서버 내부 에러 (timeout 등)

  AUTH_CANNOT_FIND_HOST: 13,            /* 13 */ // 인터넷 연결 안되거나 잘못된 주소
  AUTH_WRONG_LOCAL_TIME: 14,            /* 14 */ // 기기와 서버의 시간 차이가 큰 경우
  AUTH_INVALID_KEY_FORMAT: 15,          /* 15 */ // 잘못된 라이센스 키 포맷
  AUTH_EXPIRED_KEY: 16,                 /* 16 */ // 만료된 키 (로컬 인증 전용)
});

export const CalibrationAccuracyCriteria = Object.freeze({
  DEFAULT: 0,
  LOW: 1,
  HIGH: 2,
});
const ColorFormat = Object.freeze({
  NV12: 1,
  NV21: 2,
  RGB: 3,
  BGRA: 4,
  RGBA: 5,
  ELSE: 6,
});

class Gaze {
  constructor() {
    if (Gaze.gaze) {
      return Gaze.gaze;
    }
    Gaze.gaze = this;

    this.thread = null;
    this.debugThread = null;
    this.initialized = false;

    this.widthMm = 330;
    this.heightMm = 210;
    this.monitorInch = MonitorSizeConveter.sizeMMtoInch(this.widthMm, this.heightMm);
    this.faceDistance = 50;
    this.cameraX = window.outerWidth / 2;
    this.isCameraOnTop = true;
    this.trackerModule = null;
    this.cameraTopMm = 10;

    // debug
    this.latencyList = [];
    this.befTime = -1;
    this.initCallbacks = [];
    this.debugCallbacks = [];
    this.gazeCallbacks = [];
    this.calibrationFinishCallbacks = [];
    this.calibrationNextPointCallbacks = [];
    this.calibrationProgressCallbacks = [];
    this.addFunctions = [];
    this.eyeTracker = null;
    this.errCode = InitializationErrorType.ERROR_INIT;
    this.licenseKey = null;
    this.calibrationData = null;
  }

  //// Lifecycle functions

  /**  */
  async initialize(licenseKey) {
    if (!licenseKey) return;
    try {
      if (await this.initWasm_()) {
        await this.initEyeTracker_(licenseKey);
      }
      this.licenseKey = licenseKey;
      if (this.errCode === InitializationErrorType.ERROR_NONE) {
        this.initialized = true;
      } else {
        this.deinitialize();
      }
      return this.errCode;

    } catch (e) {
      console.log(e);
      this.releaseStreamTrack_();
      return this.errCode;
    }
  }

  async deinitialize() {
    this.imageCapture = null;
    this.stopTracking();

    setTimeout(() => {
      if (this.trackerModule) {
        if (this.eyeTracker) {
          let isDeinit = this.trackerModule.ccall('deinitEyeTracker', 'boolean',
              ['number'], [this.eyeTracker]);
          console.log('eyeTracker deinit ' + isDeinit);
          this.eyeTracker = null;
        }
        for (let fn of this.addFunctions) {
          this.trackerModule.removeFunction(fn);
        }
        this.addFunctions = [];
      }
    }, 1000);
  }

  static openCalibrationPageQuickStart(licenseKey, userId, redirectUrl, calibrationPoint) {
    const payload = {
      licenseKey,
      userId,
      redirectUrl,
      selectCalibrationPoint: calibrationPoint,
      quickStart: true
    }
    const queryString = Object.entries(payload).map(e => e.join('=')).join('&');
    window.location.replace(`${getCalibrationServiceUrl()}?${queryString}`)
  }
  static openCalibrationPage(licenseKey, userId, redirectUrl, calibrationPoint) {
    const payload = {
      licenseKey,
      userId,
      redirectUrl,
      selectCalibrationPoint: calibrationPoint,
    }
    const queryString = Object.entries(payload).map(e => e.join('=')).join('&');
    window.location.replace(`${getCalibrationServiceUrl()}?${queryString}`)
  }

  getCameraPosition () {
    if (!this.trackerModule || !this.eyeTracker) {
      return undefined;
    }
    return {
      isCameraOnTop: this.isCameraOnTop,
      cameraX: this.cameraX,
    }
  }

  setCameraPosition(cameraX, isCameraOnTop) {
    this.cameraX = cameraX;
    this.isCameraOnTop = isCameraOnTop;
  }

  getFaceDistance() {
    return this.faceDistance / 10
  }

  setFaceDistance(faceDistance) {
    this.faceDistance = parseFloat(faceDistance) * 10;
    if (!this.trackerModule || !this.eyeTracker) {
      return;
    }
    this.trackerModule.ccall('setCameraDistanceZ', 'number',
        ['number', 'number'], [this.eyeTracker, this.faceDistance]);
  }

  getMonitorSize() {
    if (!this.trackerModule || !this.eyeTracker) {
      return undefined;
    }
    return this.monitorInch;
  }

  setMonitorSize(monitorInch) {
    if (monitorInch) {
      this.monitorInch = monitorInch;
      const {width, height} = MonitorSizeConveter.inchToSizeMM(monitorInch);
      this.widthMm = width;
      this.heightMm = height;
    }
  }

  setTrackingFps(fps) {
    if (!this.trackerModule || !this.eyeTracker) {
      return;
    }
    this.trackerModule.ccall('setTrackingFps', 'number',
        ['number', 'number'], [this.eyeTracker, fps]);
  }

  addGazeCallback(callback) {
    if (this.gazeCallbacks.indexOf(callback) == -1){
      this.gazeCallbacks.push(callback);
    }

  }

  removeGazeCallback(callback) {
    this.removeCallbackFunc_(callback, this.gazeCallbacks);
  }

  addDebugCallback(callback) {
    if (this.debugCallbacks.indexOf(callback) == -1){
      this.debugCallbacks.push(callback);
    }
  }

  removeDebugCallback(callback) {
    this.removeCallbackFunc_(callback, this.debugCallbacks);
  }

  addCalibrationNextPointCallback(callback) {
    if (this.calibrationNextPointCallbacks.indexOf(callback) == -1){
      this.calibrationNextPointCallbacks.push(callback);
    }
  }

  removeCalibrationNextPointCallback(callback) {
    this.removeCallbackFunc_(callback,this.calibrationNextPointCallbacks);
  }

  addCalibrationProgressCallback(callback) {
    if (this.calibrationNextPointCallbacks.indexOf(callback) == -1) {
      this.calibrationProgressCallbacks.push(callback);
    }
  }

  removeCalibrationProgressCallback(callback) {
    this.removeCallbackFunc_(callback, this.calibrationProgressCallbacks);
  }

  addCalibrationFinishCallback(callback) {
    if (this.calibrationNextPointCallbacks.indexOf(callback) == -1) {
      this.calibrationFinishCallbacks.push(callback);
    }
  }

  removeCalibrationFinishCallback(callback) {
    this.removeCallbackFunc_(callback,this.calibrationFinishCallbacks);
  }

  /** @private */
  removeCallbackFunc_(callback, callbacklist) {
    let index = callbacklist.indexOf(callback);
    callbacklist.splice(index, 1);
  }

  async fetchCalibrationData(userId) {
    const payload = {
      licenseKey: this.licenseKey,
      userId,
      hostname: window.location.origin
    }
    const queryString = Object.entries(payload).map(e => e.join('=')).join('&');
    const urlQuery = `${getServerUrl()}?${queryString}`;
    let response;
    try {
      response = await axios.get(urlQuery);
    } catch (error) {
      const errPayload = error.response.data.payload
      console.error(errPayload)
    }

    if (response.data.header.err) {
      return ''
    }
    if (response.status === 200) {
      return httpRes.data.payload.doc.calibrationData
    }
  }

  async uploadCalibrationData(userId) {
    try {
      const reqHeaders = {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      }
      const { width, height } = MonitorSizeConveter.inchToSizeMM(this.calibrationData.monitorInch)
      const bodyParams = {
        licenseKey: this.licenseKey,
        userId,
        hostname: window.location.origin,
        calibrationData: this.calibrationData.to_string()
      }
      const httpRes = await axios.post(getServerUrl(), bodyParams, reqHeaders)
      return httpRes.status === 200
    } catch (error) {
      const errPayload = error.response.data.payload
      console.error(errPayload)
      return false
    }
  }

  startTracking(stream) {
    if (!this.thread) {
      this.thread = new InstantThread(INTERVAL_TIME_MS);
    }
    if (!this.debugThread) {
      this.debugThread = new InstantThread(DEBUG_INTERVAL_TIME_MS);
    }

    if (!this.trackerModule || !this.eyeTracker || !this.thread ||
        !this.debugThread) {
      return false;
    }
    this.trackerModule.ccall('startTrackingTimeCheck', 'void');
    if (this.initStreamTrack_(stream) && this.startCameraThread_(this.thread)
        && this.startDebugThread_(this.debugThread)) {
      return true;
    }
    return false;
  }

  stopTracking() {
    this.releaseStreamTrack_();
    if (this.thread) {
      this.thread.release();
      this.thread = null;
    }
    if (this.debugThread) {
      this.debugThread.release();
      this.debugThread = null;
    }
  }

  startCalibration(calibrationPoints, criteria) {
    if (!this.trackerModule || !this.eyeTracker) {
      return false;
    }
    const left = window.screen.width * (1 - CALIBRATION_REGION_RATIO) / 2;
    const right = window.screen.width - left;
    const top = window.screen.height * (1 - CALIBRATION_REGION_RATIO) / 2;
    const bottom = window.screen.height - top;
    const lt = this.screen_to_camera_(left, top);
    const rb = this.screen_to_camera_(right, bottom);
    this.trackerModule.ccall('setCalibrationRegion', 'boolean',
        ['number', 'number', 'number', 'number', 'number'],
        [this.eyeTracker, lt.camera_x, lt.camera_y, rb.camera_x, rb.camera_y]);

    if (calibrationPoints === 1) {
      return this.trackerModule.ccall('startCalibration', 'boolean',
          ['number', 'number', 'number'],
          [this.eyeTracker, 1, criteria]);
    } else {
      return this.trackerModule.ccall('startCalibration', 'boolean',
          ['number', 'number', 'number'],
          [this.eyeTracker, 5, criteria]);
    }
  }

  stopCalibration() {
    if (!this.trackerModule || !this.eyeTracker) {
      return false;
    }
    return this.trackerModule.ccall('stopCalibration', 'boolean',
        ['number'],
        [this.eyeTracker]);
  }



  async setCalibrationData(calibrationData){
    const data = new CalibrationData(calibrationData);
    if (!this.trackerModule || !this.eyeTracker) {
      return;
    }
    this.calibrationData = data;
    this.setCameraPosition(data.cameraX, data.isCameraOnTop)
    // this.setFaceDistance(data.faceDistance)
    this.setMonitorSize(data.monitorInch)
    await this.setCalibrationBase64(data.vector, data.vectorLength)
  }

  /**
   *
   * @returns {String}
   */
  getCalibrationData(){
    if (!this.calibrationData) return null;
    return this.calibrationData.to_string()
  }

  /**
   *
   * @param {string} vector
   * @param {int} vectorLength
   * @returns {Promise<void>}
   */
  async setCalibration(vector, vectorLength) {
    if (!this.trackerModule || !this.eyeTracker) {
      return;
    }
    let isSuccess = await this.trackerModule.ccall('setCalibrationData',
        'boolean', ['number', 'number', 'number'],
        [this.eyeTracker, vector, vectorLength]);
    return isSuccess;
  }


  startCollectSamples() {
    if (!this.trackerModule || !this.eyeTracker) {
      return;
    }
    this.trackerModule.ccall('startCollectSamples', 'boolean', ['number'],
        [this.eyeTracker]);
  }

  /**
   * For debugging, have to remove
   */
  showImage() {
    this.isShowPreview = true;
  }

  /**
   * For debugging, have to remove
   */
  hideImage() {
    this.isShowPreview = false;
  }

    //* @private */
  // base64로 캘리브레이션 데이터를 받아 설정
  async setCalibrationBase64(vector, length) {
    if (!this.trackerModule || !this.eyeTracker) {
      return;
    }
    const caliDataB64 = vector;
    const caliDataPointer = this.trackerModule.ccall('create_ptr',
        'number', ['number'], [length]);
    const caliDataByteBuffer = this.base64ToByteBuffer_(caliDataB64);
    const caliDataUInt8Arr = new Uint8Array(caliDataByteBuffer);
    this.trackerModule.HEAPU8.set(caliDataUInt8Arr, caliDataPointer);
    let isSuccess = await this.setCalibration(caliDataPointer, length);
    return isSuccess
  }

  /** @private */
  async initWasm_() {
    if (!this.initialized) {
      // 최초에만 로드함, 비동기로 모듈이 초기화되어 시간 체크해 에러로 막는 방식은 안통할까봐 수정
      await this.wasmStatusCheck_();
      const [jsUrl, workerUrl] = makeUrl(check.feature.simd, check.feature.threads);
      if (typeof (jsUrl) == 'string' && typeof (workerUrl) == 'string') {
        // cdn load module
        await this.loadModuleScript_(jsUrl);
        let module = await this.makePresetModule_(jsUrl, workerUrl);

        await createSeeSo(module).then(instance => {
          this.trackerModule = instance;
        });
      } else {
        console.warn('WRONG CDN URL!');
        return false;
      }
    }
    return true;
  }

  /** @private function() */
  initEyeTracker_(licenseKey) {
    if (this.trackerModule && !this.eyeTracker) {
      const serverUrl = getServerUrl();
      let initCallback = this.trackerModule.addFunction(this.sendInitCallback_,
          'vii');
      this.addFunctions.push(initCallback);
      return this.trackerModule.ccall('initEyeTracker', null,
          ['string', 'number', 'number', 'string', 'number'],
          [licenseKey, licenseKey.length, initCallback, serverUrl, serverUrl.length], {async: true});
    }
  }

  /** @private */
  async wasmStatusCheck_() {
    console.log('SIMD: ' + check.feature.simd);
    console.log('Threads: ' + check.feature.threads);
  }

  /** @private */
  loadModuleScript_(jsUrl) {
    return new Promise((resolve, reject) => {
      let script = document.createElement('script');
      script.onload = (() => {
        resolve();
      });
      script.onerror = (() => {
        reject();
      });
      script.async = true;
      script.src = jsUrl;
      script.crossOrigin = 'anonymous';
      document.getElementsByTagName('script')[0].parentNode.appendChild(script);
    });
  }

  /** @private */
  async makePresetModule_(jsUrl, workerUrl) {
    async function readUrl(url) {
      const workerResponse = await fetch(url);
      const workerJS = await workerResponse.text();
      const blob = new Blob([workerJS], {type: 'application/javascript'});
      return URL.createObjectURL(blob);
    }

    const doc = await readUrl(jsUrl);
    const worker_doc = await readUrl(workerUrl);
    return {'mainScriptUrlOrBlob': doc, 'workerScriptBlob': worker_doc};
  }

  /** @private */
  convertBitmapToBlob_(bitmap) {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
    }
    if (!this.preview) {
      this.preview = document.getElementById('preview');
    }

    this.canvas.width = bitmap.width;
    this.canvas.height = bitmap.height;

    const ctx = this.canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0);
    if (this.isShowPreview) {
      this.preview.width = bitmap.width / 2;
      this.preview.height = bitmap.height / 2;
      const previewCtx = this.preview.getContext("2d");
      previewCtx.scale(0.5, 0.5);
      previewCtx.drawImage(this.canvas, 0, 0);
    }
    return ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }

  /** @private */
  addCallbackInCpp_(_trackerPtr) {
    let gazeCallback_ = this.trackerModule.addFunction(this.wasmGazeCallback_,
        'viffii');
    let calibrationProcessCallback_ = this.trackerModule.addFunction(
        this.wasmCalibrationProgress_, 'vfff');
    let calibrationFinishCallback_ = this.trackerModule.addFunction(
        this.wasmCalibrationFinished_, 'vii');

    this.addFunctions.push(gazeCallback_);
    this.addFunctions.push(calibrationProcessCallback_);
    this.addFunctions.push(calibrationFinishCallback_);

    let isCall = this.trackerModule.ccall('setJSCallbacks', 'boolean',
        ['number', 'number', 'number', 'number'],
        [
          _trackerPtr,
          gazeCallback_,
          calibrationProcessCallback_,
          calibrationFinishCallback_],
    );
  }

  /** @private */
  sendInitCallback_(_trackerPtr, _errCode) {
    const instance = Gaze.gaze;
    instance.eyeTracker = _trackerPtr;
    if (_errCode == 0) {
      instance.errCode = InitializationErrorType.ERROR_NONE;
    } else {
      instance.errCode = _errCode + 2;
    }
    if (instance.errCode === InitializationErrorType.ERROR_NONE) {
      instance.addCallbackInCpp_(_trackerPtr);
    }
  }

  /** @private */
  initStreamTrack_(stream) {
    this.releaseStreamTrack_();
    const tracks = stream.getVideoTracks();
    if (tracks) {
      this.track = tracks[0];
      this.imageCapture = new ImageCapture(this.track);
      return true;
    }
    return false;
  }

  /** @private */
  startCameraThread_(cameraThread) {
    cameraThread.setFunc(async () => {
      try {
        if (!this.checkStreamTrack_(this.track)) {
          return;
        }
        await this.processFrame_(this.imageCapture);
      } catch (e) {
        console.log(e);
        return false;
      }
    });
    cameraThread.start();
    return true;
  }

  /** @private */
  startDebugThread_(debugThread) {
    debugThread.setFunc(async () => {
      try {
        const averageLatency = arr => arr.reduce((p, c) => p + c, 0) /
            arr.length;
        const latency_avg = averageLatency(this.latencyList);
        const latency_max = Math.max.apply(null, this.latencyList);
        const latency_min = Math.min.apply(null, this.latencyList);
        const FPS = Math.floor(
            DEBUG_INTERVAL_TIME_MS / 1000 * this.latencyList.length);

        this.debugCallbacks.forEach((fn) => {
          if (!fn) return;
          fn(FPS, latency_min, latency_max, latency_avg);
        });
        this.latencyList = [];
        this.befTime = -1;
      } catch (e) {
        console.log(e);
        return false;
      }
    });
    debugThread.start();
    return true;
  }

  /** @private */
  checkStreamTrack_(track) {
    if (track === null || track.readyState !== 'live' || !track.enabled ||
        track.muted) {
      if (track === null) {
        console.log('error checkStreamTrack_ ');
      } else {
        console.log(`error 
                    ready ${track.readyState !== 'live'}, 
                    enabled ${!track.enabled}, 
                    muted ${track.muted}`);
      }
      return false;
    }
    return true;
  }

  /** @private */
  async processFrame_(imageCapture) {
    const bitmap = await imageCapture.grabFrame();
    const ptr = this.getBufferPtr_(bitmap);
    const blob = this.convertBitmapToBlob_(bitmap);

    this.trackerModule.HEAPU8.set(blob.data, ptr);
    this.trackerModule.ccall('addFrame', 'number',
        ['number', 'number', 'number', 'number', 'number'],
        [
          this.eyeTracker,
          ptr,
          bitmap.width,
          bitmap.height,
          ColorFormat.RGBA]);
  }

  /** @private */
  getBufferPtr_(bitmap) {
    if (!this.imagePtr) {
      this.imagePtr = this.trackerModule.ccall('create_image_ptr', 'number',
          ['number', 'number'],
          [bitmap.width, bitmap.height]);
    }
    return this.imagePtr;
  }

  /** @private */
  wasmGazeCallback_(_timestamp, _x, _y, _trackingState, _eyeMovmentState) {
    if (Gaze.gaze.befTime === -1) {
      Gaze.gaze.befTime = Date.now();
    } else {
      const curTime = Date.now();
      Gaze.gaze.latencyList.push(curTime - Gaze.gaze.befTime);
      Gaze.gaze.befTime = curTime;
    }
    const {browser_x, browser_y} = Gaze.gaze.cm_to_pixel_(_x, _y, false);
    const gazeInfo = new GazeInfo(_timestamp, browser_x, browser_y, _trackingState, _eyeMovmentState);
    Gaze.gaze.gazeCallbacks.forEach((fn) => {
      fn(gazeInfo);
    });
  }

  /** @private */
  wasmCalibrationProgress_(_progress, _x, _y) {
    const {browser_x, browser_y} = Gaze.gaze.cm_to_pixel_(_x, _y, false);
    const progress = _progress;

    if (_progress >= 1.0) {
      Gaze.gaze.calibrationNextPointCallbacks.forEach((fn) => {
        fn(browser_x, browser_y);
      });
    }

    Gaze.gaze.calibrationProgressCallbacks.forEach((fn) => {
      fn(progress);
    });
  }

  /** @private */
  wasmCalibrationFinished_(calibrationData, dataSize) {
    let seeso = Gaze.gaze;
    const buffer = new ArrayBuffer(dataSize);
    const intArr = new Uint8Array(buffer);
    intArr.set(seeso.trackerModule.HEAPU8.subarray(calibrationData,
        (calibrationData + dataSize)));
    const calibrationB64 = seeso.bytesToBase64_(intArr);

    const cameraInfo = seeso.getCameraPosition();
    const monitorInch = seeso.getMonitorSize();
    const faceDistance = seeso.getFaceDistance();
    Gaze.gaze.calibrationFinishCallbacks.forEach((fn) => {
      fn(new CalibrationData({
        vector: calibrationB64,
        vectorLength: dataSize,
        isCameraOnTop: cameraInfo.isCameraOnTop,
        cameraX: cameraInfo.cameraX,
        monitorInch: monitorInch,
        faceDistance: faceDistance,
      }).to_string());
    });

  }

  /** @private */
  bytesToBase64_(bytes) {
    let binary = '';
    let len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /** @private */
  base64ToByteBuffer_(base64) {
    return Buffer.from(base64, 'base64');
  }

  // Functions for dimension calculate
  /** @private */
  cm_to_pixel_(_x, _y, debug) {
    const {screen_x, screen_y} = this.camera_to_screen_(_x, _y);
    const {browser_x, browser_y} = this.screen_to_browser_(screen_x, screen_y);
    if (debug) {
      console.log(_x, _y, '->', screen_x, screen_y, '->', browser_x, browser_y);
    }
    return {browser_x, browser_y};
  }

  /** @private */
  pixel_to_cm_(_x, _y) {
    const {screen_x, screen_y} = this.browser_to_screen_(_x, _y);
    const {camera_x, camera_y} = this.screen_to_camera_(screen_x, screen_y);
    console.log(_x, _y, '->', screen_x, screen_y, '->', camera_x, camera_y);
    return {camera_x, camera_y};
  }

  /** @private */
  screen_to_browser_(_x, _y) {
    const leftOrigin = window.screenX;// - (window.outerWidth - window.innerWidth);
    const topOrigin = window.screenY +
        (window.outerHeight - window.innerHeight);
    const browser_x = _x - leftOrigin;
    const browser_y = _y - topOrigin + (this.isCameraOnTop ? 0 : window.outerHeight);
    return {browser_x, browser_y};
  }

  /** @private */
  browser_to_screen_(_x, _y) {
    const leftOrigin = window.screenX;// - (window.outerWidth - window.innerWidth);
    const topOrigin = window.screenY +
        (window.outerHeight - window.innerHeight);
    const screen_x = _x + leftOrigin;
    const screen_y = _y + topOrigin - (this.isCameraOnTop ? 0 : window.outerHeight); // screen_to_browser를 그냥 반대로
    return {screen_x, screen_y};
  }

  /** @private */
  camera_to_screen_(_x, _y) {
    _y = _y + this.cameraTopMm;
    const screen_x = Math.floor(window.screen.width / this.widthMm * _x + this.cameraX);
    const screen_y = Math.floor(window.screen.height / this.heightMm * (-_y));
    return {screen_x, screen_y};
  }

  /** @private */
  screen_to_camera_(_x, _y) {
    let camera_x = Math.floor(this.widthMm / window.screen.width * (_x - this.cameraX));
    let camera_y = - Math.floor(this.heightMm / window.screen.height * (_y));
    camera_y = camera_y - this.cameraTopMm;
    return {camera_x, camera_y};
  }

  /** @private */
  releaseStreamTrack_() {
    if (this.track) {
      this.track.stop();
      this.track = null;
    }
  }
}

export default Gaze;
