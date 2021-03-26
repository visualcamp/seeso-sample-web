import 'regenerator-runtime/runtime';
import EasySeeSo from "../SeeSo/easy-seeso";
import showGaze from "../showGaze";

const licenseKey = 'YOUR_LICENSE_KEY_HERE';

function onClickCalibrationBtn(){
    const userId = 'YOUR_USER_ID'; // ex) 5e9easf293
    const redirectUrl = 'http://localhost:8080';
    const calibrationPoint = 1;
    EasySeeSo.openCalibrationPage(licenseKey, userId, redirectUrl, calibrationPoint);
}

// in redirected page
function parseCalibrationDataInQueryString () {
    const href = window.location.href
    const decodedURI = decodeURI(href)
    const queryString = decodedURI.split('?')[1];
    if (!queryString) return undefined
    const jsonString = queryString.slice("calibrationData=".length, queryString.length)
    return jsonString
}

// gaze callback.
function onGaze(gazeInfo) {
    // do something with gaze info.
    showGaze(gazeInfo)
}

// debug callback.
function onDebug(FPS, latency_min, latency_max, latency_avg){
    // do something with debug info.
}

async function main() {

    const calibrationData = parseCalibrationDataInQueryString()

    if (calibrationData){
        const seeSo = new EasySeeSo();
        await seeSo.setCalibrationData(calibrationData)
        await seeSo.init(licenseKey,
            () => seeSo.startTracking(onGaze, onDebug), // callback when init succeeded.
            () => console.log("callback when init failed.") // callback when init failed.
        )
    } else {
        console.log('No calibration data given.')
        const calibrationButton = document.getElementById('calibrationButton')
        calibrationButton.addEventListener('click', onClickCalibrationBtn)
    }
}

(async () => {
  await main();
})()
