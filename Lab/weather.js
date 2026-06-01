"use strict";

/**
 * 天气数据通用适配器
 * 将彩云天气API数据转换为通用格式，便于D3.js和ECharts可视化
 */

const WeatherDataAdapter = (() => {

    /**
     * 将彩云天气API数据转换为通用格式
     * @param {Object} caiyunData - 彩云天气API原始数据
     * @returns {Object} 通用格式的天气数据
     */
    const transformToUniversalFormat = (caiyunData) => {
        if (!caiyunData || caiyunData.status !== "ok") {
            throw new Error("Invalid weather data");
        }

        const result = caiyunData.result;
        const location = caiyunData.location || [102, 24]; // 默认坐标

        return {
            metadata: {
                location: {
                    longitude: location[0],
                    latitude: location[1]
                },
                updateTime: new Date().toISOString(),
                forecastKeypoint: result.forecast_keypoint || "",
                dataSource: "CaiYun Weather API"
            },

            // 当前天气
            current: transformCurrentWeather(result),

            // 15天预报
            daily: transformDailyForecast(result.daily),

            // 小时预报
            hourly: transformHourlyForecast(result.hourly),

            // 分钟级预报
            minutely: transformMinutelyForecast(result.minutely),

            // 预警信息
            alerts: transformAlerts(result.alert)
        };
    };

    /**
     * 转换当前天气数据
     */
    const transformCurrentWeather = (result) => {
        return {
            temperature: result.hourly?.temperature?.[0]?.value || null,
            humidity: result.hourly?.humidity?.[0]?.value || null,
            pressure: result.hourly?.pres?.[0]?.value || null,
            windSpeed: result.hourly?.wind?.[0]?.speed || null,
            windDirection: result.hourly?.wind?.[0]?.direction || null,
            visibility: result.hourly?.visibility?.[0]?.value || null,
            cloudRate: result.hourly?.cloudrate?.[0]?.value || null,
            skycon: result.hourly?.skycon?.[0]?.value || null,
            aqi: result.hourly?.aqi?.[0]?.value || null,
            pm25: result.hourly?.pm25?.[0]?.value || null
        };
    };

    /**
     * 转换15天预报数据
     */
    const transformDailyForecast = (daily) => {
        if (!daily) return [];

        const dailyData = [];
        const daysCount = Math.max(
            daily.temperature?.length || 0,
            daily.skycon?.length || 0,
            daily.cloudrate?.length || 0,
            daily.humidity?.length || 0,
            daily.pres?.length || 0,
            daily.wind?.length || 0,
            daily.astro?.length || 0
        );

        for (let i = 0; i < daysCount; i++) {
            const dayData = {
                date: daily.temperature?.[i]?.date || null,
                timestamp: daily.temperature?.[i]?.date ?
                    new Date(daily.temperature[i].date).getTime() : null,

                // 温度
                temperature: {
                    max: daily.temperature?.[i]?.max || null,
                    min: daily.temperature?.[i]?.min || null,
                    avg: daily.temperature?.[i]?.avg || null
                },

                // 天气状况
                skycon: daily.skycon?.[i]?.value || null,

                // 湿度
                humidity: daily.humidity?.[i]?.avg || null,

                // 气压
                pressure: daily.pres?.[i]?.avg || null,

                // 风速风向
                wind: {
                    speed: daily.wind?.[i]?.avg?.speed || null,
                    direction: daily.wind?.[i]?.avg?.direction || null
                },

                // 云量
                cloudRate: daily.cloudrate?.[i]?.avg || null,

                // 天文数据
                astro: daily.astro?.[i] || null,

                // 生活指数
                lifeIndex: {
                    ultraviolet: daily.ultraviolet?.[i] || null,
                    comfort: daily.comfort?.[i] || null,
                    carWashing: daily.carWashing?.[i] || null,
                    dressing: daily.dressing?.[i] || null
                }
            };

            dailyData.push(dayData);
        }

        return dailyData;
    };

    /**
     * 转换小时预报数据
     */
    const transformHourlyForecast = (hourly) => {
        if (!hourly) return [];

        const hourlyData = [];
        const hoursCount = Math.max(
            hourly.temperature?.length || 0,
            hourly.skycon?.length || 0,
            hourly.precipitation?.length || 0,
            hourly.humidity?.length || 0,
            hourly.wind?.length || 0,
            hourly.pres?.length || 0,
            hourly.cloudrate?.length || 0,
            hourly.aqi?.length || 0,
            hourly.pm25?.length || 0
        );

        for (let i = 0; i < hoursCount; i++) {
            const hourData = {
                datetime: hourly.temperature?.[i]?.datetime || null,
                timestamp: hourly.temperature?.[i]?.datetime ?
                    new Date(hourly.temperature[i].datetime).getTime() : null,

                // 温度
                temperature: hourly.temperature?.[i]?.value || null,

                // 天气状况
                skycon: hourly.skycon?.[i]?.value || null,

                // 降水
                precipitation: hourly.precipitation?.[i]?.value || null,

                // 湿度
                humidity: hourly.humidity?.[i]?.value || null,

                // 风速风向
                wind: {
                    speed: hourly.wind?.[i]?.speed || null,
                    direction: hourly.wind?.[i]?.direction || null
                },

                // 气压
                pressure: hourly.pres?.[i]?.value || null,

                // 云量
                cloudRate: hourly.cloudrate?.[i]?.value || null,

                // 空气质量
                aqi: hourly.aqi?.[i]?.value || null,
                pm25: hourly.pm25?.[i]?.value || null
            };

            hourlyData.push(hourData);
        }

        return hourlyData;
    };

    /**
     * 转换分钟级预报数据
     */
    const transformMinutelyForecast = (minutely) => {
        if (!minutely) return null;

        return {
            description: minutely.description || "",
            datasource: minutely.datasource || "",
            // 1小时降水预报
            precipitation1h: minutely.precipitation || [],
            // 2小时降水预报
            precipitation2h: minutely.precipitation_2h || [],
            // 开始时间戳
            startTime: new Date().getTime()
        };
    };

    /**
     * 转换预警信息
     */
    const transformAlerts = (alert) => {
        if (!alert || !alert.content) return [];

        return [{
            content: alert.content,
            status: alert.status || "active",
            code: alert.code || null
        }];
    };

    /**
     * 获取用于D3.js/ECharts的时间序列数据
     */
    const getTimeSeriesData = (universalData, dataType, metric) => {
        switch (dataType) {
            case 'daily':
                return universalData.daily.map(day => ({
                    date: day.date,
                    timestamp: day.timestamp,
                    value: metric ? day[metric] : day.temperature.max,
                    ...day
                })).filter(item => item.timestamp !== null);

            case 'hourly':
                return universalData.hourly.map(hour => ({
                    datetime: hour.datetime,
                    timestamp: hour.timestamp,
                    value: metric ? hour[metric] : hour.temperature,
                    ...hour
                })).filter(item => item.timestamp !== null);

            case 'minutely':
                if (!universalData.minutely) return [];
                return universalData.minutely.precipitation1h.map((precip, index) => ({
                    time: index * 5, // 5分钟间隔
                    timestamp: universalData.minutely.startTime + index * 5 * 60 * 1000,
                    value: precip,
                    index: index
                }));

            default:
                return [];
        }
    };

    /**
     * 获取温度趋势数据（适用于折线图）
     */
    const getTemperatureTrendData = (universalData, forecastType = 'daily') => {
        const data = getTimeSeriesData(universalData, forecastType, 'temperature');

        if (forecastType === 'daily') {
            return data.map(day => ({
                date: day.date,
                timestamp: day.timestamp,
                max: day.temperature?.max || 0,
                min: day.temperature?.min || 0,
                avg: day.temperature?.avg || 0
            }));
        } else {
            return data.map(hour => ({
                datetime: hour.datetime,
                timestamp: hour.timestamp,
                temperature: hour.temperature || 0
            }));
        }
    };

    /**
     * 获取多指标对比数据（适用于多系列图表）
     */
    const getMultiMetricData = (universalData, forecastType = 'hourly', metrics = []) => {
        const baseData = getTimeSeriesData(universalData, forecastType);

        return baseData.map(item => {
            const result = {
                timestamp: item.timestamp,
                datetime: item.datetime || item.date
            };

            metrics.forEach(metric => {
                if (forecastType === 'daily') {
                    if (metric === 'temperature') {
                        result.maxTemp = item.temperature?.max;
                        result.minTemp = item.temperature?.min;
                        result.avgTemp = item.temperature?.avg;
                    } else {
                        result[metric] = item[metric];
                    }
                } else {
                    result[metric] = item[metric];
                }
            });

            return result;
        });
    };

    /**
     * 获取ECharts配置模板
     */
    const getEChartsTemplate = (dataType, metrics = []) => {
        const baseConfig = {
            title: {
                text: '天气预报数据',
                left: 'center'
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross'
                }
            },
            legend: {
                data: [],
                top: 30
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            toolbox: {
                feature: {
                    saveAsImage: {},
                    dataZoom: {},
                    restore: {}
                }
            },
            xAxis: {
                type: 'time',
                boundaryGap: false
            },
            yAxis: {
                type: 'value',
                name: '数值'
            },
            series: []
        };

        // 根据数据类型和指标配置图表
        if (dataType === 'temperature') {
            baseConfig.title.text = '温度趋势图';
            baseConfig.yAxis.name = '温度 (°C)';
            baseConfig.legend.data = ['最高温', '最低温', '平均温'];
            baseConfig.series = [
                {
                    name: '最高温',
                    type: 'line',
                    data: [],
                    smooth: true,
                    itemStyle: { color: '#ff4444' }
                },
                {
                    name: '最低温',
                    type: 'line',
                    data: [],
                    smooth: true,
                    itemStyle: { color: '#4444ff' }
                },
                {
                    name: '平均温',
                    type: 'line',
                    data: [],
                    smooth: true,
                    itemStyle: { color: '#44ff44' }
                }
            ];
        }

        return baseConfig;
    };

    return {
        transformToUniversalFormat,
        getTimeSeriesData,
        getTemperatureTrendData,
        getMultiMetricData,
        getEChartsTemplate
    };
})();

