/* dancing-episode-old.js
 * Federico Mancinelli
 *
 * Implements dancing task at its basic form.
 * To make this playable, it's possible that some variables should be adjusted
 * based on screen type -- although I've tried to make everything relative.
 *
 * If you're having trouble, get in touch: fed.mancinelli@gmail.com
 *
 * Do adjust practice_duration, and trial_duration based on your needs.
 *
 * The original task had 1 min practice, and 14 min play time.
 *
 */

jsPsych.plugins['dancing-episode-old'] = (function(){

  var plugin = {};

  plugin.info = {
    name: 'dancing-episode-old',
    parameters: {
      practice_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Practice duration",
        default: 30,
        description: "Length of practice session."
      },
      trial_duration: {
        type: jsPsych.plugins.parameterType.INT,
        pretty_name: "Trial duration",
        default: 1,
        description: "Total length of the dances."
      }
    }
  };

plugin.trial = function(display_element, trial){

  //Create a canvas element and append it to the DOM
  var canvas = document.createElement("canvas");
  display_element.appendChild(canvas);

  //Get the context of the canvas so that it can be painted on.
  canvas.style.width = (0.9*window.innerWidth).toString()+"px";
  canvas.style.height = (0.9*window.innerHeight).toString()+"px";
  dpr = window.devicePixelRatio;
  var canvas_width = canvas.width = dpr*0.9*window.innerWidth;
  var canvas_height = canvas.height = dpr*0.9*window.innerHeight;

  var uMsg = document.createElement("div");
  var dMsg = document.createElement("div");
  // uMsg.setAttribute("id", "uMsg");
  display_element.appendChild(uMsg);
  display_element.appendChild(dMsg);

  var ctx = canvas.getContext("2d");

  //~~~ Helper variables
  sec = 1000;
  min = 60*sec;

  //~~~ Game phases flags
  var IDPhase = true;
  var practicePhase = false;
  var gamePhase = false;
  var noDrawPhase = false;
  var noSubjectDraw = false;

  //~~~ Durations
  var taskStartTime = 0;
  var practiceDuration = trial.practice_duration * sec;
  var intermezzoDuration = 5 * sec;
  var taskDuration = trial.trial_duration * min;

  var explored = new Array(false,false,false,false);
  var allExplored = 0;
  var minimalTime = 5*sec;

  //~~~ Task data variables

  // UserID
  var userID;

  // Questionnaire
  var nQuestions = 9;
  var results = new Array(4*nQuestions + 11).fill(50);

  // General
  var samplingInterval = 50;
  var subjectData = [];
  var mouseCoords = {x:0, y:0};
  var clicked = 0;
  var action = 0;

  // Summary variables
  var summaryData = [];
  var nMoods = 1;
  var delta1 = 0;
  var avgMood = 0;
  var varMood = 0;

  //~~~ Subject & agents aesthetics
  var agentColors = new Array("rgb(0,255,128)","rgb(102,178,255)","rgb(255,255,51)","rgb(255,178,102)");
  var subjectSize = 28 * dpr;
  var agentSize = 32 * dpr;
  var breathingAmp = 2;  // oscillation amplitude (breathing)
  var blinkTime = 0;
  var blinking = false;

  //~~~ Subject & agents positional and dynamic variables

  // static variables
  var xa, ya; // all positions
  var r1, r2, r3, r4; // all s-a distances
  var sub_agt_distance;

  var action_initiated = false;
  var subject_step_norm = 0;
  var subject_current_span = 0;
  var subject_x, subject_y;
  var x_selected = -10;
  var y_selected = -10;
  var n_slices = 100;
  var subject_old_x, subject_old_y;
  var subject_delta_x = 0;
  var subject_delta_y = 0;
  var dx1 = 0;
  var dy1 = 0;
  var dx2 = 0;
  var dy2 = 0;
  var dx3 = 0;
  var dy3 = 0;
  var dx4 = 0;
  var dy4 = 0;

  // dynamic variables
  var engdSpeed = 0.001*(canvas_width + canvas_height)/2; // the higher, the faster the steps when engaged
  var idlePeriod = 900; // the lower the faster the frequency of oscillation when idle
  var idleSpeed = 1/100; // the lower the slower when idle
  // var crashed = new Array(false,false,false,false);
  var startTimeSub = 0;
  var startTimeAgent = new Array(0,0,0,0);
  var actionTimeInterval = 4500; // period of dance moves
  var nSlices = 100;
  var sliceTime = 10;
  var selTime = 0;
  var movedFirstTime = false;
  var stepTime = 500;
  var danceRadius = 4e2;
  var movementState = new Array(0,0,0,0); // tracks movement state of each agent. 0 is idle, 1 is approaching, -1 is leaving.
  var previousState = new Array(0,0,0,0);
  var withdrew = 0; // whether subject just pressed space bar to withdraw from dance

  //~~~ Mood and dance variables
  var moods = new Array(-0.05,-0.05,-0.05,-0.05);
  var agentSmiles = new Array(0,0,0,0);
  var ctlGain_pos = [0.0, 0.0, 0.0, 0.0];
  var ctlGain_neg = [0.0, 0.0, 0.0, 0.0];
  var noiseTerm = 0;
  var moodUnlocked = false;
  var minDistance = 55*dpr;
  var maxDistance = 200*dpr;

  // choice related
  var choiceAllowed = true; // variable to force a wait between "dances"; the wait is choiceRefractTime ms (below).
  var disengTime = -3000; // time of disengagement
  var choiceRefractTime = 3000;
  var selected = 0; // var to keep track of engaged agent. Starts at 0 for practice phase.

  // Score and other game variables
  var deltaScore = 0; // score variation updated every time draw() is called
  var scoreScale = 0.1;
  var colorIT = 5; // inverse temperature for translation of mood into green level
  var soundLock = true; // making sure that audio feedback only arises at the desired frequency
  var oscillFactor = new Array(1,1,1,1);

  // Audio variables
  var audioMoveYes = new Audio('move.wav');
  var audioMoveNo = new Audio('moveWR.mp3');
  var audioEngage = new Audio('moveOK.mp3');
  var audioRegenerate = new Audio('computer_access.wav');
  var audioPosSel = new Audio('bzz.mp3');
  audioEngage.volume = 0.15;
  audioMoveYes.volume = 0.1;
  audioMoveNo.volume = 0.1;
  audioRegenerate.volume = 0.2;
  audioPosSel.volume = 0.15;


  //~~~ Helper functions


  function getRandomInt(max){
    return Math.floor(Math.random() * Math.floor(max));
  }

  function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
    return array;
  }

  function rgb(r, g, b){
    return ["rgb(",r,",",g,",",b,")"].join("");
  }

  function logit(x, t, invTemp){
    return 1/(1 + Math.exp(-(x-t)*invTemp));
  }

  function isAllTrue(element){
    return element;
  }

  function randn_bm() {
      var u = 0, v = 0;
      while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
      while(v === 0) v = Math.random();
      return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
  }

  function resetCanvas(){
    ctx.clearRect(0, 0, canvas_width, canvas_height);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas_width, canvas_height);
    ctx.strokeStyle = "#44FFAA";
    ctx.strokeRect(0, 0, canvas_width, canvas_height);
  }

  // ----- Mouse_handling

  canvas.onmousemove = updateMouseCoords;

  function getMousePos(e) {
    var rect = canvas.getBoundingClientRect();
    return {
      x : window.devicePixelRatio * (e.clientX - rect.left),
      y : window.devicePixelRatio * (e.clientY - rect.top)
    };
  }

  function updateMouseCoords(event) {
      mouseCoords = getMousePos(event); // pointer position
  }

  // -----

  function stackDataLine(){

    if (!IDPhase){
      if (selected > 0){
        subjectData.push([practicePhase? 1:0, performance.now() - taskStartTime, selected, clicked, action, stepTime, mouseCoords.x, mouseCoords.y, x, y, xa[selected-1].toFixed(1), ya[selected-1].toFixed(1), sub_agt_distance, movementState[selected-1], moods[selected-1].toFixed(2), allExplored? 1:0]);
      }
      else{
        subjectData.push([practicePhase? 1:0, performance.now() - taskStartTime, selected, clicked, action, stepTime, mouseCoords.x, mouseCoords.y, x, y, 0, 0, 0, 0, 0, allExplored? 1:0]);
      }

      if (clicked == 1)
        clicked = 0;
    }
  }
  setInterval(stackDataLine, 50);

  function stackSummaryLine(){
    summaryData.push([practicePhase? 1:0, selected, selTime, disengTime, avgMood.toFixed(2), (varMood/nMoods).toFixed(2)]);
  }

  // ~~~~~~~~~ Initialization_procedures
  //

  initiate();

  function initiate(){

      canvas.style.display = "block";

      subject_x = canvas_width/2.5; // initial x position of player
      subject_y = canvas_height/2.5; // initial y position of player

      xa = [canvas_width/2, 1e5, 1e5, 1e5];
      ya = [canvas_height/2, 1e5, 1e5, 1e5];

      //-- Start the practice phase
      startPracticePhase();
  }

  function startPracticePhase(){

    setTimeout(startInterPhase, practiceDuration);

      practicePhase = true;
      taskStartTime = performance.now(); // taskStartTime the global game timer
      agentColors[0] = '#DDDDDD';
      dMsg.innerHTML = "Select the dancer, then dance at the <i>right distance</i>.";
  }

  function startInterPhase(){

    setTimeout(startGamePhase, intermezzoDuration);

      withdrew = 1; disengage(); // disengage from dance with agent 1
      practicePhase = false;
      noDrawPhase = true;
      resetCanvas();
      dMsg.innerHTML = ""; uMsg.innerHTML = "";
      ctx.font = "63px Consolas"; ctx.fillStyle = "blue";
      ctx.textAlign = "center";
      ctx.fillText("[game starts soon]",canvas_width/2,canvas_height/2);
      ctx.font = "43px Consolas"; ctx.fillStyle = "blue";
      ctx.textAlign = "center";
      ctx.fillText("Try to remember your experience with each dancer.",canvas_width/2,canvas_height/2 + canvas_height/10);
  }

  function startGamePhase(){

    setTimeout(endGamePhase, taskDuration);

      taskStartTime = performance.now(); // taskStartTime the global game timer

      noDrawPhase = false;
      gamePhase = true; // update game phase

      agentColors[0] = "rgb(0,255,128)";

      xa = [0.33*canvas_width, 0.66*canvas_width, 0.33*canvas_width, 0.66*canvas_width];
      ya = [0.33*canvas_height, 0.33*canvas_height, 0.66*canvas_height, 0.66*canvas_height];

      x_selected = subject_x;
      y_selected = subject_y;

      moods = [0.15,0.15,0.15,0.15];

      explored = new Array(false,false,false,false);

      dMsg.innerHTML = "Choose from any of the numbered dancers.";
  }

  function endGamePhase(){

      // Wrap-up
        withdrew = 1; disengage(); // disengage from dance with agent 1
        gamePhase = false;
        noSubjectDraw = true;
        uMsg.innerHTML = ""; dMsg.innerHTML = "";

        // avoid the disengagement to keep happening
        withdrew = 0;

        display_element.removeChild(canvas);

        // // reposition dancers to be on the right side
        // xa = [canvas_width-180,canvas_width-180,canvas_width-180,canvas_width-180];
        // ya = [2*canvas_height/6, 3*canvas_height/6, 4*canvas_height/6, 5*canvas_height/6];

        // Questionnaire
        // showQuestionnaire()
        // document.getElementById("theQ").style.display = "block";

        // storeQData();
        jsPsych.finishTrial();
  }

  function storeAllData(){

    // task data
    // var link = document.createElement("a");

    var mouseDataCsv = "mouseData:text/csv;charset=utf-8,";

    mouseDataCsv += "\n";
    mouseDataCsv += "Practice, Time, Selected, Clicked, Action, Step duration, mouse (X), mouse (Y), Sub (X), Sub (Y), Agt (X), Agt (Y), Distance to agent, MS, Mood, AllExplored  \n";

    subjectData.forEach(function(infoArray, index) {
      dataString = infoArray.join(",");
      mouseDataCsv += dataString + "\n";
    });

    // link.setAttribute("href", window.URL.createObjectURL(new Blob(
    //     [ mouseDataCsv ])));
    // link.setAttribute("download", userID + "_task_data.csv");
    // link.click();

    // summary data
    var summaryDataCsv = "summaryData:text/csv;charset=utf-8,";

    summaryDataCsv += "\n";
    summaryDataCsv += "Practice, Agent, Start, End, Avg Mood, Var Mood \n";

    summaryData.forEach(function(infoArray, index) {
      dataString = infoArray.join(",");
      summaryDataCsv += dataString + "\n";
    });

    // link.setAttribute("href", window.URL.createObjectURL(new Blob(
    //     [ summaryDataCsv ])));
    // link.setAttribute("download", userID + "_summary.csv");
    // link.click();

    // questionnaire data
    var qDataCsv = "questionnaireData:text/csv;charset=utf-8,";

    qDataCsv += "\n";
    qDataCsv += results.join(",");

    // link.setAttribute("href", window.URL.createObjectURL(new Blob(
    //     [ qDataCsv ])));
    // link.setAttribute("download", userID + "_quest_data.csv");
    // link.click();
  }

  // ~~~~~~~~~ Main__drawing__loop
  //
  function draw(){

    if (!noDrawPhase){

      resetCanvas();

      // Update distances
      r1 = Math.sqrt((subject_x-xa[0])*(subject_x-xa[0]) + (subject_y-ya[0])*(subject_y-ya[0])); // distance between subject and agent 1
      r2 = Math.sqrt((subject_x-xa[1])*(subject_x-xa[1]) + (subject_y-ya[1])*(subject_y-ya[1])); // distance between subject and agent 2
      r3 = Math.sqrt((subject_x-xa[2])*(subject_x-xa[2]) + (subject_y-ya[2])*(subject_y-ya[2])); // distance between subject and agent 3
      r4 = Math.sqrt((subject_x-xa[3])*(subject_x-xa[3]) + (subject_y-ya[3])*(subject_y-ya[3])); // distance between subject and agent 4

      // ctx.font = "42px Consolas";
      // ctx.fillStyle = "black";
      // ctx.fillText("x_selected: " + x_selected + " y_selected: " + y_selected, canvas_width/2, canvas_height/2);
      // ctx.fillText("ssn: " +  subject_step_norm.toFixed(1), canvas_width/2, canvas_height/2 + 55);
      // ctx.fillText("scs: " +  subject_current_span.toFixed(1), canvas_width/2, canvas_height/2 + 110);
      // ctx.fillText("diff: " +  (subject_step_norm - subject_current_span).toFixed(1), canvas_width/2, canvas_height/2 + 165);


      if (!noSubjectDraw)
        drawSubject();
      drawAgents();
      drawScore();
      updateMoods();
      updatePositions();
    }

  }
  setInterval(draw, sliceTime);
  //
  //

  function updateMoods(){

    danceContribution = deltaScore; // between -1 and 1
    noiseTerm = 0.01*randn_bm();
    noiseTerm = (deltaScore == 0)? 0:noiseTerm;

    // online estimates of mood mean and variance (goes to summary)
    if (selected > 0){
      delta1 = moods[selected-1] - avgMood;
      avgMood = 1/nMoods*((moods[selected-1]) + (nMoods-1)*avgMood);
      varMood += delta1*(moods[selected-1] - avgMood);
      nMoods += 1;
    }

    for (a = 0; a < 4; a++){
      if (gamePhase && selected == a+1) {

        // translation of mood into expression
        agentSmiles[a] = 27*(logit(moods[a],0,5));

        // translation of mood into behaviour
        switch(a){
          case 0:
            ctlGain_pos[0] = 0.002;
            ctlGain_neg[0] = 0.002;
            moods[0] = Math.min(Math.max(moods[0] + ((danceContribution > 0)? ctlGain_pos[0]:ctlGain_neg[0]) * danceContribution + noiseTerm,-1),1);
            break;
          case 1:
            ctlGain_pos[1] = 0.002;
            ctlGain_neg[1] = 0.002;
            moods[1] = Math.min(Math.max(moods[1] + ((danceContribution > 0)? ctlGain_pos[1]:ctlGain_neg[1]) * danceContribution + noiseTerm,-0.2),1);
            break;
          case 2:
            ctlGain_pos[2] = 0.002;
            ctlGain_neg[2] = 0.002;
            moods[2] = Math.min(Math.max(moods[2] + ((danceContribution > 0)? ctlGain_pos[2]:ctlGain_neg[2]) * danceContribution + noiseTerm,-1),0.2);
            break;
          case 3:
            ctlGain_pos[3] = 0.002;
            ctlGain_neg[3] = 0.002;
            moods[3] = Math.min(Math.max(moods[3] + ((danceContribution > 0)? ctlGain_pos[3]:ctlGain_neg[3]) * danceContribution + noiseTerm,-0.2),0.2);
            break;
        }
      }
      if (practicePhase) { // practice phase
        ctlGain_pos[0] = 0.002;
        ctlGain_neg[0] = 0.002;
        moods[a] = Math.min(Math.max(moods[a] + ((danceContribution > 0)? ctlGain_pos[a]:ctlGain_neg[a]) * danceContribution + noiseTerm,-0.3),0.3);
        agentSmiles[a] = 0.55*subjectSize*logit(moods[a],0,5) - 2;
      }
    }
  }

  function updatePositions(){

     // Subject movement updates
     if (action_initiated && ((subject_step_norm - subject_current_span) > 0)){
       subject_x += subject_delta_x;
       subject_y += subject_delta_y;
       subject_current_span += Math.sqrt(subject_delta_x*subject_delta_x + subject_delta_y*subject_delta_y);
     }
     else{
       if(action_initiated){
         action_initiated = false;
         subject_step_norm = 0;
         subject_current_span = 0;
       }
       else{
         // x_selected = subject_x;
         // y_selected = subject_y;
       }
     }

    // Agent -1- movement updates
    if (performance.now() - startTimeAgent[0] < stepTime){

      // delta updates based on intention. 0: no effect on delta 1: forward -1: backward.
      dx1 = (movementState[0] != 0)? ((movementState[0] == 1)? Math.cos(Math.atan2(subject_y-ya[0],subject_x-xa[0]))*engdSpeed:-Math.cos(Math.atan2(subject_y-ya[0],subject_x-xa[0]))*engdSpeed):dx1;
      dy1 = (movementState[0] != 0)? ((movementState[0] == 1)? Math.sin(Math.atan2(subject_y-ya[0],subject_x-xa[0]))*engdSpeed:-Math.sin(Math.atan2(subject_y-ya[0],subject_x-xa[0]))*engdSpeed):dy1;

      // check the canvas border
      dx1 = (xa[0] + dx1 >  42 + 1)?((xa[0] + dx1 < canvas_width -  42 - 1)? dx1:0):0;
      dy1 = (ya[0] + dy1 >  42 + 1)?((ya[0] + dy1 < canvas_height -  42 - 1)? dy1:0):0;

      // proceed
      xa[0] += dx1;
      ya[0] += dy1;

      // check whether a collision with subject happened
      // crashed[0] = (x-(xa[0] + 10*dx1))*(x-(xa[0] + 10*dx1)) + (y-(ya[0] + 10*dy1))*(y-(ya[0] + 10*dy1)) < 2800;

    }
    else
      stopMovement(1);

    // Agent -2- movement updates
    if (performance.now() - startTimeAgent[1] < stepTime){

      dx2 = (movementState[1] != 0)? ((movementState[1] == 1)? Math.cos(Math.atan2(subject_y-ya[1],subject_x-xa[1]))*engdSpeed:-Math.cos(Math.atan2(subject_y-ya[1],subject_x-xa[1]))*engdSpeed):dx2;
      dy2 = (movementState[1] != 0)? ((movementState[1] == 1)? Math.sin(Math.atan2(subject_y-ya[1],subject_x-xa[1]))*engdSpeed:-Math.sin(Math.atan2(subject_y-ya[1],subject_x-xa[1]))*engdSpeed):dy2;

      xa[1] += (xa[1] + dx2 >  42 + 1)?((xa[1] + dx2 < canvas_width -  42 - 1)? dx2:0):0;
      ya[1] += (ya[1] + dy2 >  42 + 1)?((ya[1] + dy2 < canvas_height -  42 - 1)? dy2:0):0;

      // crashed[1] = (subject_x-(xa[1] + 10*dx2))*(subject_x-(xa[1] + 10*dx2)) + (subject_y-(ya[1] + 10*dy2))*(subject_y-(ya[1] + 10*dy2)) < 2800;
    }
    else
      stopMovement(2);

    // Agent -3- movement updates
    if (performance.now() - startTimeAgent[2] < stepTime){

      dx3 = (movementState[2] != 0)? ((movementState[2] == 1)? Math.cos(Math.atan2(subject_y-ya[2],subject_x-xa[2]))*engdSpeed:-Math.cos(Math.atan2(subject_y-ya[2],subject_x-xa[2]))*engdSpeed):dx3;
      dy3 = (movementState[2] != 0)? ((movementState[2] == 1)? Math.sin(Math.atan2(subject_y-ya[2],subject_x-xa[2]))*engdSpeed:-Math.sin(Math.atan2(subject_y-ya[2],subject_x-xa[2]))*engdSpeed):dy3;

      xa[2] += (xa[2] + dx3 >  42 + 1)?((xa[2] + dx3 < canvas_width -  42 - 1)? dx3:0):0;
      ya[2] += (ya[2] + dy3 >  42 + 1)?((ya[2] + dy3 < canvas_height -  42 - 1)? dy3:0):0;

      // crashed[2] = (subject_x-(xa[2] + 10*dx3))*(subject_x-(xa[2] + 10*dx3)) + (subject_y-(ya[2] + 10*dy3))*(subject_y-(ya[2] + 10*dy3)) < 2800;
    }
    else
      stopMovement(3);

    // Agent -4- movement updates
    if (performance.now() - startTimeAgent[3] < stepTime){

      dx4 = (movementState[3] != 0)? ((movementState[3] == 1)? Math.cos(Math.atan2(subject_y-ya[3],subject_x-xa[3]))*engdSpeed:-Math.cos(Math.atan2(subject_y-ya[3],subject_x-xa[3]))*engdSpeed):dx4;
      dy4 = (movementState[3] != 0)? ((movementState[3] == 1)? Math.sin(Math.atan2(subject_y-ya[3],subject_x-xa[3]))*engdSpeed:-Math.sin(Math.atan2(subject_y-ya[3],subject_x-xa[3]))*engdSpeed):dy4;

      xa[3] += (xa[3] + dx4 >  42 + 1)?((xa[3] + dx4 < canvas_width -  42 - 1)? dx4:0):0;
      ya[3] += (ya[3] + dy4 >  42 + 1)?((ya[3] + dy4 < canvas_height -  42 - 1)? dy4:0):0;

      // crashed[3] = (subject_x-(xa[3] + 10*dx4))*(subject_x-(xa[3] + 10*dx4)) + (y-(ya[3] + 10*dy4))*(y-(ya[3] + 10*dy4)) < 2800;
    }
    else
      stopMovement(4);
  }

  function drawSubject() {

    smileyLevel = 20*logit(deltaScore-0.01,0, colorIT);

    // subject
    ctx.beginPath();
    ctx.arc(subject_x, subject_y, subjectSize + breathingAmp * Math.cos(performance.now()/500*4), 0, Math.PI * 2);
    ctx.fillStyle = rgb(255,255,255);

    // edge
    ctx.strokeStyle = rgb(60,60,60);
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fill();
    ctx.closePath();

    // -- face drawing
    ctx.beginPath();
    ctx.strokeStyle = rgb(100,100,100); ctx.lineWidth = 1.2*dpr;
    ctx.moveTo(subject_x+6*dpr, subject_y-6*dpr); ctx.lineTo(subject_x+6*dpr, subject_y-2*dpr); ctx.stroke();
    ctx.strokeStyle = rgb(100,100,100); ctx.lineWidth = 1.2*dpr;
    ctx.moveTo(subject_x-6*dpr, subject_y-6*dpr); ctx.lineTo(subject_x-6*dpr, subject_y-2*dpr); ctx.stroke();
    ctx.closePath();
    ctx.beginPath(); // mouth
    ctx.strokeStyle = rgb(100,100,100); ctx.lineWidth = 1.2*dpr;
    ctx.beginPath();
    ctx.moveTo(subject_x - 5*dpr,subject_y + 8*dpr);
    ctx.quadraticCurveTo(subject_x, subject_y + 8.5*dpr, subject_x + 5*dpr,subject_y + 8*dpr);
    ctx.stroke();
    ctx.closePath();
    //

    // new destination
    if (Math.abs(x_selected - subject_x) + Math.abs(y_selected - subject_y) > 50){ // this dot only gets cancelled once you reach it (-first condition-)
      ctx.beginPath();
      ctx.fillStyle = rgb(250,0,0);
      ctx.arc(x_selected, y_selected, subjectSize/10, 0, Math.PI * 2);
      ctx.fill();
      ctx.closePath();
    }
  }


  function drawAgents() {


    if (selected > 0)
      sub_agt_distance = Math.sqrt((subject_x-xa[selected-1])*(subject_x-xa[selected-1]) + (subject_y-ya[selected-1])*(subject_y-ya[selected-1]));
    else
      sub_agt_distance = 0;

    for (a = 0; a < 4; a++){

      ctx.beginPath();
      ctx.arc(xa[a], ya[a], agentSize + breathingAmp * Math.cos(performance.now()/500*oscillFactor[a]), 0,
      Math.PI * 2);
      ctx.strokeStyle = (selected == a+1 && (sub_agt_distance < danceRadius || movedFirstTime))? (moodUnlocked? "rgb(0,0,0)":"rgb(0,0,255)"):"rgb(255,255,255)";
      ctx.lineWidth = (selected == a+1 && (sub_agt_distance < danceRadius || movedFirstTime))? ((deltaScore > 0)?2:(Math.sin(performance.now()/200) > 0?6:2)):1;
      ctx.stroke();
      ctx.fillStyle = agentColors[a];
      ctx.fill(); // color fill
      ctx.closePath();

      if (!explored[a] || allExplored){ // agent number drawing
        ctx.font = "42px Consolas"; ctx.fillStyle = "black";
        ctx.fillText(a+1,xa[a]+16,ya[a]-16);
      }

      if (selected == a+1){
        ctx.fillStyle = agentColors[a];
        ctx.fill();

        // -- higher freq
        oscillFactor[a] = 3;

        // -- eyes and blinks
        if (Math.random() > 0.998 && !blinking)
          blinkTime = performance.now();
        blinking = (performance.now() - blinkTime) < 200;
        if (blinking){
          ctx.beginPath();
          ctx.strokeStyle = "black"; ctx.lineWidth = 1*dpr;
          ctx.moveTo(xa[a] + subjectSize*0.28,ya[a] - subjectSize*0.14); ctx.lineTo(xa[a] + subjectSize*0.14,ya[a] - subjectSize*0.14); ctx.stroke(); //eyes blinking
          ctx.moveTo(xa[a] - subjectSize*0.28,ya[a] - subjectSize*0.14); ctx.lineTo(xa[a] - subjectSize*0.14,ya[a] - subjectSize*0.14); ctx.stroke();
          ctx.closePath();
        }
        else{
          ctx.beginPath();
          ctx.fillStyle = "black";
          ctx.lineWidth = 1.2*dpr;
          ctx.moveTo(xa[a] + subjectSize*0.28, ya[a] - subjectSize*0.14);
          ctx.ellipse(xa[a] + subjectSize*0.28, ya[a] - subjectSize*0.14, 0.11*subjectSize*logit(-moods[a],0,6) + 0.025*subjectSize, 0.07*subjectSize*logit(moods[a],0,6)+ 0.017*subjectSize, 0, 0, 2 * Math.PI);  ctx.fill();
          ctx.moveTo(xa[a] - subjectSize*0.28, ya[a] - subjectSize*0.14);
          ctx.ellipse(xa[a] - subjectSize*0.28, ya[a] - subjectSize*0.14, 0.11*subjectSize*logit(-moods[a],0,6) + 0.025*subjectSize, 0.07*subjectSize*logit(moods[a],0,6)+ 0.017*subjectSize, 0, 0, 2 * Math.PI);  ctx.fill();
          ctx.closePath();
        }

        // -- smile
        ctx.beginPath();
        ctx.strokeStyle = "black"; ctx.lineWidth = 1.2*dpr;
        ctx.moveTo(xa[a] - 0.32*subjectSize,ya[a] + 0.32*subjectSize);
        ctx.quadraticCurveTo(xa[a], ya[a] + agentSmiles[a]*0.032*subjectSize, xa[a] + 9*dpr,ya[a]+ 9*dpr);
        ctx.stroke();
        ctx.closePath();
      }
    }
  }

  function drawScore() {

    // Visual score section

    switch (selected){
      case 1:
        deltaScore = moodUnlocked? ((r1 < minDistance)? -1: ((r1 > maxDistance)? -1:1)) : 0;
        break;
      case 2:
        deltaScore = moodUnlocked? ((r2 < minDistance)? -1: ((r2 > maxDistance)? -1:1)) : 0;
        break;
      case 3:
        deltaScore = moodUnlocked? ((r3 < minDistance)? -1: ((r3 > maxDistance)? -1:1)) : 0;
        break;
      case 4:
        deltaScore = moodUnlocked? ((r4 < minDistance)? -1: ((r4 > maxDistance)? -1:1)) : 0;
        break;
      default:
        deltaScore = 0;
    }


    if(practicePhase)
      uMsg.innerHTML = '[practice mode]';

    if (practicePhase && movedFirstTime)
      dMsg.innerHTML = "Remember: dancers usually don't like to be too close or too far.";
    else if (practicePhase && selected > 0)
      dMsg.innerHTML = "Get close and <i>click</i> to make the first move.";
    else if (practicePhase)
      dMsg.innerHTML = "Select this dancer by pressing their number.";
    else if(gamePhase && selected > 0 && moodUnlocked)
      dMsg.innerHTML = 'Dancer ' + selected + ' (press space to stop).';
    else if(gamePhase && selected > 0 && !moodUnlocked)
      dMsg.innerHTML = 'Dancer ' + selected + ' (move to start dancing!).';

  }

  function actionInitiation(){

    mentalState = Math.random();
    // crashed = [false,false,false,false]; // revive from crash

    if (selected > 0)
        action += 1;

    stepTime = (Math.random() >= 0.5)? randn_bm()*40 + 200 : randn_bm()*40 + 500;

    switch(selected){

      case 1:
        if (movedFirstTime){
          audioMoveYes.play();
          moodUnlocked = true;
          startTimeAgent[0] = performance.now(); moveSubject();
          movementState[0] = (previousState[0] != 0)? -previousState[0]:-1;
        }
        break;

      case 2:
        if (movedFirstTime){
          audioMoveYes.play();
          moodUnlocked = true;
          startTimeAgent[1] = performance.now(); moveSubject();
          movementState[1] = (previousState[1] != 0)? -previousState[1]:-1;
        }
        break;
      case 3:
        if (movedFirstTime){
          audioMoveYes.play();
          moodUnlocked = true;
          startTimeAgent[2] = performance.now(); moveSubject();
          movementState[2] = (previousState[2] != 0)? -previousState[2]:-1;
        }
        break;
      case 4:
        if (movedFirstTime){
          audioMoveYes.play();
          moodUnlocked = true;
          startTimeAgent[3] = performance.now(); moveSubject();
          movementState[3] = (previousState[3] != 0)? -previousState[3]:-1;
        }
        break;
    }
  }
  setInterval(actionInitiation, actionTimeInterval);

  function stopMovement(agent){

    switch(agent){
      case 1:
        dx1 = 0; dy1 = 0;
        previousState[0] = movementState[0];
        break;
      case 2:
        dx2 = 0; dy2 = 0;
        previousState[1] = movementState[1];
        break;
      case 3:
        dx3 = 0; dy3 = 0;
        previousState[2] = movementState[2];
        break;
      case 4:
        dx4 = 0; dy4 = 0;
        previousState[3] = movementState[3];
        break;
      default:
        dx1 = 0; dy1 = 0;
        dx2 = 0; dy2 = 0;
        dx3 = 0; dy3 = 0;
        dx4 = 0; dy4 = 0;
        previousState = movementState;
    }
  }

  function disengage() {

    if (performance.now() - disengTime > 3000 && withdrew > 0){

      disengTime = performance.now();
      stackSummaryLine(); // save summary
      audioRegenerate.play();

      // summary updates
      avgMood = 0;
      varMood = 0;
      nMoods = 1;
      nMoves = 0;

      // mood reset
      moods = [0.05,0.05,0.05,0.05];

      // flags updates
      selected = 0;
      action = 0;
      withdrew = 0;
      movedFirstTime = false;
      moodUnlocked = false;

      resetAgents();
      setTimeout(function(){
        choiceAllowed = true;
      },choiceRefractTime);
    }
    if (gamePhase && performance.now() - disengTime < 3000 && performance.now() - taskStartTime > 5000)
      dMsg.innerHTML = "Catch your breath for " + (4 - (performance.now() - disengTime)/1000).toFixed(0) + " seconds.";
    else if (gamePhase && selected == 0)
      dMsg.innerHTML = "Choose from any of the <i>numbered</i> dancers.";
  }
  setInterval(disengage, 10);

  function resetAgents(){
    movementState = [0,0,0,0];
    previousState = [0,0,0,0];
    oscillFactor = [1,1,1,1];
  }

  function baselineDynamics(){

      if(selected != 1){
        // crashed[0] = false;
        startTimeAgent[0] = performance.now();
        dx1 = (Math.cos(performance.now()/idlePeriod)*Math.random()*30 - 2*Math.sin(performance.now()/idlePeriod))*idleSpeed;
        dy1 = (Math.sin(performance.now()/idlePeriod)*Math.random()*30 + 2*Math.sin(performance.now()/idlePeriod))*idleSpeed;
      }

      if(selected != 2){
        // crashed[1] = false;
        startTimeAgent[1] = performance.now();
        dx2 = (Math.cos(performance.now()/idlePeriod)*Math.random()*30 + 2*Math.sin(performance.now()/idlePeriod))*idleSpeed;
        dy2 = (Math.sin(performance.now()/idlePeriod)*Math.random()*30 + 2*Math.sin(performance.now()/idlePeriod))*idleSpeed;
      }

      if(selected != 3){
        // crashed[2] = false;
        startTimeAgent[2] = performance.now();
        dx3 = (Math.sin(performance.now()/idlePeriod)*Math.random()*30 + 2*Math.sin(performance.now()/idlePeriod))*idleSpeed;
        dy3 = (Math.sin(performance.now()/idlePeriod)*Math.random()*30 - 2*Math.sin(performance.now()/idlePeriod))*idleSpeed;
      }

      if(selected != 4){
        // crashed[3] = false;
        startTimeAgent[3] = performance.now();
        dx4 = (Math.cos(performance.now()/idlePeriod)*Math.random()*30 - 2*Math.sin(performance.now()/idlePeriod))*idleSpeed;
        dy4 = (Math.cos(performance.now()/idlePeriod)*Math.random()*30 - 2*Math.sin(performance.now()/idlePeriod))*idleSpeed;
      }
  }

  setInterval(baselineDynamics, sliceTime);

  /**** ~~~~ Interaction handling ****/

  document.addEventListener("mousedown", mouseDownHandler, false);
  document.addEventListener("keydown", keyDownHandler, false);

  function mouseDownHandler(e) {

    if (practicePhase || gamePhase){

      audioPosSel.play();

      pos = getMousePos(e);

      //*** Subject ***
      x_selected = (pos.x > 0)?((pos.x < canvas_width)? pos.x:canvas_width):0;
      y_selected = (pos.y > 0)?((pos.y < canvas_height)? pos.y:canvas_height):0;

      subject_old_x = subject_x;
      subject_old_y = subject_y;

      subject_step_norm = Math.sqrt((x_selected - subject_old_x)*(x_selected - subject_old_x) + (y_selected - subject_old_y)*(y_selected - subject_old_y));
      subject_current_span = 0;

      subject_delta_x = (x_selected - subject_old_x)/n_slices;
      subject_delta_y = (y_selected - subject_old_y)/n_slices;

      clicked = 1; // this is for task data

      switch (selected){
        case 1:
          if (r1 < danceRadius)
            movedFirstTime = true;
          break;
        case 2:
          if (r2 < danceRadius)
            movedFirstTime = true;
          break;
        case 3:
          if (r3 < danceRadius)
            movedFirstTime = true;
          break;
        case 4:
          if (r4 < danceRadius)
            movedFirstTime = true;
          break;
      }

      if (selected == 0 || (sub_agt_distance >= danceRadius && !movedFirstTime)){
        action_initiated = true;
      }
    }
  }

  function moveSubject(){
    action_initiated = true;
  }

  // Plain directional presses
  function keyDownHandler(e) {

    if (gamePhase || practicePhase){ // only execute whatever is below if game has been initialized (username entered)

      // if space bar is pressed (and) subject is currently engaged (and) they spent the minimal time with current agent (and) they have not disengaged in the past 3s
      if (e.keyCode == 32 && gamePhase && selected > 0 && (performance.now() - selTime > minimalTime)  && ((performance.now() - disengTime) > choiceRefractTime || disengTime == 0))
        withdrew = 1;

      if (choiceAllowed){
        resetAgents();

        if (gamePhase && e.keyCode >= 49 && e.keyCode <= 52){
          audioEngage.play();
          selTime = performance.now();
          switch (e.keyCode){
            case 49:
              if(!explored[0] || allExplored){
                dx1 = 0; dy1 = 0;
                choiceAllowed = false;
                selected = 1;
                explored[0] = true;
              }
              break;
            case 50:
              if(!explored[1] || allExplored){
                choiceAllowed = false;
                dx2 = 0; dy2 = 0;
                selected = 2;
                explored[1] = true;
              }
              break;
            case 51:
              if(!explored[2] || allExplored){
                choiceAllowed = false;
                dx3 = 0; dy3 = 0;
                selected = 3;
                explored[2] = true;
              }
              break;
            case 52:
              if(!explored[3] || allExplored){
                choiceAllowed = false;
                dx4 = 0; dy4 = 0;
                selected = 4;
                explored[3] = true;
              }
              break;
            default:
            }
            if (explored.every(isAllTrue))
              allExplored = 1;
        }
        else if (practicePhase && e.keyCode == 49){
          audioEngage.play();

          selTime = performance.now();
          dx1 = 0; dy1 = 0;
          choiceAllowed = false;
          selected = 1;
          explored[0] = true;
        }
      }
    }
    else if (practicePhase || gamePhase && e.keyCode != 32)
      audioMoveNo.play();
  }

};

return plugin;

})();
