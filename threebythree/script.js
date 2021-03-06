import Chart from './chart.js';

fetch("./cstimer_20211118_124530.json")
.then(response => {
   return response.json();
})
.then(data => renderDotAndPercentage(formatData(data)));

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
            'sub15': 0,
            '16-19': 0,
            '20-29': 0,
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
                'sub15': 0,
                '16-19': 0,
                '20-29': 0,
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
                w['sub15']++
            } else if (toSec < 20) {
                w['16-19']++
            } else if (toSec < 30) {
                w['20-29']++
            } else if (toSec > 30) {
                w['30+']++
            }
        });
        let totalTimes = w.times.reduce((a,c) => a += c.time.value, 0);
        w.avgTime = Math.round(totalTimes / w.times.length);
        w.minTime = Math.min(...w.times.map(d => d.time.value));
        w['sub15-perc'] = (w['sub15']/w.times.length) * 100;
        w['16-19-perc'] = (w['16-19']/w.times.length) * 100;
        w['20-29-perc'] = (w['20-29']/w.times.length) * 100;
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
function renderDotAndPercentage(data) {
    data.times.sort((a,b) => a.date - b.date);
    console.log('data', data)
    let filterData = data.times.filter(d => d.date.getFullYear() > 2019);
    console.log('filterData', filterData)
    let margin = { top: 20, right: 50, bottom: 20, left: 50 };
    let width = 900 - margin.right - margin.left;
    let height = 500 - margin.top - margin.bottom;
    let svg = d3.select('#chart').append('svg')
        .attr('width', width + margin.right + margin.left)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`)
        
    

    let tc = new Chart(svg, data.times, height, width, margin, d => d.date, d => d.time.value);
    tc.render = function() {
        let minTime = d3.min(tc.data, d => d.time.value);

        this.g.append('line')
            .attr('x1', 0)
            .attr('y1', tc.y(minTime))
            .attr('x2', tc.width)
            .attr('y2', tc.y(minTime))
            .attr('stroke', 'hotpink')
            .attr('stroke-width', 1)

        let avgTime = tc.data.reduce((a,c) => a += c.time.value, 0) / tc.data.length;

        this.g.append('line')
            .attr('x1', 0)
            .attr('y1', tc.y(avgTime))
            .attr('x2', tc.width)
            .attr('y2', tc.y(avgTime))
            .attr('stroke', 'steelblue')
            .attr('stroke-width', 1)


        this.g.selectAll('circle.times')
            .data(tc.data)
            .join('circle')
            .attr('class', 'times')
            .attr('cx', d => tc.x(d.date))
            .attr('cy', d => tc.y(d.time.value))
            .attr('r', 2)
            .attr('fill-opacity', 0.3)
        
        return tc;
    }
    tc.axis().render();
    
    let weekChart = new Chart(svg, data, height, width, margin, null, null);
    weekChart.render = function() {
        let colors = ["#A51C30","#44ccff","#d138bf","#B0DB43","#27187E","#FB8B24"];
        let weekKeys = Object.keys(weekChart.data.weeks[0]).filter(d => d.includes('perc'));
        let legendKeys = weekKeys.slice().map(d => d.replace('-perc', ''));
        let legend = weekChart.g.append('g')
            .attr('class', 'legend')
            .attr('transform', d => `translate(${this.width/2},${-this.margin.top})`)
            .selectAll('g.legend-item')
            .data(legendKeys)
            .join('g')
            .attr('class', 'legend-item')
            .attr('transform', (d,i) => `translate(${i * 70},0)`)
        legend.append('circle')
            .attr('cx', 0)
            .attr('cy', 10)
            .attr('r', 7)
            .attr('fill', (d,i) => colors[i])
        legend.append('text')
            .attr('x', 10)
            .attr('y', 15)
            .style('font-size', '15px')
            .text(d => d)

        let rectGs = weekChart.g.selectAll('g.week')
            .data(weekChart.data.weeks)
            .join('g')
            .attr('transform', d => `translate(${weekChart.x(d.date)},${0})`)
            .attr('class', 'week')
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
                .attr('height',  d => weekChart.y(d[weekKeys[keyId]]) ? weekChart.height - weekChart.y(d[weekKeys[keyId]]) : 0)
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
    }
    weekChart.height = height / 2 - margin.top;
    weekChart.g =  svg.append('g')
        .attr('transform', `translate(0,${height / 2 + margin.top})`)
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

function renderScatter(data) {
    data.times.sort((a,b) => a.date - b.date);
    console.log(data)
    let nest = d3.nest()
        .key(d => Math.round(d.time.value * 0.01))
        .entries(data.times);
    console.log('nest', nest);

    let margin = { top: 20, right: 50, bottom: 20, left: 50 };
    let width = 900 - margin.right - margin.left;
    let height = 500 - margin.top - margin.bottom;
    let svg = d3.select('#chart').append('svg')
        .attr('width', width + margin.right + margin.left)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`)
    
    let xBand = d3.scaleBand()
        .domain(nest.map(d => d.key))
        .range([0, width])
        .paddingInner(0.001);
    let yNest = d3.scaleLinear()
        .domain([0, d3.max(nest, d => d.values.length)])
        .range([height, 0]);
    let x = d3.scaleTime()
        .domain([d3.min(data.times, d => d.time.value) - 1000, d3.max(data.times, d => d.time.value)])
        .range([0, width]);
    let y = d3.scaleLinear()
        .domain([7, 19])
        .range([height, 0]);
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x));
    svg.append('g')
        .call(d3.axisLeft(y));

        console.log(x(150 * 100))
    let alpha = 0.4
    let colors = [
        `rgba(105, 48, 109, ${alpha})`,  // purple
        `rgba(250, 200, 205, ${alpha})`,     // pink
        `rgba(176, 254, 118, ${alpha})`,     // green
        `rgba(120, 195, 251, ${alpha})`,     // blue
        `rgba(241, 143, 1, ${alpha})`        // orange
    ]

    let nestGs = svg.selectAll('g.time')
        .data(nest)
        .join('g')
        .attr('class', 'time')
        .attr('transform', d => `translate(${x(+d.key * 100) + xBand.bandwidth()/2},0)`)
    nestGs.append('rect')
        .attr('x', 0)
        .attr('y', (d,i) => yNest(d.values.length))
        .attr('width', xBand.bandwidth())
        .attr('height', d => height - yNest(d.values.length))
        .attr('fill', d => {
            let val = Math.floor(d.key * 0.1);
            if (val < 15) {
                return colors[0];
            } else if (val < 20) {
                return colors[1];
            } else if (val < 25) {
                return colors[2];
            } else if (val < 30) {
                return colors[3];
            } else {
                return colors[4];
            }
        })
    // nestGs.selectAll('rect')
    //     .data(d => d.values)
    //     .join('rect')
    //     .attr('x', 0)
    //     .attr('y', (d,i) => yNest(d.length))
    //     .attr('width', xBand.bandwidth())
    //     .attr('height', d => height - yNest(d.length))

    let circles = svg.selectAll('circle')
        .data(data.times)
        .join('circle')
        .attr('cx', d => x(d.time.value))
        .attr('cy', (d,i) => y(d.date.getHours() + d.date.getMinutes()/60))
        .attr('r', 2);
}