// 使用示例
const WeatherAdapterExample = {
    /**
     * 使用适配器转换数据
     */
    async convertWeatherData(caiyunApiUrl) {
        try {
            // 获取原始数据
            const response = await fetch(caiyunApiUrl);
            const rawData = await response.json();

            // 转换为通用格式
            const universalData = WeatherDataAdapter.transformToUniversalFormat(rawData);

            return universalData;
        } catch (error) {
            console.error('Weather data conversion failed:', error);
            throw error;
        }
    },

    /**
     * 为ECharts准备温度趋势数据
     */
    prepareTemperatureData(universalData, forecastType = 'daily') {
        const trendData = WeatherDataAdapter.getTemperatureTrendData(universalData, forecastType);

        if (forecastType === 'daily') {
            return {
                dates: trendData.map(d => d.date),
                maxTemps: trendData.map(d => d.max),
                minTemps: trendData.map(d => d.min),
                avgTemps: trendData.map(d => d.avg)
            };
        } else {
            return {
                times: trendData.map(d => d.datetime),
                temperatures: trendData.map(d => d.temperature)
            };
        }
    },

    /**
     * 为D3.js准备时间序列数据
     */
    prepareD3TimeSeriesData(universalData, dataType, metric) {
        return WeatherDataAdapter.getTimeSeriesData(universalData, dataType, metric);
    }
};

