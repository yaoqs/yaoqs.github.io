"use strict";
/*
// 原始版本
const locationModule=(()=>{
	const container = d3.select('#location').select('#position');
	container.text("");
	const protocol = document.location.protocol === "https:" ? "https://" : "http://";
	const amapkey='e260a68ad05869098e9d00ac0b3f45a8';

	const getPosition = async () => {
		if (navigator.geolocation) {
			try {
				const position = await new Promise((resolve, reject) => {
					navigator.geolocation.getCurrentPosition(resolve, reject);
				});

				const { latitude, longitude } = position.coords;

				// 选择更安全的存储方式，例如 sessionStorage
				sessionStorage.setItem('longitude', longitude);
				sessionStorage.setItem('latitude', latitude);

				const posApiUrl = `${protocol}restapi.amap.com/v3/geocode/regeo?key=${amapkey}&location=${longitude},${latitude}&radius=1`;

				const res = await fetchPosition(posApiUrl);

				if (res.status === "1") {
					const formattedAddress = res.regeocode.formatted_address; // 定义 formattedAddress 变量
					sessionStorage.setItem('address', formattedAddress);
					updateLocationDisplay(latitude, longitude, formattedAddress, container);
				}
			} catch (error) {
				handleError(error);
			}
		} else {
			container.append("text").text("该浏览器不支持获取地理位置。");
		}
	};
	const handleError = (error) => {
		let errorMessage;
		switch (error.code) {
			case error.PERMISSION_DENIED:
				errorMessage = "用户拒绝对获取地理位置的请求。";
				break;
			case error.POSITION_UNAVAILABLE:
				errorMessage = "位置信息是不可用的。";
				break;
			case error.TIMEOUT:
				errorMessage = "请求用户地理位置超时。";
				break;
			case error.UNKNOWN_ERROR:
				errorMessage = "未知错误。";
				break;
			default:
				errorMessage = "获取位置信息出错。";
		}
		container.text("")
		container.append("text").text(errorMessage);
	};

	async function ChangePosition(address) {
		try {
			const res = await fetchPosition(`${protocol}restapi.amap.com/v3/geocode/geo?address=${address}&key=${amapkey}`);
			//console.log(res);
			if (res.status === "1") {
				const [longitude, latitude] = res.geocodes[0].location.split(",");
				const formattedAddress = res.geocodes[0].formatted_address;

				// 选择更安全的存储方式，例如 sessionStorage
				sessionStorage.setItem('longitude', longitude);
				sessionStorage.setItem('latitude', latitude);
				sessionStorage.setItem('address', formattedAddress);

				updateLocationDisplay(latitude, longitude, formattedAddress, container);
			} else {
				alert("未找到该城市！");
			}
		} catch (error) {
			handleError(error);
			alert("获取位置信息出错，请稍后再试。");
		}
	}
	const fetchPosition = async (url) => {
		return $.ajax({
			dataType: 'jsonp',
			url: url,
			method: "GET",
			crossDomain: true
		});
	};
	// 更新页面上的位置显示
	const updateLocationDisplay = (latitude, longitude, position) => {
		container.text("");

		container.append("text").text(`${position}`);
		container.append("br");
		container.append("text").text(`纬度: ${latitude}`);
		container.append("br");
		container.append("text").text(`经度: ${longitude}`);
	};

	return {
		getPosition,
		ChangePosition
	};
})();
*/

//===============

