import BinChart from "./binChart.js";
 
 export default class Chart {
    margin = { top: 20, right: 50, bottom: 20, left: 40};
    width = 900 - this.margin.left - this.margin.right;
    height = 1000 - this.margin.top - this.margin.bottom;
    _data = undefined;
    constructor (elem) {
        this.elemId = elem;
        this.svg = d3.select(elem).append('svg')
            .attr('width', this.width + this.margin.left + this.margin.right)
            .attr('height', this.height + this.margin.top + this.margin.left); 
    }

    set data(d) {
        this._data = this.formatData(d);
        this.render();
    }

    render() {
        // this.dateChart();
        // this.timeBoxChart();
        this.timeChart();
    }

    toLocalDate(date) {
        // let dateOptions = { year: 'numeric', month: 'long', day: 'numeric' }
        // return Date.prototype.toLocaleDateString.apply(date, ['en-US', dateOptions]);
        return `${date.getDate()}/${date.getMonth()}/${date.getFullYear()}`;
    }

    getMinTimesPerDay(arr) {
        let newArr = [];
        arr.sort((a,b) => a.date - b.date);
        for (let date = arr[0].date; date < arr[arr.length - 1].date; date.setDate(date.getDate() +1)) {
            let todayArr = arr
                .filter(d => this.toLocalDate(d.date) === this.toLocalDate(date))
            let avgTime = todayArr.reduce((a,c) => c.time.value + a, 0) / todayArr.length;
            let reduced = todayArr.reduce((a,c) => c.time.value < a.time.value ? c : a, todayArr[0]);
            console.log('avgTime', avgTime);
            reduced.avgTime = avgTime;
            console.log('reduced', reduced);
            newArr.push(reduced);
        }
        return newArr.sort((a,b) => a.date - b.date);
    }

    timeBoxChart() {     
        let fourTimes = this.flatTimes.filter(d => d.type.includes('444') && d.time.value < 120000)

        let bottomChart = new BinChart(fourTimes, this.height/4, this.width, d3.thresholdsTime(10), 'scaleTime', this.svg);
        bottomChart.render = function() {
            let bestTime = this.data.find(b => b.time.value === d3.min(this.data, d => d.time.value));
            
            let diff = this.monthDiff(this.data[0].date, this.data[this.data.length - 1].date);
        
            this.numBins = d3.thresholdsTime(diff);
        
            this.svg.attr('transform', `translate(40,${(this.height)})`);
        
            this.svg.append('g')
            .attr('transform', `translate(0,${this.height})`)
            .call(d3.axisBottom(this.x))

            this.svg.append('g')
            .call(d3.axisLeft(this.y).tickFormat(d3.timeFormat('%M:%S')).ticks(3))
            
            let boxPadding = 0;
            let bucketCont = this.svg.selectAll('g.bucket')
            .data(this.buckets)
            .join('g')
            .attr('class', 'bucket')
            .attr('fill', d => this.binColor(d.x0))
            .attr('stroke-width', 1) 
            bucketCont.append('path')
            .attr('stroke', d => this.binColor(d.x0)) 
            .attr('d', d => `
                M${(this.x(d.x0) + this.x(d.x1)) / 2},${this.y(d.range[0])}
                V${this.y(d.range[1])}
            `)
            bucketCont.append('path')
            .attr('stroke', 'currentcolor') 
            .attr('d', d => `
                M${this.x(d.x0) + boxPadding},${this.y(d.quartiles[2])}
                H${this.x(d.x1) - boxPadding}
                V${this.y(d.quartiles[0])}
                H${this.x(d.x0) + boxPadding}
                Z
            `) 
            bucketCont.append("path")
            .attr('stroke', 'currentcolor')
            .attr("stroke-width", 1.5)
            .attr("d", d => `
                M${this.x(d.x0) + boxPadding},${this.y(d.quartiles[1])}
                H${this.x(d.x1) - boxPadding}
            `);
        
            bucketCont.append("g")
                .attr("fill", d => this.binColor(d.x0))
                .attr("fill-opacity", 0.4)
                .attr("stroke", "none")
                .attr("transform", d => `translate(${(this.x(d.x0) + this.x(d.x1)) / 2},0)`)
            .selectAll("circle")
            .data(d => d.outliers)
            .join("circle")
                .attr("r", 2)
                .attr("cx", () => (Math.random() - 0.5) * 4)
                .attr("cy", d => this.y(d.y));

            this.svg.append('circle')
                .attr("r", 3)
                .attr("cx", this.x(bestTime.date))
                .attr("cy", this.y(bestTime.time.value));
        }
        bottomChart.render();
    }

    
    dateChart() {
        this.dateG = this.svg.append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);
        let height = this.height * 1/4;
        let x = this.xAxis(this.dateG, d3.extent(this.flatTimes, d => d.date), height);
        let y = this.yAxis(this.dateG, [6,20], height);
        this.colorScale();
        this.rScale();
        this.legend();
        this.dateG.selectAll('circle.data')
            .data(this._data)
            .join('circle')
            .attr('class', 'data')
            .attr('cx', d => x(d.date))
            .attr('cy', d => y(d.date.getHours()))
            .attr('r', d => this.r(d.value))
            .attr('fill', d => this.color(d.type))
            .attr('stroke', d => d.isMinTime ? 'black' : 'transparent')
            .attr('fill-opacity', 0.5)
            .attr('title', d => d.value);
    }

    timeChart() {
        let fourTimes = this.flatTimes.filter(d => d.type.includes('444') && d.time.value < 120000)
        let chart = new BinChart(fourTimes, this.height/4, this.width, undefined, 'scaleTime', this.svg);
        chart.render = function() {
            this.svg.attr('transform', `translate(40,${(this.height * 2)})`);
        
            this.svg.append('g')
            .attr('transform', `translate(0,${this.height})`)
            .call(d3.axisBottom(this.x))

            this.svg.append('g')
            .call(d3.axisLeft(this.y).tickFormat(d3.timeFormat('%M:%S')).ticks(3))
            
            let bestTime = (d, isDay = true) => {
                let monthOrDay = isDay ? 'toLocalDate' : 'toLocalDateMonthYear';
                let day = fourTimes.filter(ft => this[monthOrDay](ft.date) === this[monthOrDay](d.date));
                let isBestOfDay = Math.min(...day.map(dtime => dtime.time.value));
                return isBestOfDay === d.time.value;
            }

            fourTimes.map(d => {
                d.isMinDay = bestTime(d);
                d.isMinMonth = bestTime(d, false);
                return d;
            })


            this.svg.selectAll('circle.times')  
                .data(fourTimes)
                .join('circle')
                .attr('class', 'times')
                .attr('fill', d => d.isMinDay ? 'steelblue' : 'limegreen')
                .attr('fill-opacity', d => d.isMinDay ? 1 : 0.5)
                .attr('stroke', d => d.isMinDay ? 'steelblue' : 'limegreen')
                .attr('stroke-width', .5)
                .attr("r", 3)
                .attr("cx", d => this.x(d.date))
                .attr("cy", d => this.y(d.time.value));
        }
        chart.render();
    }

    xAxis(elem, domain, height) {
        let x = d3.scaleTime()
            .range([0,this.width])
            .domain(domain);

        elem.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x));

        return x;
    }

    yAxis(elem, domain, height, options) {
        let y = d3.scaleLinear()
            .range([height,0])
            .domain(domain);
        if (options) {
            elem.append('g')
                .call(
                    d3.axisLeft(y)
                    .tickFormat(d3.timeFormat("%M:%S"))
                    .ticks(3)
                );
        } else {
            elem.append('g')
                .call(d3.axisLeft(y));
        }

        return y;
    }

    colorScale() {
        this.color = d3.scaleOrdinal()
            .range(['salmon', 'steelblue', 'purple', 'limegreen'])
            .domain(this._data.map(d => d.type));
    }

    rScale() {
        this.r = d3.scaleLinear()
            .range([5,20])
            .domain(d3.extent(this._data, d => d.value));
        let rValues = [...new Set(this._data.map(d => d.value))];
        this.rQuantiles = [
            d3.quantile(rValues, 0),
            d3.quantile(rValues, .5),
            d3.quantile(rValues, 1)
        ];
    }

    legend() {
        let legend = this.dateG.append('g')
            .attr('transform', `translate(${this.width - 200}, 0)`)
            .selectAll('g.legend')
            .data(this.color.domain())
            .join('g')
            .attr('class', 'legend');
        legend.append('text')
            .text(d => d.match(/\d+/g)[0])
            .attr('x', (d,i) => i * 30)
            .attr('fill', d => this.color(d));

        let circleLegend = this.dateG.append('g')
            .attr('class', 'circle-legend')
            .attr('transform', `translate(${this.width - 140}, 50)`)
            .selectAll(`${this.elemId} g.circle`)
            .data(this.rQuantiles)
            .join('g')
            .attr('class', 'circle');
        circleLegend.append('circle')
            .attr('cy', (d,i) => -this.r(d) + i)
            .attr('cx', (d,i) => 0)
            .attr('r', (d,i) => this.r(d))
            .attr('fill', 'none')
            .attr('stroke', 'black');
        circleLegend.append('text')
            .text(d => d)
            .attr('x', 0)
            .attr('y', (d,i) => -this.r(d)*2 - 1)
            .attr('text-anchor', 'middle')
            .attr('font-size', 8);
    }

    formatData(data) {
        let timerData = this.cleanData(data);
        let times = [];
        for (let key in timerData) {
            times.push(timerData[key].times)
        }
        this.flatTimes = times.flat()
            .filter(d => d.date.getFullYear() > 2019);
        let nest = d3.nest()
            .key(d => d.date.getFullYear())
            .key(d => d.date.getMonth())
            .key(d => d.date.getDate())
            .key(d => d.date.getHours())
            .key(d => d.type)
            //.rollup(v => v.length)
            .entries(this.flatTimes);

        let timeValues = nest.map(year => {
            return year.values.map(month => {
                return month.values.map(day => {
                    return day.values.map(hour => {
                        return hour.values.map(type => {
                            let minTime = d3.min(type.values, d => d.time.value);
                            let minTimeHour = d3.min(day.values, 
                                d => d3.min(d.values, 
                                    f => d3.min(f.values, k => k.time.value)
                                )
                            );
                            return {
                                date: new Date(year.key, month.key, day.key, hour.key),
                                type: type.key,
                                value: type.values.length,
                                values: type.values,
                                minTime: minTime,
                                isMinTime: minTime === minTimeHour
                            };
                        })
                    })
                })
            })
        })

        return timeValues.flat().flat().flat().flat();
    }

    cleanData(d) {
        // loop through sessions
        for (let key in d) {
            // loop through times
            d[key].times = d[key].times.map(time => {
                let timeObj = {
                    time: this.convertToMinSec(time[0][1]),
                    scramble: time[1],
                    date: new Date(time[3] * 1000),
                    type: d[key].type
                }
                return timeObj;
            })
        }
        return d;
    }


    convertToMinSec(time) {
        return {
            value: time,
            toString: function() {
                let minutes = this.value / 60000;
                let seconds = (minutes % 1) * 60;
                let milliseconds = seconds % 1;
                let returnStr = '';
                if (Math.floor(minutes) > 0) {
                    returnStr += `${Math.floor(minutes)}:`;
                }
                returnStr += `${Math.floor(seconds) < 10 ? '0' + Math.floor(seconds) : Math.floor(seconds)}.${milliseconds.toFixed(3) * 1000}`
                return returnStr;
            }
        }
    }
}