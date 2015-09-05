Date.format = function(d, mask){
    var zeroize = function (value, length) {
        if (!length) length = 2;
        value = String(value);
        for (var i = 0, zeros = ''; i < (length - value.length); i++) {
            zeros += '0';
        }
        return zeros + value;
    };
    return mask.replace(/"[^"]*"|'[^']*'|\b(?:d{1,4}|m{1,4}|yy(?:yy)?|([hHMstT])\1?|[lLZ])\b/g, function($0) {
        switch($0) {
            case 'd':   return d.getDate();
            case 'dd':  return zeroize(d.getDate());
            case 'ddd': return ['Sun','Mon','Tue','Wed','Thr','Fri','Sat'][d.getDay()];
            case 'dddd':return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()];
            case 'M':   return d.getMonth() + 1;
            case 'MM':  return zeroize(d.getMonth() + 1);
            case 'MMM': return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()];
            case 'MMMM':return ['January','February','March','April','May','June','July','August','September','October','November','December'][d.getMonth()];
            case 'yy':  return String(d.getFullYear()).substr(2);
            case 'yyyy':return d.getFullYear();
            case 'h':   return d.getHours() % 12 || 12;
            case 'hh':  return zeroize(d.getHours() % 12 || 12);
            case 'H':   return d.getHours();
            case 'HH':  return zeroize(d.getHours());
            case 'm':   return d.getMinutes();
            case 'mm':  return zeroize(d.getMinutes());
            case 's':   return d.getSeconds();
            case 'ss':  return zeroize(d.getSeconds());
            case 'l':   return zeroize(d.getMilliseconds(), 3);
            case 'L':   var m = d.getMilliseconds();
                    if (m > 99) m = Math.round(m / 10);
                    return zeroize(m);
            case 'tt':  return d.getHours() < 12 ? 'am' : 'pm';
            case 'TT':  return d.getHours() < 12 ? 'AM' : 'PM';
            case 'Z':   return d.toUTCString().match(/[A-Z]+$/);
            // Return quoted strings with the surrounding quotes removed
            default:    return $0.substr(1, $0.length - 2);
        }
    });
};
Date.prototype.format = function(mask) {
    return Date.format(this, mask);
};
Date.parseFormat = function(str, format){
    var pattern = format.replace(/(yyyy)/g, "([0-9]{4})")
    .replace(/(yy)|(MM)|(dd)|(hh)|(mm)|(ss)/g, "([0-9]{2})")
    .replace(/[Mdhms]/g, "([0-9]{1,2})");
    var getIndex = function(expr1, expr2) {
        var index = format.indexOf(expr1);
        if (index == -1) index = format.indexOf(expr2);
        return index;
    }
    var returnDate;
    if (new RegExp(pattern).test(str)) {
        var yPos = getIndex("yyyy", "yy");
        var mPos = getIndex("MM", "M");
        var dPos = getIndex("dd", "d");
        var hPos = getIndex("hh", "h");
        var miPos = getIndex("mm", "m");
        var sPos = getIndex("ss", "s");
        var data = {y: 0,m: 0,d: 0,h: 0,mi: 0,s: 0};
        var pos = [yPos + ",y", mPos + ",m", dPos + ",d", hPos + ",h", miPos + ",mi", sPos + ",s"].sort(function(a, b) {
            a = parseInt(a.split(',')[0]);
            b = parseInt(b.split(',')[0]);
            return a > b;
        });
        var tmpIndex = 0;
        var newPos = [];
        for (var i = 0, l = pos.length; i < l; i++) {
            if (parseInt(pos[i].split(',')[0]) != -1) {
                newPos[tmpIndex] = pos[i];
                tmpIndex++;
            }
        }
        var m = str.match(pattern);
        for (var i = 1, l = m.length; i < l; i++) {
            if (i == 0) break;
            var flag = newPos[i - 1].split(',')[1];
            data[flag] = m[i];
        };
        data.y = data.y || today.getFullYear();
        data.d = data.d || today.getDate();
        if (data.y.toString().length == 2) data.y = parseInt('20' + data.y);
        data.m -= 1;
        returnDate = new Date(data.y, data.m, data.d, data.h, data.mi, data.s);
    }
    return returnDate;
};



// demo
var time1 = new Date("2012/01/01 00:00:00 UTC+800");
var str1 = time1.format("yyyy年MM月dd日 H时mm分ss秒 TT")
console.log("Date["+time1+"]");
console.log("格式化结果为：" + str1);

var str2 = "2012年1月23日";
var time2 = Date.parseFormat(str2, "yyyy年M月dd日");
console.log("时间字符串："+str2);
console.log("格式化结果: Date["+time2+"]");