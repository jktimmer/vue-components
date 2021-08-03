import AMapLoader from '@amap/amap-jsapi-loader';

const AmapwebJsApiKey = 'your ampapkey';

function init(Vue, options) {
  const { plugins, version, AMapUi, Loca } = options || {};
  AMapLoader.load({
    key: AmapwebJsApiKey,
    plugins: plugins || [
      'AMap.Autocomplete', // 输入提示，提供了根据关键字获得提示信息的功能
      'AMap.PlaceSearch', // 地点搜索服务，提供了关键字搜索、周边搜索、范围内搜索等功能
      'AMap.MouseTool', // 鼠标工具插件
      'AMap.Geocoder', // 地理编码与逆地理编码服务，提供地址与坐标间的相互转换
      'AMap.Geolocation',
      // 'AMap.ElasticMarker', // 灵活点标记，可以随着地图级别改变样式和大小的 Marker
      'AMap.ToolBar', // 工具条，控制地图的缩放、平移等
      'AMap.Scale' // 比例尺
    ],
    version: version || '1.4.16',
    AMapUI: AMapUi,
    Loca: Loca
  }).then((Amap) => {
    Vue.prototype.$Amap = Amap;
  }).catch((err) => {
    console.log(err)
  });
}

const AmapInfo = {
  install: init
}

export default AmapInfo;