//// 初始化变量
const geoAmap = (() => {
  let map;
  let geocoder;
  let markers = [];
  // 初始化地图
  function initMap() {
    // 创建地图实例:cite[1]
    map = new AMap.Map("mapContainer", {
      zoom: 11, // 缩放级别
      center: [116.397428, 39.90923], // 中心点坐标（北京天安门）
      viewMode: "3D",
    });
    // 创建地理编码实例:cite[2]
    geocoder = new AMap.Geocoder({
      city: "全国", // 默认城市
    });
    // 添加地图点击事件:cite[3]
    map.on("click", function (e) {
      // 清除之前的标记
      clearMarkers();
      // 添加新标记
      addMarker(e.lnglat);
      // 更新坐标输入框
      document.getElementById("lngInput").value = e.lnglat.lng.toFixed(6);
      document.getElementById("latInput").value = e.lnglat.lat.toFixed(6);
      // 进行逆地理编码
      getAddressByLngLat(e.lnglat);
    });
    // 添加工具条控件
    map.addControl(new AMap.ToolBar());
    // 添加比例尺控件
    map.addControl(new AMap.Scale());
  }
  // 添加标记到地图:cite[3]
  function addMarker(lnglat) {
    const marker = new AMap.Marker({
      position: lnglat,
      map: map,
    });
    markers.push(marker);
    // 将地图中心移动到标记位置
    map.setCenter(lnglat);
  }
  // 清除所有标记
  function clearMarkers() {
    markers.forEach((marker) => {
      map.remove(marker);
    });
    markers = [];
  }
  // 通过经纬度获取地址（逆地理编码）:cite[1]
  function getAddressByLngLat(lnglat) {
    geocoder.getAddress(lnglat, function (status, result) {
      if (status === "complete" && result.info === "OK") {
        const address = result.regeocode.formattedAddress;
		// 更新坐标输入框
		document.getElementById("addressInput").value = address;
        showResult(
          `坐标 [${lnglat.lng.toFixed(6)}, ${lnglat.lat.toFixed(
            6
          )}] 对应的地址是：<br><span class="address">${address}</span>`
        );
      } else {
        showResult("地址解析失败，请重试");
      }
    });
  }
  // 通过地址获取经纬度（地理编码）:cite[2]
  function getLngLatByAddress(address) {
    geocoder.getLocation(address, function (status, result) {
      if (status === "complete" && result.info === "OK") {
        const geocodes = result.geocodes;
        if (geocodes && geocodes.length > 0) {
          const lng = geocodes[0].location.lng;
          const lat = geocodes[0].location.lat;
          // 清除之前的标记
          clearMarkers();
          // 添加新标记
          const lnglat = new AMap.LngLat(lng, lat);
          addMarker(lnglat);
          // 更新坐标输入框
          document.getElementById("lngInput").value = lng.toFixed(6);
          document.getElementById("latInput").value = lat.toFixed(6);
          showResult(
            `地址 "${address}" 对应的坐标是：<br><span class="coordinates">${lng.toFixed(
              6
            )}, ${lat.toFixed(6)}</span>`
          );
        } else {
          showResult("未找到相关地址，请尝试更详细的信息");
        }
      } else {
        showResult("地址解析失败，请检查地址格式或重试");
      }
    });
  }
  // 显示结果
  function showResult(content) {
    document.getElementById("resultContent").innerHTML = content;
  }
  // 获取当前位置:cite[6]
  function getCurrentLocation() {
    const geolocation = navigator.geolocation;
    console.log(geolocation);
    if (geolocation) {
      geolocation.getCurrentPosition(
        function (position) {
          const lng = position.coords.longitude;
          const lat = position.coords.latitude;
          // 清除之前的标记
          clearMarkers();
          // 添加新标记
          const lnglat = new AMap.LngLat(lng, lat);
          addMarker(lnglat);
          // 更新坐标输入框
          document.getElementById("lngInput").value = lng.toFixed(6);
          document.getElementById("latInput").value = lat.toFixed(6);
          // 进行逆地理编码
          getAddressByLngLat(lnglat);
        },
        (error) => {
          let errorMessage;
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "用户拒绝对获取地理位置的请求。";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "位置信息是不可用的。";
              break;
            case error.TIMEOUT:
              errorMessage = "请求用户地理位置超时。";
              break;
            case error.UNKNOWN_ERROR:
              errorMessage = "未知错误。";
              break;
            default:
              errorMessage = "获取位置信息出错。";
          }
          console.error(errorMessage);
          alert(errorMessage);
        },
        {
          enableHighAccuracy: true,
          timeout: 50000,
          maximumAge: 3000,
        }
      );
    } else {
      alert("您的浏览器不支持地理定位功能");
    }
  }
  return{
		initMap,
		getCurrentLocation,
		getLngLatByAddress,
		showResult,
		addMarker,
		clearMarkers,
		getAddressByLngLat
  }
})();

export default geoAmap;
