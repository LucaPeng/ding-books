/**
 * Created by liqiao on 8/10/15.
 */
var getMethod = function(method, ns) {
    var arr = method.split('.');
    var namespace = ns || dd;
    for (var i = 0, k = arr.length; i < k; i++) {
        if (i === k - 1) {
            return namespace[arr[i]];
        }
        if (typeof namespace[arr[i]] == 'undefined') {
            namespace[arr[i]] = {};
        }
        namespace = namespace[arr[i]];
    }
};

logger.i('Here we go...');

logger.i(location.href);

/**
 * _config comes from server-side template. see views/index.jade
 */
dd.config({
    agentId: _config.agentId,
    corpId: _config.corpId,
    timeStamp: _config.timeStamp,
    nonceStr: _config.nonceStr,
    signature: _config.signature,
    jsApiList: [
        'runtime.info',
        'device.notification.prompt',
        'biz.chat.pickConversation',
        'device.notification.confirm',
        'device.notification.alert',
        'device.notification.prompt',
        'biz.chat.open',
        'biz.util.open',
        'biz.user.get',
        'biz.contact.choose',
        'biz.telephone.call',
        'biz.util.uploadImage',
	'biz.util.qrcode',
	'biz.util.barcode',
        'biz.ding.post']
});
dd.userid=0;
dd.ready(function() {
    logger.i('dd.ready rocks!');

    dd.runtime.info({
        onSuccess: function(info) {
            logger.i('runtime info: ' + JSON.stringify(info));
        },
        onFail: function(err) {
            logger.e('fail: ' + JSON.stringify(err));
        }
    });

    dd.runtime.permission.requestAuthCode({
        corpId: _config.corpId, //企业id
        onSuccess: function (info) {
            logger.i('authcode: ' + info.code);
            $.ajax({
                url: '/openapi/sendMsg.php',
                type:"POST",
                data: {"event":"get_userinfo","code":info.code,"corpId":_config.corpId},
                dataType:'json',
                timeout: 900,
                success: function (data, status, xhr) {
					logger.i('data: ' + data);
                    var info = JSON.parse(data);
                    if (info.errcode === 0) {
                        logger.i('user id: ' + info.userid);
                        logger.i('user name: ' + info.name);
                        dd.userid = info.userid;
						dd.username = info.name;
	
						$.ajax({
                                url: '/api/userUpdate',
                                type:"POST",
                                data: {"userId":dd.userid,"userName":dd.username,"corpId":_config.corpId},
                                dataType:'json',
                                timeout: 900,
                                success: function (data, status, xhr) {
                                        logger.i('data: ' + data);
                                    var user = JSON.parse(data);
                                        logger.i('datasss: ' + user);
                                    if(user.errcode === 0) {
                                        dd.username = user.name;
                                    }

                                },
                                error: function (xhr, errorType, error) {
                                        logger.i('data: ' + data);
                                    logger.e(errorType + ', ' + error);
                                }
                        });
                    }
                    else {
                        logger.e('auth error: ' + data);
                    }
                },
                error: function (xhr, errorType, error) {
                    logger.e(errorType + ', ' + error);
                }
            });
        },
        onFail: function (err) {
            logger.e('requestAuthCode fail: ' + JSON.stringify(err));
        }
    });

    $('.chooseonebtn').on('click', function() {

        dd.biz.chat.pickConversation({
            corpId: _config.corpId, //企业id
            isConfirm:'false', //是否弹出确认窗口，默认为true
            onSuccess: function (data) {
                var chatinfo = data;
                if(chatinfo){
                console.log(chatinfo.cid);
                    dd.device.notification.prompt({
                        message: "发送消息",
                        title: chatinfo.title,
                        buttonLabels: ['发送', '取消'],
                        onSuccess : function(result) {
                            var text = result.value;
                            if(text==''){
                                return false;
                            }

                            $.ajax({
                                url: '/openapi/sendMsg.php',
                                type:"POST",
                                data: {"event":"send_to_conversation","cid":chatinfo.cid,"sender":dd.userid,"content":text,"corpId":_config.corpId},
                                dataType:'json',
                                timeout: 900,
                                success: function (data, status, xhr) {
                                    var info = data;
                                    logger.i('sendMsg: ' + JSON.stringify(data));
                                    if(info.errcode==0){
                                        logger.i('sendMsg: 发送成功');
                                        /**
                                         * 跳转到对话界面
                                         */
                                        dd.biz.chat.open({
                                            cid:chatinfo.cid,
                                            onSuccess : function(result) {
                                            },
                                            onFail : function(err) {}
                                        });
                                    }else{
                                        logger.e('sendMsg: 发送失败'+info.errmsg);
                                    }
                                },
                                error: function (xhr, errorType, error) {
                                    logger.e(errorType + ', ' + error);
                                }
                            });
                        },
                        onFail : function(err) {}
                    });
                }
            },
            onFail: function (err) {
            }
        });
    });

    $('.phonecall').on('click', function() {
        dd.biz.contact.choose({
            startWithDepartmentId: 0, //-1表示打开的通讯录从自己所在部门开始展示, 0表示从企业最上层开始，(其他数字表示从该部门开始:暂时不支持)
            multiple: false, //是否多选： true多选 false单选； 默认true
            users: [], //默认选中的用户列表，userid；成功回调中应包含该信息
            corpId: _config.corpId, //企业id
            max: 10, //人数限制，当multiple为true才生效，可选范围1-1500
            onSuccess: function(data) {
                if(data&&data.length>0){
                    var selectUserId = data[0].emplId;
                    if(selectUserId>0){
                        dd.biz.telephone.call({
                            users: [selectUserId], //用户列表，工号
                            corpId: _config.corpId, //企业id
                            onSuccess : function(info) {
                                logger.i('biz.telephone.call: info' + JSON.stringify(info));

                            },
                            onFail : function(err) {
                                logger.e('biz.telephone.call: error' + JSON.stringify(err));
                            }
                        })
                    }else{
                        return false;
                    }
                }else{
                    return false;
                }
        },
        onFail : function(err) {}
    });
    });

	$('.J_method_btn').on('click', function() {
        var $this = $(this);
        var method = $this.data('method');
        var action = $this.data('action');
        var param = $this.data('param') || {};
        if (typeof param === 'string') {
            param = JSON.parse(param);
        }    
		if (param.corpId) {
            param.corpId = _config.corpId;
            if (param.id) {
                param.id = _config.users[0];
            }
            if (param.users) {
                param.users = _config.users;
            }
        }
        if (param.params && param.params.corpId) {
            param.params.corpId = _config.corpId;
            if (param.params.id) {
                param.params.id = _config.users[0];
            }
            if (param.params.users) {
                param.params.users = _config.users;
            }
        }
		param.onSuccess = function(result) {
            if (action === 'alert') {
                dd.device.notification.alert({
                    title: method,
                    message: '传参：' + JSON.stringify(param, null, 4) + '\n' + '响应：' + JSON.stringify(result, null, 4)
                });
            } else if(action === 'share'){
				info = JSON.stringify(result);
				$.ajax({
					url: '/api/spaceShare',
					type:"POST",
					data: {"event":"space_share","userId":dd.userid,"corpId":_config.corpId,"info":info},
					dataType:'json',
					timeout: 900,
					success: function (data, status, xhr) {
						logger.i('data: ' + data);
						var info = JSON.parse(data);
						if(info.errcode === 0) {
							logger.i('book_id: ' + info.book_id);
							logger.i('item_id: ' + info.item_id);
							window.location.href = "http://120.26.118.14/index.php/share/detail/" + info.item_id;
						}
						
					},
					error: function (xhr, errorType, error) {
						logger.e(errorType + ', ' + error);
					}
				});
			}
        };
        param.onFail = function(result) {
            console.log(method, '调用失败，fail', result)
        };
        getMethod(method)(param);
    });
});

dd.error(function(err) {
    logger.e('dd error: ' + JSON.stringify(err));
});
