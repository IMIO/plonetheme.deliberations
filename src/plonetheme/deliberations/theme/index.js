import "./styles/theme.scss";
import Watermark from '@uiw/watermark.js';

const heightWidthRatio = 0.33;
const createWatermark = (el, width, height, repeat) => {
  const watermark = document.createElement('div');
  watermark.classList.add('watermark');
  const wSize = (height + width)
  watermark.style.height = wSize + "px";
  watermark.style.width = wSize + "px";
  watermark.style.left = ((-wSize / 2) + width / 2) + "px";
  watermark.style.top = ((-wSize / 2) + height / 2) + "px";
  watermark.dataset.text = (el.dataset.watermark + ' – ').repeat(repeat);
  el.appendChild(watermark);
}

const autoWatermark = (el) => {
  const lengthMultiplier = Math.round(el.dataset.watermark.length);
  const repeat = Math.round(el.offsetHeight * heightWidthRatio * lengthMultiplier)
  if (el.dataset.watermark) {
    createWatermark(el, el.offsetWidth, el.offsetHeight, repeat);
  }
}
document.addEventListener("DOMContentLoaded", function (event) {
  document.querySelectorAll('.watermarked').forEach(function (el) {
    autoWatermark(el);
  });
});

document.addEventListener("ItemsLayoutChanged", function (event) {
  document.querySelectorAll('.watermarked').forEach(function (el) {
    autoWatermark(el);
  });
});


$(Faceted.Events).bind(Faceted.Events.AJAX_QUERY_SUCCESS, function () {
  setTimeout(() => {
    document.querySelectorAll('.watermarked').forEach(function (el) {
      autoWatermark(el);
    });
  }, 500);
});



if (module.hot) {
  module.hot.accept();
}
