// Create a chart instance to display the audio data
const ctx = document.getElementById('audioVisualizer').getContext('2d');

const frequencyBands = [
  {start: 0, end: 30},
  {start: 30, end: 60},
  {start: 60, end: 120},
  {start: 120, end: 250},
  {start: 250, end: 500},
  {start: 500, end: 1000},
  {start: 1000, end: 2000},
  {start: 2000, end: 4000},
  {start: 4000, end: 8000},
  {start: 8000, end: 16000},
  {start: 16000, end: 25000}
];

const frequencyBandLabels = frequencyBands.map(band => `${band.start}-${band.end}Hz`);
const audioChart = new Chart(ctx, {
  type: 'bar',
  data: {
      labels: frequencyBandLabels, // use the frequency band labels here
      datasets: [{
          label: 'Amplitude',
          data: [], // initially empty, to be filled by the real-time audio data
          backgroundColor: 'rgba(0, 123, 255, 0.5)',
          borderColor: 'rgba(0, 123, 255, 1)',
          borderWidth: 1
      }]
  },
  options: {
      scales: {
          x: {
              title: {
                  display: true,
                  text: 'Frequency Bands'
              }
          },
          y: {
              beginAtZero: true,
              title: {
                  display: true,
                  text: 'Amplitude'
              },
              max: 150
          }
      }
  }
});

// Web Audio API for FFT
const audioContext = new AudioContext();
let analyser = audioContext.createAnalyser();
analyser.fftSize = 2048;
let bufferLength = analyser.frequencyBinCount;
let dataArray = new Uint8Array(bufferLength);
audioChart.update();




document.getElementById('startButton').addEventListener('click', function() {
  // Check if context is in suspended state (autoplay policy)
  if (audioContext.state === 'suspended') {
      audioContext.resume();
  }

  // Move getUserMedia call inside this click event handler
  navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then(stream => {
          const source = audioContext.createMediaStreamSource(stream);
          source.connect(analyser);

          // Function to update audio data and redraw chart
          const updateAudioData = () => {
            analyser.getByteFrequencyData(dataArray);
        
            // The array that will hold the average values for each frequency band
            const bandData = new Array(frequencyBands.length).fill(0);
        
            // The frequency bin size is equal to the sample rate divided by the FFT size
            const binSize = audioContext.sampleRate / analyser.fftSize;
        
            frequencyBands.forEach((band, index) => {
                // Determine the start and end bins for this frequency band
                const startBin = Math.floor(band.start / binSize);
                const endBin = Math.floor(band.end / binSize);
                let count = 0;
        
                for (let i = startBin; i <= endBin; i++) {
                    bandData[index] += dataArray[i];
                    count++;
                }
        
                // Calculate the average value for this band
                if (count > 0) {
                    bandData[index] /= count;
                }
            });
        
            // Update chart with new data
            audioChart.data.datasets[0].data = bandData;
            audioChart.update();
        
            requestAnimationFrame(updateAudioData);
        };        

          updateAudioData(); // Initial call to start the cycle
      })
      .catch(error => {
          console.error('Could not access microphone:', error);
      });
});
