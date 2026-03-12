let audioContext = null;
let masterGain = null;
let randomCount = null;
let chosenGuess = null;
let isPlaying = false;

const MIN_FREQ = 20;
const MAX_FREQ = 20000;

const freq = document.getElementById("freq");
const volume = document.getElementById("volume");
const beepDuration = document.getElementById("beepDuration");
const gapDuration = document.getElementById("gapDuration");

const freqValue = document.getElementById("freqValue");
const volumeValue = document.getElementById("volumeValue");
const beepDurationValue = document.getElementById("beepDurationValue");
const gapDurationValue = document.getElementById("gapDurationValue");

const initAudioBtn = document.getElementById("initAudioBtn");
const testToneBtn = document.getElementById("testToneBtn");
const playRandomBtn = document.getElementById("playRandomBtn");
const revealAnswerBtn = document.getElementById("revealAnswerBtn");
const resetBtn = document.getElementById("resetBtn");

const presetButtons = document.querySelectorAll(".preset-btn");
const stepButtons = document.querySelectorAll(".step-btn");
const guessButtons = document.querySelectorAll(".guess-btn");

const audioStatus = document.getElementById("audioStatus");
const lastAction = document.getElementById("lastAction");
const selectedGuess = document.getElementById("selectedGuess");
const actualAnswer = document.getElementById("actualAnswer");
const resultText = document.getElementById("resultText");

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function updateDisplayValues() {
  freqValue.textContent = Number(freq.value).toLocaleString();
  volumeValue.textContent = volume.value;
  beepDurationValue.textContent = beepDuration.value;
  gapDurationValue.textContent = gapDuration.value;
}

function setStatus(text) {
  lastAction.textContent = text;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function initAudio() {
  try {
    if (!audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioContextClass();

      masterGain = audioContext.createGain();
      masterGain.gain.value = Number(volume.value) / 100;
      masterGain.connect(audioContext.destination);
    }

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    updateMasterVolume();
    audioStatus.textContent = "준비 완료";
    setStatus("오디오 준비 완료");
  } catch (error) {
    audioStatus.textContent = "실패";
    setStatus("오디오 준비 실패: " + error.message);
  }
}

function updateMasterVolume() {
  if (!masterGain) return;
  masterGain.gain.value = Math.max(0.001, Number(volume.value) / 100);
}

function clearGuessStyles() {
  guessButtons.forEach(button => {
    button.classList.remove("selected", "correct", "wrong");
  });
}

function resetResultView() {
  chosenGuess = null;
  selectedGuess.textContent = "없음";
  actualAnswer.textContent = "숨김";
  resultText.textContent = "아직 없음";
  clearGuessStyles();
}

function setFrequencyValue(newFreq) {
  const safeFreq = clamp(Math.round(newFreq), MIN_FREQ, MAX_FREQ);
  freq.value = safeFreq;
  updateDisplayValues();
  return safeFreq;
}

function changeFrequencyBy(step) {
  const current = Number(freq.value);
  const updated = setFrequencyValue(current + step);
  const sign = step > 0 ? "+" : "";
  setStatus(`주파수 조정: ${sign}${step}Hz → ${updated.toLocaleString()}Hz`);
}

async function playBeep(frequency, durationMs, peak = 0.95, type = "sine") {
  if (!audioContext || !masterGain) {
    throw new Error("오디오가 준비되지 않았습니다.");
  }

  return new Promise(resolve => {
    const osc = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    const now = audioContext.currentTime;
    const durationSec = durationMs / 1000;
    const fadeIn = 0.01;
    const fadeOut = 0.03;

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), now + fadeIn);

    const sustainEnd = Math.max(now + fadeIn + 0.01, now + durationSec - fadeOut);
    gainNode.gain.setValueAtTime(Math.max(0.0002, peak), sustainEnd);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc.connect(gainNode);
    gainNode.connect(masterGain);

    osc.start(now);
    osc.stop(now + durationSec + 0.02);
    osc.onended = resolve;
  });
}

async function playCorrectSound() {
  await initAudio();
  await playBeep(1046, 180, 0.7, "sine");
  await sleep(60);
  await playBeep(1318, 180, 0.7, "sine");
  await sleep(60);
  await playBeep(1567, 260, 0.75, "sine");
}

async function playWrongSound() {
  await initAudio();
  await playBeep(220, 220, 0.7, "square");
  await sleep(70);
  await playBeep(180, 280, 0.7, "square");
}

