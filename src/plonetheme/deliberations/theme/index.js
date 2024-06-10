import "./styles/theme.scss";
import Watermark from '@uiw/watermark.js';

const heightWidthRatio = 0.33;


const applyWatermark = (el) => {
  const watermark = document.createElement('div');
  watermark.classList.add('watermark');
  const wSize = (el.clientHeight + el.clientWidth)
  watermark.style.height = wSize + "px";
  watermark.style.width = wSize + "px";
  watermark.style.left = ((-wSize / 2) + el.clientWidth / 2) + "px";
  watermark.style.top = ((-wSize / 2) + el.clientHeight / 2) + "px";
  const lengthMultiplier = Math.round(el.dataset.watermark.length);
  watermark.dataset.text = (el.dataset.watermark + ' – ').repeat(Math.round(el.clientHeight * heightWidthRatio * lengthMultiplier));
  el.appendChild(watermark);
}

document.addEventListener("DOMContentLoaded", function (event) {
  document.querySelectorAll('.watermarked').forEach(function (el) {
    if (el.dataset.watermark) {
      applyWatermark(el);
    }
  });
});

if (module.hot) {
  module.hot.accept();
}
