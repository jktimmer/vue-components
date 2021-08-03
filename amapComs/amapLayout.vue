<template>
  <div v-loading="amapLoading" class="container">
    <div class="amap-container" />
    <div class="ainput">
      <span>输入地址:</span>
      <input type="text" class="searchInput ipt" placeholder="输入地址">
    </div>
    <div class="tools">
      <el-button type="primary" plain @click.stop="useSelectBtnEv">使用选择的位置</el-button>
      <el-button plain @click.stop="cancel">取消</el-button>
    </div>
  </div>
</template>
<script>
export default {
  name: 'AmapLayout',
  props: {
    baseAddress: {
      type: String,
      default: ''
    },
    cityCode: {
      type: Number,
      default: -1
    },
    lnat: {
      type: Array,
      default: () => []
    },
    // 逆地理编码(坐标==> 地址), 查询范围 500 m
    gradius: {
      type: Number,
      default: 500
    }
  },
  data() {
    return {
      map: null,
      searchV: '',
      timeId: null,
      marker: null,
      markerList: [],
      inputId: '',
      amapDomId: '',
      amapLoading: true,
      geocoder: null
    };
  },
  watch: {
    baseAddress(n, o) {
      this.initPosition()
    },
    cityCode(n, o) {
      this.initPosition()
    },
    lnat(n, o) {
      this.initPosition()
    }
  },
  mounted() {
    var dom = this.$el;
    var inputdom = dom.querySelector('.ainput input.searchInput');
    const containerId = `amapLayout_${this._uid}`;
    const inputId = `amapLayout_input_${this._uid}`;
    dom.firstChild.id = containerId;
    inputdom.id = inputId;
    this.inputId = inputId;
    this.amapDomId = containerId;
    this.$nextTick().then((v) => {
      this.checkGlobalMap();
    });
  },
  beforeDestroy() {
    this.map && (this.map.destroy())
  },
  methods: {
    initData() {
      // this.map = null;
      this.searchV = '';
      this.timeId = null;
      this.marker = null;
      // this.markerList = [];
      // this.geocoder = null;
    },
    checkGlobalMap() {
      setTimeout(() => {
        if (this.$Amap == null) {
          this.checkGlobalMap()
          return;
        }
        this.initAmapLayout();
      }, 10)
    },
    initAmapLayout() {
      this.amapLoading = true;
      this.map = new this.$Amap.Map(this.amapDomId, {
        resizeEnable: true, // 自动调整尺寸
        zooms: [3, 18],
        zoom: 14, // 缩放
        showIndoorMap: false, // 查看室内
        rotateEnable: false // 旋转
      });
      this.map.on('complete', () => {
        this.amapLoading = false;
        this.map.addControl(new this.$Amap.Scale())
        this.map.addControl(new this.$Amap.ToolBar())
        this.initSearch();
        this.initGeoder();
        this.initPosition()
        this.map.on('click', this.mapClick);
      })
    },
    initPosition() {
      this.map.clearMap();
      if (this.baseAddress === '') {
        this.initMarker();
        return;
      }
      if (this.lnat && this.lnat.length >= 2) {
        this.initMarker(this.lnat);
        return;
      }
      this.baseSearch(`${this.baseAddress}`, (v) => {
        this.initMarker(v.pos)
      })
    },
    initMarker(pos) {
      var initPos = pos || this.map.getCenter();
      var initMarker = new this.$Amap.Marker({
        title: '初始位置',
        label: {
          offset: new this.$Amap.Pixel(0, -6),
          content: `<div>初始位置</div>`,
          direction: 'top'
        },
        offset: new this.$Amap.Pixel(-15, -30),
        icon: new this.$Amap.Icon({
          image: '//a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-red.png',
          size: new this.$Amap.Size(34, 34),
          imageSize: new this.$Amap.Size(34, 34)
        }),
        position: initPos
      })
      this.markerList = [initMarker];
      this.map.add(this.markerList.slice());
      this.map.panTo(initPos);
    },
    initGeoder() {
      this.geocoder = new this.$Amap.Geocoder({
        // city 指定进行编码查询的城市，支持传入城市名、adcode 和 citycode
        city: `${this.cityCode}`,
        raduis: this.gradius
      })
    },
    initSearch() {
      // build search constructor
      var auto = new this.$Amap.Autocomplete({
        input: this.inputId
      });
      new this.$Amap.PlaceSearch({
        map: this.map
      });
      this.$Amap.event.addListener(auto, 'select', this.placeSearch); // 注册监听，当选中某条记录时会触发
    },
    setMarker(position) {
      if (this.marker != null) {
        this.marker.setPosition(position || [120.232955, 30.197336])
        return;
      }
      this.marker = new this.$Amap.Marker({
        title: '初始位置',
        label: {
          offset: new this.$Amap.Pixel(0, -6),
          content: `<div>选择的位置</div>`,
          direction: 'top'
        },
        // icon: '//a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-red.png',
        icon: new this.$Amap.Icon({
          image: '//a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-default.png',
          size: new this.$Amap.Size(34, 34),
          imageSize: new this.$Amap.Size(34, 34)
        }),
        offset: new this.$Amap.Pixel(-15, -30),
        position: position || [120.232955, 30.197336]
      })
      if (this.markerList.length < 2) {
        this.markerList.push(this.marker)
        this.marker.setMap(this.map)
      }
    },
    placeSearch(e) {
      const location = e.poi.location;
      const position = [location.lng, location.lat];
      this.map.panTo(position);
      this.setMarker(position)
    },
    // 防抖
    mapClick(e) {
      // this.timeId = setTimeout();
      this.timeId && clearTimeout(this.timeId);
      this.timeId = setTimeout(() => {
        const position = [e.lnglat.lng, e.lnglat.lat];
        this.setMarker(position)
      }, 500); // 设定600 ms 后再查询数据改变model
    },
    baseSearch(keywords, callback) {
      var placeSearch = new this.$Amap.PlaceSearch({
        // city 指定搜索所在城市，支持传入格式有：城市名、citycode和adcode
        city: `${this.cityCode}`,
        pageSize: 1,
        pageIndex: 1
      })
      placeSearch.search(`${keywords}`, (sts, res) => {
        if (sts === 'complete') {
          const poisZero = res.poiList.pois[0];
          const type = typeof callback;
          if (type === 'function') {
            callback({
              pos: poisZero.location,
              name: poisZero.name,
              address: poisZero.address
            })
          }
          return;
        }
        this.$message({
          type: 'error',
          message: sts,
          showClose: true
        })
      })
    },
    useSelectBtnEv() {
      if (this.marker == null) {
        this.$message({
          type: 'info',
          message: '还没有选择位置哦',
          showClose: true,
          offset: 40
        });
        return;
      }
      const pos = this.marker.getPosition();
      const { lng, lat } = pos;
      this.getSelectAddress([lng, lat])
    },
    getSelectAddress(lnat) {
      if (this.geocoder == null) {
        console.log('null geocoder==>');
        return;
      }
      this.geocoder.getAddress(lnat, (sts, res) => {
        if (sts === 'complete' && res.regeocode) {
          const formattedAddress = res.regeocode.formattedAddress;
          const { adcode, province, city, district } = res.regeocode.addressComponent;
          const replaceList = [province, city, district];
          var address = this.replaceAddress(formattedAddress, replaceList, '');
          if (`${adcode}` !== `${this.cityCode}`) {
            this.$message({
              type: 'error',
              message: '地图所选位置和选择不在同一区域,请检查后再试!',
              showClose: true
            })
            return;
          }
          // this.$el.style.display = 'none';
          this.$emit('AmapSelect', address, lnat)
          this.initData();
          return;
        }
        this.$message({
          type: 'error',
          message: res.info,
          showClose: true
        })
      })
    },
    replaceAddress(address, replaceList, replacedStr) {
      const list = replaceList.slice();
      if (address == null || list.length === 0) return address;
      const ad = address.replace(list[0], replacedStr);
      list.shift();
      return this.replaceAddress(ad, list, replacedStr)
    },
    cancel() {
      if (this.markerList.length > 1) {
        this.map && this.map.remove(this.markerList.pop());
      }
      this.$emit('AmapCancel')
      this.initData();
    }
  }
}
</script>
<style lang="scss">
.amap-sug-result {
  z-index: 100;
}
</style>
<style lang="scss" scoped>
.container {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  margin: auto;
  z-index: 98;
  width: 100%;
  height: 100%;
  .amap-container {
    width: 100%;
    height: 100%;
  }
  .ainput {
    position: absolute;
    right: 20px;
    top: 0;
    display: flex;
    flex-direction: column;
    background-color: white;
    padding: 10px;
    .ipt {
      outline: none;
      height: 30px;
      border: 1px solid rgba(200, 200, 200, 1);
      border-radius: 4px;
      padding: 4px 10px;
      font-size: 14px;
      margin-top: 10px;
    }
  }
  .tools {
    position: absolute;
    bottom: 0;
    right: 0;
    padding: 10px;
    background-color: white;
  }
}
</style>
