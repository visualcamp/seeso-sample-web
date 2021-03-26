/* eslint-disable */

export const MAX_FPS = 30;
export const INTERVAL_TIME_MS = 1000 / MAX_FPS;
export const DEBUG_INTERVAL_TIME_MS = 1000;
export const CALIBRATION_REGION_RATIO = 0.95;
export const getServerUrl = () => {
  const NODE_ENV = process.env.NODE_ENV;
  if (NODE_ENV === 'visualcamprelease') {
    return 'https://console.seeso.io';
  } else if (NODE_ENV === 'visualcampproduction') {
    return 'https://console.seeso.io';
  } else if (NODE_ENV === 'visualcampstage') {
    return 'https://stage.seeso.io';
  } else if (NODE_ENV === 'visualcampdevelopment') {
    return 'https://stage.seeso.io';
  } else if (NODE_ENV === 'visualcamplocaltoprodserver') {
    return 'https://console.seeso.io';
  } else if (NODE_ENV === 'visualcamplocal') {
    return null; // not implement
  } else {
    return 'https://console.seeso.io';
  }
}
export const getCalibrationServiceUrl = () => {
  const NODE_ENV = process.env.NODE_ENV;
  if (NODE_ENV === 'visualcamprelease') {
    return 'https://calibration.seeso.io/#/service';
  } else if (NODE_ENV === 'visualcampproduction') {
    return 'https://calibration.seeso.io/#/service';
  } else if (NODE_ENV === 'visualcampstage') {
    return 'https://js.seeso.io/#/service';
  } else if (NODE_ENV === 'visualcampdevelopment') {
    return 'https://js.seeso.io/#/service';
  } else if (NODE_ENV === 'visualcamplocaltoprodserver') {
    return 'https://calibration.seeso.io/#/service';
  } else if (NODE_ENV === 'visualcamplocal') {
    return null; // not implement
  } else {
    return 'https://calibration.seeso.io/#/service';
  }
}
