const context = new AudioContext();
const audioElement = document.querySelector("audio");
const audioSource = context.createMediaElementSource(audioElement);
const gainNode = context.createGain();
const eqNode = context.createBiquadFilter();

audioSource.connect(gainNode);
gainNode.connect(eqNode);
eqNode.connect(context.destination);

gainNode.gain.setValueAtTime(1, 0);
eqNode.Q.setValueAtTime(EQ_Q, 0);
eqNode.gain.setValueAtTime(0, 0);
eqNode.type = "peaking";



const eqPanel = document.querySelector(".eq-panel");
const freqSelect = document.querySelector(".freq-select");
const freqReadout = document.querySelector(".freq-readout");
const freqSelectAreas = document.querySelectorAll(".freq-select-area");

eqPanel.addEventListener("mousemove", function (e) {
    if (eqPanel.dataset.state != "guessing") return;

    var rect = eqPanel.getBoundingClientRect()
    var pos = (e.clientX - rect.left) / rect.width;

    if (pos < 0 || pos > 1) return;

    freqSelect.style.left = (e.clientX - rect.left) + "px";

    var freq = Math.floor(55.5621 * Math.pow(414.6218, pos));
    freqSelect.dataset.frequency = freq;
    freqReadout.innerHTML = freq > 999 ? Math.floor(freq / 1000) + "," + String(freq).substring(freq > 9999 ? 2 : 1) : freq;
});



const freqTarget = document.querySelector(".freq-target");
const freqTargetBar = document.querySelector(".freq-target>div")
const freqTargetReadout = document.querySelector(".freq-target-readout");

const scoreReadout = document.querySelector(".score-readout");
const levelReadout = document.querySelector(".level-readout");
const livesReadout = document.querySelector(".lives-readout");

eqPanel.addEventListener("click", function (e) {
    if (eqPanel.dataset.state == "guessing") {
        eqPanel.dataset.state = "result-mousedown";
        freqTarget.style.visibility = "visible";
        audioElement.pause();

        var octaveDifference = Math.abs(Math.log2(Number(freqTarget.dataset.frequency)/Number(freqSelect.dataset.frequency)))
        if (octaveDifference <= Number(freqSelect.dataset.octaves)) {
            freqTargetBar.style.backgroundColor = "rgb(0, 160, 0)";
            freqTargetReadout.style.color = "rgb(0, 255, 0)";

            var score = Math.round(Number(scoreReadout.dataset.score) + 100 - 90 * (octaveDifference / freqSelect.dataset.octaves));
            scoreReadout.dataset.score = score;
            scoreReadout.innerHTML = score > 999 ? Math.floor(score / 1000) + "," + String(score).substring(score > 9999 ? 2 : 1) : score;
           
            if (Number(levelReadout.dataset.level) % LEVELS_PER_LIFE_REGEN == 0 && Number(livesReadout.innerHTML) < MAX_LIVES) 
                livesReadout.innerHTML = Number(livesReadout.innerHTML) + 1;

            if (Number(levelReadout.dataset.level) % LEVELS_PER_OCTAVE_STEP == 0) 
                freqSelect.dataset.octaves = Number(freqSelect.dataset.octaves) - OCTAVE_STEP;
            if (Number(freqSelect.dataset.octaves) < MIN_OCTAVE_RANGE) freqSelect.dataset.octaves = MIN_OCTAVE_RANGE;

            levelReadout.dataset.level = Number(levelReadout.dataset.level) + 1;
        }

        else {
            freqTargetBar.style.backgroundColor = "rgb(160, 0, 0)";
            freqTargetReadout.style.color = "rgb(255, 0, 0)";

            livesReadout.innerHTML = Number(livesReadout.innerHTML) - 1;
            if (livesReadout.innerHTML == "0") {
                eqPanel.dataset.state = "gameover";
                overlay.style.display = "flex";
                levelReadout.dataset.level = 0;
            }
        }
    }
});



const body = document.querySelector("body");

body.addEventListener("mouseup", function (e) {
    if (eqPanel.dataset.state == "result-mousedown") {
        eqPanel.dataset.state = "result";
    }
});

body.addEventListener("click", function (e) {
    if (eqPanel.dataset.state == "result") {
        eqPanel.dataset.state = "guessing";
        newLevel();
    }
});



const overlay = document.querySelector(".overlay");

overlay.addEventListener("click", function (e) {
    overlay.innerHTML = "<p>Game over.</p><p>Click anywhere to restart.</p>"
    overlay.style.display = "none";
    eqPanel.dataset.state = "guessing";

    scoreReadout.dataset.score = 0;
    scoreReadout.innerHTML = 0;
    livesReadout.innerHTML = STARTING_LIVES;
    freqSelect.dataset.octaves = OCTAVE_RANGE;

    newLevel();
});



function newLevel() {
    freqTarget.style.visibility = "hidden";

    var newFreq = Math.floor(Math.pow(2, Math.random() * Math.log2(MAX_FREQ/MIN_FREQ) + Math.log2(MIN_FREQ)));
    eqNode.frequency.setValueAtTime(newFreq, 0);
    freqTarget.style.right = (55.75 - 11.5 * Math.log2(newFreq/800)) + "%";
    freqTarget.dataset.frequency = newFreq;

    if (newFreq > 999) newFreq = Math.floor(newFreq / 1000) + "," + String(newFreq).substring(newFreq > 9999 ? 2 : 1);
    freqTargetReadout.innerHTML = newFreq;

    freqSelectAreas.forEach((area) => { 
        area.style.width = (freqSelect.dataset.octaves * 10.5) + "svw"; 
        area.style.backgroundColor = "rgba(42, 35, 86, 0.5)";
    });

    levelReadout.innerHTML = levelReadout.dataset.level;

    audioElement.src = "music/" + SONGS[Math.floor(Math.random() * SONGS.length)] + ".ogg";
    context.resume();
    audioElement.play();
}



const eqButton = document.querySelector(".eq-button");

eqButton.addEventListener("click", function (e) {
    eqButton.dataset.state = eqButton.dataset.state == "off" ? "on" : "off";
    eqButton.innerHTML = "<p>EQ: " + (eqButton.dataset.state == "on" ? "ON" : "OFF") + "<\p>";
    eqNode.gain.setValueAtTime(eqButton.dataset.state == "on" ? EQ_GAIN : 0, 0);
});