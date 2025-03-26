/**
 * 面部录入
 * 基于混合同态加密的安全人脸识别系统
 */

'use strict';

$(document).ready(function() {
  // 初始化页面
  initApp();
  
  // 检查用户ID
  const userId = Cookie.get('user_id');
  if (!userId) {
    // 如果没有用户ID，重定向到首页
    window.location.href = '/';
    return;
  }
  
  // 获取CSRF令牌
  const csrfToken = $('meta[name=csrf-token]').attr('content');
  
  // 绑定选择方式事件
  $('#cameraMethod').on('click', function() {
    $(this).addClass('active');
    $('#uploadMethod').removeClass('active');
    showStep('camera');
  });
  
  $('#uploadMethod').on('click', function() {
    $(this).addClass('active');
    $('#cameraMethod').removeClass('active');
    showStep('upload');
  });
  
  // 摄像头相关事件
  $('#startCamera').on('click', function() {
    initCamera();
  });
  
  $('#backFromCamera').on('click', function() {
    stopCamera();
    showStep('select');
  });
  
  $('#snap').on('click', function() {
    takePhoto();
  });
  
  $('#confirmPhoto').on('click', function() {
    uploadPhotoFromCamera();
  });
  
  // 文件上传相关事件
  $('#customFileUpload').on('click', function() {
    document.getElementById('uploaderInput').click();
  });
  
  $('#uploaderInput').on('change', function(e) {
    handleFileSelect(e);
  });
  
  $('#removeFile').on('click', function() {
    resetFileUpload();
  });
  
  $('#backFromUpload').on('click', function() {
    resetFileUpload();
    showStep('select');
  });
  
  $('#upload').on('click', function() {
    uploadFile();
  });
  
  // 拖放文件功能
  const dropArea = document.getElementById('customFileUpload');
  
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
  });
  
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
  
  ['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false);
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false);
  });
  
  function highlight() {
    dropArea.classList.add('highlight');
  }
  
  function unhighlight() {
    dropArea.classList.remove('highlight');
  }
  
  dropArea.addEventListener('drop', handleDrop, false);
  
  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
      const fileInput = document.getElementById('uploaderInput');
      fileInput.files = files;
      $(fileInput).trigger('change');
    }
  }
});

/**
 * 初始化应用
 */
function initApp() {
  // 初始显示选择方式界面
  showStep('select');
}

/**
 * 显示指定步骤
 */
function showStep(step) {
  // 隐藏所有容器
  $('#methodSelect, #cameraContainer, #uploadContainer, #processingContainer, #resultContainer').hide();
  
  // 更新步骤指示器
  updateStepIndicator(step);
  
  // 显示对应步骤
  switch(step) {
    case 'select':
      $('#methodSelect').fadeIn();
      $('#step1').addClass('active');
      $('#step2, #step3').removeClass('active');
      break;
    case 'camera':
      $('#cameraContainer').fadeIn();
      $('#step1, #step2').addClass('active');
      $('#step3').removeClass('active');
      break;
    case 'upload':
      $('#uploadContainer').fadeIn();
      $('#step1, #step2').addClass('active');
      $('#step3').removeClass('active');
      break;
    case 'processing':
      $('#processingContainer').fadeIn();
      $('#step1, #step2, #step3').addClass('active');
      break;
    case 'result':
      $('#resultContainer').fadeIn();
      $('#step1, #step2, #step3').addClass('active');
      break;
  }
}

/**
 * 更新步骤指示器
 */
function updateStepIndicator(step) {
  const steps = {
    'select': 1,
    'camera': 2,
    'upload': 2,
    'processing': 3,
    'result': 3
  };
  
  $('.step').removeClass('active');
  
  for (let i = 1; i <= steps[step]; i++) {
    $(`#step${i}`).addClass('active');
  }
}

/**
 * 初始化摄像头
 */
function initCamera() {
  const video = document.getElementById('camera');
const constraints = {
  audio: false,
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: 'user'
    }
  };
  
  // 显示加载状态
  $('#startCamera').prop('disabled', true).html('<i class="fas fa-spinner fa-spin mr-1"></i>正在启动...');
  
  // 尝试获取摄像头权限
  navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
  window.stream = stream;
  video.srcObject = stream;
      
      // 当视频可以播放时，隐藏占位符，显示视频
      video.onloadedmetadata = function(e) {
        $('#cameraPlaceholder').hide();
        $(video).fadeIn();
        $('#snap').prop('disabled', false);
        $('#startCamera').hide();
      };
    })
    .catch(function(err) {
      console.error('摄像头访问错误:', err);
      layer.msg('无法访问摄像头，请检查设备权限设置', {icon: 2});
      $('#startCamera').prop('disabled', false).html('<i class="fas fa-power-off mr-1"></i>重试启动');
    });
}

/**
 * 停止摄像头
 */
function stopCamera() {
  if (window.stream) {
    window.stream.getTracks().forEach(function(track) {
      track.stop();
    });
  }
  
  // 重置界面
  $('#camera').hide();
  $('#cameraPlaceholder').show();
  $('#snap').prop('disabled', true);
  $('#startCamera').show().prop('disabled', false).html('<i class="fas fa-power-off mr-1"></i>启动摄像头');
}

/**
 * 拍照
 */
function takePhoto() {
  const video = document.getElementById('camera');
  const canvas = document.getElementById('photo');
  
  // 设置画布大小与视频一致
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  
  // 将视频帧绘制到画布
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
  
  // 获取图片数据并显示在模态框中
  const imgData = canvas.toDataURL('image/png');
  $('#modalImage').attr('src', imgData);
  
  // 显示确认模态框
  $('#photoModal').modal('show');
}

