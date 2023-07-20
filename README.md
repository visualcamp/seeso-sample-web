<p align="center">
    <img src="/image/seeso_logo.png">
</p>
<div align="center">
    <h1>SeeSo Web Sample</h1>
    <img src="https://img.shields.io/badge/version-2.5.0-blue" />
</div>

## SeeSo
SeeSo is an AI based eye tracking SDK which uses image from RGB camera to track where the user is looking.
Extra hardware is not required and you can start your development for free.
In 2021, SeeSo was recognized for its innovative technology and won GLOMO Award for Best Mobile Innovation for Connected Living!
1. Supports multi-platform (iOS/Android/Unity/Windows/Web-JS)
2. Has simple and quick calibration (1-5 points)
3. Has high accuracy and robustness compared to its competitors.

## Documentation
* Overview: https://docs.seeso.io/nonversioning/document/seeso-sdk-overview
* Quick Start: https://docs.seeso.io/nonversioning/quick-start/web-quick-start
* API: https://docs.seeso.io/docs/api/web-api-docs

## Requirements
![Chrome](https://raw.github.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png) | ![Firefox](https://raw.github.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png) | ![Safari](https://raw.github.com/alrra/browser-logos/master/src/safari/safari_48x48.png) | ![Edge](https://raw.github.com/alrra/browser-logos/master/src/edge/edge_48x48.png) |  |
--- | --- | --- | --- | --- |
80 and above ✔ | ✔   | 15.2 and above ✔ | ✔   |

* Must be issued a license key in [SeeSo Manage](https://manage.seeso.io/)

## Setting License Key
* Clone or download this project.
* Get a license key from https://manage.seeso.io and copy your key to [`gaze/index.js`](/samples/gaze/index.js#L8), [`gaze-minjs/index.js`](/samples/gaze-minjs/index.js#L8), [`calibration/index.js`](/samples/calibration/index.js#L5), [`custom-calibration/index.js`](/samples/custom-calibration/index.js#L5)
   ```
   const licenseKey = 'YOUR_LICENSE_KEY_HERE'; // Issue license key! -> https://manage.seeso.io
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

* To run Custom Calibration sample
```
$ npm install
$ npm run custom-calibration
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
      
## Contact Us
If you have any problems, feel free to [contact us](https://seeso.io/Contact-Us) 
