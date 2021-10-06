fetch("./cstimer.json")
.then(response => {
   return response.json();
})
.then(data => render(formatData(data)));

function formatData(data) {
    console.log('data', data);
    let newData = {
        times: []
    };
    data.session1.forEach(d => {
        let newObj = {
            time: convertToMinSec(d[0][1]),
            scramble: d[2],
            date: new Date(d[3] * 1000)
        }
        newData.times.push(newObj)
    });
    newData.times.sort((a,b) => a.date - b.date);
    
    let dateExtent = d3.extent(newData.times, d => d.date);
    console.log(dateExtent[0])

    newData.weeks = [
        { 
            times: [], 
            date: dateExtent[0],
            '12-14': 0,
            '15-16': 0,
            '17-19': 0,
            '20-24': 0,
            '25-29': 0,
            '30+': 0, 
        }
    ];
    function dateToString(date) {
        return `${date.getMonth()}/${date.getDate()}/${date.getFullYear()}`;
    }
    for (let d = new Date(dateExtent[0]); d <= dateExtent[1]; d.setDate(d.getDate() + 1)) {
        let found = newData.times.filter(t => dateToString(t.date) === dateToString(d));
        if (d.getDay() === 1) {
            newData.weeks.push({ 
                times: [], 
                date: new Date(d),
                '12-14': 0,
                '15-16': 0,
                '17-19': 0,
                '20-24': 0,
                '25-29': 0,
                '30+': 0,
            });
        }
        if (found.length > 0) {
            newData.weeks[newData.weeks.length - 1].times.push(...found);
        }
    }

    newData.weeks.forEach(w => {
        w.times.forEach(t => {
            let toSec = t.time.value * .001;
            if (toSec < 15) {
                w['12-14']++
            } else if (toSec < 17) {
                w['15-16']++
            } else if (toSec < 20) {
                w['17-19']++
            } else if (toSec < 25) {
                w['20-24']++
            } else if (toSec < 30) {
                w['25-29']++
            } else if (toSec > 30) {
                w['30+']++
            }
        });
        let totalTimes = w.times.reduce((a,c) => a += c.time.value, 0);
        w.avgTime = Math.round(totalTimes / w.times.length);
        w.minTime = Math.min(...w.times.map(d => d.time.value));
        w['12-14-perc'] = (w['12-14']/w.times.length) * 100;
        w['15-16-perc'] = (w['15-16']/w.times.length) * 100;
        w['17-19-perc'] = (w['17-19']/w.times.length) * 100;
        w['20-24-perc'] = (w['20-24']/w.times.length) * 100;
        w['25-29-perc'] = (w['25-29']/w.times.length) * 100;
        w['30+-perc'] = (w['30+']/w.times.length) * 100;
    });
    return newData;
}

function convertToMinSec(time) {
    return {
        value: time,
        toString: function() {
            console.log(this.value);
            let minutes = this.value / 60000;
            let seconds = (minutes % 1) * 60;
            let milliseconds = seconds % 1;
            let returnStr = '';
            if (Math.floor(minutes) > 0) {
                returnStr += `${Math.floor(minutes)}:`;
            }
            returnStr += `${Math.floor(seconds) < 9 ? '0' + Math.floor(seconds) : Math.floor(seconds)}.${milliseconds.toFixed(3) * 1000}`
            return returnStr;
        }
    }
}