async function playTestTone() {
  await initAudio();

  try {
    setStatus("1kHz 테스트음 재생");
    await playBeep(1000, 500, 0.85, "sine");
    setStatus("1kHz 테스트음 재생 완료");
  } catch (error) {
    setStatus("테스트음 재생 실패: " + error.message);
  }
}

async function playRandomSequence() {
  if (isPlaying) {
    setStatus("이미 재생 중입니다");
    return;
  }

  await initAudio();

  if (!audioContext || !masterGain) {
    setStatus("오디오 준비가 필요합니다");
    return;
  }

  isPlaying = true;
  playRandomBtn.disabled = true;

  try {
    resetResultView();

    const currentFreq = Number(freq.value);
    const currentBeepDuration = Number(beepDuration.value);
    const currentGapDuration = Number(gapDuration.value);

    randomCount = Math.floor(Math.random() * 5) + 1;
    setStatus(currentFreq + "Hz 비프 " + randomCount + "회 재생 시작");

    for (let i = 0; i < randomCount; i++) {
      await playBeep(currentFreq, currentBeepDuration, 0.95, "sine");
      if (i < randomCount - 1) {
        await sleep(currentGapDuration);
      }
    }

    setStatus(currentFreq + "Hz 비프 " + randomCount + "회 재생 완료");
  } catch (error) {
    setStatus("재생 실패: " + error.message);
  } finally {
    isPlaying = false;
    playRandomBtn.disabled = false;
  }
}

function chooseGuess(value) {
  chosenGuess = Number(value);
  selectedGuess.textContent = chosenGuess + "회";

  guessButtons.forEach(button => {
    const buttonValue = Number(button.dataset.guess);
    button.classList.toggle("selected", buttonValue === chosenGuess);
    button.classList.remove("correct", "wrong");
  });

  setStatus("사용자 답 선택: " + chosenGuess + "회");
}

async function revealAnswer() {
  if (randomCount === null) {
    setStatus("먼저 랜덤 비프를 재생하세요");
    return;
  }

  actualAnswer.textContent = randomCount + "회";

  guessButtons.forEach(button => {
    const buttonValue = Number(button.dataset.guess);
    button.classList.remove("correct", "wrong");

    if (buttonValue === randomCount) {
      button.classList.add("correct");
    }

    if (chosenGuess !== null && buttonValue === chosenGuess && chosenGuess !== randomCount) {
      button.classList.add("wrong");
    }
  });

  if (chosenGuess === null) {
    resultText.textContent = "답을 선택하지 않음";
    setStatus("정답 공개");
    return;
  }

  if (chosenGuess === randomCount) {
    resultText.textContent = "정답";
    setStatus("정답 공개: 정답");
    try {
      await playCorrectSound();
    } catch (error) {
      setStatus("정답 공개: 정답, 효과음 재생 실패");
    }
  } else {
    resultText.textContent = "오답";
    setStatus("정답 공개: 오답");
    try {
      await playWrongSound();
    } catch (error) {
      setStatus("정답 공개: 오답, 효과음 재생 실패");
    }
  }
}

function resetAll() {
  randomCount = null;
  resetResultView();
  setStatus("초기화 완료");
}

freq.addEventListener("input", updateDisplayValues);

volume.addEventListener("input", () => {
  updateDisplayValues();
  updateMasterVolume();
});

beepDuration.addEventListener("input", updateDisplayValues);
gapDuration.addEventListener("input", updateDisplayValues);

presetButtons.forEach(button => {
  button.addEventListener("click", () => {
    const value = Number(button.dataset.freq);
    setFrequencyValue(value);
    setStatus("프리셋 선택: " + value.toLocaleString() + "Hz");
  });
});

stepButtons.forEach(button => {
  button.addEventListener("click", () => {
    const step = Number(button.dataset.step);
    changeFrequencyBy(step);
  });
});

guessButtons.forEach(button => {
  button.addEventListener("click", () => {
    chooseGuess(button.dataset.guess);
  });
});

initAudioBtn.addEventListener("click", initAudio);
testToneBtn.addEventListener("click", playTestTone);
playRandomBtn.addEventListener("click", playRandomSequence);
revealAnswerBtn.addEventListener("click", revealAnswer);
resetBtn.addEventListener("click", resetAll);

updateDisplayValues();
setStatus("대기 중");