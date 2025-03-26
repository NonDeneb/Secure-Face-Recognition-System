/**
 * 数据查看页面脚本
 * 基于全同态加密的安全人脸识别系统
 */

'use strict';

$(document).ready(function () {
  // 绑定原始数据获取事件
  $("#get-data").on('click', function () {
    if (Cookie.get('user_id') != undefined) {
      $("#get-data").prop('disabled', true);
      $("#loading-1").show();
      layer.msg('正在获取数据...', {icon: 16, time: 0});
      getOriginData();
    } else {
      layer.msg('请先完成面部数据录入', {icon: 2});
    }
  });
  
  // 绑定加密数据获取事件
  $("#get-en-data").on('click', function () {
    if (Cookie.get('user_id') != undefined) {
      $("#get-en-data").prop('disabled', true);
      $("#loading-2").show();
      layer.msg('正在获取数据...', {icon: 16, time: 0});
      getEncryptData();
    } else {
      layer.msg('请先完成面部数据录入', {icon: 2});
    }
  });
});

/**
 * 获取原始人脸数据
 */
function getOriginData() {
  const csrfToken = $('meta[name=csrf-token]').attr('content');
  
  $.ajax({
    type: 'POST',
    url: '/origin_data',
    dataType: 'json',
    headers: {
      'X-CSRFToken': csrfToken
    },
    success: function (data) {
      layer.closeAll();
      
      if (data.code == 1) {
        // 显示数据
        $("#loading-1").hide();
        $("#tips-1").fadeIn();
        
        // 预览数据
        const list = data.data;
        roundListData("#prData", list, 6);
        
        // 完整数据
        $("#click-data").fadeIn();
        const fullData = JSON.stringify(list, null, 2);
        $("#faceData .data-full-content").text(fullData);
        
        layer.msg('数据获取成功', {icon: 1});
      } else {
        $("#loading-1").hide();
        $("#get-data").prop('disabled', false);
        layer.msg(data.msg || '获取数据失败', {icon: 2});
      }
    },
    error: function () {
      layer.closeAll();
      $("#loading-1").hide();
      $("#get-data").prop('disabled', false);
      layer.msg('服务器错误，请重试', {icon: 2});
    }
  });
}

/**
 * 获取加密人脸数据
 */
function getEncryptData() {
  const csrfToken = $('meta[name=csrf-token]').attr('content');
  
  $.ajax({
    type: 'POST',
    url: '/encrypt_data',
    dataType: 'json',
    headers: {
      'X-CSRFToken': csrfToken
    },
    success: function (data) {
      layer.closeAll();
      
      if (data.code == 1) {
        // 显示数据
        $("#loading-2").hide();
        $("#tips-2").fadeIn();
        
        // 预览数据
        $("#prEnData").text(data.data.substring(0, 125) + ' ...').fadeIn();
        
        // 完整数据
        $("#click-en-data").fadeIn();
        $("#enData").text(data.data);
        
        layer.msg('数据获取成功', {icon: 1});
      } else {
        $("#loading-2").hide();
        $("#get-en-data").prop('disabled', false);
        layer.msg(data.msg || '获取数据失败', {icon: 2});
      }
    },
    error: function () {
      layer.closeAll();
      $("#loading-2").hide();
      $("#get-en-data").prop('disabled', false);
      layer.msg('服务器错误，请重试', {icon: 2});
    }
  });
}

/**
 * 格式化列表数据显示
 */
function roundListData(id, list, length) {
  let htmlStr = '[ ';
  for (let i = 0; i < Math.min(length, list.length); i++) {
    htmlStr += list[i];
    htmlStr += ', ';
  }
  htmlStr += ' ... ]';
  $(id).html(htmlStr);
} 