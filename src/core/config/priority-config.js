////////////////////////////////
///
/// 全局config与 launch配置优先级
/// lauch可以覆盖全局config配置
///
////////////////////////////////

import { config } from './index'
import { setDelay, setDisable, setPath, resetCursor } from '../initialize/cursor'

/**
 * 获取后缀
 * @return {[type]} [description]
 * ios 支持apng '_i'
 * 安卓支持webp  '_a'
 */
function getSuffix() {
  return Xut.plat.supportWebp ? '_a' : '_i'
}


/*预先判断br的基础类型*/
// 1 在线模式 返回增加后缀
// 2 手机模式 不修改，保留后缀
// 3 PC模式，不修改，保留后缀
export function getBrType(mode) {

  //自适应平台
  if (mode === 1) {
    if (Xut.plat.isIOS) {
      return getBrType(2)
    }
    if (Xut.plat.isAndroid) {
      return getBrType(3)
    }
  }

  //ios
  if (mode === 2) {
    if (Xut.plat.isBrowser) { //浏览器访问
      return getSuffix()
    } else {
      //app访问
      return ''
    }
  }

  //android
  if (mode === 3) {
    if (Xut.plat.isBrowser) { //浏览器访问
      return getSuffix()
    } else {
      //app访问
      return ''
    }
  }

  /**
   * 纯PC端
   * 自动选择支持的
   * 但是不用APNG了
   */
  if (Xut.plat.isBrowser) {
    //浏览器访问，要探测下是否支持Webp
    if (Xut.plat.supportWebp) {
      return getSuffix()
    }
    //否则用默认的格式
    return ''
  }

  /*默认选择png，理论不会走这里了*/
  return ''
}

/*
  获取真实的配置文件 priority
  优先级： launch > config
  1 cursor
  2 trackCode
  3 brMode
 */
export function priorityConfig() {

  /*独立app与全局配置文件*/
  const launch = config.launch
  const golbal = config.golbal


  //////////////////////////////////
  /// brModel命名被修改该了
  /// 这个为了兼容老版本采用了brModel的配置
  //////////////////////////////////
  if (launch.brModel && !launch.brMode) {
    launch.brMode = launch.brModel
  }
  if (golbal.brModel && !golbal.brMode) {
    golbal.brMode = golbal.brModel
  }


  //////////////////////////////////
  /// debug模式
  //////////////////////////////////
  for (let key in golbal.debug) {
    config.debug[key] = golbal.debug[key]
  }


  //////////////////////////////////
  /// 忙碌光标
  //////////////////////////////////
  if (launch) {
    /*因为光标可以配置false 关闭，所以这里需要注意判断*/
    const cursor = launch.cursor || launch.cursor === false ?
      launch.cursor :
      golbal.cursor

    /*每次配置光标之前都重置，可能被上个给覆盖默认的*/
    resetCursor()

    /*如果配置了关闭*/
    if (cursor === false) {
      setDisable()
    } else if (cursor) {
      /*自定义忙碌*/
      if (cursor.time) {
        setDelay(cursor.time)
      }
      if (cursor.url) {
        setPath(cursor.url)
      }
    }
  }


  //////////////////////////////////
  /// 如果启动了代码追踪，配置基本信息
  //////////////////////////////////
  const trackTypes = launch && launch.trackCode || golbal.trackCode
  config.sendTrackCode = () => {}
  config.hasTrackCode = () => {}
  /*'launch', 'init', 'exit', 'flip', 'content', 'hot', 'swipe']*/
  if (trackTypes && _.isArray(trackTypes) && trackTypes.length) {
    if (!launch.trackCode) { launch.trackCode = {} }
    trackTypes.forEach(type => { launch.trackCode[type] = true })
    const uuid = Xut.guid()

    /*检测是否有代码追踪*/
    config.hasTrackCode = (type) => {
      if (launch && launch.trackCode && launch.trackCode[type]) {
        return true
      }
    }

    /*合并命令，动作类型归类为action*/
    const modifyName = ['content', 'hot']
    const getTrackName = (type) => {
      if (~modifyName.indexOf(type)) {
        return 'action'
      }
      return type
    }

    /*发送代码追踪数据*/
    config.sendTrackCode = (type, options = {}) => {
      if (config.hasTrackCode(type)) {
        Xut.Application.Notify('trackCode', getTrackName(type), _.extend(options || {}, {
          uuid,
          appId: config.data.appId,
          appName: config.data.shortName
        }))
      }
    }
  }

  //////////////////////////////////
  /// 图片模式webp
  /// 需要兼容老版本的png模式，base-config会重设
  //////////////////////////////////
  if (launch) {
    if (!launch.brMode && golbal.brMode) {
      launch.brMode = golbal.brMode
    }

    /*预先判断出基础类型*/
    if (launch.brMode) {
      launch.brModeType = getBrType(launch.brMode)
    }
  }

  //////////////////////////////////
  ///golbal混入到launch中
  //////////////////////////////////
  for (let key in golbal) {
    if (launch[key] === undefined) {
      launch[key] = golbal[key]
    }
  }

  //////////////////////////////////
  ///竖版的情况下，页面模式都强制为1
  //////////////////////////////////
  if (launch.scrollMode === 'v') {
    launch.visualMode = 1
  }

}
