export class CalibrationData {
    constructor(input) {
        if (typeof(input) === "string"){
            this.constructFromString(input)
        } else {
            this.constructFromCalibrationInput(input)
        }
    }

    constructFromString (jsonString) {
        const calibrationData = JSON.parse(jsonString);
        const {vector, vectorLength, isCameraOnTop, cameraX, monitorInch, faceDistance} = calibrationData
        this.vector = vector;
        this.vectorLength = vectorLength;
        this.isCameraOnTop = isCameraOnTop;
        this.cameraX = cameraX;
        this.monitorInch = monitorInch;
        this.faceDistance = faceDistance;
    }

    constructFromCalibrationInput (input) {
        this.vector = input.vector;//b64 string
        this.vectorLength = input.vectorLength; //b64 길이
        this.isCameraOnTop = input.isCameraOnTop;
        this.cameraX = input.cameraX;
        this.monitorInch = input.monitorInch;
        this.faceDistance = input.faceDistance;
    }

    to_string() {
        return JSON.stringify(this);
    }

}
