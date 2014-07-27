





function setFullScreenMode(width) {
       document.body.style.width = width + 'px';
       //为了防止取不到clientWidth，这里补充一个默认值
       var clientWidth = document.documentElement.clientWidth ? document.documentElement.clientWidth : 320;
       var scale = clientWidth / width;
           //缩放页面，这里一般是放大页面
       document.body.style['-webkit-transform'] = 'scale(' + scale + ',' + scale + ')';
       document.body.style['-webkit-transform-origin'] = '0px 0px';
           //缩回放大高度，避免出现一些兼容性问题
       var height = document.body.clientHeight / scale;
       document.body.style.height = height + 'px';
  }

setFullScreenMode(320);
