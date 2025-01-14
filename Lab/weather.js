"use strict";
function addScript(url) {
	const script = document.createElement('script');
	script.setAttribute('type', 'text/javascript');
	script.setAttribute('src', url);
	document.getElementsByTagName('head')[0].appendChild(script);
}

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


// weatherModule.js
const weatherModule = (() => {
	const weatherContainer = d3.select("#weather");
    const protocol = document.location.protocol === "https:" ? "https://" : "http://";
    const DEF_TOKEN = 'Y2FpeXVuX25vdGlmeQ==';

	function setTime() {
		const now = new Date();
		const HH = now.getHours().toString().padStart(2, '0');
		const MM = now.getMinutes().toString().padStart(2, '0');
		const SS = now.getSeconds().toString().padStart(2, '0');
		return ("最近更新时间 " + HH + ":" + MM + ":" + SS);
	}

    const fetchWeatherData = async (url) => {
        return $.ajax({
            dataType: 'jsonp',
            url,
            method: "GET",
            crossDomain: true
        });
    };

    const displayWeatherData = (result, container) => {
		container.selectAll('*').remove()
        container.append("text").text(setTime);
        container.append("br");
        container.append("text").text(result.forecast_keypoint);
        if (result.alert.content) {
            container.append("br").append("text").text(`alert: ${result.alert.content}`);
        }
        renderDailyForecast(result.daily, container);
		//drawChart(result.daily.temperature, container);

        renderHourlyForecast(result.hourly, container);
        renderMinutelyForecast(result.minutely, container);
    };

    const showError = (container, message) => {
        container.append("text").text(message);
    };

	/*const drawChart = (data, container) => {
		const width = window.innerWidth;
		const height = 200;
		const padding = 30;
		const svg = container.append('svg').attr('width', '100%').attr('height', height).append("g");
		const xScale = d3.scaleTime().domain(d3.extent(data.map(d => d3.timeParse("%Y-%m-%d")(d.date)))).range([0, width - padding * 2]);
		const xAxis = d3.axisBottom(xScale).ticks(d3.timeDay);
		const yScale = d3.scaleLinear().domain([d3.min(data, d => d.min), d3.max(data, d => d.max)]).range([height - padding * 2, 0]);
		const yAxis = d3.axisLeft(yScale);
		svg.append('g').call(xAxis).attr('transform', 'translate(40, ' + (height - padding) + ')');
		svg.append('g').call(yAxis).attr('transform', 'translate(40, ' + padding + ')');
		const line = svg.append('g').attr('transform', 'translate(40, ' + padding + ')');
		line.append('path')
			.datum(data)
			.attr('fill', 'none')
			.attr('stroke', 'red')
			.attr('stroke-width', 1)
			.attr('d', d3.line().x(d => xScale(d3.timeParse("%Y-%m-%d")(d.date))).y(d => yScale(d.max)));
		line.selectAll('circle').data(data)
			.enter()
			.append('circle')
			.attr('cx', d => xScale(d3.timeParse("%Y-%m-%d")(d.date)))
			.attr('cy', d => yScale(d.max))
			.attr('r', 5)
			.attr('fill', 'red')
			.attr('stroke', 'red')
			.on('mouseover', function (e, v) {
				// 放大坐标圆点
				d3.select(this).attr('r', 7)
				var pos = d3.pointer(e)
				svg.append('text')
					.text(v.max + "℃")
					.attr('class', 'tooltip')
					.attr('x', pos[0] + 50)
					.attr('y', pos[1] + 20)
					.attr('text-anchor', 'end')
			})
			.on('mouseout', function () {
				// 还原坐标圆点
				d3.select(this).attr('r', 5)
				// 移除坐标值提示标签
				d3.select('.tooltip').remove()
			});
	};*/
    const renderDailyForecast = (daily, container) => {
		const width = window.innerWidth
        var padding = 30;
			var height = 200;

			container.append("p").text("Daily Forecast-15日内预报:")
			const svg_daily_temperature = container.append('svg').attr('width', '100%').attr(
				'height',
				200).append("g");
			// 定义坐标轴
			var xScale_daily_temperature = d3.scaleTime().domain(d3.extent(daily.temperature
				.map(
					d => d3.timeParse("%Y-%m-%d")(d.date)))).range([0,
						width / 2 -
						padding * 2
					])
			var xAxis_daily_temperature = d3.axisBottom(xScale_daily_temperature).ticks(d3.timeDay);
			var yScale_daily_temperature = d3.scaleLinear().domain([d3.min(daily
				.temperature, d => d
					.min), d3.max(daily.temperature, d => d.max)]).range([
						height -
						padding * 2, 0
					])
			var yAxis_daily_temperature = d3.axisLeft(yScale_daily_temperature)
			// 绘制坐标轴
			svg_daily_temperature.append('g').call(xAxis_daily_temperature).attr('transform',
				'translate(40, ' +
				(height - padding) + ')')
			svg_daily_temperature.append('g').call(yAxis_daily_temperature).attr('transform',
				'translate(40, ' +
				padding + ')')
			// 绘制折线
			var line_daily_temperature = svg_daily_temperature.append('g').attr('transform',
				'translate(40, ' +
				padding + ')')
			var line_daily_temperature_max = line_daily_temperature.append("g")
			line_daily_temperature_max.append('path')
				.datum(daily.temperature)
				.attr('fill', 'none')
				.attr('stroke', 'red')
				.attr('stroke-width', 1)
				.attr('d', d3.line().x(d => {
					//console.log(d.date)
					return xScale_daily_temperature(d3.timeParse("%Y-%m-%d")(d
						.date))
				}).y(d => {
					return yScale_daily_temperature(d.max)
				}))

			// 绘制数据坐标圆点
			line_daily_temperature_max.selectAll('circle').data(daily
				.temperature)
				.enter()
				.append('circle')
				.attr('cx', d => {
					return xScale_daily_temperature(d3.timeParse("%Y-%m-%d")(d.date))
				})
				.attr('cy', d => {
					return yScale_daily_temperature(d.max)
				})
				.attr('r', 5)
				.attr('fill', 'red')
				.attr('stroke', 'red')
				// 定义鼠标移入事件
				.on('mouseover', function (e, v) {
					// 放大坐标圆点
					d3.select(this).attr('r', 7)
					// 在光标上方显示坐标值
					var pos = d3.pointer(e)
					svg_daily_temperature.append('text')
						.text(v.max + "℃")
						.attr('class', 'tooltip')
						.attr('x', pos[0] + 50)
						.attr('y', pos[1] + 20)
						.attr('text-anchor', 'end')
				})
				// 定义鼠标移出事件
				.on('mouseout', function () {
					// 还原坐标圆点
					d3.select(this).attr('r', 5)
					// 移除坐标值提示标签
					d3.select('.tooltip').remove()
				})
			var line_daily_temperature_avg = line_daily_temperature.append("g")
			line_daily_temperature_avg.append('path')
				.datum(daily.temperature)
				.attr('fill', 'none')
				.attr('stroke', 'green')
				.attr('stroke-width', 1)
				.attr('d', d3.line().x(d => {
					//console.log(d.date)
					return xScale_daily_temperature(d3.timeParse("%Y-%m-%d")(d
						.date))
				}).y(d => {
					return yScale_daily_temperature(d.avg)
				}))

			// 绘制数据坐标圆点
			line_daily_temperature_avg.selectAll('circle').data(daily
				.temperature)
				.enter()
				.append('circle')
				.attr('cx', d => {
					return xScale_daily_temperature(d3.timeParse("%Y-%m-%d")(d.date))
				})
				.attr('cy', d => {
					return yScale_daily_temperature(d.avg)
				})
				.attr('r', 5)
				.attr('fill', 'green')
				.attr('stroke', 'green')
				// 定义鼠标移入事件
				.on('mouseover', function (e, v) {
					// 放大坐标圆点
					d3.select(this).attr('r', 7)
					// 在光标上方显示坐标值
					var pos = d3.pointer(e)
					svg_daily_temperature.append('text')
						.text(v.avg + "℃")
						.attr('class', 'tooltip')
						.attr('x', pos[0] + 50)
						.attr('y', pos[1] + 20)
						.attr('text-anchor', 'end')
				})
				// 定义鼠标移出事件
				.on('mouseout', function () {
					// 还原坐标圆点
					d3.select(this).attr('r', 5)
					// 移除坐标值提示标签
					d3.select('.tooltip').remove()
				})
			var line_daily_temperature_min = line_daily_temperature.append("g")
			line_daily_temperature_min.append('path')
				.datum(daily.temperature)
				.attr('fill', 'none')
				.attr('stroke', 'blue')
				.attr('stroke-width', 1)
				.attr('d', d3.line().x(d => {
					//console.log(d.date)
					return xScale_daily_temperature(d3.timeParse("%Y-%m-%d")(d
						.date))
				}).y(d => {
					return yScale_daily_temperature(d.min)
				}))

			// 绘制数据坐标圆点
			line_daily_temperature_min.selectAll('circle').data(daily
				.temperature)
				.enter()
				.append('circle')
				.attr('cx', d => {
					return xScale_daily_temperature(d3.timeParse("%Y-%m-%d")(d.date))
				})
				.attr('cy', d => {
					return yScale_daily_temperature(d.min)
				})
				.attr('r', 5)
				.attr('fill', 'blue')
				.attr('stroke', 'blue')
				// 定义鼠标移入事件
				.on('mouseover', function (e, v) {
					// 放大坐标圆点
					d3.select(this).attr('r', 7)
					// 在光标上方显示坐标值
					var pos = d3.pointer(e)
					svg_daily_temperature.append('text')
						.text(v.min + "℃")
						.attr('class', 'tooltip')
						.attr('x', pos[0] + 50)
						.attr('y', pos[1] + 20)
						.attr('text-anchor', 'end')
				})
				// 定义鼠标移出事件
				.on('mouseout', function () {
					// 还原坐标圆点
					d3.select(this).attr('r', 5)
					// 移除坐标值提示标签
					d3.select('.tooltip').remove()
				})
			/*line_daily.selectAll("text")
			.data(daily.skycon)
			.enter().append("text")
			.attr('x', d => { return xScale_daily(d3.timeParse("%Y-%m-%d")(d.date))})
			.attr('y', marginTop / 2)
			.attr('dy', '0.03em')
			.text(d=>{return d.value})
			.attr('text-anchor', 'middle')*/
			line_daily_temperature.append("text")
				.attr("x", padding)
				.attr("y", -padding / 2)
				.text("Temperature(℃)")
				.attr('text-anchor', 'middle')
				.attr('dy', '0.03em');
				const svg_daily_precipitation = container.append('svg').attr('width', '100%').attr(
					'height',
					200).append("g");
				// 定义坐标轴
				var xScale_daily_precipitation = d3.scaleTime().domain(d3.extent(daily.precipitation
					.map(
						d => d3.timeParse("%Y-%m-%d")(d.date)))).range([0,
							width / 2 -
							padding * 2
						]);

				var xAxis_daily_precipitation = d3.axisBottom(xScale_daily_precipitation).ticks(d3.timeDay);
			var var1 = d3.max(daily.precipitation, d => d.max);
			var yScale_daily_precipitation = d3.scaleLinear().domain([d3.min(
				daily
					.precipitation, d => d.min), d3.max([var1, 1])]).range([
						height -
						padding * 2, 0
					])
			var yAxis_daily_precipitation = d3.axisLeft(
				yScale_daily_precipitation)
			// 绘制坐标轴
			svg_daily_precipitation.append('g').call(xAxis_daily_precipitation).attr('transform',
				'translate(40, ' +
				(height - padding) + ')')
			svg_daily_precipitation.append('g').call(yAxis_daily_precipitation).attr('transform',
				'translate(40, ' +
				padding + ')')
			// 绘制折线
			var line_daily_precipitation = svg_daily_precipitation.append('g').attr(
				'transform',
				'translate(40, ' + padding + ')')
			/*var yGrid_daily = d3.axisLeft()
			.scale(yScale_daily_precipitation)
			.tickFormat('')
			.ticks(5)
			.tickSizeInner(-width/2+padding*2 )
			svg_daily.append('g')
			.attr('transform', 'translate(40, '+padding+')')
			.call(yGrid_daily)*/
			//precipitation
			var line_daily_precipitation_max = line_daily_precipitation.append(
				"g")
			line_daily_precipitation_max.append('path')
				.datum(daily.precipitation)
				.attr('fill', 'none')
				.attr('stroke', 'orange')
				.attr('stroke-width', 1)
				.attr('d', d3.line().x(d => {
					//console.log(d.date)
					return xScale_daily_precipitation(d3.timeParse("%Y-%m-%d")(d
						.date))
				}).y(d => {
					return yScale_daily_precipitation(d.max)
				}))

			// 绘制数据坐标圆点
			line_daily_precipitation_max.selectAll('circle').data(daily
				.precipitation)
				.enter()
				.append('circle')
				.attr('cx', d => {
					return xScale_daily_precipitation(d3.timeParse("%Y-%m-%d")(d.date))
				})
				.attr('cy', d => {
					return yScale_daily_precipitation(d.max)
				})
				.attr('r', 2)
				.attr('fill', 'orange')
				.attr('stroke', 'orange')
				// 定义鼠标移入事件
				.on('mouseover', function (e, v) {
					// 放大坐标圆点
					d3.select(this).attr('r', 7)
					// 在光标上方显示坐标值
					var pos = d3.pointer(e)
					svg_daily_precipitation.append('text')
						.text(v.max + "mm")
						.attr('class', 'tooltip')
						.attr('x', pos[0] + 50)
						.attr('y', pos[1] + 20)
						.attr('text-anchor', 'end')
				})
				// 定义鼠标移出事件
				.on('mouseout', function () {
					// 还原坐标圆点
					d3.select(this).attr('r', 2)
					// 移除坐标值提示标签
					d3.select('.tooltip').remove()
				})
			var line_daily_precipitation_avg = line_daily_precipitation.append(
				"g")
			line_daily_precipitation_avg.append('path')
				.datum(daily.precipitation)
				.attr('fill', 'none')
				.attr('stroke', 'lightgreen')
				.attr('stroke-width', 1)
				.attr('d', d3.line().x(d => {
					//console.log(d.date)
					return xScale_daily_precipitation(d3.timeParse("%Y-%m-%d")(d
						.date))
				}).y(d => {
					return yScale_daily_precipitation(d.avg)
				}))

			// 绘制数据坐标圆点
			line_daily_precipitation_avg.selectAll('circle').data(daily
				.precipitation)
				.enter()
				.append('circle')
				.attr('cx', d => {
					return xScale_daily_precipitation(d3.timeParse("%Y-%m-%d")(d.date))
				})
				.attr('cy', d => {
					return yScale_daily_precipitation(d.avg)
				})
				.attr('r', 2)
				.attr('fill', 'lightgreen')
				.attr('stroke', 'lightgreen')
				// 定义鼠标移入事件
				.on('mouseover', function (e, v) {
					// 放大坐标圆点
					d3.select(this).attr('r', 7)
					// 在光标上方显示坐标值
					var pos = d3.pointer(e)
					svg_daily_precipitation.append('text')
						.text(v.avg + "mm")
						.attr('class', 'tooltip')
						.attr('x', pos[0] + 50)
						.attr('y', pos[1] + 20)
						.attr('text-anchor', 'end')
				})
				// 定义鼠标移出事件
				.on('mouseout', function () {
					// 还原坐标圆点
					d3.select(this).attr('r', 2)
					// 移除坐标值提示标签
					d3.select('.tooltip').remove()
				})
			var line_daily_precipitation_min = line_daily_precipitation.append(
				"g")
			line_daily_precipitation_min.append('path')
				.datum(daily.precipitation)
				.attr('fill', 'none')
				.attr('stroke', 'lightblue')
				.attr('stroke-width', 1)
				.attr('d', d3.line().x(d => {
					//console.log(d.date)
					return xScale_daily_precipitation(d3.timeParse("%Y-%m-%d")(d
						.date))
				}).y(d => {
					return yScale_daily_precipitation(d.min)
				}))

			// 绘制数据坐标圆点
			line_daily_precipitation_min.selectAll('circle').data(daily
				.precipitation)
				.enter()
				.append('circle')
				.attr('cx', d => {
					return xScale_daily_precipitation(d3.timeParse("%Y-%m-%d")(d.date))
				})
				.attr('cy', d => {
					return yScale_daily_precipitation(d.min)
				})
				.attr('r', 2)
				.attr('fill', 'lightblue')
				.attr('stroke', 'lightblue')
				// 定义鼠标移入事件
				.on('mouseover', function (e, v) {
					// 放大坐标圆点
					d3.select(this).attr('r', 7)
					// 在光标上方显示坐标值
					var pos = d3.pointer(e)
					svg_daily_precipitation.append('text')
						.text(v.min + "mm")
						.attr('class', 'tooltip')
						.attr('x', pos[0] + 50)
						.attr('y', pos[1] + 20)
						.attr('text-anchor', 'end')
				})
				// 定义鼠标移出事件
				.on('mouseout', function () {
					// 还原坐标圆点
					d3.select(this).attr('r', 2)
					// 移除坐标值提示标签
					d3.select('.tooltip').remove()
				})
			line_daily_precipitation.append("text")
				.attr("x", padding)
				.attr("y", -padding / 2)
				.text("Precipitation(mm)")
				.attr('text-anchor', 'middle')
				.attr('dy', '0.03em')

		// Daily summary table
		const tn = ["date", "sunrise", "sunset", "skycon", "comfort", "carWashing", "humidity", "ultraviolet", "aqi", "cloudrate", "coldRisk", "pm25"];
		container.append("table").attr("id", "daily").attr("border", "1px solid")
			.attr("border-color", "#96D4D4").append("tr").attr("id", "name")
			.selectAll("td").data(tn).enter().append("td").text(d => d);

		const table = container.select("table#daily")
			.selectAll("tr")
			.data(daily.skycon)
			.enter().append("tr");

		// Fill the table with data
		table.append("td").text(d => d.date)
		table.data(daily.astro).append('td').text(d => d.sunrise.time)
		table.data(daily.astro).append('td').text(d => d.sunset.time)
		table.data(daily.skycon).append('td').text(d => d.value)
		table.data(daily.comfort).append('td').text(d => `${d.desc} [${d.index}]`)
		table.data(daily.carWashing).append('td').text(d => d.desc)
		table.data(daily.humidity).append('td').text(d => `[${d.min}][${d.avg}][${d.max}]`)
		table.data(daily.ultraviolet).append('td').text(d => `${d.desc} [${d.index}]`)
		table.data(daily.aqi).append('td').text(d => `[${d.min}][${d.avg}][${d.max}]`)
		table.data(daily.cloudrate).append('td').text(d => `[${d.min}][${d.avg}][${d.max}]`)
		table.data(daily.coldRisk).append('td').text(d => `${d.desc} [${d.index}]`)
		table.data(daily.pm25).append('td').text(d => `[${d.min}][${d.avg}][${d.max}]`);
	};


    const renderHourlyForecast = (hourly, container) => {
        const width=window.innerWidth;
		//const height=window.innerHeight;
		var padding = 30;
		var height = 200;
		const marginTop = 30;
			const marginRight = 30;
			const marginBottom = 30;
			const marginLeft = 50;
			container.append("p").text("Hourly Forecast(48h)-小时级预报（48小时）:")
			const svg_hourly = container.append('svg').attr('width', '100%')
				.attr(
					'height', 200);
			// 定义坐标轴
			var xScale_hourly = d3.scaleTime().domain(d3.extent(hourly
				.temperature.map(
					d => d3.timeParse("%Y-%m-%d %H:%M")(d.datetime))))
				.range([0, width /
					2 - padding * 2
				])
			var xAxis_hourly = d3.axisBottom(xScale_hourly).ticks(8);
			var yScale_hourly = d3.scaleLinear().domain([d3.min(hourly
				.temperature, d =>
				d.value), d3.max(hourly.temperature, d => d.value)]).range([
					height -
					padding * 2, 0
				])
			var yAxis_hourly = d3.axisLeft(yScale_hourly)
			// 绘制坐标轴
			svg_hourly.append('g').call(xAxis_hourly).attr('transform',
				'translate(40, ' + (height - padding) + ')')
			svg_hourly.append('g').call(yAxis_hourly).attr('transform',
				'translate(40, ' + padding + ')')
			// 绘制折线
			var line_hourly = svg_hourly.append('g').attr('transform',
				'translate(40, ' + padding + ')')
			var line_hourly_temperature = line_hourly.append("g")
			line_hourly_temperature.append('path')
				.datum(hourly.temperature)
				.attr('fill', 'none')
				.attr('stroke', 'red')
				.attr('stroke-width', 1)
				.attr('d', d3.line().x(d => {
					//console.log(d.date)
					return xScale_hourly(d3.timeParse("%Y-%m-%d %H:%M")(
						d
							.datetime))
				}).y(d => {
					return yScale_hourly(d.value)
				}))

			// 绘制数据坐标圆点
			line_hourly_temperature.selectAll('circle').data(hourly.temperature)
				.enter()
				.append('circle')
				.attr('cx', d => {
					return xScale_hourly(d3.timeParse("%Y-%m-%d %H:%M")(d
						.datetime))
				})
				.attr('cy', d => {
					return yScale_hourly(d.value)
				})
				.attr('r', 5)
				.attr('fill', 'red')
				.attr('stroke', 'red')
				// 定义鼠标移入事件
				.on('mouseover', function (e, v) {
					// 放大坐标圆点
					d3.select(this).attr('r', 7)
					// 在光标上方显示坐标值
					var pos = d3.pointer(e)
					svg_hourly.append('text')
						.text(v.value + "℃")
						.attr('class', 'tooltip')
						.attr('x', pos[0] + 50)
						.attr('y', pos[1] + 20)
						.attr('text-anchor', 'end')
				})
				// 定义鼠标移出事件
				.on('mouseout', function () {
					// 还原坐标圆点
					d3.select(this).attr('r', 5)
					// 移除坐标值提示标签
					d3.select('.tooltip').remove()
				})

			line_hourly.append("text")
				.attr("x", padding)
				.attr("y", -padding / 2)
				.text("Temperature(℃)")
				.attr('text-anchor', 'middle')
				.attr('dy', '0.03em')

			var yScale_hourly_precipitation = d3.scaleLinear().domain([d3.min(
				hourly
					.precipitation, d => d.value), d3.max([d3.max(hourly
						.precipitation, d => d.value), 1])]).range([height -
							padding * 2,
							0
						])
			var yAxis_hourly_precipitation = d3.axisRight(
				yScale_hourly_precipitation)
			// 绘制坐标轴
			svg_hourly.append('g').call(yAxis_hourly_precipitation).attr(
				'transform',
				'translate(' + (width / 2 - padding * 0.8) + ', ' +
				padding + ')')
			// 绘制折线
			var line_hourly_precipitation = svg_hourly.append('g').attr(
				'transform',
				'translate(40, ' + padding + ')').append("g")
			/*var yGrid_daily = d3.axisLeft()
			.scale(yScale_daily_precipitation)
			.tickFormat('')
			.ticks(5)
			.tickSizeInner(-width/2+padding*2 )
			svg_daily.append('g')
			.attr('transform', 'translate(40, '+padding+')')
			.call(yGrid_daily)*/
			//precipitation

			line_hourly_precipitation.append('path')
				.datum(hourly.precipitation)
				.attr('fill', 'none')
				.attr('stroke', 'orange')
				.attr('stroke-width', 1)
				.attr('d', d3.line().x(d => {
					//console.log(d.date)
					return xScale_hourly(d3.timeParse("%Y-%m-%d %H:%M")(
						d
							.datetime))
				}).y(d => {
					return yScale_hourly_precipitation(d.value)
				}))

			// 绘制数据坐标圆点
			line_hourly_precipitation.selectAll('circle').data(hourly
				.precipitation)
				.enter()
				.append('circle')
				.attr('cx', d => {
					return xScale_hourly(d3.timeParse("%Y-%m-%d %H:%M")(d
						.datetime))
				})
				.attr('cy', d => {
					return yScale_hourly_precipitation(d.value)
				})
				.attr('r', 2)
				.attr('fill', 'orange')
				.attr('stroke', 'orange')
				// 定义鼠标移入事件
				.on('mouseover', function (e, v) {
					// 放大坐标圆点
					d3.select(this).attr('r', 7)
					// 在光标上方显示坐标值
					var pos = d3.pointer(e)
					svg_hourly.append('text')
						.text(v.value + "mm")
						.attr('class', 'tooltip')
						.attr('x', pos[0] + 50)
						.attr('y', pos[1] + 20)
						.attr('text-anchor', 'end')
				})
				// 定义鼠标移出事件
				.on('mouseout', function () {
					// 还原坐标圆点
					d3.select(this).attr('r', 2)
					// 移除坐标值提示标签
					d3.select('.tooltip').remove()
				})
			line_hourly.append("text")
				.attr("x", width / 2 - padding * 4)
				.attr("y", -padding / 2)
				.text("Precipitation(mm)")
				.attr('text-anchor', 'middle')
				.attr('dy', '0.03em')

			var tn2 = ["datetime", "Temperature(℃)", "Precipitation(mm)",
				"skycon",
				"humidity", "aqi", "cloudrate", "pm25", "wind/风",
				"press/气压(Pa)"
			]
			container.append("table").attr("id", "hourly").attr("border",
				"1px solid")
				.attr("border-color", "#96D4D4").append("tr").attr("id", "name")
				.selectAll("td").data(tn2).enter().append("td").text(d => d)
			var t = container.select("table#hourly")
				.selectAll("tr").filter((d, i) => {
					return i > 1
				})
				.data(hourly.skycon)
				.join("tr");

			t.append("td").text(d => d.datetime)
			t.data(hourly.temperature).append('td').text(d => d.value + "℃")
			t.data(hourly.precipitation).append('td').text(d => d.value)
			t.data(hourly.skycon).append('td').text(d => d.value)
			t.data(hourly.humidity).append('td').text(d => d.value)
			t.data(hourly.aqi).append('td').text(d => d.value)
			t.data(hourly.cloudrate).append('td').text(d => d.value)
			t.data(hourly.pm25).append('td').text(d => d.value)
			t.data(hourly.wind).append('td').text(d => "[" + d.speed + "m/s][" +
				d
					.direction + "°]")
			t.data(hourly.pres).append('td').text(d => d.value)
    };

    const renderMinutelyForecast = (minutely, container) => {
		const width=window.innerWidth;
		//const height=window.innerHeight;
		var padding = 30;
		var height = 200;
		const marginTop = 30;
			const marginRight = 30;
			const marginBottom = 30;
			const marginLeft = 50;
        container.append("p").text(
			"Minutely Forecast(1h/2h)-分钟级预报（1小时/2小时）:")
		const svg_minutely = container.append('svg').attr('width', '100%').attr(
				'height', 200);
		// 定义坐标轴
		var xScale_minutely = d3.scaleLinear().domain([0, 120]).range([0,
			width /
			2 - padding * 2
		])
		var xAxis_minutely = d3.axisBottom(xScale_minutely);
		var yScale_minutely = d3.scaleLinear().domain([d3.min(minutely
			.precipitation_2h), d3.max(minutely
				.precipitation_2h) + 1]).range([
					height - padding * 2, 0
				])
		var yAxis_minutely = d3.axisLeft(yScale_minutely)
		// 绘制坐标轴
		svg_minutely.append('g').call(xAxis_minutely).attr('transform',
			'translate(40, ' + (height - padding) + ')')
		svg_minutely.append('g').call(yAxis_minutely).attr('transform',
			'translate(40, ' + padding + ')')
		svg_minutely.append('text')
			.attr('x', (marginLeft + width / 2 + marginRight) / 2)
			.attr('y', marginTop / 2)
			.attr('dy', '0.33em')
			.text(minutely.datasource + ":" + minutely.description)
			.attr('text-anchor', 'middle')
		// 绘制折线
		var line_minutely = svg_minutely.append('g').attr('transform',
			'translate(40, ' + padding + ')')
		line_minutely.append('path')
			.datum(minutely.precipitation)
			.attr('fill', 'none')
			.attr('stroke', 'red')
			.attr('stroke-width', 1)
			.attr('d', d3.line().x((d, i) => {
				return xScale_minutely(i)
			}).y(d => {
				return yScale_minutely(d)
			}))
		line_minutely.append('path')
			.datum(minutely.precipitation_2h)
			.attr('fill', 'none')
			.attr('stroke', 'black')
			.attr('stroke-width', 1)
			.attr('d', d3.line().x((d, i) => {
				return xScale_minutely(i)
			}).y(d => {
				return yScale_minutely(d)
			}))
		const yGrid = d3.axisLeft()
			.scale(yScale_minutely)
			.tickFormat('')
			.ticks(5)
			.tickSizeInner(-width / 2)
		const xGrid = d3.axisBottom()
			.scale(xScale_minutely)
			.tickFormat("")
			.ticks(12)
			.tickSizeInner(-height)
		svg_minutely.append('g')
			.attr('transform', 'translate(40, ' + padding + ')')
			.call(yGrid)
		/*svg_minutely.append('g')
		.attr('transform', 'translate(40, '+(height-padding)+')')
		.call(xGrid)*/
		svg_minutely.append("text")
			.attr('x', width / 2 - padding / 2)
			.attr('y', height - padding)
			.attr('dy', '0.33em')
			.style("text-anchor", "middle")
			.text("min");
    };

	const showWeather = () => {
		const longitude = sessionStorage.getItem("longitude");
		const latitude = sessionStorage.getItem("latitude");

		if (longitude && latitude) {
			const WeatherapiURL = `${protocol}api.caiyunapp.com/v2/${DEF_TOKEN}/${longitude},${latitude}/forecast?dailysteps=15&alert=true`;
			//[彩云天气 API 一览表](https://open.caiyunapp.com/%E5%BD%A9%E4%BA%91%E5%A4%A9%E6%B0%94_API_%E4%B8%80%E8%A7%88%E8%A1%A8)
			(async () => {
				try {
					const weatherData = await fetchWeatherData(WeatherapiURL);
					if (weatherData?.status === "ok") {
						displayWeatherData(weatherData.result, weatherContainer);
					} else {
						showError(weatherContainer, "获取天气数据出错。");
					}
				} catch (error) {
					//console.error("Error:", error);
					showError(weatherContainer, "网络连接异常或浏览器已阻止载入混合活动内容（请用http协议访问）");
				}
			})();
		}
	};


    return {
        showWeather
    };
})();

// main.js
$(document).ready(async () => {
	await locationModule.getPosition();
	await weatherModule.showWeather();
	setInterval(async function () {
		await locationModule.getPosition();
		await weatherModule.showWeather();
	}, 60000*30)
});

//======================================

$("#submit").on('click', async function (e) {
	var cityname = $('input[name="cityname"]').val();
	if (cityname == '') {
		cityname = sessionStorage.getItem('address');
		if (typeof (cityname) != "undefined"&&cityname!= null) {

			$("#cityname").text = cityname;
			$('input[name="cityname"]').attr('value', cityname);
		} else {
			$("#cityname").text = $("#cityname")[0].placeholder;
			cityname = $("#cityname")[0].placeholder;
			$('input[name="cityname"]').attr('value', cityname);
		}

	}
	cityname = encodeURI(cityname);
	await locationModule.ChangePosition(cityname);
	await weatherModule.showWeather();
});

$("#currentPosition").on('click', async function (e) {
	await locationModule.getPosition();
	await weatherModule.showWeather();
});
