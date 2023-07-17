// IP隐藏情况：
// 火狐(FireFox) 删除隐藏IP
// 浏览器输入 about:config
//
// 搜索配置 media.peerconnection.enabled改为false ( 刷新程序,IP正常显示 )
//
// 谷歌(Chrome) 删除隐藏IP
//
// 浏览器输入：chrome://flags/#enable-webrtc-hide-local-ips-with-mdns
//
// 把 Anonymize local IPs exposed by WebRTC 设置为 disabled ( 刷新程序,IP正常显示 )
/**
 * 获取本机IP
 * @param timeout 最大超时时间
 * @returns {Promise<unknown>}
 */
export function getIP(timeout = 500) {
  return new Promise((resolve, reject) => {
    const ipList = new Set();
    if (typeof window === 'undefined') {
      reject(new Error('仅支持浏览器环境！'));
      return;
    }
    const RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;

    if (!RTCPeerConnection) {
      console.warn('');
      reject(new Error('当前浏览器不支持该操作！'));
      return;
    }
    const rtc = new RTCPeerConnection();

    rtc.createDataChannel(''); // 创建一个可以发送任意数据的数据通道

    rtc.createOffer()
      .then((offerDesc) => { // 创建并存储一个sdp数据
        rtc.setLocalDescription(offerDesc)
      })
      .catch((e) => {
        console.error(e);
      })
    rtc.onicecandidate = (evt) => { // 监听candidate事件
      if (rtc.iceGatheringState !== 'complete') {
        ipList.add(evt.candidate.address)
        return;
      }
      rtc.onicecandidate = null;
      rtc.close();
      resolve(Array.from(ipList));
    }
    // 检测超时后直接返回空数据
    setTimeout(() => {
      if (rtc.iceGatheringState !== 'complete') {
        rtc.onicecandidate = null;
        rtc.close();
        reject(new Error('ip查询超时！'));
      }
    }, timeout)
  })
}
