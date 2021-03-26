const INCH_TO_MM = 25.4;
class MonitorSizeConveter {
    static inchToSizeMM(inch) {
        const widthRatio = screen.width / screen.height;
        const heightRatio = 1; // height에 대한 비를 구했으니 height는 1

        if (inch) {
            let mornitorInchMm = INCH_TO_MM * inch;

            let ratioDiagonal = Math.sqrt(
                Math.pow(widthRatio, 2) + Math.pow(heightRatio, 2));

            let monitorRatio = mornitorInchMm / ratioDiagonal;
            let monitorWidth = widthRatio * monitorRatio;
            let monitorHeight = heightRatio * monitorRatio;
            return { width : monitorWidth, height : monitorHeight };
        }
    }

    static sizeMMtoInch(monitorWidth, monitorHeight) {
        let diagonal = Math.sqrt(Math.pow(monitorWidth,2) + Math.pow(monitorHeight,2));
        return Math.round(diagonal / INCH_TO_MM);
    }
}

export default MonitorSizeConveter;
