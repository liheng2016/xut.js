/*
 增强判断
 ios上支持行内播放，不能用默认的H5控制条，拖动失效，必须要加进度条
 ios低于10的情况下，用原生播放,而且不能是平板，只能是手机，touch

201.7.6.30
 *微信版本的安卓上面，需要增加这２个属性，要不会弹出广告
**/
import { getFilePath, getContainer, createVideoWrap } from './util'
import { config } from '../../../config/index'

/**
 * html5 and flash player
 * @param  {[type]} options [description]
 * @return {[type]}         [description]
 */
export default class flarePlayer {

  constructor(options, removeVideo) {

    let url = getFilePath(options.url)
    let { width, height, top, left, zIndex } = options

    this.container = getContainer(options)

    let $videoWrap = createVideoWrap('video-flare', {
      width,
      height,
      top,
      left,
      zIndex
    })

    let fv = this.fv = $videoWrap.flareVideo({
      width,
      height,
      autoplay: true,
      srcs: url
    })

    /*窗口化*/
    fv.video.setAttribute('playsinline', 'playsinline')

    /**
     * 微信版本的安卓上面，需要增加这２个属性，要不会弹出广告
     * 如果是column页面触发的广告
     * 需要排除，会出现视频错乱的问题
     */
    if (Xut.plat.isAndroid && Xut.plat.isWeiXin && !options.isColumn) {
      fv.video.setAttribute("x5-video-player-type", "h5")
      fv.video.setAttribute("x5-video-player-fullscreen", true)

      //小窗播放时 安卓微信浏览器自动全屏
      //则视频有一部分会被遮挡  进入全屏事件时调整视频top值 退出全屏事件恢复原有top值
      fv.video.addEventListener("x5videoenterfullscreen", function() {
          $videoWrap[0].style.top = '0px'
          $videoWrap[0].style.left = '0px'
      })
      fv.video.addEventListener("x5videoexitfullscreen", function() {
        $videoWrap[0].style.top = top+'px';
        $videoWrap[0].style.left = left+'px'
      })

    }

    /*播放完毕，关闭视频窗口*/
    fv.bind('ended', function () {
      if (options.startBoot) {
        options.startBoot();
      }
      /*非迷你平台关闭视频*/
      if (config.launch.platform !== 'mini') {
        removeVideo(options.chapterId);
      }
    })

    /*播放出错*/
    fv.bind('error', function () {
      if (options.startBoot) {
        options.startBoot();
      }
      removeVideo(options.chapterId);
    })

    this.container.append($videoWrap)

    /*触发了关闭按钮*/
    fv.bind('close', function () {
      removeVideo(options.chapterId);
    })

  }

  play() {
    this.fv.play()
  }

  stop() {
    this.fv.pause()
  }

  destroy() {
    this.fv.remove()
    this.fv = null
    this.container = null
  }

}
