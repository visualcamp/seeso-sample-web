// helper functions to display gaze information and dot in browser.


// 시선 추적 프레임레이트 30, 각 좌표(X,Y) 별로 필터가 필요
import {OneEuroFilter} from "./filter/OneEuroFilter";

const oneEuroFilterX = new OneEuroFilter(30);
const oneEuroFilterY = new OneEuroFilter(30);

// show gaze information on screen.
function showGazeInfoOnDom (gazeInfo) {
  let gazeInfoDiv = document.getElementById("gazeInfo")
  gazeInfoDiv.innerText = `Gaze Information Below
                          \nx: ${gazeInfo.x}
                          \ny: ${gazeInfo.y}
                          `
}

// hide gaze information on screen.
function hideGazeInfoOnDom () {
  let gazeInfoDiv = document.getElementById("gazeInfo");
  gazeInfoDiv.innerText = "";
}

// show gaze dot on screen.
function showGazeDotOnDom (gazeInfo) {
  let canvas = document.getElementById("output")
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  let ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height )

  /// 필터 없는 GazePoint는 붉은 색으로 표시
  ctx.fillStyle = '#FF0000'
  ctx.beginPath();
  ctx.arc(gazeInfo.x, gazeInfo.y, 3, 0, Math.PI * 2, true);
  ctx.fill();


  /// 시선 좌표가 유효하지 않은 경우에는 필터를 돌리지 않는다.
  if(isNaN(gazeInfo.x) === false){
    /// 필터로 좌표 계산, 시간은 밀리초에서 초단위로 변경하기 위해 1000으로 나누어줌
    const filterGazeX = oneEuroFilterX.filter(gazeInfo.x, gazeInfo.timestamp / 1000)
    const filterGazeY = oneEuroFilterY.filter(gazeInfo.y, gazeInfo.timestamp / 1000)

    /// 필터가 적용된 GazePoint는 파란 색으로 표시
    /// 필터가 적용되면 떨림 현상은 줄어들지만, 반응 속도가 필터 없는것에 비해 느려짐
    ctx.fillStyle = '#0000FF'
    ctx.beginPath();
    ctx.arc(filterGazeX, filterGazeY, 10, 0, Math.PI * 2, true);
    ctx.fill();

  }

  console.log(gazeInfo);
}


let fixationX = -9999;
let fixationY = -9999;
let fixationRadius = 5;

function showFixationOnDom (gazeInfo) {
  let canvas = document.getElementById("fixationOutput")
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  let ctx = canvas.getContext("2d");

  // eyemovementState === 0 인 경우 Fixation
  if(gazeInfo.eyemovementState === 0){

    if(fixationX === -9999){
      fixationX = gazeInfo.x;
    }

    if(fixationY === -9999){
      fixationY = gazeInfo.y;
    }

    /// Fixation은 반투명한 초록색 원으로 표시
    ctx.fillStyle = '#00FF0066'
    ctx.beginPath();
    ctx.arc(fixationX, fixationY, fixationRadius, 0, Math.PI * 2, true);
    ctx.fill();
    fixationRadius += 2;

  }else{
    fixationX = -9999;
    fixationY = -9999;
    fixationRadius = 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height )
  }
}

function hideGazeDotOnDom() {
  let canvas = document.getElementById("output");
  let ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height );
}

function showGaze(gazeInfo) {
  showGazeInfoOnDom(gazeInfo)
  showGazeDotOnDom(gazeInfo)
  showFixationOnDom(gazeInfo)
}

function hideGaze(){
  hideGazeInfoOnDom();
  hideGazeDotOnDom();
}

export { showGaze, hideGaze }