/**
 * 信息页面脚本
 * 基于混合同态加密的安全人脸识别系统
 */

'use strict';

$(document).ready(function () {
  // 初始化比对上传功能
  initCompareUploader();
  
  // 标签页切换事件监听
  $('#infoTabs a').on('click', function (e) {
    e.preventDefault();
    $(this).tab('show');
  });

  // 初始化已存储的面部数据显示
  initStoredFace();
});

/**
 * 初始化比对上传组件
 */
function initCompareUploader() {
  const csrfToken = $('meta[name=csrf-token]').attr('content');
  let uploadCount = 0;
  let uploadList = [];
  
  // 处理文件上传
  function handleFileSelect(input) {
    input.addEventListener('change', function() {
      if (this.files && this.files.length > 0) {
        const file = this.files[0];
        
        // 验证文件类型
        if (["image/jpg", "image/jpeg", "image/png"].indexOf(file.type) < 0) {
          layer.msg('请上传jpg或png格式的图片', {icon: 2});
          return;
        }
        
        // 验证文件大小
        if (file.size > 6 * 1024 * 1024) {
          layer.msg('请上传不超过6M的图片', {icon: 2});
          return;
        }
        
        // 验证上传数量
        if (uploadCount + 1 > 1) {
          layer.msg('最多只能上传1张图片', {icon: 2});
          return;
        }
        
        uploadCount++;
        
        // 创建预览
        const reader = new FileReader();
        reader.onload = function(e) {
          const imgElement = document.createElement('div');
          imgElement.className = 'weui-uploader__file';
          imgElement.style.backgroundImage = 'url(' + e.target.result + ')';
          document.getElementById('uploaderFiles').appendChild(imgElement);
          
          // 创建上传对象
          const uploadObj = {
            file: file,
            element: imgElement,
            upload: function() {
              uploadFile(this.file);
            }
          };
          
          uploadList.push(uploadObj);
          $('#uploadCount').text(uploadCount);
          
          // 显示计数器和上传按钮
          if (uploadCount > 0) {
            $('.upload-status').show();
            $('#uploadActions').show();
            $('#upload').prop('disabled', false);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }
  
  // 处理文件上传
  function uploadFile(file) {
    // 显示比对结果区域和加载动画
    $('#compareResult').show();
    $('#upload').prop('disabled', true);
    $('#clearBtn').prop('disabled', true);
    $('#loading-0').show();
    $('.result-content').hide();
    
    // 更新提示文本
    $('#tips-0').html('正在上传并处理数据，请稍候...');
    
    // 创建FormData对象
    const formData = new FormData();
    formData.append('file', file);
    
    // 发送文件上传请求
    $.ajax({
      url: '/file_upload',
      type: 'POST',
      data: formData,
      processData: false,
      contentType: false,
      headers: {
        'X-CSRFToken': csrfToken,
        'Type': 2
      },
      success: function(ret) {
        if (ret.code == 1) {
          console.log('文件上传成功，开始调用人脸比对接口');
          
          // 延时500ms确保后端完成文件处理
          setTimeout(function() {
            // 调用人脸比对接口
            $.ajax({
              type: 'POST',
              url: '/face_compare',
              data: {
                user_id: Cookie.get('user_id')
              },
              dataType: 'json',
              headers: {
                'X-CSRFToken': csrfToken
              },
              success: function(data) {
                console.log('人脸比对结果:', data);
                processFaceCompareResult(data);
                $('#clearBtn').prop('disabled', false);
              },
              error: function(xhr, status, error) {
                console.error('人脸比对请求失败:', error);
                showCompareError('人脸比对失败: ' + error);
                $('#clearBtn').prop('disabled', false);
              }
            });
          }, 500);
        } else {
          showCompareError(ret.msg || '上传失败，请重试');
          $('#clearBtn').prop('disabled', false);
        }
      },
      error: function() {
        showCompareError('上传失败，请重试');
        $('#clearBtn').prop('disabled', false);
      }
    });
  }
  
  // 初始化文件上传按钮
  handleFileSelect(document.getElementById('fileInput'));
  
  // 缩略图预览
  $("#uploaderFiles").on('click', function (e) {
    let target = e.target;
    while (!target.classList.contains('weui-uploader__file') && target) {
      target = target.parentNode;
    }
    if (!target) return;
    
    let url = target.getAttribute('style') || '';
    if (url) {
      url = url.match(/url\((.*?)\)/)[1].replace(/"/g, '');
    }
    
    let gallery = weui.gallery(url, {
      onDelete: function () {
        clearUploadedImage(target);
        gallery.hide();
      }
    });
  });
  
  // 上传按钮点击事件
  $("#upload").on('click', function () {
    if (uploadList.length === 1 && uploadCount === 1) {
      weui.confirm('确认上传并进行人脸比对？', function () {
        uploadList.forEach(function (file) {
          file.upload();
        });
      });
    } else {
      layer.msg('请选择一张照片', {icon: 2});
    }
  });
  
  // 清除按钮点击事件
  $("#clearBtn").on('click', function() {
    if (uploadList.length > 0 || uploadCount > 0) {
      clearAllUploads();
    } else {
      layer.msg('没有可清除的图片', {icon: 2});
    }
  });
  
  // 清除所有上传
  function clearAllUploads() {
    $('#uploaderFiles').empty();
    uploadCount = 0;
    uploadList = [];
    $('#uploadCount').text('0');
    $('#uploadActions').hide();
    $('#compareResult').hide();
    $('.upload-status').hide();
    resetCompareResult();
    layer.msg('已清除所有图片', {icon: 1});
  }
  
  // 清除单个上传图片
  function clearUploadedImage(target) {
    uploadCount--;
    $('#uploadCount').text(uploadCount);
    
    if (uploadCount <= 0) {
      $('.upload-status').hide();
    }
    
    const index = Array.prototype.indexOf.call(target.parentNode.children, target);
    if (index !== -1) {
      uploadList.splice(index, 1);
      target.remove();
    }
  }
  
  // 处理人脸比对结果
  function processFaceCompareResult(data) {
    $('#loading-0').hide();
    $('.result-content').show();
    
    if (data.code === 1) {
      const similarity = parseFloat(data.data) * 100;
      const isMatch = similarity >= 60;
      
      // 显示相似度
      $('.meter-fill').css('width', similarity + '%');
      $('.meter-value').text(similarity.toFixed(2) + '%');
      $('.similarity-value').text(similarity.toFixed(2) + '%');
      
      // 显示结果消息
      if (isMatch) {
        $('.result-message').html('<i class="fas fa-check-circle"></i> 比对成功，确认为本人').addClass('success').removeClass('error');
      } else {
        // 认证失败但显示实际相似度
        $('.result-message').html('<i class="fas fa-times-circle"></i> 比对失败，不是本人（低于识别阈值60%）').addClass('error').removeClass('success');
      }
      
      // 启用清除按钮
      $('#clearBtn').prop('disabled', false);
    } else {
      // 后端API错误但仍然尝试显示相似度（如果有）
      let similarity = 0;
      try {
        if (data.data) {
          similarity = parseFloat(data.data) * 100;
        }
      } catch (e) {
        similarity = 0;
      }
      
      // 显示相似度（即使是0）
      $('.meter-fill').css('width', similarity + '%');
      $('.meter-value').text(similarity.toFixed(2) + '%');
      $('.similarity-value').text(similarity.toFixed(2) + '%');
      $('.result-message').html('<i class="fas fa-exclamation-circle"></i> ' + (data.msg || '比对过程发生错误')).addClass('error').removeClass('success');
      
      // 启用清除按钮
      $('#clearBtn').prop('disabled', false);
    }
  }
  
  // 显示比对错误
  function showCompareError(message) {
    $('#loading-0').hide();
    $('.result-content').show();
    
    // 确保进度条正确显示
    $('.meter-fill').css('width', '0%');
    $('.meter-value').text('0.00%');
    $('.similarity-value').text('0.00%');
    $('.result-message').html('<i class="fas fa-exclamation-circle"></i> ' + message).addClass('error').removeClass('success');
    
    // 启用上传按钮
    $('#upload').prop('disabled', false);
  }
  
  // 重置比对结果
  function resetCompareResult() {
    $('.meter-fill').css('width', '0%');
    $('.meter-value').text('0%');
    $('.similarity-value').text('0.00%');
    $('.result-message').html('').removeClass('success error');
    $('#tips-0').html('正在处理数据，请稍候...');
  }
}

// 初始化已存储的面部数据显示
function initStoredFace() {
  const storedFace = $('#storedFace');
  if (storedFace.length) {
    const userId = Cookie.get('user_id');
    if (!userId) {
      console.error('未找到用户ID');
      return;
    }

    // 获取用户头像
    const userImg = $('.user-img').attr('src');
    if (userImg) {
      const imgElement = document.createElement('div');
      imgElement.className = 'weui-uploader__file';
      imgElement.style.backgroundImage = 'url(' + userImg + ')';
      storedFace.empty().append(imgElement);
    } else {
      console.error('未找到用户头像');
    }
  }
}