//Promise.try()
// weatherModule.js
const weatherModule = (() => {
	const weatherContainer = d3.select("#weather");
    const protocol = document.location.protocol === "https:" ? "https://" : "http://";
    const DEF_TOKEN = 'Y2FpeXVuX25vdGlmeQ==';

    // 天气数据适配器
    let weatherAdapter = WeatherDataAdapter;

    // 动态加载适配器脚本
    const loadWeatherAdapter = () => {
        return new Promise((resolve) => {
            // 适配器已经在文件顶部定义
            resolve(weatherAdapter);
        });
    };

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

    // 使用ECharts渲染天气数据
    const renderWithECharts = (data, container) => {
        // 确保ECharts已加载
        if (typeof echarts === 'undefined') {
            addScript('https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js');
            setTimeout(() => renderWithECharts(data, container), 500);
            return;
        }

        // 温度图表
        container.append("p").text("Temperature Forecast (ECharts)");
        const tempChart = container.append('div')
            .style('width', '100%')
            .style('height', '400px');

        const tempECharts = echarts.init(tempChart.node());

        const dates = data.daily.map(d => d.date);
        const maxTemp = data.daily.map(d => d.temperature.max);
        const minTemp = data.daily.map(d => d.temperature.min);
        const avgTemp = data.daily.map(d => d.temperature.avg);

        tempECharts.setOption({
            title: {
                text: 'Temperature Change',
                left: 'center'
            },
            tooltip: {
                trigger: 'axis'
            },
            legend: {
                data: ['Max Temp', 'Min Temp', 'Avg Temp'],
                bottom: 10
            },
            xAxis: {
                type: 'category',
                data: dates
            },
            yAxis: {
                type: 'value',
                name: 'Temperature (°C)'
            },
            series: [
                {
                    name: 'Max Temp',
                    type: 'line',
                    data: maxTemp,
                    itemStyle: {
                        color: 'red'
                    }
                },
                {
                    name: 'Min Temp',
                    type: 'line',
                    data: minTemp,
                    itemStyle: {
                        color: 'blue'
                    }
                },
                {
                    name: 'Avg Temp',
                    type: 'line',
                    data: avgTemp,
                    itemStyle: {
                        color: 'green'
                    }
                }
            ]
        });

        // 降水图表
        container.append("p").text("Precipitation Forecast (ECharts)");
        const precipChart = container.append('div')
            .style('width', '100%')
            .style('height', '400px');

        const precipECharts = echarts.init(precipChart.node());

        const maxPrecip = data.daily.map(d => d.precipitation.max);
        const avgPrecip = data.daily.map(d => d.precipitation.avg);

        precipECharts.setOption({
            title: {
                text: 'Precipitation Change',
                left: 'center'
            },
            tooltip: {
                trigger: 'axis'
            },
            legend: {
                data: ['Max Precipitation', 'Avg Precipitation'],
                bottom: 10
            },
            xAxis: {
                type: 'category',
                data: dates
            },
            yAxis: {
                type: 'value',
                name: 'Precipitation (mm)'
            },
            series: [
                {
                    name: 'Max Precipitation',
                    type: 'line',
                    data: maxPrecip,
                    itemStyle: {
                        color: 'orange'
                    }
                },
                {
                    name: 'Avg Precipitation',
                    type: 'line',
                    data: avgPrecip,
                    itemStyle: {
                        color: 'lightgreen'
                    }
                }
            ]
        });

        // 风速图表
        container.append("p").text("Wind Speed Forecast (ECharts)");
        const windChart = container.append('div')
            .style('width', '100%')
            .style('height', '400px');

        const windECharts = echarts.init(windChart.node());

        const maxWind = data.daily.map(d => d.wind.max);
        const avgWind = data.daily.map(d => d.wind.avg);

        windECharts.setOption({
            title: {
                text: 'Wind Speed Change',
                left: 'center'
            },
            tooltip: {
                trigger: 'axis'
            },
            legend: {
                data: ['Max Wind Speed', 'Avg Wind Speed'],
                bottom: 10
            },
            xAxis: {
                type: 'category',
                data: dates
            },
            yAxis: {
                type: 'value',
                name: 'Wind Speed (m/s)'
            },
            series: [
                {
                    name: 'Max Wind Speed',
                    type: 'line',
                    data: maxWind,
                    itemStyle: {
                        color: 'purple'
                    }
                },
                {
                    name: 'Avg Wind Speed',
                    type: 'line',
                    data: avgWind,
                    itemStyle: {
                        color: 'gray'
                    }
                }
            ]
        });

        // 气压图表
        container.append("p").text("Pressure Forecast (ECharts)");
        const pressureChart = container.append('div')
            .style('width', '100%')
            .style('height', '400px');

        const pressureECharts = echarts.init(pressureChart.node());

        const maxPressure = data.daily.map(d => d.pressure.max);
        const avgPressure = data.daily.map(d => d.pressure.avg);

        pressureECharts.setOption({
            title: {
                text: 'Pressure Change',
                left: 'center'
            },
            tooltip: {
                trigger: 'axis'
            },
            legend: {
                data: ['Max Pressure', 'Avg Pressure'],
                bottom: 10
            },
            xAxis: {
                type: 'category',
                data: dates
            },
            yAxis: {
                type: 'value',
                name: 'Pressure (hPa)'
            },
            series: [
                {
                    name: 'Max Pressure',
                    type: 'line',
                    data: maxPressure,
                    itemStyle: {
                        color: 'brown'
                    }
                },
                {
                    name: 'Avg Pressure',
                    type: 'line',
                    data: avgPressure,
                    itemStyle: {
                        color: 'orange'
                    }
                }
            ]
        });

        // 响应式调整
        window.addEventListener('resize', () => {
            tempECharts.resize();
            precipECharts.resize();
            windECharts.resize();
            pressureECharts.resize();
        });
    };

    const displayWeatherData = (result, container) => {
		container.selectAll('*').remove()

        // 使用通用适配器转换数据格式
        let universalData = null;
        try {
            if (weatherAdapter) {
                universalData = weatherAdapter.transformToUniversalFormat('caiyun', {
                    status: "ok",
                    result: result,
                    location: [102, 24]
                });
                console.log('Universal weather data:', universalData);
            }
        } catch (error) {
            console.warn('Weather adapter not available, using original format:', error);
        }

        container.append("text").text(setTime);
        container.append("br");
        container.append("text").text(result.forecast_keypoint);
        if (result.alert.content) {
            container.append("br").append("text").text(`alert: ${result.alert.content}`);
        }

        // 使用通用数据格式进行可视化（如果可用）
        if (universalData) {
            // 使用D3.js渲染
            renderUniversalDailyForecast(universalData.daily, container);
            renderUniversalHourlyForecast(universalData.hourly, container);

            // 使用ECharts渲染
            container.append("hr");
            container.append("h3").text("ECharts Visualizations");
            renderWithECharts(universalData, container);
        } else {
            // 回退到原始渲染方式
            renderDailyForecast(result.daily, container);
            renderHourlyForecast(result.hourly, container);
        }

        renderMinutelyForecast(result.minutely, container);
    };

    const showError = (container, message) => {
        container.append("text").text(message);
    };

    /**
     * 使用通用数据格式渲染日预报 (D3.js)
     */
    const renderUniversalDailyForecast = (dailyData, container) => {
        if (!dailyData || dailyData.length === 0) return;

        const width = window.innerWidth;
        const height = 200;
        const padding = 30;

        container.append("p").text("Daily Forecast-15日预报 (D3.js)");

        // 温度图表
        const svgTemp = container.append('svg')
            .attr('width', '100%')
            .attr('height', height)
            .append("g");

        // 准备温度数据
        const tempData = dailyData.map(d => ({
            date: d.date,
            timestamp: d.timestamp,
            max: d.temperature?.max || 0,
            min: d.temperature?.min || 0,
            avg: d.temperature?.avg || 0
        }));

        // 设置比例尺
        const xScale = d3.scaleTime()
            .domain(d3.extent(tempData, d => new Date(d.date)))
            .range([0, width / 2 - padding * 2]);

        const yScale = d3.scaleLinear()
            .domain([
                d3.min(tempData, d => Math.min(d.min, d.avg)) - 2,
                d3.max(tempData, d => Math.max(d.max, d.avg)) + 2
            ])
            .range([height - padding * 2, 0]);

        // 创建线条生成器
        const line = d3.line()
            .x(d => xScale(new Date(d.date)))
            .y(d => yScale(d.value))
            .curve(d3.curveMonotoneX);

        // 添加坐标轴
        svgTemp.append('g')
            .attr('transform', `translate(40, ${height - padding})`)
            .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%m/%d')));

        svgTemp.append('g')
            .attr('transform', `translate(40, ${padding})`)
            .call(d3.axisLeft(yScale));

        // 绘制温度线
        const lineGroup = svgTemp.append('g').attr('transform', `translate(40, ${padding})`);

        // 最高温度
        lineGroup.append('path')
            .datum(tempData.map(d => ({ date: d.date, value: d.max })))
            .attr('fill', 'none')
            .attr('stroke', 'red')
            .attr('stroke-width', 2)
            .attr('d', line);

        // 最低温度
        lineGroup.append('path')
            .datum(tempData.map(d => ({ date: d.date, value: d.min })))
            .attr('fill', 'none')
            .attr('stroke', 'blue')
            .attr('stroke-width', 2)
            .attr('d', line);

        // 平均温度
        lineGroup.append('path')
            .datum(tempData.map(d => ({ date: d.date, value: d.avg })))
            .attr('fill', 'none')
            .attr('stroke', 'green')
            .attr('stroke-width', 2)
            .attr('d', line);

        // 添加数据点
        lineGroup.selectAll('.max-point')
            .data(tempData)
            .enter().append('circle')
            .attr('class', 'max-point')
            .attr('cx', d => xScale(new Date(d.date)))
            .attr('cy', d => yScale(d.max))
            .attr('r', 4)
            .attr('fill', 'red')
            .on('mouseover', function(event, d) {
                d3.select(this).attr('r', 6);
                const tooltip = svgTemp.append('text')
                    .attr('class', 'tooltip')
                    .attr('x', xScale(new Date(d.date)) + 40)
                    .attr('y', yScale(d.max) + 20)
                    .attr('text-anchor', 'middle')
                    .text(`Max: ${d.max}°C`);
            })
            .on('mouseout', function() {
                d3.select(this).attr('r', 4);
                svgTemp.select('.tooltip').remove();
            });

        // 添加图例
        const legend = svgTemp.append('g')
            .attr('transform', `translate(${width - 150}, 20)`);

        const legendData = [
            { label: 'Max Temp', color: 'red' },
            { label: 'Min Temp', color: 'blue' },
            { label: 'Avg Temp', color: 'green' }
        ];

        legendData.forEach((d, i) => {
            const legendRow = legend.append('g')
                .attr('transform', `translate(0, ${i * 20})`);

            legendRow.append('line')
                .attr('x1', 0)
                .attr('x2', 15)
                .attr('stroke', d.color)
                .attr('stroke-width', 2);

            legendRow.append('text')
                .attr('x', 20)
                .attr('y', 0)
                .attr('dy', '0.32em')
                .style('text-anchor', 'start')
                .text(d.label);
        });

        // 降水图表
        container.append("p").text("Precipitation Forecast (D3.js)");
        const svgPrecip = container.append('svg')
            .attr('width', '100%')
            .attr('height', height)
            .append("g");

        // 准备降水数据
        const precipData = dailyData.map(d => ({
            date: d.date,
            max: d.precipitation?.max || 0,
            min: d.precipitation?.min || 0,
            avg: d.precipitation?.avg || 0
        }));

        const yScalePrecip = d3.scaleLinear()
            .domain([
                0,
                d3.max(precipData, d => Math.max(d.max, d.avg)) + 1
            ])
            .range([height - padding * 2, 0]);

        // 添加坐标轴
        svgPrecip.append('g')
            .attr('transform', `translate(40, ${height - padding})`)
            .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%m/%d')));

        svgPrecip.append('g')
            .attr('transform', `translate(40, ${padding})`)
            .call(d3.axisLeft(yScalePrecip));

        // 绘制降水线
        const precipGroup = svgPrecip.append('g').attr('transform', `translate(40, ${padding})`);

        // 最大降水
        precipGroup.append('path')
            .datum(precipData.map(d => ({ date: d.date, value: d.max })))
            .attr('fill', 'none')
            .attr('stroke', 'orange')
            .attr('stroke-width', 2)
            .attr('d', line.y(d => yScalePrecip(d.value)));

        // 平均降水
        precipGroup.append('path')
            .datum(precipData.map(d => ({ date: d.date, value: d.avg })))
            .attr('fill', 'none')
            .attr('stroke', 'lightgreen')
            .attr('stroke-width', 2)
            .attr('d', line.y(d => yScalePrecip(d.value)));

        // 风速图表
        container.append("p").text("Wind Speed Forecast (D3.js)");
        const svgWind = container.append('svg')
            .attr('width', '100%')
            .attr('height', height)
            .append("g");

        // 准备风速数据
        const windData = dailyData.map(d => ({
            date: d.date,
            max: d.wind?.max || 0,
            min: d.wind?.min || 0,
            avg: d.wind?.avg || 0
        }));

        const yScaleWind = d3.scaleLinear()
            .domain([
                0,
                d3.max(windData, d => Math.max(d.max, d.avg)) + 1
            ])
            .range([height - padding * 2, 0]);

        // 添加坐标轴
        svgWind.append('g')
            .attr('transform', `translate(40, ${height - padding})`)
            .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%m/%d')));

        svgWind.append('g')
            .attr('transform', `translate(40, ${padding})`)
            .call(d3.axisLeft(yScaleWind));

        // 绘制风速线
        const windGroup = svgWind.append('g').attr('transform', `translate(40, ${padding})`);

        // 最大风速
        windGroup.append('path')
            .datum(windData.map(d => ({ date: d.date, value: d.max })))
            .attr('fill', 'none')
            .attr('stroke', 'purple')
            .attr('stroke-width', 2)
            .attr('d', line.y(d => yScaleWind(d.value)));

        // 平均风速
        windGroup.append('path')
            .datum(windData.map(d => ({ date: d.date, value: d.avg })))
            .attr('fill', 'none')
            .attr('stroke', 'gray')
            .attr('stroke-width', 2)
            .attr('d', line.y(d => yScaleWind(d.value)));

        // 气压图表
        container.append("p").text("Pressure Forecast (D3.js)");
        const svgPressure = container.append('svg')
            .attr('width', '100%')
            .attr('height', height)
            .append("g");

        // 准备气压数据
        const pressureData = dailyData.map(d => ({
            date: d.date,
            max: d.pressure?.max || 0,
            min: d.pressure?.min || 0,
            avg: d.pressure?.avg || 0
        }));

        const yScalePressure = d3.scaleLinear()
            .domain([
                d3.min(pressureData, d => Math.min(d.min, d.avg)) - 10,
                d3.max(pressureData, d => Math.max(d.max, d.avg)) + 10
            ])
            .range([height - padding * 2, 0]);

        // 添加坐标轴
        svgPressure.append('g')
            .attr('transform', `translate(40, ${height - padding})`)
            .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%m/%d')));

        svgPressure.append('g')
            .attr('transform', `translate(40, ${padding})`)
            .call(d3.axisLeft(yScalePressure));

        // 绘制气压线
        const pressureGroup = svgPressure.append('g').attr('transform', `translate(40, ${padding})`);

        // 最大气压
        pressureGroup.append('path')
            .datum(pressureData.map(d => ({ date: d.date, value: d.max })))
            .attr('fill', 'none')
            .attr('stroke', 'brown')
            .attr('stroke-width', 2)
            .attr('d', line.y(d => yScalePressure(d.value)));

        // 平均气压
        pressureGroup.append('path')
            .datum(pressureData.map(d => ({ date: d.date, value: d.avg })))
            .attr('fill', 'none')
            .attr('stroke', 'orange')
            .attr('stroke-width', 2)
            .attr('d', line.y(d => yScalePressure(d.value)));
    };

    /**
     * 使用通用数据格式渲染小时预报
     */
    const renderUniversalHourlyForecast = (hourlyData, container) => {
        if (!hourlyData || hourlyData.length === 0) return;

        // 显示数据表格
        const tableData = hourlyData.slice(0, 24).map(hour => ({
            datetime: hour.datetime.split(' ')[1] || hour.datetime,
            temperature: hour.temperature,
            humidity: (hour.humidity * 100).toFixed(1),
            precipitation: hour.precipitation || 0,
            skycon: hour.skycon,
            wind: hour.wind ? `${hour.wind.speed}m/s` : 'N/A',
            pressure: hour.pressure || 0
        }));

        container.append("p").text("Hourly Forecast-小时预报 (通用格式):");

        // 创建简单的表格显示
        const table = container.append('table')
            .attr('border', '1')
            .attr('cellpadding', '5')
            .attr('cellspacing', '0')
            .style('border-collapse', 'collapse')
            .style('width', '100%');

        // 表头
        const header = table.append('thead').append('tr');
        ['Time', 'Temp(°C)', 'Humidity(%)', 'Precip(mm)', 'Weather', 'Wind(m/s)', 'Pressure(hPa)'].forEach(title => {
            header.append('th').text(title).style('background-color', '#f0f0f0');
        });

        // 数据行
        const tbody = table.append('tbody');
        tableData.forEach(row => {
            const tr = tbody.append('tr');
            tr.append('td').text(row.datetime);
            tr.append('td').text(row.temperature);
            tr.append('td').text(row.humidity);
            tr.append('td').text(row.precipitation);
            tr.append('td').text(row.skycon);
            tr.append('td').text(row.wind);
            tr.append('td').text(row.pressure);
        });
    };
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

	const showWeather = async (longitude, latitude, options = {}) => {
		if (longitude && latitude) {
			const {
				source = 'caiyun',
				token = DEF_TOKEN,
				chartType = 'both' // 'd3', 'echarts', or 'both'
			} = options;

			const WeatherapiURL = `${protocol}api.caiyunapp.com/v2/${token}/${longitude},${latitude}/forecast?dailysteps=15&alert=true`;
			//[彩云天气 API 一览表](https://open.caiyunapp.com/%E5%BD%A9%E4%BA%91%E5%A4%A9%E6%B0%94_API_%E4%B8%80%E8%A7%88%E8%A1%A8)

			try {
				// 加载天气适配器
				await loadWeatherAdapter();
				console.log('Weather adapter loaded successfully');
			} catch (error) {
				console.warn('Failed to load weather adapter, continuing without it:', error);
			}

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

    // 注册自定义数据源适配器
    const registerDataSource = (sourceName, adapterFunction) => {
        weatherAdapter.registerAdapter(sourceName, adapterFunction);
    };


    return {
        showWeather,
        registerDataSource,
        //adapter: weatherAdapter
    };
})();

export default weatherModule;
// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = weatherModule;
} else if (typeof window !== 'undefined') {
    window.weatherModule = weatherModule;
    // 确保全局可访问适配器
    //window.WeatherDataAdapter = WeatherDataAdapter;
}