function render(data) {
    data.times.sort((a,b) => a.date - b.date);
    console.log(data)
    let filterData = data.times.filter(d => d.date.getFullYear() > 2019);
    console.log(filterData)
    let margin = { top: 20, right: 50, bottom: 20, left: 50 };
    let width = 900 - margin.right - margin.left;
    let height = 500 - margin.top - margin.bottom;
    let svg = d3.select('#chart').append('svg')
        .attr('width', width + margin.right + margin.left)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`)
        
    function Chart(svg, data, xFunc, yFunc, render) {
        this.data = data;
        this.g = svg.append('g')
            .attr('transform', `translate(0,0)`)
            .attr('class', 'time-chart'),
        this.height = height / 2 - margin.top,
        this.width = width,
        this.x = xFunc === null ? null : d3.scaleTime()
            .domain(d3.extent(this.data, xFunc))
            .range([0, this.width]),
        this.y = yFunc === null ? null : d3.scaleTime()
            .domain([d3.min(this.data, yFunc) - 3000, d3.max(this.data, yFunc)])
            .range([this.height, 0]),
        this.axis = (third = undefined) => {
            this.g.append('g')
                .attr('transform', `translate(0,${this.height})`)
                .call(d3.axisBottom(this.x));
            this.g.append('g')
                .attr('transform', `translate(${this.width},0)`)
                .call(d3.axisLeft(this.y).ticks(6).tickSize(this.width))
                .call(g => {
                    g.select('path').remove();
                    g.selectAll('.tick').select('line').attr('stroke-width', 0.3)
                });
            if (third) {
                this.g.append('g')
                    .attr('transform', `translate(${this.width},0)`)
                    .call(d3.axisRight(third).ticks(6))
            }
            return this;
        }
        this.render = render
        return this;
    };

    let tc = new Chart(svg, data.times, d => d.date, d => d.time.value, () => {
        
        let minTime = d3.min(tc.data, d => d.time.value);

        tc.g.append('line')
            .attr('x1', 0)
            .attr('y1', tc.y(minTime))
            .attr('x2', tc.width)
            .attr('y2', tc.y(minTime))
            .attr('stroke', 'hotpink')
            .attr('stroke-width', 1)

        let avgTime = tc.data.reduce((a,c) => a += c.time.value, 0) / tc.data.length;

        tc.g.append('line')
            .attr('x1', 0)
            .attr('y1', tc.y(avgTime))
            .attr('x2', tc.width)
            .attr('y2', tc.y(avgTime))
            .attr('stroke', 'steelblue')
            .attr('stroke-width', 1)


        tc.g.selectAll('circle.times')
            .data(tc.data)
            .join('circle')
            .attr('class', 'times')
            .attr('cx', d => tc.x(d.date))
            .attr('cy', d => tc.y(d.time.value))
            .attr('r', 2)
            .attr('fill-opacity', 0.3)
        
        return tc;
    });
    tc.axis().render();
    
    let weekChart = new Chart(svg, data, null, null, 
        () => {
            let colors = ["#A51C30","#44ccff","#d138bf","#B0DB43","#27187E","#FB8B24"];
            let rectGs = weekChart.g.selectAll('g.week')
                .data(weekChart.data.weeks)
                .join('g')
                .attr('transform', d => `translate(${weekChart.x(d.date)},${0})`)
                .attr('class', 'week')
            let weekKeys = Object.keys(weekChart.data.weeks[0]).filter(d => d.includes('perc'));
            console.log(weekChart.data.weeks)
            console.log(weekKeys)
            for (let keyId in weekKeys) {
                rectGs.append('rect')
                    .attr('x', 0)
                    .attr('y', d => {
                        let i = keyId;
                        let total = 0;
                        while (i > -1) {
                            total += d[weekKeys[i]]
                            i--;
                        }
                        return isNaN(total) ? 0 : weekChart.y(total)
                    })
                    .attr('width', 5)
                    .attr('height',  d => weekChart.height - weekChart.y(d[weekKeys[keyId]]))
                    .attr('fill', colors[keyId])
                    .attr('stroke', 'white')
                    .attr('stroke-width', .5)
            }

            weekChart.g.append('path')
                .datum(weekChart.data.weeks)
                .attr('d', weekChart.line)
                .attr('fill', 'none')
                .attr('stroke', 'steelblue')
                .attr('stroke-width', 2);

            weekChart.g.selectAll('circle.totals')
                .data(weekChart.data.weeks)
                .join('circle')
                .attr('class', 'totals')
                .attr('cx', d => weekChart.x(d.date))
                .attr('cy', d => weekChart.yTotal(d.times.length))
                .attr('r', 3)
                .attr('stroke', 'white')
                .attr('stroke-width', 2)
                .attr('fill', 'steelblue')
        });
    weekChart.height = height / 2;
    weekChart.g =  svg.append('g')
        .attr('transform', `translate(0,${height / 2})`)
        .attr('class', 'week-chart');
    weekChart.x = d3.scaleTime()
            .domain(d3.extent(weekChart.data.times, d => d.date))
            .range([0, weekChart.width]),
    weekChart.y = d3.scaleLinear()
        .domain([0, 100])
        .range([weekChart.height, 0]);
    weekChart.yTotal = d3.scaleLinear()
        .domain([0, d3.max(weekChart.data.weeks, d => d.times.length)])
        .range([weekChart.height, 0]);
    weekChart.line = d3.line()
        .x(d => weekChart.x(d.date))
        .y(d => weekChart.yTotal(d.times.length))
        .curve(d3.curveBumpX)
    weekChart.axis(weekChart.yTotal).render();

}