// -*- coding: utf-8-unix; -*-
// Copyright (c) 2013 Tencent, Inc.
//     All rights reserved.
//
// Author: amadeusguo@tencent.com
//
/*jslint browser: true, regexp: true, nomen: true, sloppy: true, unparam: true, todo: true, indent: 4,
     plusplus: true */
/*global define, requirejs, require, window, navigator, document, importScripts, setTimeout, opera, console */
/*global _, $ */
define(function (require, exports, module) {
    var _ = require('underscore'),
        Backbone = require('backbone');
    var requestAnimationFrame = window.requestAnimationFrame
            || window.webkitRequestAnimationFrame
            || window.mozRequestAnimationFrame
            || window.oRequestAnimationFrame
            || window.msRequestAnimationFrame
            || function(callback) {
                return setTimeout(callback, 100)
            },
        cancelAnimationFrame = window.cancelRequestAnimationFrame
            || window.webkitCancelAnimationFrame
            || window.webkitCancelRequestAnimationFrame
            || window.mozCancelRequestAnimationFrame
            || window.oCancelRequestAnimationFrame
            || window.msCancelRequestAnimationFrame
            || clearTimeout,
    
    bind = function (func, context) {
        if (func.bind) {
            return func.bind(context);
        }
        return function () {
            func.apply(context, arguments);
        };
    },
    preventDefault = function (evt) {
        evt.stopPropagation();
        evt.preventDefault();
    };
    
    // enable = /iPhone|iPad|iPod/.test(navigator.platform);
    ///////////////// dragging /////////////////////
    var events;
    if ('ontouchstart' in  window) {
        events = ['touchstart', 'touchmove', 'touchend', 'touchcancel'];
    } else {
        events = ['mousedown', 'mousemove', 'mouseup'];
    }
    
    var Scroller = function (options) {
        // if (!enable) return;
        if (!options.$dom) throw 'need dom element';
        _.extend(this, Backbone.Events);
        this.$dom = options.$dom;
        this.enabled = true;
        this.snap = options.snap || 0;
        this.direction = options.direction || 'y';
        this.momentum = typeof options.momentum === 'boolean' ? options.momentum : true;
        this.overscroll = typeof options.overscroll === 'boolean' ? options.overscroll : true;
        this.maxScrollFunc = options.maxScrollFunc;
        this.position = options.position || 'fixed';
        this.scrollbar = options.scrollbar || false;
        this.makeScroller();
        this.reset();
        this.bindEvents();
        this.setMaxScroll();
    };
    Scroller.prototype = {
        makeScroller: function () {
            var $dom = this.$dom,
                $scroller = document.createElement('div');
            $dom.style.position = this.position;
            if (this.position == 'fixed') {
                $dom.style.width = '100%';
                $dom.style.height = '100%';
                $dom.style.top = '0';
                $dom.style.zIndex = '500';
            }
            // wrap in scroller
            $scroller.className = 'x-scroller';
            while ($dom.childNodes.length > 0) {
                $scroller.appendChild($dom.childNodes[0]);
            }
            $dom.appendChild($scroller);
            this.$scroller = $scroller;
            // make scrollbar
            // only support y scrollbar now
            if (this.scrollbar && this.direction == 'y') {
                var $scrollbar = this.$scrollbar = document.createElement('div');
                $scrollbar.className = 'x-scrollbar';
                $scrollbar.style.cssText = 'height: 100%; position: absolute; width: 2px; right: 1px; top: 4px;bottom:4px; z-index:100; -webkit-transition:opacity: 0; opacity:0;';
                $dom.appendChild($scrollbar);
                var $handle = this.$handle = document.createElement('div');
                $handle.className = 'x-handle';
                $handle.style.cssText = 'height: 200px; position: absolute; width: 2px; right: 1px; top: 4px;bottom:4px; border-radius:5px; background-color:rgba(100,100,100,0.5);';
                $scrollbar.appendChild($handle);
                this.on('sizeChange', bind(this.onSizeChange, this));
            }
        },
        reset: function () {
            this.isDragging = false;
            this.startY = 0;
            this.x = 0;
            this.y = 0;
            // for calc delta between ticks
            this.touchY = 0;
            // for momentum
            this.speedY = 0;
            this.time = 0;
            this.maxScrollY = 0;
            cancelAnimationFrame(this.slideTimer);
            this.slideTimer = null;
            // movement related
            this.fraction = 0.05;
            this.setScroll(this.y);
            // hide scrollbar initially
            this.hideScrollbar(0);
        },
        bindEvents: function () {
            for (var i = 0, len = events.length; i<len; i++) {
                this.$dom.addEventListener(events[i], this);
            }
            this.$dom.ondragstart = function() { return false; };
        },
        unbind: function () {
            for (var i = 0, len = events.length; i<len; i++) {
                this.$dom.removeEventListener(events[i], this);
            }
            this.$dom.ondragstart = null;
        },
        handleEvent: function (evt) {
            if (!this.enabled) return;
            switch (evt.type) {
                case 'mousedown':
                case 'touchstart':
                    this.onStart(evt);
                    break;
                case 'mousemove':
                case 'touchmove':
                    this.onMove(evt);
                    break;
                case 'mouseup':
                case 'touchend':
                case 'touchcancel':
                    this.onEnd(evt);
                    break;
            }
        },
        setMaxScroll: function () {
            var d, box, page;
            if (this.direction === 'x') {
                page = this.$scroller.scrollWidth;
                box = this.$dom.clientWidth;
            } else if (this.direction === 'y') {
                page = this.$scroller.scrollHeight;
                box = this.$dom.clientHeight;
            }
            d = page - box;
            if (typeof this.maxScrollFunc === 'function') {
                d = this.maxScrollFunc(d);
            }
            this.maxScrollY = d > 0 ? d : 0;
            // maxScroll修改了，还要改scrollbar的长度哦
            if (this.$scrollbar) {
                this.scrollRatio = page/box;
                this.$handle.style.height = box/this.scrollRatio + 'px';
            }
        },
        onStart: function (evt) {
            this.setMaxScroll();
            this.isDragging = true;
            var touch = evt.touches? evt.touches[0] : evt;
            if (this.direction === 'x') {
                this.touchY = touch.clientX;
            } else if (this.direction === 'y') {
                this.touchY = touch.clientY;
            }
            this.startY = this.y;
            this.speedY = 0;
            this.time = new Date().getTime();
            cancelAnimationFrame(this.slideTimer);
            // only cancel touchstart wont work, they cancel click event as well
            document.addEventListener('touchmove', preventDefault);
            this.showScrollbar();
        },
        showScrollbar: function () {
            if (this.$scrollbar) {
                this.$scrollbar.style.webkitTransition = 'opacity 1s';
                this.$scrollbar.style.opacity = 1;
            }
        },
        hideScrollbar: function (delay) {
            if (this.$scrollbar) {
                this.$scrollbar.style.webkitTransition = 'opacity 1s ease ' + delay + 's';
                this.$scrollbar.style.opacity = 0;
            }
        },
        onMove: function (evt) {
            if (!this.isDragging) return;
            var touch = evt.touches? evt.touches[0] : evt;
            var touchY;
            if (this.direction === 'x') {
                touchY = touch.clientX;
            } else if (this.direction === 'y') {
                touchY = touch.clientY;
            }
            var deltaY = this.touchY - touchY;
            var y = this.startY + deltaY;
            var oldY = this.y;
            if (!this.overscroll) {
                if (y < 0) {
                    y = 0;
                } else if (y > this.maxScrollY) {
                    y = this.maxScrollY;
                }
            }
            this.setScroll(y);
            // find speedY
            var time = new Date().getTime();
            var speedY = (time!=this.time) ? (this.y - oldY)/(time - this.time)*0.9:0;
            if (this.speedY > 1.5) this.speedY = 1.5; // set max speedY
            else if (this.speedY<-1.5) this.speedY = -1.5; // set max speedY
            this.speedY = speedY;
            this.time = time;
        },
        onEnd: function (evt) {
            this.isDragging = false;
            // get an initial speed
            /*
            if (this.y < 0) {
                this.speedY = -this.y/100;
            } else if (this.y > this.maxScrollY) {
                this.speedY = (this.y - this.maxScrollY)/100;
            }
            */
            if (this.snap) {
                var delta = this.y - this.startY;
                // choose snap target
                var i = Math.round(this.startY/this.snap);
                if (Math.abs(delta) > this.snap/5) {
                    if (delta > 0) {
                        i += 1;
                    } else {
                        i -= 1;
                    }
                }
                i = Math.max(i, 0);
                i = Math.min(i, Math.floor(this.maxScrollY/this.snap));
                this.snapTarget = i;
                this.scrollTo(this.snap * i);
            } else if (this.momentum) {
                if (this.y < 0 || this.y > this.maxScrollY) {
                    // scroll to boundry
                    this.scrollTo(this.y);
                } else {
                    // slide with momentum
                    this.slide = bind(this._slide, this);
                    this.slide();
                }
            }
            document.removeEventListener('touchmove', preventDefault);
        },
        onSizeChange: function () {
            this.setMaxScroll();
            this.setScroll(this.y);
        },
        enable: function () {
            this.enabled = true;
            return this;
        },
        disable: function () {
            this.enabled = false;
            return this;
        },
        scrollTo: function (y) {
            this.setMaxScroll();
            if (y < 0) {
                y = 0;
            } else if (y > this.maxScrollY) {
                y = this.maxScrollY;
            }
            this.dstY = y;
            this.time = new Date().getTime();
            this.slide = bind(this._scroll, this);
            this.slide();
            // this.setScroll(y);
        },
        _scroll: function () {
            // 非物理模型的减速效果
            var time = new Date().getTime();
            if (this.time != time) {
                var interval = time - this.time;
                this.time = time;
                var oldSpeed = this.speedY;
                if (this.y > this.dstY) {
                    this.speedY = -(this.y - this.dstY)/40;
                } else if (this.dstY > this.y) {
                    this.speedY = (this.dstY - this.y)/40;
                }
                // this.speedY = Math.min(this.speedY, 5);
                // this is ok as well
                // this.speedY = 0.2;
                // change scroll
                var y = this.y + this.speedY * interval;
                this.setScroll(y);
                // animation stopped
                if (oldSpeed * this.speedY < 0 || Math.round(this.speedY*300) == 0) {
                    this.stopped();
                    this.setScroll(this.dstY);
                    this.trigger('snap', this.snapTarget);
                    return;
                }
            } else {
                this.speedY = 0;
            }
            this.slideTimer = requestAnimationFrame(this.slide);
        },
        /////////////////// slide animation /////////////////////
        _slide: function () {
            // 基于物理模型的动画
            var time = new Date().getTime();
            var interval = time - this.time;
            this.time = time;
            var speedY = this.speedY;
            // apply spring deacceleration
            if (this.y < 0) {
                if (this.overscroll) {
                    speedY += -this.y/300;
                } else {
                    this.y = 0;
                    speedY = 0;
                }
            } else if (this.y > this.maxScrollY) {
                if (this.overscroll) {
                    speedY -= (this.y - this.maxScrollY)/300;
                } else {
                    this.y = this.maxScrollY;
                    speedY = 0;
                }
            }
            // apply friction
            if (speedY > 0 && speedY > this.fraction){
                speedY = speedY - this.fraction;
            }else if (speedY < 0 && -speedY > this.fraction){
                speedY = speedY + this.fraction;
            } else {
                speedY = 0;
            }
            // change scroll
            this.setScroll(this.y + speedY * interval);
            // animation stopped
            // friction slow the speed to zero
            if (speedY * this.speedY <= 0) {
                if (this.y < 0) {
                    this.scrollTo(0);
                } else if (this.y > this.maxScrollY){
                    this.scrollTo(this.maxScrollY);
                } else {
                    this.stopped();
                }
                return;
            }
            this.speedY = speedY;
            this.slideTimer = requestAnimationFrame(this.slide);
        },
        stopped: function () {
            this.speedY = 0;
            this.hideScrollbar(1.5);
        },
 
        setScroll: function (y) {
            if (y < 0){
                // y = 0;
                y = -Math.pow(-y, 0.85);
            }else if (y > this.maxScrollY){
                // y = this.maxScrollY;
                y = this.maxScrollY + Math.pow((y-this.maxScrollY), 0.85);
            }
            // this.$dom.scrollTop = y;
            if (this.direction === 'x') {
                this.$scroller.style.webkitTransform = 'translate3d(' + parseInt(-y) + 'px, 0px, 0px)';
            } else if (this.direction === 'y') {
                this.$scroller.style.webkitTransform = 'translate3d(0px, ' + parseInt(-y) + 'px, 0px)';
            }
            if (this.$scrollbar) {
                this.$handle.style.top = parseInt(y/this.scrollRatio) + 'px';
                // this.$handle.style.height = 
            }
            this.y = y;
            this.trigger('scroll', this.y);
        }
    };
    return {
        init: function (options) {
            return new Scroller(options);
        }
    };
});


// demo
//  xscroller.init({     $dom: document.getElementByI...