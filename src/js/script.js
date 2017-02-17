import Audio from './lib/Audio';
import $ from 'jquery';
import _ from 'lodash';

// デバイスごとにイベントを分ける
window.EVT = {};
let hasTapEvent = ('ontouchstart' in window);
if (hasTapEvent) {
    EVT.TOUCH_START = 'touchstart';
    EVT.TOUCH_MOVE = 'touchmove';
    EVT.TOUCH_END = 'touchend';
} else {
    EVT.TOUCH_START = 'mousedown';
    EVT.TOUCH_MOVE = 'mousemove';
    EVT.TOUCH_END = 'mouseup';
}

const audio = new Audio('./audio/8bit25.mp3');
let canSelect = false;
const $playBtn = $('.js-playBtn');
const $muteBtn = $('.js-mute');
const $simpleEqualizer = $('.js-simpleEqualizer');
const $equalizerList = $('.js-equalizerList');
const $circle = $('.js-targetCircle');
const e_size = $simpleEqualizer.width();

$(document).on('touchmove.noScroll', function(ev) { ev.preventDefault(); });

$playBtn.on(EVT.TOUCH_START, (ev) => {
    audio.start();
    $(ev.currentTarget).addClass('noSelect').text('Now playing♪');
})

$muteBtn.on('change', (ev) => {
    const $target = $(ev.currentTarget);
    if ($target.is(':checked')) {
        audio.setMute(true);
    } else {
        audio.setMute(false);
    }
});

$equalizerList.on('change', 'input', (ev) => {
    const $target = $(ev.currentTarget);
    audio.setFilterType($target.val());
    console.log($target.val(), 'filtertype')
})

audio.on('audio:ended', () => {
    $playBtn.text('END');
});


const controllHandler = (ev) => {
    if (canSelect) {
        let touchX, touchY;
        if (ev.offsetX) {
            touchX = ev.offsetX;
            touchY = ev.offsetY;
        } else {
            const touchObj = ev.originalEvent.changedTouches[0];
            touchX = touchObj.pageX - $simpleEqualizer.offset().left;
            touchY = touchObj.pageY - $simpleEqualizer.offset().top;
            if (touchX <= 0) touchX = 0;
            if (touchX >= e_size) touchX = e_size;
            if (touchY <= 0) touchY = 0;
            if (touchY >= e_size) touchY = e_size;
        }
        $circle.css({ 'left': touchX, 'top': touchY });
        audio.setFrequency(touchX / e_size);
        audio.setQuality(touchY / e_size);

    }
}

$simpleEqualizer.on(EVT.TOUCH_START, (ev) => {
    canSelect = true;
})

$simpleEqualizer.on(EVT.TOUCH_MOVE, _.throttle(controllHandler, 60));

$(document).on(EVT.TOUCH_END, (ev) => {
    canSelect = false;
})
