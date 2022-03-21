import 'regenerator-runtime/runtime';
import EasySeeSo from 'seeso/easy-seeso';
import showGaze from "../showGaze";

const licenseKey = 'INPUT_YOUR_KEY';

function onClickCalibrationBtn(){
    const userId = 'YOUR_USER_ID'; // ex) 5e9easf293
    const redirectUrl = 'http://localhost:8082';
    const calibrationPoint = 5;
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
        await seeSo.init(licenseKey,
            async () => {        
                await seeSo.startTracking(onGaze, onDebug)
                await seeSo.setCalibrationData(calibrationData)
            }, // callback when init succeeded.
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
