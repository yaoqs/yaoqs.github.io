"use strict";
// main.js
import geoAmap from '/Lab/geoAmap.js';
import weatherModule from '/Lab/weather.js';
//https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js
//import $ from 'jquery.js';

// 绑定事件
function bindEvents() {
	document.getElementById('toCoordinatesBtn').addEventListener('click', function() {
		const address = document.getElementById('addressInput').value.trim();
		if (address) {
			try{
				geoAmap.getLngLatByAddress(address);
			}
			catch(error){
				geoAmap.showResult(error.message);
			}
			const lng = parseFloat(document.getElementById('lngInput').value);
			const lat = parseFloat(document.getElementById('latInput').value);
			weatherModule.showWeather(lng,lat);
		} else {
			alert('请输入地址');
		}
	});
	document.getElementById('toAddressBtn').addEventListener('click', function() {
		const lng = parseFloat(document.getElementById('lngInput').value);
		const lat = parseFloat(document.getElementById('latInput').value);
		if (!isNaN(lng) && !isNaN(lat)) {
			// 清除之前的标记
			geoAmap.clearMarkers();
			// 添加新标记
			const lnglat = new AMap.LngLat(lng, lat);
			geoAmap.addMarker(lnglat);
			// 进行逆地理编码
			try{
				geoAmap.getAddressByLngLat(lnglat);
			}
			catch(error){
				geoAmap.showResult(error.message);
			}
			weatherModule.showWeather(lng,lat);
		} else {
			alert('请输入有效的经纬度');
		}
	});
	document.getElementById('clearMarkersBtn').addEventListener('click', function() {
		geoAmap.clearMarkers();
		geoAmap.showResult('已清除所有标记');
	});
	document.getElementById('currentLocationBtn').addEventListener('click', async function() {
		try{
			await geoAmap.getCurrentLocation();
		}
		catch(error){
			geoAmap.showResult(error.message);
		}

		const lng = parseFloat(document.getElementById('lngInput').value);
		const lat = parseFloat(document.getElementById('latInput').value);
		weatherModule.showWeather(lng,lat);
	});
	// 按Enter键触发转换
	document.getElementById('addressInput').addEventListener('keypress', function(e) {
		if (e.key === 'Enter') {
			document.getElementById('toCoordinatesBtn').click();
		}
	});
}

$(async () => {
	geoAmap.initMap();
	bindEvents();
	geoAmap.showResult('欢迎使用高德地图位置服务！<br>您可以：<br>1. 输入地址转换为坐标<br>2. 输入坐标转换为地址<br>3. 直接点击地图选择位置');
		try{
			await geoAmap.getCurrentLocation();
		}
		catch(error){
			geoAmap.showResult(error.message);
		}
	const lng = parseFloat(document.getElementById('lngInput').value);
	const lat = parseFloat(document.getElementById('latInput').value);
	console.log(lng,lat);
	await weatherModule.showWeather(lng,lat,{
  source: 'caiyun',
  token: 'Y2FpeXVuX25vdGlmeQ==',
  chartType: 'both' // 'd3', 'echarts', or 'both'
});
	setInterval(async function () {
		try{
			await geoAmap.getCurrentLocation();
		}
		catch(error){
			geoAmap.showResult(error.message);
		}
		const lng = parseFloat(document.getElementById('lngInput').value);
		const lat = parseFloat(document.getElementById('latInput').value);
		await weatherModule.showWeather(lng,lat,{
  source: 'caiyun',
  token: 'Y2FpeXVuX25vdGlmeQ==',
  chartType: 'both' // 'd3', 'echarts', or 'both'
});

	}, 60000*30)
	});

