<p align="center">
    <img src="/image/seeso_logo.png">
</p>
<div align="center">
    <h1>SeeSo Web Sample</h1>
    <a href="https://github.com/visualcamp/seeso-sample-windows/releases" alt="release">
        <img src="https://img.shields.io/badge/version-2.4.0-blue" />
    </a>
</div>

## SeeSo
SeeSo is an AI based eye tracking SDK which uses image from RGB camera to track where the user is looking.
Extra hardware is not required and you can start your development for free.
In 2021, SeeSo was recognized for its innovative technology and won GLOMO Award for Best Mobile Innovation for Connected Living!
1. Supports multi-platform (iOS/Android/Unity/Windows/Web-JS)
2. Has simple and quick calibration (1-5 points)
3. Has high accuracy and robustness compared to its competitors.

## Documentation
* Overview: https://docs.seeso.io/docs/seeso-sdk-overview/
* Quick Start: https://docs.seeso.io/docs/web-quick-start/
* API: https://docs.seeso.io/docs/web-api-docs/

## Requirements
![Chrome](https://raw.github.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png) | ![Firefox](https://raw.github.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png) | ![Safari](https://raw.github.com/alrra/browser-logos/master/src/safari/safari_48x48.png) | ![Edge](https://raw.github.com/alrra/browser-logos/master/src/edge/edge_48x48.png) | ![IE](https://raw.github.com/alrra/browser-logos/master/src/archive/internet-explorer_9-11/internet-explorer_9-11_48x48.png) |
--- | --- | --- | --- | --- |
80 and above ✔ | Available Soon  |✘ | Available Soon  | ✘|

* Must be issued a license key in [SeeSo Console](https://console.seeso.io/)

## Setting License Key
* Clone or download this project.
* Get a license key from https://console.seeso.io and copy your key to [`gaze/index.js`](/samples/gaze/index.js), [`gaze-minjs/index.js`](/samples/gaze-minjs/index.js), [`calibration/index.js`](/samples/calibration/index.js)
   ```
   const licenseKey = 'YOUR_LICENSE_KEY_HERE'; // Issue license key! -> https://console.seeso.io
   ```

## How to run
* To run Gaze sample
```
$ npm install
$ npm run gaze
```

* To run Calibration sample
```
$ npm install
$ npm run calibration
```

## How to install SeeSo

* Using npm:
```shell script
$ npm install seeso
```

* Using CDN: It will be available soon.
```html
<script src="https://cdn.seeso.io/seeso.js"></script>
```

## SIMD Setting (Chrome Optional)

> Using this setting improves the performance of the SDK.

1. Go to `chrome://flags/`
2. Set WebAssembly SIMD support `Enabled`
![SIMD setting](https://docs.seeso.io/img/web-quick-start/simd-chrome-setting.png)
      
## Contact Us
If you have any problems, feel free to [contact us](https://seeso.io/Contact-Us) 
