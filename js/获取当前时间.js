jQuery.extend({
    //获取系统时间
    getSystemTime: function(){
        return new Date();
    },
    //异步获取服务器时间
    getServerTime_async: function(success){
        $.ajax({
            type: "HEAD",
            cache: false,
            complete: function(xhr){
                var str = xhr.getResponseHeader("Date");
                var now = null;
                if(str != null)
                    now = new Date(str);
                if($.isFunction(success))
                    success(now);
            }
        });
    },
    //同步获取服务器时间
    getServerTime: function(){
        var xhr = $.ajax({
            type: "HEAD",
            cache: false,
            async: false
        });
        var str = xhr.getResponseHeader("Date");
        if(str == null)
            return null;
        return new Date(str);
    }
});