/**
 * 从摄像头上传照片
 */
function uploadPhotoFromCamera() {
  // 关闭模态框
  $('#photoModal').modal('hide');
  
  // 获取图片数据
  const canvas = document.getElementById('photo');
  const imgData = canvas.toDataURL('image/png');
  
  // 停止摄像头
  stopCamera();
  
  // 显示处理步骤
  showStep('processing');
  updateProcessingUI('正在处理面部图像', 20);
  
  // 发送数据到服务器
  const userId = Cookie.get('user_id');
  const csrfToken = $('meta[name=csrf-token]').attr('content');
  
      $.ajax({
        type: 'POST',
        url: '/img_upload',
        dataType: 'json',
        headers: {
      'X-CSRFToken': csrfToken
        },
        data: {
      image: imgData,
      user_id: userId
    },
    success: function(response) {
      handleUploadResponse(response);
    },
    error: function() {
      showError('服务器通信失败，请稍后重试');
    }
  });
}

/**
 * 处理文件选择
 */
function handleFileSelect(e) {
  const file = e.target.files[0];
  
  // 验证文件
  if (!file) return;
  
  // 检查文件类型
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (validTypes.indexOf(file.type) === -1) {
    layer.msg('请上传 JPG 或 PNG 格式的图片', {icon: 2});
    resetFileUpload();
    return;
  }
  
  // 检查文件大小
  if (file.size > 6 * 1024 * 1024) {
    layer.msg('文件大小不能超过 6MB', {icon: 2});
    resetFileUpload();
    return;
  }
  
  // 显示文件预览
  const reader = new FileReader();
  reader.onload = function(e) {
    $('#previewImage').attr('src', e.target.result);
    $('#fileName').text(file.name);
    $('#fileSize').text(formatFileSize(file.size));
    
    $('#customFileUpload').hide();
    $('#filePreview').fadeIn();
    $('#upload').prop('disabled', false);
  };
  reader.readAsDataURL(file);
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(1) + ' MB';
}

/**
 * 重置文件上传
 */
function resetFileUpload() {
  $('#uploaderInput').val('');
  $('#filePreview').hide();
  $('#customFileUpload').fadeIn();
  $('#upload').prop('disabled', true);
}

/**
 * 上传文件
 */
function uploadFile() {
  // 获取文件
  const fileInput = document.getElementById('uploaderInput');
  if (!fileInput.files || fileInput.files.length === 0) {
    layer.msg('请选择一个文件', {icon: 2});
    return;
  }
  
  const file = fileInput.files[0];
  const userId = Cookie.get('user_id');
  const csrfToken = $('meta[name=csrf-token]').attr('content');
  
  // 显示处理步骤
  showStep('processing');
  updateProcessingUI('正在上传图像', 10);
  
  // 创建FormData
  const formData = new FormData();
  formData.append('file', file);
  formData.append('user_id', userId);
  
  // 发送到服务器
  $.ajax({
    type: 'POST',
    url: '/file_upload',
    data: formData,
    processData: false,
    contentType: false,
    headers: {
      'X-CSRFToken': csrfToken,
      'Type': '1' // 表示首次上传（注册）
    },
    success: function(response) {
      handleUploadResponse(response);
    },
    error: function() {
      showError('服务器通信失败，请稍后重试');
    }
  });
}

/**
 * 更新处理界面
 */
function updateProcessingUI(message, progress) {
  $('#processingStage').text(message);
  $('#processingProgress').css('width', progress + '%').attr('aria-valuenow', progress).text(progress + '%');
  
  // 更新步骤状态
  if (progress < 30) {
    $('#step-detection').addClass('completed');
    $('#step-encryption, #step-storage').removeClass('completed');
  } else if (progress < 70) {
    $('#step-detection, #step-encryption').addClass('completed');
    $('#step-storage').removeClass('completed');
  } else {
    $('#step-detection, #step-encryption, #step-storage').addClass('completed');
  }
}

/**
 * 处理上传响应
 */
function handleUploadResponse(response) {
  // 检查响应状态
  if ((response.code && response.code === 1) || (response.status && response.status === 1)) {
    // 模拟处理流程
    updateProcessingUI('正在提取面部特征', 40);
    
    setTimeout(function() {
      updateProcessingUI('正在加密面部数据', 65);
      
      setTimeout(function() {
        updateProcessingUI('完成数据存储', 100);
        
        setTimeout(function() {
          showSuccess(response.msg || '面部数据已成功录入并加密');
          Cookie.set('user_id', response.user_id, 24 * 7); // 7天有效
        }, 500);
      }, 800);
    }, 800);
  } else {
    showError(response.msg || '处理失败，请重试');
  }
}

/**
 * 显示成功结果
 */
function showSuccess(message) {
  showStep('result');
  $('#resultIconSuccess').show();
  $('#resultIconError').hide();
  $('#resultTitle').text('录入成功');
  $('#resultMessage').text(message);
}

/**
 * 显示错误结果
 */
function showError(message) {
  showStep('result');
  $('#resultIconSuccess').hide();
  $('#resultIconError').show();
  $('#resultTitle').text('录入失败');
  $('#resultMessage').text(message);
  
  // 更改按钮
  $('.result-actions').html(`
    <button class="btn btn-primary" onclick="initApp()">
      <i class="fas fa-redo mr-1"></i>重试
    </button>
  `);
}